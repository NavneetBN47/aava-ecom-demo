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
        +checkInventoryAvailability(Long productId, Integer quantity) boolean
        +validateStockForCart(Long productId, Integer quantity) void
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
        -Integer minimumProcurementThreshold
        -Boolean subscriptionEligible
        -Boolean inventoryTrackingEnabled
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
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
        +getSubscriptionEligible() Boolean
        +setSubscriptionEligible(Boolean eligible) void
        +getInventoryTrackingEnabled() Boolean
        +setInventoryTrackingEnabled(Boolean enabled) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +getCart(Long cartId) ResponseEntity~Cart~
        +addItemToCart(Long cartId, CartItemRequest request) ResponseEntity~Cart~
        +updateItemQuantity(Long itemId, Integer quantity) ResponseEntity~Cart~
        +removeItemFromCart(Long itemId) ResponseEntity~Void~
        +getEmptyCartState(Long cartId) ResponseEntity~EmptyCartResponse~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemService cartItemService
        -InventoryValidationService inventoryValidationService
        -ProductService productService
        +getCartById(Long cartId) Cart
        +addItemToCart(Long cartId, Long productId, Integer quantity) Cart
        +updateItemQuantity(Long itemId, Integer quantity) Cart
        +removeItem(Long itemId) void
        +calculateCartTotal(Long cartId) BigDecimal
        +isCartEmpty(Long cartId) boolean
    }
    
    class CartItemService {
        <<@Service>>
        -CartItemRepository cartItemRepository
        -ProductService productService
        +createCartItem(Long cartId, Long productId, Integer quantity) CartItem
        +updateQuantity(Long itemId, Integer quantity) CartItem
        +calculateSubtotal(Long itemId) BigDecimal
        +validateQuantity(Integer quantity) void
        +deleteCartItem(Long itemId) void
    }
    
    class InventoryValidationService {
        <<@Service>>
        -ProductService productService
        +validateInventoryAvailability(Long productId, Integer quantity) void
        +checkStockLevel(Long productId) Integer
        +isStockSufficient(Long productId, Integer requestedQuantity) boolean
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~Cart~
        +save(Cart cart) Cart
        +findByUserId(Long userId) Optional~Cart~
        +findBySessionId(String sessionId) Optional~Cart~
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~CartItem~
        +save(CartItem item) CartItem
        +deleteById(Long id) void
        +findByCartId(Long cartId) List~CartItem~
        +calculateCartTotal(Long cartId) BigDecimal
    }
    
    class Cart {
        <<@Entity>>
        -Long cartId
        -Long userId
        -String sessionId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        -List~CartItem~ items
        +getCartId() Long
        +setCartId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getSessionId() String
        +setSessionId(String sessionId) void
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
        -Long cartItemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -LocalDateTime addedAt
        +getCartItemId() Long
        +setCartItemId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal price) void
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
    CartService --> CartItemService : depends on
    CartService --> InventoryValidationService : depends on
    CartService --> ProductService : depends on
    CartItemService --> CartItemRepository : depends on
    CartItemService --> ProductService : depends on
    InventoryValidationService --> ProductService : depends on
    CartRepository --> Cart : manages
    CartItemRepository --> CartItem : manages
    Cart --> CartItem : contains
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
        INTEGER minimum_procurement_threshold "NULLABLE"
        BOOLEAN subscription_eligible "DEFAULT FALSE"
        BOOLEAN inventory_tracking_enabled "DEFAULT TRUE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CARTS {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id "NULLABLE"
        VARCHAR session_id "NULLABLE, MAX_LENGTH(255)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, DEFAULT 'ACTIVE', MAX_LENGTH(50)"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : "included in"
```
