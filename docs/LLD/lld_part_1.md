# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement  

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
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
```

### 2.2 Shopping Cart Class Diagram

```mermaid
classDiagram
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addToCart(Long productId) ResponseEntity~CartItem~
        +getCart(Long userId) ResponseEntity~CartResponse~
        +updateCartItemQuantity(Long cartItemId, Integer quantity) ResponseEntity~CartResponse~
        +removeCartItem(Long cartItemId) ResponseEntity~CartResponse~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -ProductRepository productRepository
        +addToCart(Long userId, Long productId) CartItem
        +getCart(Long userId) CartResponse
        +updateCartItemQuantity(Long cartItemId, Integer quantity) CartResponse
        +removeCartItem(Long cartItemId) CartResponse
        +calculateItemSubtotal(BigDecimal price, Integer quantity) BigDecimal
        +calculateCartTotal(List~CartItem~ items) BigDecimal
        +isCartEmpty(Long userId) boolean
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) List~CartItem~
        +findCartItemByUserIdAndProductId(Long userId, Long productId) Optional~CartItem~
        +deleteCartItem(Long cartItemId) void
        +save(CartItem cartItem) CartItem
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long userId
        -Long productId
        -Integer quantity
        -LocalDateTime addedAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getAddedAt() LocalDateTime
        +setAddedAt(LocalDateTime addedAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartResponse {
        -List~CartItemDetail~ items
        -BigDecimal cartTotal
        -boolean isEmpty
        -String message
        +getItems() List~CartItemDetail~
        +getCartTotal() BigDecimal
        +isEmpty() boolean
        +getMessage() String
    }
    
    class CartItemDetail {
        -Long cartItemId
        -String productName
        -BigDecimal productPrice
        -Integer quantity
        -BigDecimal subtotal
        +getCartItemId() Long
        +getProductName() String
        +getProductPrice() BigDecimal
        +getQuantity() Integer
        +getSubtotal() BigDecimal
    }
    
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> ProductRepository : depends on
    CartRepository --> CartItem : manages
    CartService --> CartItem : operates on
    CartService --> CartResponse : creates
    CartResponse --> CartItemDetail : contains
    CartItem --> Product : references
```

### 2.3 Entity Relationship Diagram

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
```

### 2.4 Shopping Cart Entity Relationship Diagram

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
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS ||--|| PRODUCTS : references
```
