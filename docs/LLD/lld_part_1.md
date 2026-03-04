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

### 2.1.1 Shopping Cart Module - Class Diagram

```mermaid
classDiagram
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +addItemToCart(AddToCartRequest request) ResponseEntity~CartResponse~
        +getCart(Long customerId) ResponseEntity~CartResponse~
        +updateCartItem(Long itemId, UpdateCartItemRequest request) ResponseEntity~CartResponse~
        +removeCartItem(Long itemId) ResponseEntity~CartResponse~
        +clearCart(Long customerId) ResponseEntity~EmptyCartResponse~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemService cartItemService
        -ProductService productService
        +getOrCreateCart(Long customerId) ShoppingCart
        +addItemToCart(Long customerId, Long productId, Integer quantity) CartResponse
        +updateItemQuantity(Long itemId, Integer quantity) CartResponse
        +removeItemFromCart(Long itemId) CartResponse
        +getCartDetails(Long customerId) CartResponse
        +clearCart(Long customerId) void
        +calculateCartTotal(Long cartId) BigDecimal
    }
    
    class CartItemService {
        <<@Service>>
        -CartItemRepository cartItemRepository
        +calculateSubtotal(CartItem item) BigDecimal
        +validateQuantity(Integer quantity) boolean
        +updateCartItemQuantity(Long itemId, Integer quantity) CartItem
        +removeCartItem(Long itemId) void
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +findActiveCartByCustomerId(Long customerId) Optional~ShoppingCart~
        +existsByCustomerId(Long customerId) boolean
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +deleteByCartIdAndProductId(Long cartId, Long productId) void
        +countByCartId(Long cartId) Long
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long cartId
        -Long customerId
        -LocalDateTime createdDate
        -LocalDateTime lastModifiedDate
        -String status
        -BigDecimal totalAmount
        +getCartId() Long
        +setCartId(Long cartId) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getCreatedDate() LocalDateTime
        +setCreatedDate(LocalDateTime createdDate) void
        +getLastModifiedDate() LocalDateTime
        +setLastModifiedDate(LocalDateTime lastModifiedDate) void
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
        -LocalDateTime addedDate
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
        +getAddedDate() LocalDateTime
        +setAddedDate(LocalDateTime addedDate) void
    }
    
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemService : depends on
    ShoppingCartService --> ProductService : depends on
    CartItemService --> CartItemRepository : depends on
    ShoppingCartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    ShoppingCart "1" --> "*" CartItem : contains
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

### 2.2.1 Shopping Cart Module - Entity Relationship Diagram

```mermaid
erDiagram
    SHOPPING_CART {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL, UNIQUE"
        TIMESTAMP created_date "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP last_modified_date "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, MAX_LENGTH(20), DEFAULT 'ACTIVE'"
        DECIMAL total_amount "NOT NULL, PRECISION(10,2), DEFAULT 0.00"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_date "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_in
```
