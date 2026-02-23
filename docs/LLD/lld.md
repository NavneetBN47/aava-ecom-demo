# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

This document provides a comprehensive low-level design for an E-commerce Product Management System. The system enables users to browse products, manage a shopping cart, and perform CRUD operations on products. It is built using Spring Boot with a RESTful API architecture.

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐
│   Client Layer  │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│ Controller Layer│
│  (REST APIs)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Service Layer  │
│ (Business Logic)│
└────────┬────────┘
         │
┌────────▼────────┐
│Repository Layer │
│   (Data Access) │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │
│    (MySQL)      │
└─────────────────┘
```

### 2.2 Class Diagram

```mermaid
classDiagram
    class Product {
        -Long id
        -String name
        -String description
        -Double price
        -Integer stockQuantity
        -String category
        -String imageUrl
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long) void
        +getName() String
        +setName(String) void
        +getDescription() String
        +setDescription(String) void
        +getPrice() Double
        +setPrice(Double) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer) void
        +getCategory() String
        +setCategory(String) void
        +getImageUrl() String
        +setImageUrl(String) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime) void
    }

    class CartItem {
        -Long id
        -Long productId
        -String productName
        -Double price
        -Integer quantity
        -Double subtotal
        +getId() Long
        +setId(Long) void
        +getProductId() Long
        +setProductId(Long) void
        +getProductName() String
        +setProductName(String) void
        +getPrice() Double
        +setPrice(Double) void
        +getQuantity() Integer
        +setQuantity(Integer) void
        +getSubtotal() Double
        +calculateSubtotal() void
    }

    class ShoppingCart {
        -Long id
        -List~CartItem~ items
        -Double totalAmount
        +getId() Long
        +setId(Long) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~) void
        +getTotalAmount() Double
        +addItem(CartItem) void
        +removeItem(Long) void
        +updateItemQuantity(Long, Integer) void
        +calculateTotal() void
        +clear() void
    }

    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long) ResponseEntity~Product~
        +createProduct(Product) ResponseEntity~Product~
        +updateProduct(Long, Product) ResponseEntity~Product~
        +deleteProduct(Long) ResponseEntity~Void~
        +getProductsByCategory(String) ResponseEntity~List~Product~~
        +searchProducts(String) ResponseEntity~List~Product~~
    }

    class CartController {
        -CartService cartService
        +addToCart(Long, Integer) ResponseEntity~CartItem~
        +getCart() ResponseEntity~ShoppingCart~
        +updateCartItem(Long, Integer) ResponseEntity~CartItem~
        +removeFromCart(Long) ResponseEntity~Void~
        +clearCart() ResponseEntity~Void~
    }

    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long) Product
        +createProduct(Product) Product
        +updateProduct(Long, Product) Product
        +deleteProduct(Long) void
        +getProductsByCategory(String) List~Product~
        +searchProducts(String) List~Product~
        +checkStock(Long, Integer) boolean
    }

    class CartService {
        -ShoppingCart cart
        -ProductService productService
        +addItemToCart(Long, Integer) CartItem
        +getCart() ShoppingCart
        +updateItemQuantity(Long, Integer) CartItem
        +removeItem(Long) void
        +clearCart() void
    }

    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findById(Long) Optional~Product~
        +save(Product) Product
        +deleteById(Long) void
        +findByCategory(String) List~Product~
        +findByNameContainingIgnoreCase(String) List~Product~
    }

    ProductController --> ProductService
    CartController --> CartService
    ProductService --> ProductRepository
    CartService --> ProductService
    ProductService ..> Product
    CartService ..> ShoppingCart
    CartService ..> CartItem
    ShoppingCart "1" *-- "*" CartItem
```

### 2.3 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCT {
        BIGINT id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        INT stock_quantity
        VARCHAR category
        VARCHAR image_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CART_ITEM {
        BIGINT id PK
        BIGINT product_id FK
        VARCHAR product_name
        DECIMAL price
        INT quantity
        DECIMAL subtotal
    }

    SHOPPING_CART {
        BIGINT id PK
        DECIMAL total_amount
    }

    SHOPPING_CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : references
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

    Client->>ProductController: GET /api/products
    ProductController->>ProductService: getAllProducts()
    ProductService->>ProductRepository: findAll()
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.2 Get Product By ID

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/{id}
    ProductController->>ProductService: getProductById(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Found
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ResourceNotFoundException
        ProductController-->>Client: 404 Not Found
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

    Client->>ProductController: POST /api/products (Product Data)
    ProductController->>ProductController: Validate Request Body
    
    alt Validation Successful
        ProductController->>ProductService: createProduct(product)
        ProductService->>ProductService: Set createdAt, updatedAt
        ProductService->>ProductRepository: save(product)
        ProductRepository->>Database: INSERT INTO products VALUES (...)
        Database-->>ProductRepository: Generated ID
        ProductRepository-->>ProductService: Saved Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 201 Created (Product)
    else Validation Failed
        ProductController-->>Client: 400 Bad Request (Validation Errors)
    end
```

