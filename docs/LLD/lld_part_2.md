## 3. Sequence Diagrams

### 3.1 Get All Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products
    ProductController->>+ProductService: getAllProducts()
    ProductService->>+ProductRepository: findAll()
    ProductRepository->>+Database: SELECT * FROM products
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.2 Get Product By ID

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products/{id}
    ProductController->>+ProductService: getProductById(id)
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Found
        ProductService-->>ProductController: Product
        ProductController-->>Client: ResponseEntity<Product> (200)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
    end
```

### 3.3 Create Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: POST /api/products (Product data)
    ProductController->>+ProductService: createProduct(product)
    
    Note over ProductService: Validate product data
    Note over ProductService: Set createdAt timestamp
    
    ProductService->>+ProductRepository: save(product)
    ProductRepository->>+Database: INSERT INTO products (...) VALUES (...)
    Database-->>-ProductRepository: Product (with generated ID)
    ProductRepository-->>-ProductService: Product
    ProductService-->>-ProductController: Product
    ProductController-->>-Client: ResponseEntity<Product> (201)
```

### 3.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: PUT /api/products/{id} (Product data)
    ProductController->>+ProductService: updateProduct(id, product)
    
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Exists
        Note over ProductService: Update product fields
        ProductService->>+ProductRepository: save(updatedProduct)
        ProductRepository->>+Database: UPDATE products SET ... WHERE id = ?
        Database-->>-ProductRepository: Updated Product
        ProductRepository-->>-ProductService: Updated Product
        ProductService-->>ProductController: Updated Product
        ProductController-->>Client: ResponseEntity<Product> (200)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
    end
```

### 3.5 Delete Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: DELETE /api/products/{id}
    ProductController->>+ProductService: deleteProduct(id)
    
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Exists
        ProductService->>+ProductRepository: deleteById(id)
        ProductRepository->>+Database: DELETE FROM products WHERE id = ?
        Database-->>-ProductRepository: Success
        ProductRepository-->>-ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: ResponseEntity (204)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
    end
```

