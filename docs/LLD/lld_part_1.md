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
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +getCart(Long customerId) ResponseEntity~ShoppingCart~
        +addItemToCart(Long customerId, CartItemRequest request) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long customerId, Long itemId, Integer quantity) ResponseEntity~ShoppingCart~
        +removeItemFromCart(Long customerId, Long itemId) ResponseEntity~ShoppingCart~
        +clearCart(Long customerId) ResponseEntity~Void~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +getCartByCustomerId(Long customerId) ShoppingCart
        +addItemToCart(Long customerId, Long productId, Integer quantity) ShoppingCart
        +updateItemQuantity(Long customerId, Long itemId, Integer quantity) ShoppingCart
        +removeItem(Long customerId, Long itemId) ShoppingCart
        +clearCart(Long customerId) void
        +recalculateCartTotals(ShoppingCart cart) void
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
        +deleteByCustomerId(Long customerId) void
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +deleteById(Long id) void
        +findByCartId(Long cartId) List~CartItem~
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long customerId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getCustomerId() Long
        +setCustomerId(Long customerId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
        +getTotalAmount() BigDecimal
        +setTotalAmount(BigDecimal totalAmount) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +isEmpty() boolean
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -String productName
        -BigDecimal productPrice
        -Integer quantity
        -BigDecimal subtotal
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProductName() String
        +setProductName(String productName) void
        +getProductPrice() BigDecimal
        +setProductPrice(BigDecimal productPrice) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +calculateSubtotal() void
    }
    
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemRepository : depends on
    ShoppingCartService --> ProductService : depends on
    ShoppingCart "1" --> "*" CartItem : contains
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
    SHOPPING_CARTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT customer_id "NOT NULL, UNIQUE"
        DECIMAL total_amount "NOT NULL, PRECISION(10,2), DEFAULT 0.00"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        VARCHAR product_name "NOT NULL, MAX_LENGTH(255)"
        DECIMAL product_price "NOT NULL, PRECISION(10,2)"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
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
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    CART_ITEMS }o--|| PRODUCTS : references
```
