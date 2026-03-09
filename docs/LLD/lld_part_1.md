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

### 2.3 Shopping Cart Data Models

#### 2.3.1 Shopping Cart Model
**Requirement Reference:** Epic: Shopping cart management, Story: Add products to cart, AC-1

```mermaid
classDiagram
    class ShoppingCart {
        <<@Entity>>
        -Long cartId
        -Long userId
        -List~CartItem~ items
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal grandTotal
        +getCartId() Long
        +setCartId(Long cartId) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
        +calculateTotals() void
    }
    
    class CartItem {
        <<@Entity>>
        -Long itemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal priceSnapshot
        -Integer minQuantity
        -Integer maxQuantity
        -LocalDateTime addedAt
        +getItemId() Long
        +setItemId(Long itemId) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getPriceSnapshot() BigDecimal
        +setPriceSnapshot(BigDecimal priceSnapshot) void
        +getMinQuantity() Integer
        +setMinQuantity(Integer minQuantity) void
        +getMaxQuantity() Integer
        +setMaxQuantity(Integer maxQuantity) void
        +validateQuantity() boolean
    }
    
    ShoppingCart "1" --> "*" CartItem : contains
```

**Shopping Cart Data Structure:**
- `cart_id`: Unique identifier for the cart (Primary Key)
- `user_id`: Reference to the user who owns the cart (Foreign Key)
- `items`: Array of CartItem objects
- `created_at`: Timestamp when cart was created
- `updated_at`: Timestamp of last cart modification
- `status`: Cart status (ACTIVE, ABANDONED, CHECKED_OUT)
- `subtotal`: Sum of all item prices
- `tax`: Calculated tax amount
- `grand_total`: Final total including tax

**Reason for Addition:** Missing fundamental cart data structure required for cart functionality

#### 2.3.2 Cart Item Model
**Requirement Reference:** Story: Quantity management and thresholds, AC-2, AC-4

**CartItem Data Structure:**
- `item_id`: Unique identifier for cart item (Primary Key)
- `cart_id`: Reference to parent cart (Foreign Key)
- `product_id`: Reference to product (Foreign Key)
- `quantity`: Number of units in cart
- `price_snapshot`: Product price at time of addition (for price consistency)
- `min_quantity`: Minimum procurement threshold for this product
- `max_quantity`: Maximum allowed quantity per order
- `added_at`: Timestamp when item was added to cart

**Reason for Addition:** Missing cart item structure needed for quantity management
