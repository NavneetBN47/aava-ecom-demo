# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement, ShoppingCart  

## 2. System Architecture

### 2.1 Class Diagram - Product Management

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
        +checkStockAvailability(Long productId, Integer quantity) Boolean
        +validateMinMaxQuantity(Long productId, Integer quantity) Boolean
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
        -Integer minQuantity
        -Integer maxQuantity
        -Boolean isSubscriptionEligible
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
        +getMinQuantity() Integer
        +setMinQuantity(Integer minQuantity) void
        +getMaxQuantity() Integer
        +setMaxQuantity(Integer maxQuantity) void
        +getIsSubscriptionEligible() Boolean
        +setIsSubscriptionEligible(Boolean isSubscriptionEligible) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
```

### 2.2 Class Diagram - Shopping Cart Module

```mermaid
classDiagram
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addItemToCart(CartItemRequest request) ResponseEntity~Cart~
        +getCart(String sessionId) ResponseEntity~Cart~
        +updateCartItemQuantity(Long itemId, Integer quantity) ResponseEntity~Cart~
        +removeCartItem(Long itemId) ResponseEntity~Void~
        +clearCart(String sessionId) ResponseEntity~Void~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        -CostCalculationEngine costCalculationEngine
        +addItemToCart(String sessionId, Long productId, Integer quantity, Boolean isSubscription) Cart
        +getCartBySession(String sessionId) Cart
        +updateItemQuantity(Long itemId, Integer quantity) Cart
        +removeItem(Long itemId) void
        +clearCart(String sessionId) void
        +calculateCartTotals(Cart cart) CartTotals
        +validateInventory(Long productId, Integer quantity) Boolean
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findBySessionId(String sessionId) Optional~Cart~
        +findByUserId(Long userId) Optional~Cart~
        +save(Cart cart) Cart
        +deleteById(Long id) void
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findById(Long id) Optional~CartItem~
        +save(CartItem cartItem) CartItem
        +deleteById(Long id) void
    }
    
    class Cart {
        <<@Entity>>
        -Long id
        -String sessionId
        -Long userId
        -List~CartItem~ items
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getSessionId() String
        +setSessionId(String sessionId) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
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
        -Product product
        -Integer quantity
        -Boolean isSubscription
        -BigDecimal lineTotal
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProduct() Product
        +setProduct(Product product) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getIsSubscription() Boolean
        +setIsSubscription(Boolean isSubscription) void
        +getLineTotal() BigDecimal
        +setLineTotal(BigDecimal lineTotal) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CostCalculationEngine {
        <<@Service>>
        +calculateSubtotal(List~CartItem~ items) BigDecimal
        +calculateTax(BigDecimal subtotal, String location) BigDecimal
        +calculateShipping(String deliveryMethod) BigDecimal
        +calculateGrandTotal(BigDecimal subtotal, BigDecimal tax, BigDecimal shipping) BigDecimal
        +recalculateCartTotals(Cart cart) CartTotals
    }
    
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductService : depends on
    CartService --> CostCalculationEngine : depends on
    Cart --> CartItem : contains
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
        INTEGER min_quantity "NULLABLE, DEFAULT 1"
        INTEGER max_quantity "NULLABLE"
        BOOLEAN is_subscription_eligible "NOT NULL, DEFAULT FALSE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CART {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR session_id "NOT NULL, UNIQUE, MAX_LENGTH(255)"
        BIGINT user_id "NULLABLE, FK"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        BOOLEAN is_subscription "NOT NULL, DEFAULT FALSE"
        DECIMAL line_total "NOT NULL, PRECISION(10,2)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```
