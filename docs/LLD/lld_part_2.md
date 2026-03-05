## 5. Service Layer Implementation

### 5.1 ProductService

```javascript
class ProductService {
  constructor(productRepository, cacheService) {
    this.productRepository = productRepository;
    this.cacheService = cacheService;
  }

  async getProducts(filters, pagination) {
    const cacheKey = `products:${JSON.stringify(filters)}:${pagination.page}`;
    
    // Check cache first
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Query database
    const products = await this.productRepository.findAll(filters, pagination);
    const totalCount = await this.productRepository.count(filters);

    const result = {
      products,
      pagination: {
        current_page: pagination.page,
        total_pages: Math.ceil(totalCount / pagination.limit),
        total_items: totalCount,
        items_per_page: pagination.limit
      }
    };

    // Cache the result for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async getProductById(productId) {
    const cacheKey = `product:${productId}`;
    
    const cachedProduct = await this.cacheService.get(cacheKey);
    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await this.cacheService.set(cacheKey, JSON.stringify(product), 600);
    return product;
  }

  async checkStockAvailability(productId, quantity) {
    const product = await this.getProductById(productId);
    return product.stock_quantity >= quantity;
  }
}
```

### 5.2 CartService

```javascript
class CartService {
  constructor(cartRepository, cartItemRepository, productService) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.productService = productService;
  }

  async getOrCreateCart(userId) {
    let cart = await this.cartRepository.findActiveByUserId(userId);
    
    if (!cart) {
      cart = await this.cartRepository.create({
        user_id: userId,
        status: 'active'
      });
    }

    return cart;
  }

  async getCartWithItems(userId) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartItemRepository.findByCartId(cart.id);

    // Enrich items with current product information
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.productService.getProductById(item.product_id);
        return {
          ...item,
          product_name: product.name,
          current_price: product.price,
          image_url: product.image_url,
          subtotal: item.quantity * item.price_at_addition
        };
      })
    );

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...cart,
      items: enrichedItems,
      total_items: totalItems,
      total_amount: totalAmount
    };
  }

  async addItem(userId, productId, quantity) {
    // Validate product and stock
    const product = await this.productService.getProductById(productId);
    const hasStock = await this.productService.checkStockAvailability(productId, quantity);
    
    if (!hasStock) {
      throw new Error('Insufficient stock available');
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    let cartItem = await this.cartItemRepository.findByCartAndProduct(cart.id, productId);

    if (cartItem) {
      // Update quantity
      const newQuantity = cartItem.quantity + quantity;
      const hasStockForUpdate = await this.productService.checkStockAvailability(productId, newQuantity);
      
      if (!hasStockForUpdate) {
        throw new Error('Insufficient stock for requested quantity');
      }

      cartItem = await this.cartItemRepository.update(cartItem.id, {
        quantity: newQuantity,
        updated_at: new Date()
      });
    } else {
      // Create new cart item
      cartItem = await this.cartItemRepository.create({
        cart_id: cart.id,
        product_id: productId,
        quantity: quantity,
        price_at_addition: product.price
      });
    }

    return cartItem;
  }

  async updateItemQuantity(userId, cartItemId, quantity) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findById(cartItemId);

    if (!cartItem || cartItem.cart_id !== cart.id) {
      throw new Error('Cart item not found');
    }

    // Check stock availability
    const hasStock = await this.productService.checkStockAvailability(
      cartItem.product_id,
      quantity
    );

    if (!hasStock) {
      throw new Error('Insufficient stock available');
    }

    return await this.cartItemRepository.update(cartItemId, {
      quantity,
      updated_at: new Date()
    });
  }

  async removeItem(userId, cartItemId) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findById(cartItemId);

    if (!cartItem || cartItem.cart_id !== cart.id) {
      throw new Error('Cart item not found');
    }

    return await this.cartItemRepository.delete(cartItemId);
  }

  async clearCart(cartId) {
    return await this.cartItemRepository.deleteByCartId(cartId);
  }
}
```

### 5.3 OrderService

