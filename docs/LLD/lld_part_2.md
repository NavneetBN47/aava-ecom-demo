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

### 3.8 Add to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (productId)
    CartController->>+CartService: addToCart(userId, productId)
    
    Note over CartService: Validate product exists
    CartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-CartService: Optional<Product>
    
    alt Product Not Found
        CartService-->>CartController: throw ProductNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Product Found
        Note over CartService: Check if item already in cart
        CartService->>+CartRepository: findCartItemByUserIdAndProductId(userId, productId)
        CartRepository->>+Database: SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?
        Database-->>-CartRepository: Optional<CartItem>
        CartRepository-->>-CartService: Optional<CartItem>
        
        alt Item Already Exists
            Note over CartService: Update quantity (increment by 1)
            Note over CartService: Validate quantity <= stock_quantity
            CartService->>+CartRepository: save(updatedCartItem)
            CartRepository->>+Database: UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?
            Database-->>-CartRepository: CartItem
            CartRepository-->>-CartService: CartItem
        else New Item
            Note over CartService: Create new cart item with quantity = 1
            Note over CartService: Set addedAt timestamp
            CartService->>+CartRepository: save(newCartItem)
            CartRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
            Database-->>-CartRepository: CartItem
            CartRepository-->>-CartService: CartItem
        end
        
        CartService-->>CartController: CartItem
        CartController-->>Client: ResponseEntity<CartItem> (201)
    end
```

### 3.9 View Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: GET /api/cart
    CartController->>+CartService: getCart(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE user_id = ?
    Database-->>-CartRepository: List<CartItem>
    CartRepository-->>-CartService: List<CartItem>
    
    alt Cart is Empty
        Note over CartService: Create empty cart response
        Note over CartService: Set message: 'Your cart is empty'
        CartService-->>CartController: CartResponse (empty=true)
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    else Cart Has Items
        Note over CartService: For each cart item, fetch product details
        loop For each CartItem
            CartService->>+ProductRepository: findById(productId)
            ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
            Database-->>-ProductRepository: Product
            ProductRepository-->>-CartService: Product
            Note over CartService: Calculate item subtotal = price * quantity
            Note over CartService: Build CartItemDetail
        end
        
        Note over CartService: Calculate cart total
        Note over CartService: Build CartResponse with all items
        CartService-->>CartController: CartResponse (with items and total)
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    end
```

### 3.10 Update Cart Item Quantity Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{cartItemId} (newQuantity)
    CartController->>+CartService: updateCartItemQuantity(cartItemId, newQuantity)
    
    Note over CartService: Validate quantity > 0
    
    CartService->>+CartRepository: findById(cartItemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Cart Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Cart Item Found
        Note over CartService: Fetch product to validate stock
        CartService->>+ProductRepository: findById(productId)
        ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
        Database-->>-ProductRepository: Product
        ProductRepository-->>-CartService: Product
        
        alt Quantity Exceeds Stock
            CartService-->>CartController: throw InsufficientStockException
            CartController-->>Client: ResponseEntity (400)
        else Valid Quantity
            Note over CartService: Update cart item quantity
            Note over CartService: Set updatedAt timestamp
            CartService->>+CartRepository: save(updatedCartItem)
            CartRepository->>+Database: UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?
            Database-->>-CartRepository: CartItem
            CartRepository-->>-CartService: CartItem
            
            Note over CartService: Fetch updated cart with recalculated totals
            CartService->>CartService: getCart(userId)
            CartService-->>CartController: CartResponse (with updated totals)
            CartController-->>Client: ResponseEntity<CartResponse> (200)
        end
    end
```

### 3.11 Remove Cart Item Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{cartItemId}
    CartController->>+CartService: removeCartItem(cartItemId)
    
    CartService->>+CartRepository: findById(cartItemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Cart Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Cart Item Found
        Note over CartService: Store userId for fetching updated cart
        CartService->>+CartRepository: deleteCartItem(cartItemId)
        CartRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartRepository: Success
        CartRepository-->>-CartService: void
        
        Note over CartService: Fetch updated cart with recalculated totals
        CartService->>CartService: getCart(userId)
        CartService-->>CartController: CartResponse (with updated totals)
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    end
```

### 3.12 Empty Cart Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: GET /api/cart
    CartController->>+CartService: getCart(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE user_id = ?
    Database-->>-CartRepository: Empty List
    CartRepository-->>-CartService: Empty List
    
    Note over CartService: Detect empty cart
    CartService->>CartService: isCartEmpty(userId) returns true
    
    Note over CartService: Build CartResponse
    Note over CartService: Set isEmpty = true
    Note over CartService: Set message = 'Your cart is empty'
    Note over CartService: Set cartTotal = 0.00
    Note over CartService: Set items = empty list
    
    CartService-->>CartController: CartResponse (empty cart)
    CartController-->>Client: ResponseEntity<CartResponse> (200)
    Note over Client: Display 'Your cart is empty' message
    Note over Client: Show 'Continue Shopping' link
```

## 4. API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

## 5. Shopping Cart API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart | {"productId": Long} | CartItem |
| GET | `/api/cart` | View cart contents | None | CartResponse |
| PUT | `/api/cart/items/{cartItemId}` | Update item quantity | {"quantity": Integer} | CartResponse |
| DELETE | `/api/cart/items/{cartItemId}` | Remove item from cart | None | CartResponse |

### 5.1 Cart API Request/Response Models

**Add to Cart Request:**
```json
{
  "productId": 123
}
```

**Update Quantity Request:**
```json
{
  "quantity": 3
}
```

**Cart Response (with items):**
```json
{
  "items": [
    {
      "cartItemId": 1,
      "productName": "Product A",
      "productPrice": 29.99,
      "quantity": 2,
      "subtotal": 59.98
    },
    {
      "cartItemId": 2,
      "productName": "Product B",
      "productPrice": 15.50,
      "quantity": 1,
      "subtotal": 15.50
    }
  ],
  "cartTotal": 75.48,
  "isEmpty": false,
  "message": null
}
```

**Cart Response (empty):**
```json
{
  "items": [],
  "cartTotal": 0.00,
  "isEmpty": true,
  "message": "Your cart is empty"
}
```

## 6. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_product UNIQUE (user_id, product_id),
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_cart_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_product_id ON cart_items(product_id);
```
