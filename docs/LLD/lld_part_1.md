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
        +checkStockAvailability(Long productId, Integer requestedQuantity) Boolean
        +reserveStock(Long productId, Integer quantity) void
        +releaseStock(Long productId, Integer quantity) void
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
        +findByIdWithStockLock(Long productId) Optional~Product~
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
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addProductToCart(AddToCartRequest request) ResponseEntity~CartDetailsDTO~
        +getCart(Long customerId) ResponseEntity~CartDetailsDTO~
        +updateCartItemQuantity(Long cartItemId, UpdateQuantityRequest request) ResponseEntity~CartDetailsDTO~
        +removeCartItem(Long cartItemId) ResponseEntity~CartDetailsDTO~
        +clearCart(Long customerId) ResponseEntity~Void~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +addProductToCart(Long customerId, Long productId, Integer quantity, String subscriptionType) CartDetailsDTO
        +updateCartItemQuantity(Long cartItemId, Integer quantity) CartDetailsDTO
        +removeCartItem(Long cartItemId) CartDetailsDTO
        +getCartDetails(Long customerId) CartDetailsDTO
        +calculateCartTotal(Long cartId) BigDecimal
        +clearCart(Long customerId) void
        +validateInventory(Long productId, Integer quantity) Boolean
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~Cart~
        +findActiveCartByCustomerId(Long customerId) Optional~Cart~
        +save(Cart cart) Cart
        +deleteById(Long id) void
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +deleteByCartId(Long cartId) void
        +save(CartItem cartItem) CartItem
        +deleteById(Long id) void
    }
    
    class Cart {
        <<@Entity>>
        -Long cartId
        -Long customerId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        -BigDecimal totalAmount
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
    }
    
    class CartItem {
        <<@Entity>>
        -Long cartItemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -String subscriptionType
        -LocalDateTime createdAt
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
        +getSubscriptionType() String
        +setSubscriptionType(String subscriptionType) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartDetailsDTO {
        -List~CartItemDTO~ cartItems
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal total
        -Integer itemCount
        +getCartItems() List~CartItemDTO~
        +setCartItems(List~CartItemDTO~ cartItems) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getTax() BigDecimal
        +setTax(BigDecimal tax) void
        +getTotal() BigDecimal
        +setTotal(BigDecimal total) void
        +getItemCount() Integer
        +setItemCount(Integer itemCount) void
    }
    
    class CartItemDTO {
        -String productName
        -BigDecimal unitPrice
        -Integer quantity
        -BigDecimal subtotal
        -String subscriptionType
        +getProductName() String
        +setProductName(String productName) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getSubscriptionType() String
        +setSubscriptionType(String subscriptionType) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductService : depends on
    CartRepository --> Cart : manages
    CartItemRepository --> CartItem : manages
    Cart --> CartItem : contains
    CartItem --> Product : references
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
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CARTS {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, MAX_LENGTH(50)"
        DECIMAL total_amount "NOT NULL, PRECISION(10,2), DEFAULT 0.00"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        VARCHAR subscription_type "MAX_LENGTH(50)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```
