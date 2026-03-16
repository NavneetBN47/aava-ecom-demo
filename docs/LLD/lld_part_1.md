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
        -Integer minimumProcurementThreshold
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
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addItemToCart(AddCartItemRequest request) ResponseEntity~CartItem~
        +getCart(Long customerId) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long cartItemId, UpdateQuantityRequest request) ResponseEntity~CartItem~
        +removeCartItem(Long cartItemId) ResponseEntity~Void~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addItemToCart(Long customerId, Long productId, Integer quantity, Boolean isSubscription) CartItem
        +getCart(Long customerId) ShoppingCart
        +updateCartItemQuantity(Long cartItemId, Integer quantity) CartItem
        +removeCartItem(Long cartItemId) void
        +calculateCartTotal(Long cartId) BigDecimal
        +validateInventory(Long productId, Integer quantity) boolean
        +applyMinimumThreshold(Product product, Integer quantity) Integer
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findById(Long id) Optional~CartItem~
        +save(CartItem cartItem) CartItem
        +deleteById(Long id) void
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long cartId
        -Long customerId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -List~CartItem~ cartItems
        +getCartId() Long
        +setCartId(Long cartId) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getCartItems() List~CartItem~
        +setCartItems(List~CartItem~ cartItems) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long cartItemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -Boolean isSubscription
        -Integer minimumProcurementThreshold
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
        +getIsSubscription() Boolean
        +setIsSubscription(Boolean isSubscription) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
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
    ShoppingCart --> CartItem : contains
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
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        INTEGER minimum_procurement_threshold "NULLABLE"
    }
    
    SHOPPING_CARTS {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL, UNIQUE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        BOOLEAN is_subscription "NOT NULL, DEFAULT FALSE"
        INTEGER minimum_procurement_threshold "NULLABLE"
    }
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```
