# Low-Level Design (LLD) - E-commerce Product Management System

**Version:** 2.0  
**Last Updated:** 2024  
**Story Reference:** SCRUM-1140 - Shopping Cart Management

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement, ShoppingCartManagement  

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        <<@RestController>>
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword) ResponseEntity~List~Product~~
    }
    
    class ProductService {
        <<@Service>>
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Product
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }
    
    class ProductRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingIgnoreCase(String keyword) List~Product~
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getCategory() String
        +setCategory(String category) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer stockQuantity) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +addToCart(Long customerId, Long productId) ResponseEntity~ShoppingCart~
        +getCart(Long customerId) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long customerId, Long productId, Integer quantity) ResponseEntity~ShoppingCart~
        +removeFromCart(Long customerId, Long productId) ResponseEntity~ShoppingCart~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +addToCart(Long customerId, Long productId) ShoppingCart
        +getCart(Long customerId) ShoppingCart
        +updateCartItemQuantity(Long customerId, Long productId, Integer quantity) ShoppingCart
        +removeFromCart(Long customerId, Long productId) ShoppingCart
        +calculateTotal(ShoppingCart cart) BigDecimal
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
        +deleteById(Long id) void
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +deleteByCartIdAndProductId(Long cartId, Long productId) void
        +save(CartItem cartItem) CartItem
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long customerId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
        +getTotalAmount() BigDecimal
        +setTotalAmount(BigDecimal totalAmount) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -String productName
        -BigDecimal productPrice
        -Integer quantity
        -BigDecimal subtotal
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProductName() String
        +setProductName(String productName) void
        +getProductPrice() BigDecimal
        +setProductPrice(BigDecimal productPrice) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemRepository : depends on
    ShoppingCartService --> ProductService : depends on
    ShoppingCartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    ShoppingCart --> CartItem : contains
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CARTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL, UNIQUE"
        DECIMAL total_amount "NOT NULL, PRECISION(10,2), DEFAULT 0.00"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        VARCHAR product_name "NOT NULL, MAX_LENGTH(255)"
        DECIMAL product_price "NOT NULL, PRECISION(10,2)"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```

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
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductService
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/{customerId}/add?productId={productId}
    ShoppingCartController->>+ShoppingCartService: addToCart(customerId, productId)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService-->>-ShoppingCartService: Product
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
        
        alt Item Exists
            Note over ShoppingCartService: Increment quantity by 1
        else Item Not Exists
            Note over ShoppingCartService: Create new CartItem with quantity 1
        end
    else Cart Not Exists
        Note over ShoppingCartService: Create new ShoppingCart
        Note over ShoppingCartService: Create new CartItem with quantity 1
    end
    
    Note over ShoppingCartService: Calculate subtotal
    ShoppingCartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT/UPDATE cart_items
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-ShoppingCartService: CartItem
    
    Note over ShoppingCartService: Recalculate total amount
    ShoppingCartService->>+ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>+Database: UPDATE shopping_carts
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: ShoppingCart
    ShoppingCartController-->>-Client: ResponseEntity<ShoppingCart> (200)
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart/{customerId}
    ShoppingCartController->>+ShoppingCartService: getCart(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists and Has Items
        Note over ShoppingCartService: Return cart with all items
        ShoppingCartService-->>ShoppingCartController: ShoppingCart with items
        ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
    else Cart Empty or Not Exists
        Note over ShoppingCartService: Return empty cart message
        ShoppingCartService-->>ShoppingCartController: Empty cart response
        ShoppingCartController-->>Client: ResponseEntity with "Your cart is empty" message (200)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/{customerId}/update?productId={productId}&quantity={quantity}
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(customerId, productId, quantity)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
        
        alt Item Exists
            Note over ShoppingCartService: Update quantity
            Note over ShoppingCartService: Recalculate subtotal
            ShoppingCartService->>+CartItemRepository: save(cartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            Note over ShoppingCartService: Recalculate total amount
            ShoppingCartService->>+ShoppingCartRepository: save(cart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        else Item Not Found
            ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
            ShoppingCartController-->>Client: ResponseEntity (404)
        end
    else Cart Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/{customerId}/remove?productId={productId}
    ShoppingCartController->>+ShoppingCartService: removeFromCart(customerId, productId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
        
        alt Item Exists
            ShoppingCartService->>+CartItemRepository: deleteByCartIdAndProductId(cartId, productId)
            CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?
            Database-->>-CartItemRepository: Success
            CartItemRepository-->>-ShoppingCartService: void
            
            Note over ShoppingCartService: Recalculate total amount
            ShoppingCartService->>+ShoppingCartRepository: save(cart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        else Item Not Found
            ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
            ShoppingCartController-->>Client: ResponseEntity (404)
        end
    else Cart Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/{customerId}/add?productId={productId}` | Add product to cart with quantity 1 | None | ShoppingCart |
| GET | `/api/cart/{customerId}` | View shopping cart with all items | None | ShoppingCart |
| PUT | `/api/cart/{customerId}/update?productId={productId}&quantity={quantity}` | Update item quantity in cart | None | ShoppingCart |
| DELETE | `/api/cart/{customerId}/remove?productId={productId}` | Remove item from cart | None | ShoppingCart |

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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_carts_customer_id ON shopping_carts(customer_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_cart_product (cart_id, product_id)
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
2. **Repository Pattern:** Data access abstraction through ProductRepository, ShoppingCartRepository, and CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors
6. **Aggregate Pattern:** ShoppingCart acts as an aggregate root containing CartItems

## 8. Key Features

### Product Management
- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

### Shopping Cart Management
- Add products to cart with default quantity of 1
- View all cart items with product details (name, price, quantity, subtotal)
- Update item quantities with automatic subtotal and total recalculation
- Remove items from cart with automatic total updates
- Empty cart detection with appropriate messaging
- One cart per customer (enforced by unique constraint)
- Automatic calculation of subtotals and total amounts
- Cascade deletion of cart items when cart is deleted
- Transactional consistency for all cart operations