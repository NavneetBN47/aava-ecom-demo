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
```

### 2.3 Shopping Cart Data Model Specification

**Requirement Reference:** Epic SCRUM-344: shopping cart management, Story SCRUM-343: add products to shopping cart and manage quantities

#### Cart Entity Structure

```mermaid
classDiagram
    class Cart {
        <<@Entity>>
        -UUID cartId
        -UUID userId
        -String sessionId
        -String status
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -LocalDateTime expiresAt
        +getCartId() UUID
        +setCartId(UUID cartId) void
        +getUserId() UUID
        +setUserId(UUID userId) void
        +getSessionId() String
        +setSessionId(String sessionId) void
        +getStatus() String
        +setStatus(String status) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getExpiresAt() LocalDateTime
        +setExpiresAt(LocalDateTime expiresAt) void
    }
    
    class CartItem {
        <<@Entity>>
        -UUID itemId
        -UUID cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -LocalDateTime addedAt
        +getItemId() UUID
        +setItemId(UUID itemId) void
        +getCartId() UUID
        +setCartId(UUID cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getAddedAt() LocalDateTime
        +setAddedAt(LocalDateTime addedAt) void
        +calculateSubtotal() void
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addItemToCart(UUID cartId, Long productId, Integer quantity) CartItem
        +getCart(UUID cartId) Cart
        +updateItemQuantity(UUID itemId, Integer quantity) CartItem
        +removeItemFromCart(UUID itemId) void
        +calculateCartTotals(UUID cartId) CartSummary
        +clearCart(UUID cartId) void
    }
    
    Cart "1" --> "*" CartItem : contains
    CartItem "*" --> "1" Product : references
    CartService --> Cart : manages
    CartService --> CartItem : manages
```

#### Cart Entity Relationships

```mermaid
erDiagram
    CARTS {
        UUID cart_id PK "NOT NULL"
        UUID user_id "NULLABLE, FK to users"
        VARCHAR session_id "NULLABLE, MAX_LENGTH(255)"
        VARCHAR status "NOT NULL, DEFAULT active"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP expires_at "NOT NULL"
    }
    
    CART_ITEMS {
        UUID item_id PK "NOT NULL"
        UUID cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, CHECK > 0"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CARTS ||--o{ CART_ITEMS : contains
    CART_ITEMS }o--|| PRODUCTS : references
```

**Description:** Comprehensive shopping cart data model including cart entity structure (cart_id, user_id, session_id, status, timestamps), cart item entity (item_id, cart_id, product_id, quantity, unit_price, subtotal), and relationship mappings between cart, cart_items, and products tables.

**Reason:** Required for implementing cart functionality with proper data structures for persistence and state management.