```javascript
class OrderService {
  constructor(
    orderRepository,
    orderItemRepository,
    cartService,
    productService,
    paymentService,
    inventoryService
  ) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.cartService = cartService;
    this.productService = productService;
    this.paymentService = paymentService;
    this.inventoryService = inventoryService;
  }

  async createOrder(userId, orderData) {
    // Start transaction
    const transaction = await this.orderRepository.beginTransaction();

    try {
      // Get cart with items
      const cart = await this.cartService.getCartWithItems(userId);

      if (!cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate stock availability for all items
      for (const item of cart.items) {
        const hasStock = await this.productService.checkStockAvailability(
          item.product_id,
          item.quantity
        );
        if (!hasStock) {
          throw new Error(`Insufficient stock for product: ${item.product_name}`);
        }
      }

      // Create order
      const order = await this.orderRepository.create({
        user_id: userId,
        total_amount: cart.total_amount,
        status: 'pending',
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        payment_status: 'pending'
      }, transaction);

      // Create order items
      const orderItems = await Promise.all(
        cart.items.map(item =>
          this.orderItemRepository.create({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price_at_addition
          }, transaction)
        )
      );

      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: cart.total_amount,
        payment_method: orderData.payment_method,
        payment_token: orderData.payment_token,
        order_id: order.id
      });

      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      // Update order payment status
      await this.orderRepository.update(order.id, {
        payment_status: 'completed',
        status: 'processing'
      }, transaction);

      // Reduce inventory
      for (const item of cart.items) {
        await this.inventoryService.reduceStock(
          item.product_id,
          item.quantity,
          transaction
        );
      }

      // Clear cart and mark as converted
      await this.cartService.clearCart(cart.id);
      await this.cartRepository.update(cart.id, {
        status: 'converted'
      }, transaction);

      // Commit transaction
      await transaction.commit();

      return order;
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  }

  async getOrdersByUserId(userId, pagination) {
    const orders = await this.orderRepository.findByUserId(userId, pagination);
    const totalCount = await this.orderRepository.countByUserId(userId);

    return {
      orders,
      pagination: {
        current_page: pagination.page,
        total_pages: Math.ceil(totalCount / pagination.limit),
        total_items: totalCount
      }
    };
  }

  async getOrderById(userId, orderId) {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.user_id !== userId) {
      throw new Error('Order not found');
    }

    const items = await this.orderItemRepository.findByOrderId(orderId);

    // Enrich items with product information
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.productService.getProductById(item.product_id);
        return {
          ...item,
          product_name: product.name,
          subtotal: item.quantity * item.price
        };
      })
    );

    return {
      ...order,
      items: enrichedItems
    };
  }
}
```

## 6. Sequence Diagrams

### 6.1 Add Item to Cart Flow

```
User -> API: POST /api/cart/items {product_id, quantity}
API -> AuthMiddleware: Validate JWT token
AuthMiddleware -> API: User authenticated
API -> CartService: addItem(userId, productId, quantity)
CartService -> ProductService: getProductById(productId)
ProductService -> Database: SELECT * FROM products WHERE id = ?
Database -> ProductService: Product data
ProductService -> CartService: Product details
CartService -> ProductService: checkStockAvailability(productId, quantity)
ProductService -> CartService: Stock available
CartService -> Database: SELECT * FROM carts WHERE user_id = ? AND status = 'active'
Database -> CartService: Cart data (or null)
CartService -> Database: INSERT INTO cart_items OR UPDATE cart_items
Database -> CartService: Cart item created/updated
CartService -> API: Cart item data
API -> User: 200 OK {success, data}
```

### 6.2 Checkout and Order Creation Flow

```
User -> API: POST /api/orders {shipping_address, payment_method, payment_token}
API -> AuthMiddleware: Validate JWT token
AuthMiddleware -> API: User authenticated
API -> OrderService: createOrder(userId, orderData)
OrderService -> Database: BEGIN TRANSACTION
OrderService -> CartService: getCartWithItems(userId)
CartService -> Database: SELECT cart and items
Database -> CartService: Cart with items
CartService -> OrderService: Cart data
OrderService -> ProductService: Validate stock for all items
ProductService -> OrderService: Stock validated
OrderService -> Database: INSERT INTO orders
Database -> OrderService: Order created
OrderService -> Database: INSERT INTO order_items (multiple)
Database -> OrderService: Order items created
OrderService -> PaymentService: processPayment(paymentData)
PaymentService -> StripeAPI: Create payment intent
StripeAPI -> PaymentService: Payment successful
PaymentService -> OrderService: Payment result
OrderService -> Database: UPDATE orders SET payment_status = 'completed'
OrderService -> InventoryService: Reduce stock for all items
InventoryService -> Database: UPDATE products SET stock_quantity = stock_quantity - ?
OrderService -> Database: DELETE FROM cart_items WHERE cart_id = ?
OrderService -> Database: UPDATE carts SET status = 'converted'
OrderService -> Database: COMMIT TRANSACTION
OrderService -> API: Order data
API -> User: 200 OK {success, order_id, total_amount}
```
