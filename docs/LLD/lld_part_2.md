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

### 3.8 Add Product to Shopping Cart

**Requirement Reference:** Story SCRUM-343 AC1: When they click Add to Cart, Then the product is added to their shopping cart with quantity 1

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant CartItemRepository
    participant Database
    participant Cache
    
    Client->>+CartController: POST /api/v1/cart/items {productId, quantity}
    CartController->>CartController: Validate authentication/session
    CartController->>+CartService: addItemToCart(cartId, productId, quantity)
    
    CartService->>+ProductService: getProductById(productId)
    ProductService-->>-CartService: Product
    
    alt Product Not Found
        CartService-->>CartController: throw ProductNotFoundException
        CartController-->>Client: 404 Not Found
    else Insufficient Stock
        CartService-->>CartController: throw InsufficientStockException
        CartController-->>Client: 409 Conflict
    else Product Exists and In Stock
        CartService->>+CartRepository: findById(cartId)
        CartRepository->>+Database: SELECT * FROM carts WHERE cart_id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-CartService: Optional<CartItem>
        
        alt Item Already Exists
            Note over CartService: Update quantity
            CartService->>CartService: calculateSubtotal()
        else New Item
            Note over CartService: Create new CartItem
            CartService->>CartService: calculateSubtotal()
        end
        
        CartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>+Database: INSERT/UPDATE cart_items
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-CartService: CartItem
        
        CartService->>+Cache: invalidate(cartId)
        Cache-->>-CartService: Success
        
        CartService-->>-CartController: CartItem
        CartController-->>-Client: 201 Created {cartItem}
    end
```

### 3.9 View Shopping Cart

**Requirement Reference:** Story SCRUM-343 AC2: all added products are displayed with name, price, quantity, and subtotal, AC5: message Your cart is empty is displayed

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    participant Cache
    
    Client->>+CartController: GET /api/v1/cart
    CartController->>CartController: Extract cartId from session/auth
    CartController->>+CartService: getCart(cartId)
    
    CartService->>+Cache: get(cartId)
    Cache-->>-CartService: Cache miss
    
    CartService->>+CartRepository: findById(cartId)
    CartRepository->>+Database: SELECT * FROM carts WHERE cart_id = ?
    Database-->>-CartRepository: Cart
    CartRepository-->>-CartService: Cart
    
    CartService->>+CartItemRepository: findByCartId(cartId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
    Database-->>-CartItemRepository: List<CartItem>
    CartItemRepository-->>-CartService: List<CartItem>
    
    alt Cart is Empty
        CartService-->>CartController: Cart with empty items
        CartController-->>Client: 200 OK {cart: {items: [], message: "Your cart is empty"}}
    else Cart has Items
        loop For each CartItem
            CartService->>+ProductRepository: findById(productId)
            ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
            Database-->>-ProductRepository: Product
            ProductRepository-->>-CartService: Product
            Note over CartService: Enrich CartItem with product details
        end
        
        CartService->>CartService: calculateCartTotals()
        CartService->>+Cache: set(cartId, cart, TTL=15min)
        Cache-->>-CartService: Success
        
        CartService-->>-CartController: Cart with items and totals
        CartController-->>-Client: 200 OK {cart: {items: [...], subtotal, tax, total}}
    end
```

### 3.10 Update Cart Item Quantity

**Requirement Reference:** Story SCRUM-343 AC3: update the quantity of an item, Then the subtotal and total are recalculated automatically

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartItemRepository
    participant Database
    participant Cache
    
    Client->>+CartController: PATCH /api/v1/cart/items/{itemId} {quantity}
    CartController->>CartController: Validate input (quantity > 0)
    CartController->>+CartService: updateItemQuantity(itemId, quantity)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    else Item Found
        CartService->>+ProductService: getProductById(productId)
        ProductService-->>-CartService: Product
        
        CartService->>CartService: validateStockAvailability(product, quantity)
        
        alt Insufficient Stock
            CartService-->>CartController: throw InsufficientStockException
            CartController-->>Client: 409 Conflict {available: stock_quantity}
        else Stock Available
            Note over CartService: Update quantity
            CartService->>CartService: calculateSubtotal(unitPrice * quantity)
            
            CartService->>+CartItemRepository: save(cartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE item_id = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-CartService: CartItem
            
            CartService->>CartService: calculateCartTotals(cartId)
            CartService->>+Cache: invalidate(cartId)
            Cache-->>-CartService: Success
            
            CartService-->>-CartController: CartItem with updated totals
            CartController-->>-Client: 200 OK {cartItem, cartTotals}
        end
    end
```

### 3.11 Remove Item from Cart

**Requirement Reference:** Story SCRUM-343 AC4: When they click Remove, Then the item is deleted from the cart and totals are updated

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database
    participant Cache
    
    Client->>+CartController: DELETE /api/v1/cart/items/{itemId}
    CartController->>+CartService: removeItemFromCart(itemId)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    else Item Found
        Note over CartService: Extract cartId for total recalculation
        
        CartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE item_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        CartService->>CartService: calculateCartTotals(cartId)
        CartService->>+Cache: invalidate(cartId)
        Cache-->>-CartService: Success
        
        CartService-->>-CartController: CartTotals
        CartController-->>-Client: 204 No Content {cartTotals}
    end
```