### 3.6 Get Products By Category

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products/category/{category}
    ProductController->>+ProductService: getProductsByCategory(category)
    ProductService->>+ProductRepository: findByCategory(category)
    ProductRepository->>+Database: SELECT * FROM products WHERE category = ?
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>+ProductService: searchProducts(keyword)
    ProductService->>+ProductRepository: findByNameContainingIgnoreCase(keyword)
    ProductRepository->>+Database: SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.8 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (customerId, productId, quantity, subscriptionType)
    CartController->>+CartService: addProductToCart(customerId, productId, quantity, subscriptionType)
    
    CartService->>+ProductService: getProductById(productId)
    ProductService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Product
    ProductRepository-->>-ProductService: Product
    ProductService-->>-CartService: Product
    
    Note over CartService: Determine default quantity based on minimumProcurementThreshold
    Note over CartService: Apply subscription vs one-time buy logic
    
    CartService->>+ProductService: validateInventory(productId, quantity)
    ProductService->>+ProductRepository: findByIdWithStockLock(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ? FOR UPDATE
    Database-->>-ProductRepository: Product
    ProductRepository-->>-ProductService: Product
    
    alt Stock Available
        ProductService-->>CartService: true
        
        CartService->>+CartRepository: findActiveCartByCustomerId(customerId)
        CartRepository->>+Database: SELECT * FROM carts WHERE customer_id = ? AND status = 'ACTIVE'
        Database-->>-CartRepository: Optional<Cart>
        CartRepository-->>-CartService: Optional<Cart>
        
        alt Cart Exists
            Note over CartService: Use existing cart
        else Cart Not Found
            Note over CartService: Create new cart
            CartService->>+CartRepository: save(newCart)
            CartRepository->>+Database: INSERT INTO carts (...) VALUES (...)
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
        end
        
        CartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-CartService: Optional<CartItem>
        
        alt CartItem Exists
            Note over CartService: Update quantity and subtotal
            CartService->>+CartItemRepository: save(updatedCartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE cart_item_id = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-CartService: CartItem
        else CartItem Not Found
            Note over CartService: Create new cart item
            CartService->>+CartItemRepository: save(newCartItem)
            CartItemRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-CartService: CartItem
        end
        
        Note over CartService: Calculate cart totals (subtotal, tax, total)
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ? WHERE cart_id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: CartDetailsDTO
        CartController-->>Client: ResponseEntity<CartDetailsDTO> (200)
    else Stock Unavailable
        ProductService-->>CartService: false
        CartService-->>CartController: throw InsufficientStockException
        CartController-->>Client: ResponseEntity (400) with error message
    end
```

### 3.9 View Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: GET /api/cart?customerId={customerId}
    CartController->>+CartService: getCartDetails(customerId)
    
    CartService->>+CartRepository: findActiveCartByCustomerId(customerId)
    CartRepository->>+Database: SELECT * FROM carts WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Exists
        CartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-CartService: List<CartItem>
        
        alt Cart Has Items
            Note over CartService: Build CartDetailsDTO with items, subtotal, tax, total
            CartService-->>CartController: CartDetailsDTO
            CartController-->>Client: ResponseEntity<CartDetailsDTO> (200)
        else Cart Empty
            Note over CartService: Return empty cart DTO
            CartService-->>CartController: CartDetailsDTO (empty)
            CartController-->>Client: ResponseEntity<CartDetailsDTO> (200) with empty message
        end
    else Cart Not Found
        Note over CartService: Return empty cart response
        CartService-->>CartController: CartDetailsDTO (empty)
        CartController-->>Client: ResponseEntity<CartDetailsDTO> (200) with empty message
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{cartItemId} (quantity)
    CartController->>+CartService: updateCartItemQuantity(cartItemId, quantity)
    
    CartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt CartItem Found
        CartService->>+ProductService: validateInventory(productId, quantity)
        ProductService-->>-CartService: Boolean
        
        alt Stock Available
            Note over CartService: Update quantity and recalculate subtotal
            CartService->>+CartItemRepository: save(updatedCartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?, updated_at = ? WHERE cart_item_id = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-CartService: CartItem
            
            Note over CartService: Recalculate cart totals in real-time
            CartService->>+CartRepository: save(updatedCart)
            CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ? WHERE cart_id = ?
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
            
            CartService-->>CartController: CartDetailsDTO
            CartController-->>Client: ResponseEntity<CartDetailsDTO> (200)
        else Stock Unavailable
            CartService-->>CartController: throw InsufficientStockException with available quantity
            CartController-->>Client: ResponseEntity (400) with error message
        end
    else CartItem Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{cartItemId}
    CartController->>+CartService: removeCartItem(cartItemId)
    
    CartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt CartItem Found
        Note over CartService: Get cartId before deletion
        CartService->>+CartItemRepository: deleteById(cartItemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        Note over CartService: Recalculate cart totals
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ? WHERE cart_id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: CartDetailsDTO
        CartController-->>Client: ResponseEntity<CartDetailsDTO> (200)
    else CartItem Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.12 Clear Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart?customerId={customerId}
    CartController->>+CartService: clearCart(customerId)
    
    CartService->>+CartRepository: findActiveCartByCustomerId(customerId)
    CartRepository->>+Database: SELECT * FROM carts WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Found
        CartService->>+CartItemRepository: deleteByCartId(cartId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        Note over CartService: Update cart status and reset total
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE carts SET total_amount = 0, status = 'CLEARED', updated_at = ? WHERE cart_id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: void
        CartController-->>Client: ResponseEntity (204)
    else Cart Not Found
        CartService-->>CartController: void
        CartController-->>Client: ResponseEntity (204)
    end
```

### 3.13 Checkout and Order Creation

```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant CartService
    participant PaymentService
    participant InventoryService
    participant NotificationService
    participant Database
    
    Client->>+OrderController: POST /api/orders/checkout (customerId, paymentMethod, shippingAddress)
    OrderController->>+OrderService: createOrder(customerId, paymentMethod, shippingAddress)
    
    OrderService->>+CartService: getCartDetails(customerId)
    CartService-->>-OrderService: CartDetailsDTO
    
    alt Cart Not Empty
        OrderService->>+InventoryService: reserveInventory(cartItems)
        InventoryService-->>-OrderService: Boolean
        
        alt Inventory Reserved
            OrderService->>+PaymentService: processPayment(customerId, totalAmount, paymentMethod)
            PaymentService-->>-OrderService: PaymentResult
            
            alt Payment Successful
                Note over OrderService: Create order from cart
                OrderService->>+Database: INSERT INTO orders (...) VALUES (...)
                Database-->>-OrderService: Order
                
                OrderService->>+CartService: clearCart(customerId)
                CartService-->>-OrderService: void
                
                OrderService->>+NotificationService: sendOrderConfirmation(customerId, orderId)
                NotificationService-->>-OrderService: void
                
                OrderService-->>OrderController: OrderDTO
                OrderController-->>Client: ResponseEntity<OrderDTO> (201)
            else Payment Failed
                OrderService->>+InventoryService: releaseInventory(cartItems)
                InventoryService-->>-OrderService: void
                OrderService-->>OrderController: throw PaymentFailedException
                OrderController-->>Client: ResponseEntity (400) with error
            end
        else Inventory Unavailable
            OrderService-->>OrderController: throw InsufficientStockException
            OrderController-->>Client: ResponseEntity (400) with error
        end
    else Cart Empty
        OrderService-->>OrderController: throw EmptyCartException
        OrderController-->>Client: ResponseEntity (400) with error
    end
```