### 3.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id} (Updated Data)
    ProductController->>ProductService: updateProduct(id, productDetails)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductService: Update fields, set updatedAt
        ProductService->>ProductRepository: save(updatedProduct)
        ProductRepository->>Database: UPDATE products SET ... WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: Updated Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Updated Product)
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ResourceNotFoundException
        ProductController-->>Client: 404 Not Found
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

    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ResourceNotFoundException
        ProductController-->>Client: 404 Not Found
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

    Client->>ProductController: GET /api/products/category/{category}
    ProductController->>ProductService: getProductsByCategory(category)
    ProductService->>ProductRepository: findByCategory(category)
    ProductRepository->>Database: SELECT * FROM products WHERE category = ?
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>ProductService: searchProducts(keyword)
    ProductService->>ProductRepository: findByNameContainingIgnoreCase(keyword)
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE %keyword%
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.8 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant ShoppingCart

    Client->>CartController: POST /api/cart/add (productId, quantity)
    CartController->>CartService: addItemToCart(productId, quantity)
    CartService->>ProductService: getProductById(productId)
    
    alt Product Exists
        ProductService-->>CartService: Product
        CartService->>ProductService: checkStock(productId, quantity)
        
        alt Stock Available
            ProductService-->>CartService: true
            CartService->>CartService: Create CartItem
            CartService->>ShoppingCart: addItem(cartItem)
            ShoppingCart->>ShoppingCart: calculateTotal()
            ShoppingCart-->>CartService: void
            CartService-->>CartController: CartItem
            CartController-->>Client: 200 OK (CartItem)
        else Insufficient Stock
            ProductService-->>CartService: false
            CartService-->>CartController: throw InsufficientStockException
            CartController-->>Client: 400 Bad Request (Insufficient Stock)
        end
    else Product Not Found
        ProductService-->>CartService: throw ResourceNotFoundException
        CartService-->>CartController: throw ResourceNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ShoppingCart

    Client->>CartController: GET /api/cart
    CartController->>CartService: getCart()
    CartService->>ShoppingCart: getItems(), getTotalAmount()
    ShoppingCart-->>CartService: ShoppingCart
    CartService-->>CartController: ShoppingCart
    CartController-->>Client: 200 OK (ShoppingCart)
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant ShoppingCart

    Client->>CartController: PUT /api/cart/items/{itemId} (newQuantity)
    CartController->>CartService: updateItemQuantity(itemId, newQuantity)
    CartService->>ShoppingCart: findItem(itemId)
    
    alt Item Exists
        ShoppingCart-->>CartService: CartItem
        CartService->>ProductService: checkStock(productId, newQuantity)
        
        alt Stock Available
            ProductService-->>CartService: true
            CartService->>ShoppingCart: updateItemQuantity(itemId, newQuantity)
            ShoppingCart->>ShoppingCart: calculateTotal()
            ShoppingCart-->>CartService: Updated CartItem
            CartService-->>CartController: CartItem
            CartController-->>Client: 200 OK (CartItem)
        else Insufficient Stock
            ProductService-->>CartService: false
            CartService-->>CartController: throw InsufficientStockException
            CartController-->>Client: 400 Bad Request
        end
    else Item Not Found
        ShoppingCart-->>CartService: null
        CartService-->>CartController: throw ResourceNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ShoppingCart

    Client->>CartController: DELETE /api/cart/items/{itemId}
    CartController->>CartService: removeItem(itemId)
    CartService->>ShoppingCart: removeItem(itemId)
    
    alt Item Exists
        ShoppingCart->>ShoppingCart: calculateTotal()
        ShoppingCart-->>CartService: void
        CartService-->>CartController: void
        CartController-->>Client: 204 No Content
    else Item Not Found
        ShoppingCart-->>CartService: throw ResourceNotFoundException
        CartService-->>CartController: throw ResourceNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

## 4. API Endpoints Summary

### Product Management APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/products | Get all products | None | List<Product> |
| GET | /api/products/{id} | Get product by ID | None | Product |
| POST | /api/products | Create new product | Product | Product (201) |
| PUT | /api/products/{id} | Update product | Product | Product |
| DELETE | /api/products/{id} | Delete product | None | 204 No Content |
| GET | /api/products/category/{category} | Get products by category | None | List<Product> |
| GET | /api/products/search?keyword={keyword} | Search products | None | List<Product> |

### Shopping Cart APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/cart/add | Add item to cart | {productId, quantity} | CartItem |
| GET | /api/cart | View shopping cart | None | ShoppingCart |
| PUT | /api/cart/items/{itemId} | Update item quantity | {quantity} | CartItem |
| DELETE | /api/cart/items/{itemId} | Remove item from cart | None | 204 No Content |
| DELETE | /api/cart/clear | Clear entire cart | None | 204 No Content |

## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name)
);
```

### 5.2 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    cart_id BIGINT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE
);
```

### 5.3 Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 6. Technology Stack

- **Backend Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Database**: MySQL 8.x
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Validation**: Jakarta Bean Validation
- **Logging**: SLF4J with Logback

## 7. Design Patterns Used

1. **MVC Pattern**: Separation of Controller, Service, and Repository layers
2. **Repository Pattern**: Data access abstraction through Spring Data JPA
3. **Dependency Injection**: Constructor-based injection for loose coupling
4. **DTO Pattern**: Data Transfer Objects for API requests/responses
5. **Singleton Pattern**: Service beans managed by Spring container
6. **Builder Pattern**: For complex object creation (if needed)

## 8. Key Features

### 8.1 Product Management
- Complete CRUD operations for products
- Category-based filtering
- Search functionality with case-insensitive matching
- Stock quantity tracking
- Automatic timestamp management

### 8.2 Shopping Cart
- Add products to cart with quantity validation
- Update item quantities with stock verification
- Remove individual items
- Clear entire cart
- Automatic subtotal and total calculation
- Real-time stock availability checking

### 8.3 Error Handling
- Custom exception handling for:
  - Resource not found (404)
  - Insufficient stock (400)
  - Validation errors (400)
  - Internal server errors (500)

### 8.4 Data Validation
- Request body validation using Jakarta Bean Validation
- Business rule validation in service layer
- Stock availability checks before cart operations

### 8.5 Performance Considerations
- Database indexing on frequently queried columns
- Efficient query methods in repositories
- Lazy loading for related entities
- Connection pooling for database connections

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active