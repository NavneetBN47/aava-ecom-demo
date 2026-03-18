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
        +checkInventoryAvailability(Long id) ResponseEntity~InventoryStatus~
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
        +checkInventoryAvailability(Long productId, Integer requestedQuantity) Boolean
        +reserveInventory(Long productId, Integer quantity) void
        +releaseInventory(Long productId, Integer quantity) void
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
        -Integer availableStock
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
        +getAvailableStock() Integer
        +setAvailableStock(Integer stock) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addProductToCart(AddToCartRequest request) ResponseEntity~CartResponse~
        +getCart(Long customerId) ResponseEntity~CartResponse~
        +updateCartItemQuantity(Long itemId, UpdateQuantityRequest request) ResponseEntity~CartResponse~
        +removeCartItem(Long itemId) ResponseEntity~Void~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +addProductToCart(Long customerId, Long productId, Integer quantity, String subscriptionType) CartItem
        +updateCartItemQuantity(Long itemId, Integer quantity) CartItem
        +removeCartItem(Long itemId) void
        +getCartDetails(Long customerId) ShoppingCart
        +calculateCartTotal(Long cartId) BigDecimal
        +validateInventory(Long productId, Integer quantity) Boolean
        +applyMinimumProcurementThreshold(Long productId, Integer requestedQuantity) Integer
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +findActiveCartByCustomerId(Long customerId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +deleteByCartIdAndProductId(Long cartId, Long productId) void
        +save(CartItem item) CartItem
        +deleteById(Long id) void
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long customerId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        +getId() Long
        +setId(Long id) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -String subscriptionType
        -Integer minimumProcurementThreshold
        +getId() Long
        +setId(Long id) void
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
        +getSubscriptionType() String
        +setSubscriptionType(String type) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
    }
    
    class NotificationService {
        <<@Service>>
        +sendOrderConfirmation(Long orderId, String email) void
        +sendShippingUpdate(Long shipmentId, String email) void
        +sendOrderStatusChange(Long orderId, String status, String email) void
    }
    
    class PromotionalPricingService {
        <<@Service>>
        +calculatePromotionalPrice(Long productId) BigDecimal
        +applyCartDiscounts(Long cartId) BigDecimal
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductService : depends on
    CartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
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
        BOOLEAN subscription_eligible "DEFAULT false"
        INTEGER available_stock "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CART {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, DEFAULT 'ACTIVE'"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        VARCHAR subscription_type "NOT NULL, CHECK IN ('ONE_TIME', 'SUBSCRIPTION')"
        INTEGER minimum_procurement_threshold "NULLABLE"
    }
    
    ORDERS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL"
        BIGINT cart_id FK "NULLABLE"
        DECIMAL total_amount "NOT NULL, PRECISION(10,2)"
        VARCHAR status "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    ORDER_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    PAYMENTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        DECIMAL amount "NOT NULL, PRECISION(10,2)"
        VARCHAR payment_method "NOT NULL"
        VARCHAR payment_status "NOT NULL"
        VARCHAR transaction_id "NULLABLE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHIPMENTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        VARCHAR tracking_number "NULLABLE"
        VARCHAR carrier "NULLABLE"
        VARCHAR status "NOT NULL"
        TIMESTAMP shipped_at "NULLABLE"
        TIMESTAMP delivered_at "NULLABLE"
    }
    
    RETURNS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        VARCHAR reason "NOT NULL"
        VARCHAR status "NOT NULL"
        DECIMAL refund_amount "PRECISION(10,2)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : "included in"
    SHOPPING_CART ||--o| ORDERS : "converts to"
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "included in"
    ORDERS ||--|| PAYMENTS : "paid via"
    ORDERS ||--o| SHIPMENTS : "shipped as"
    ORDERS ||--o| RETURNS : "may have"
```
