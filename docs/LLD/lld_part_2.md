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
    participant ShoppingCartController
    participant ShoppingCartService
    participant InventoryValidationService
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/items (AddToCartRequest)
    ShoppingCartController->>+ShoppingCartService: addProductToCart(customerId, productId, quantity)
    
    ShoppingCartService->>+InventoryValidationService: checkStockAvailability(productId, quantity)
    InventoryValidationService->>+ProductService: getAvailableQuantity(productId)
    ProductService-->>-InventoryValidationService: availableQuantity
    
    alt Insufficient Stock
        InventoryValidationService-->>ShoppingCartService: throw InsufficientStockException
        ShoppingCartService-->>ShoppingCartController: InsufficientStockException
        ShoppingCartController-->>Client: ResponseEntity (400)
    else Stock Available
        InventoryValidationService-->>-ShoppingCartService: true
        
        ShoppingCartService->>+InventoryValidationService: enforceMinimumOrderQuantity(productId, quantity)
        InventoryValidationService-->>-ShoppingCartService: validation result
        
        alt Below Procurement Threshold
            ShoppingCartService-->>ShoppingCartController: throw ProcurementThresholdException
            ShoppingCartController-->>Client: ResponseEntity (400)
        else Valid Quantity
            ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
            ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ? AND status = 'ACTIVE'
            Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
            ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
            
            alt Cart Not Found
                Note over ShoppingCartService: Create new cart
                ShoppingCartService->>+ShoppingCartRepository: save(newCart)
                ShoppingCartRepository->>+Database: INSERT INTO shopping_carts
                Database-->>-ShoppingCartRepository: ShoppingCart
                ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            end
            
            ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
            CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
            Database-->>-CartItemRepository: Optional<CartItem>
            CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
            
            alt Item Exists
                Note over ShoppingCartService: Update quantity
            else Item Not Found
                Note over ShoppingCartService: Create new cart item
            end
            
            ShoppingCartService->>+CartItemRepository: save(cartItem)
            CartItemRepository->>+Database: INSERT/UPDATE cart_items
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            ShoppingCartService->>+ProductService: reserveInventory(productId, quantity)
            ProductService-->>-ShoppingCartService: void
            
            Note over ShoppingCartService: Calculate cart total
            ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: CartResponse
            ShoppingCartController-->>Client: ResponseEntity<CartResponse> (201)
        end
    end
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart/{customerId}
    ShoppingCartController->>+ShoppingCartService: getCartByCustomerId(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found or Empty
        Note over ShoppingCartService: Return empty cart response
        ShoppingCartService-->>ShoppingCartController: CartResponse (empty)
        ShoppingCartController-->>Client: ResponseEntity<CartResponse> (200) with empty message
    else Cart Found
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        Note over ShoppingCartService: Build CartResponse with items
        ShoppingCartService-->>ShoppingCartController: CartResponse
        ShoppingCartController-->>Client: ResponseEntity<CartResponse> (200)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant InventoryValidationService
    participant ProductService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/items/{itemId} (UpdateCartItemRequest)
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(itemId, newQuantity)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    else Item Found
        ShoppingCartService->>+InventoryValidationService: validateQuantityUpdate(productId, newQuantity)
        InventoryValidationService-->>-ShoppingCartService: validation result
        
        alt Invalid Quantity
            ShoppingCartService-->>ShoppingCartController: throw InvalidQuantityException
            ShoppingCartController-->>Client: ResponseEntity (400)
        else Valid Quantity
            Note over ShoppingCartService: Calculate quantity difference
            ShoppingCartService->>+ProductService: reserveInventory(productId, quantityDiff)
            ProductService-->>-ShoppingCartService: void
            
            Note over ShoppingCartService: Update cart item
            ShoppingCartService->>+CartItemRepository: save(updatedCartItem)
            CartItemRepository->>+Database: UPDATE cart_items
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            Note over ShoppingCartService: Recalculate cart total
            ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: CartResponse
            ShoppingCartController-->>Client: ResponseEntity<CartResponse> (200)
        end
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/items/{itemId}
    ShoppingCartController->>+ShoppingCartService: removeCartItem(itemId)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    else Item Found
        Note over ShoppingCartService: Get product and quantity info
        ShoppingCartService->>+ProductService: releaseInventory(productId, quantity)
        ProductService-->>-ShoppingCartService: void
        
        ShoppingCartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
        
        Note over ShoppingCartService: Recalculate cart total
        ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
        ShoppingCartRepository->>+Database: UPDATE shopping_carts
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        
        ShoppingCartService-->>ShoppingCartController: void
        ShoppingCartController-->>Client: ResponseEntity (204)
    end
```

### 3.12 Add to Cart Flow (SCRUM-343 AC-1)

```mermaid
sequenceDiagram
    participant Customer
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant CartItemRepository
    participant Database
    
    Customer->>+ShoppingCartController: POST /api/cart/items (AddToCartRequest)
    Note over ShoppingCartController: Request contains customerId, productId, purchaseType
    
    ShoppingCartController->>+ShoppingCartService: addProductToCart(customerId, productId, purchaseType)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductService: Product
    ProductService-->>-ShoppingCartService: Product
    
    alt Product has minimumProcurementThreshold
        Note over ShoppingCartService: Set quantity = minimumProcurementThreshold
    else No threshold
        Note over ShoppingCartService: Set quantity = 1
    end
    
    ShoppingCartService->>+ProductService: validateInventoryAvailability(productId, quantity)
    ProductService-->>-ShoppingCartService: validation result
    
    alt Insufficient Stock
        ShoppingCartService-->>ShoppingCartController: throw InventoryValidationException
        ShoppingCartController-->>Customer: ResponseEntity (400) - Inventory Error
    else Stock Available
        Note over ShoppingCartService: Create/Update CartItem with purchaseType
        ShoppingCartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>Database: INSERT/UPDATE cart_items
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>-ShoppingCartService: CartItem
        
        ShoppingCartService->>+ProductService: reserveStock(productId, quantity)
        ProductService-->>-ShoppingCartService: void
        
        Note over ShoppingCartService: Calculate cart total
        ShoppingCartService-->>ShoppingCartController: CartResponse
        ShoppingCartController-->>Customer: ResponseEntity<CartResponse> (201)
    end
```

### 3.13 View Cart Flow (SCRUM-343 AC-2, AC-5)

```mermaid
sequenceDiagram
    participant Customer
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Customer->>+ShoppingCartController: GET /api/cart/{customerId}
    ShoppingCartController->>+ShoppingCartService: getCartByCustomerId(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found or Empty
        Note over ShoppingCartService: Check if cart has items
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>CartItemRepository: Empty List
        CartItemRepository-->>-ShoppingCartService: Empty List
        
        Note over ShoppingCartService: Build empty cart response
        Note over ShoppingCartService: Set isEmpty = true
        Note over ShoppingCartService: Add message: Your cart is empty
        ShoppingCartService-->>ShoppingCartController: CartResponse (empty)
        ShoppingCartController-->>Customer: ResponseEntity<CartResponse> (200) with empty message
    else Cart Found with Items
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        Note over ShoppingCartService: Build CartResponse with product name, unit price, quantity, subtotal
        ShoppingCartService-->>ShoppingCartController: CartResponse
        ShoppingCartController-->>Customer: ResponseEntity<CartResponse> (200)
    end
```

### 3.14 Update Quantity Flow (SCRUM-343 AC-3, AC-6)

```mermaid
sequenceDiagram
    participant Customer
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant CartItemRepository
    participant Database
    
    Customer->>+ShoppingCartController: PUT /api/cart/items/{cartItemId} (UpdateQuantityRequest)
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(cartItemId, newQuantity)
    
    ShoppingCartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Customer: ResponseEntity (404)
    else Item Found
        ShoppingCartService->>+ProductService: validateInventoryAvailability(productId, newQuantity)
        ProductService-->>-ShoppingCartService: validation result
        
        alt Quantity Exceeds Stock
            ShoppingCartService->>ShoppingCartService: validateInventory(productId, newQuantity)
            Note over ShoppingCartService: throw InventoryValidationException
            ShoppingCartService-->>ShoppingCartController: InventoryValidationException
            ShoppingCartController-->>Customer: ResponseEntity (400) - Inventory validation error
        else Valid Quantity
            Note over ShoppingCartService: Update cart item quantity
            Note over ShoppingCartService: Recalculate subtotal = unitPrice * newQuantity
            ShoppingCartService->>+CartItemRepository: save(updatedCartItem)
            CartItemRepository->>Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            Note over ShoppingCartService: Recalculate cart total instantly
            Note over ShoppingCartService: Update without page refresh
            ShoppingCartService-->>ShoppingCartController: CartResponse
            ShoppingCartController-->>Customer: ResponseEntity<CartResponse> (200)
        end
    end
```

### 3.15 Remove Item Flow (SCRUM-343 AC-4)

```mermaid
sequenceDiagram
    participant Customer
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Customer->>+ShoppingCartController: DELETE /api/cart/items/{cartItemId}
    ShoppingCartController->>+ShoppingCartService: removeCartItem(cartItemId)
    
    ShoppingCartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Customer: ResponseEntity (404)
    else Item Found
        Note over ShoppingCartService: Get product and quantity info
        ShoppingCartService->>+ProductService: releaseInventory(productId, quantity)
        ProductService-->>-ShoppingCartService: void
        
        ShoppingCartService->>+CartItemRepository: deleteById(cartItemId)
        CartItemRepository->>Database: DELETE FROM cart_items WHERE cart_item_id = ?
        Database-->>CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
        
        Note over ShoppingCartService: Recalculate cart total
        ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts SET total_amount = ?
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        
        ShoppingCartService-->>ShoppingCartController: void
        ShoppingCartController-->>Customer: ResponseEntity (204)
    end
```
