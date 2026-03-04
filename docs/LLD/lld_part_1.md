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
    
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +getCart(Long customerId) ResponseEntity~ShoppingCart~
        +addItemToCart(Long customerId, CartItemRequest request) ResponseEntity~CartItem~
        +updateCartItemQuantity(Long itemId, Integer quantity) ResponseEntity~CartItem~
        +removeCartItem(Long itemId) ResponseEntity~Void~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +getCartByCustomerId(Long customerId) ShoppingCart
        +addItemToCart(Long customerId, Long productId, Integer quantity) CartItem
        +updateCartItemQuantity(Long itemId, Integer quantity) CartItem
        +removeCartItem(Long itemId) void
        +calculateCartTotal(Long cartId) BigDecimal
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByCustomerId(Long customerId) Optional~ShoppingCart~
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
        -BigDecimal price
        -BigDecimal subtotal
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
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemRepository : depends on
    ShoppingCartService --> ProductRepository : depends on
    ShoppingCartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    ShoppingCartService --> ShoppingCart : operates on
    ShoppingCartService --> CartItem : operates on
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
        BIGINT customer_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, MAX_LENGTH(50), DEFAULT 'ACTIVE'"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_in
```
