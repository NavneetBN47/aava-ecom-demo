# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement and ShoppingCart  

## 2. System Architecture

The system architecture encompasses two core modules:
1. **Product Management** - Handles product catalog operations including CRUD operations, search, and categorization
2. **Shopping Cart Management** - Manages customer shopping carts, cart items, quantity updates, and cart operations

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
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addToCart(Long productId, Long userId) ResponseEntity~CartItem~
        +viewCart(Long userId) ResponseEntity~ShoppingCart~
        +updateCartItem(Long itemId, Integer quantity) ResponseEntity~CartItem~
        +removeCartItem(Long itemId) ResponseEntity~Void~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addToCart(Long productId, Long userId) CartItem
        +viewCart(Long userId) ShoppingCart
        +updateCartItemQuantity(Long itemId, Integer quantity) CartItem
        +removeCartItem(Long itemId) void
        +calculateCartTotal(Long cartId) BigDecimal
        +recalculateSubtotal(CartItem item) void
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
        +findById(Long id) Optional~ShoppingCart~
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findById(Long id) Optional~CartItem~
        +save(CartItem item) CartItem
        +deleteById(Long id) void
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long userId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        -List~CartItem~ items
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal price
        -BigDecimal subtotal
        -LocalDateTime addedAt
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getAddedAt() LocalDateTime
        +setAddedAt(LocalDateTime addedAt) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductRepository : depends on
    CartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    ShoppingCart "1" --> "*" CartItem : contains
    CartItem "*" --> "1" Product : references
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
        BIGINT user_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, DEFAULT 'ACTIVE', MAX_LENGTH(50)"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```
