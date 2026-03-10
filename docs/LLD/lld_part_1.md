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
        +checkStockAvailability(Long productId, Integer quantity) ResponseEntity~Boolean~
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
        +reserveInventory(Long productId, Integer quantity) void
        +releaseInventory(Long productId, Integer quantity) void
        +checkAvailability(Long productId, Integer quantity) Boolean
        +getAvailableQuantity(Long productId) Integer
        +validateInventoryAvailability(Long productId, Integer requestedQuantity) Boolean
        +reserveStock(Long productId, Integer quantity) void
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
        +findAvailableProducts() List~Product~
        +findByIdWithLock(Long id) Optional~Product~
        +updateReservedQuantity(Long id, Integer quantity) void
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -Integer procurementThreshold
        -Integer reservedQuantity
        -Boolean isAvailable
        -LocalDateTime createdAt
        -Integer minimumProcurementThreshold
        -Boolean subscriptionEligible
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
        +getProcurementThreshold() Integer
        +setProcurementThreshold(Integer procurementThreshold) void
        +getReservedQuantity() Integer
        +setReservedQuantity(Integer reservedQuantity) void
        +getIsAvailable() Boolean
        +setIsAvailable(Boolean isAvailable) void
        +getAvailableQuantity() Integer
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer minimumProcurementThreshold) void
        +getSubscriptionEligible() Boolean
        +setSubscriptionEligible(Boolean subscriptionEligible) void
    }
    
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +addProductToCart(AddToCartRequest request) ResponseEntity~CartResponse~
        +getCartByCustomerId(Long customerId) ResponseEntity~CartResponse~
        +updateCartItemQuantity(Long itemId, UpdateCartItemRequest request) ResponseEntity~CartResponse~
        +removeCartItem(Long itemId) ResponseEntity~Void~
        +clearCart(UUID cartId) ResponseEntity~Void~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        -InventoryValidationService inventoryValidationService
        +addProductToCart(Long customerId, Long productId, Integer quantity) CartResponse
        +getCartByCustomerId(Long customerId) CartResponse
        +updateCartItemQuantity(Long itemId, Integer quantity) CartResponse
        +removeCartItem(Long itemId) void
        +calculateCartTotal(Long cartId) BigDecimal
        +validateInventoryAvailability(Long productId, Integer quantity) Boolean
        +clearCart(UUID cartId) void
        +addProductToCart(String customerId, Long productId, String purchaseType) CartResponse
        +updateCartItemQuantity(UUID cartItemId, Integer newQuantity) CartResponse
        +removeCartItem(UUID cartItemId) void
        +clearCart(UUID cartId) void
        +calculateCartTotal(UUID cartId) BigDecimal
        +validateInventory(Long productId, Integer requestedQuantity) void
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +findActiveCartByCustomerId(Long customerId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
        +findByCustomerId(String customerId) Optional~ShoppingCart~
        +findActiveCartByCustomerId(String customerId) Optional~ShoppingCart~
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +deleteByCartId(Long cartId) void
        +save(CartItem item) CartItem
        +deleteById(Long id) void
        +findByCartId(UUID cartId) List~CartItem~
        +findByCartIdAndProductId(UUID cartId, Long productId) Optional~CartItem~
        +deleteByCartId(UUID cartId) void
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long cartId
        -Long customerId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        -BigDecimal totalAmount
        -UUID cartId
        -String customerId
        +getCartId() Long
        +setCartId(Long cartId) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
        +getTotalAmount() BigDecimal
        +setTotalAmount(BigDecimal totalAmount) void
        +getCartId() UUID
        +setCartId(UUID cartId) void
        +getCustomerId() String
        +setCustomerId(String customerId) void
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
        -UUID cartItemId
        -UUID cartId
        -String purchaseType
        -Integer minimumProcurementThreshold
        -LocalDateTime updatedAt
        +getCartItemId() Long
        +setCartItemId(Long cartItemId) void
        +getCartId() Long
        +setCartId(Long cartId) void
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
        +getCartItemId() UUID
        +setCartItemId(UUID cartItemId) void
        +getCartId() UUID
        +setCartId(UUID cartId) void
        +getPurchaseType() String
        +setPurchaseType(String purchaseType) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer minimumProcurementThreshold) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class InventoryValidationService {
        <<@Service>>
        -ProductRepository productRepository
        +checkStockAvailability(Long productId, Integer quantity) Boolean
        +validateQuantityUpdate(Long productId, Integer newQuantity) Boolean
        +getProcurementThreshold(Long productId) Integer
        +enforceMinimumOrderQuantity(Long productId, Integer quantity) Boolean
    }
    
    class AddToCartRequest {
        <<DTO>>
        -String customerId
        -Long productId
        -Integer quantity
        -String purchaseType
        +getCustomerId() String
        +setCustomerId(String customerId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getPurchaseType() String
        +setPurchaseType(String purchaseType) void
    }
    
    class CartResponse {
        <<DTO>>
        -UUID cartId
        -String customerId
        -List~CartItemDTO~ items
        -BigDecimal subtotal
        -BigDecimal total
        -Boolean isEmpty
        -Integer itemCount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getCartId() UUID
        +setCartId(UUID cartId) void
        +getCustomerId() String
        +setCustomerId(String customerId) void
        +getItems() List~CartItemDTO~
        +setItems(List~CartItemDTO~ items) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getTotal() BigDecimal
        +setTotal(BigDecimal total) void
        +getIsEmpty() Boolean
        +setIsEmpty(Boolean isEmpty) void
        +getItemCount() Integer
        +setItemCount(Integer itemCount) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartItemDTO {
        <<DTO>>
        -UUID cartItemId
        -Long productId
        -String productName
        -BigDecimal unitPrice
        -Integer quantity
        -BigDecimal subtotal
        -String purchaseType
        +getCartItemId() UUID
        +setCartItemId(UUID cartItemId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProductName() String
        +setProductName(String productName) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getPurchaseType() String
        +setPurchaseType(String purchaseType) void
    }
    
    class UpdateQuantityRequest {
        <<DTO>>
        -UUID cartItemId
        -Integer newQuantity
        +getCartItemId() UUID
        +setCartItemId(UUID cartItemId) void
        +getNewQuantity() Integer
        +setNewQuantity(Integer newQuantity) void
    }
    
    class InventoryValidationException {
        <<Exception>>
        -Long productId
        -Integer requestedQuantity
        -Integer availableStock
        -String message
        +getProductId() Long
        +getRequestedQuantity() Integer
        +getAvailableStock() Integer
        +getMessage() String
    }
    
    class CartNotFoundException {
        <<Exception>>
        -String customerId
        -String message
        +getCustomerId() String
        +getMessage() String
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemRepository : depends on
    ShoppingCartService --> ProductService : depends on
    ShoppingCartService --> InventoryValidationService : depends on
    ShoppingCartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    InventoryValidationService --> ProductRepository : depends on
    ShoppingCartController --> AddToCartRequest : uses
    ShoppingCartController --> CartResponse : returns
    ShoppingCartController --> UpdateQuantityRequest : uses
    ShoppingCartService --> CartItemDTO : uses
    ShoppingCartService --> InventoryValidationException : throws
    ShoppingCartService --> CartNotFoundException : throws
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
        INTEGER procurement_threshold "NOT NULL, DEFAULT 1"
        INTEGER reserved_quantity "NOT NULL, DEFAULT 0"
        BOOLEAN is_available "NOT NULL, DEFAULT true"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        INTEGER minimum_procurement_threshold "NULLABLE"
        BOOLEAN subscription_eligible "NOT NULL, DEFAULT false"
    }
    
    SHOPPING_CARTS {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, DEFAULT 'ACTIVE'"
        DECIMAL total_amount "NOT NULL, DEFAULT 0.00, PRECISION(10,2)"
        UUID cart_id PK "NOT NULL"
        VARCHAR customer_id "NOT NULL"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        UUID cart_item_id PK "NOT NULL"
        UUID cart_id FK "NOT NULL"
        VARCHAR purchase_type "NOT NULL"
        INTEGER minimum_procurement_threshold "NULLABLE"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : "included in"
```
