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

### 3.5 Get Products By Category

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

### 3.6 Search Products

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

### 3.7 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (userId, productId, quantity)
    CartController->>+CartService: addProductToCart(userId, productId, quantity)
    
    CartService->>+ProductService: validateInventoryAvailability(productId, quantity)
    ProductService->>+ProductRepository: findAvailableStock(productId)
    ProductRepository->>+Database: SELECT stock_quantity FROM products WHERE id = ?
    Database-->>-ProductRepository: stock_quantity
    ProductRepository-->>-ProductService: stock_quantity
    
    alt Sufficient Inventory
        ProductService-->>CartService: true
        
        CartService->>+CartRepository: findByUserId(userId)
        CartRepository->>+Database: SELECT * FROM carts WHERE user_id = ?
        Database-->>-CartRepository: Optional<Cart>
        CartRepository-->>-CartService: Optional<Cart>
        
        alt Cart Exists
            Note over CartService: Add item to existing cart
        else Cart Not Exists
            Note over CartService: Create new cart
        end
        
        Note over CartService: Calculate unit price and total price
        Note over CartService: Apply Minimum Procurement Threshold logic
        
        CartService->>+CartRepository: save(cartItem)
        CartRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
        Database-->>-CartRepository: CartItem
        CartRepository-->>-CartService: CartItem
        
        CartService->>+ProductService: reserveInventory(productId, quantity)
        ProductService->>+ProductRepository: updateStockQuantity(productId, newQuantity)
        ProductRepository->>+Database: UPDATE products SET stock_quantity = ? WHERE id = ?
        Database-->>-ProductRepository: success
        ProductRepository-->>-ProductService: success
        ProductService-->>-CartService: success
        
        CartService-->>CartController: CartItem
        CartController-->>Client: ResponseEntity<CartItem> (201)
    else Insufficient Inventory
        ProductService-->>CartService: throw InsufficientInventoryException
        CartService-->>CartController: InsufficientInventoryException
        CartController-->>Client: ResponseEntity (400)
    end
```

### 3.8 View Cart Details

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: GET /api/cart?userId={userId}
    CartController->>+CartService: getCartByUserId(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT c.*, ci.* FROM carts c LEFT JOIN cart_items ci ON c.id = ci.cart_id WHERE c.user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Found
        Note over CartService: Calculate cart total
        CartService-->>CartController: Cart
        CartController-->>Client: ResponseEntity<Cart> (200)
    else Cart Not Found or Empty
        CartService-->>CartController: Empty Cart
        CartController-->>Client: ResponseEntity<Cart> (200) with empty items
    end
```

### 3.9 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} (quantity)
    CartController->>+CartService: updateCartItemQuantity(itemId, quantity)
    
    Note over CartService: Validate quantity >= 1
    
    CartService->>+CartRepository: findCartItemById(itemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Cart Item Found
        Note over CartService: Calculate quantity difference
        
        CartService->>+ProductService: validateInventoryAvailability(productId, newQuantity)
        ProductService->>+ProductRepository: findAvailableStock(productId)
        ProductRepository->>+Database: SELECT stock_quantity FROM products WHERE id = ?
        Database-->>-ProductRepository: stock_quantity
        ProductRepository-->>-ProductService: stock_quantity
        
        alt Sufficient Inventory
            ProductService-->>CartService: true
            
            Note over CartService: Update cart item quantity
            Note over CartService: Recalculate total price
            
            CartService->>+CartRepository: save(updatedCartItem)
            CartRepository->>+Database: UPDATE cart_items SET quantity = ?, total_price = ? WHERE id = ?
            Database-->>-CartRepository: Updated CartItem
            CartRepository-->>-CartService: Updated CartItem
            
            CartService->>+ProductService: reserveInventory(productId, quantityDifference)
            ProductService->>+ProductRepository: updateStockQuantity(productId, newStock)
            ProductRepository->>+Database: UPDATE products SET stock_quantity = ? WHERE id = ?
            Database-->>-ProductRepository: success
            ProductRepository-->>-ProductService: success
            ProductService-->>-CartService: success
            
            CartService-->>CartController: Updated CartItem
            CartController-->>Client: ResponseEntity<CartItem> (200)
        else Insufficient Inventory
            ProductService-->>CartService: throw InsufficientInventoryException
            CartService-->>CartController: InsufficientInventoryException
            CartController-->>Client: ResponseEntity (400)
        end
    else Cart Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.10 Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId}
    CartController->>+CartService: removeCartItem(itemId)
    
    CartService->>+CartRepository: findCartItemById(itemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Cart Item Found
        Note over CartService: Get product ID and quantity
        
        CartService->>+CartRepository: deleteCartItem(itemId)
        CartRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartRepository: success
        CartRepository-->>-CartService: success
        
        CartService->>+ProductService: reserveInventory(productId, -quantity)
        ProductService->>+ProductRepository: updateStockQuantity(productId, newStock)
        ProductRepository->>+Database: UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?
        Database-->>-ProductRepository: success
        ProductRepository-->>-ProductService: success
        ProductService-->>-CartService: success
        
        CartService-->>CartController: success
        CartController-->>Client: ResponseEntity (204)
    else Cart Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Handle Empty Cart State

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: GET /api/cart?userId={userId}
    CartController->>+CartService: getCartByUserId(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM carts WHERE user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Not Found
        Note over CartService: Return empty cart response
        CartService-->>CartController: Empty Cart object
        CartController-->>Client: ResponseEntity<Cart> (200) with empty items list
    else Cart Found but No Items
        Note over CartService: Return cart with empty items
        CartService-->>CartController: Cart with empty items
        CartController-->>Client: ResponseEntity<Cart> (200) with empty items list
    end
```

### 3.12 Validate Inventory Limits

```mermaid
sequenceDiagram
    participant CartService
    participant ProductService
    participant ProductRepository
    participant Database
    
    CartService->>+ProductService: validateInventoryAvailability(productId, requestedQuantity)
    
    ProductService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Found
        ProductService->>+ProductRepository: findAvailableStock(productId)
        ProductRepository->>+Database: SELECT stock_quantity FROM products WHERE id = ?
        Database-->>-ProductRepository: stock_quantity
        ProductRepository-->>-ProductService: stock_quantity
        
        alt Sufficient Stock
            Note over ProductService: stock_quantity >= requestedQuantity
            ProductService-->>CartService: true
        else Insufficient Stock
            Note over ProductService: stock_quantity < requestedQuantity
            ProductService-->>CartService: throw InsufficientInventoryException
        end
    else Product Not Found
        ProductService-->>CartService: throw ProductNotFoundException
    end
```

## 4. API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |
| POST | `/api/cart/items` | Add product to cart | CartItemRequest | CartItem |
| GET | `/api/cart` | View cart details | Query param: userId | Cart |
| PUT | `/api/cart/items/{id}` | Update cart item quantity | quantity | CartItem |
| DELETE | `/api/cart/items/{id}` | Remove product from cart | None | Void |

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_procurement_threshold INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Carts Table

```sql
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_id (user_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_product (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository and CartRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- Shopping cart management with real-time inventory validation
- Minimum Procurement Threshold support for products
- Cart state persistence across user sessions
