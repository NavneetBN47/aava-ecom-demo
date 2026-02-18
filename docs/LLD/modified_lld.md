# Low Level Design Document
## E-commerce Product Management System

### Version History
| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-01-15 | Development Team | Initial LLD |
| 1.1 | 2024-01-20 | Development Team | Added Shopping Cart Management |

---

## 1. Project Overview

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-commerce Product Management System. It describes the system architecture, component interactions, data models, and implementation details.

### 1.2 Scope
This document covers the detailed design of:
- Product Management Module
- Inventory Management Module
- Order Processing Module
- User Management Module
- Shopping Cart Management Module

### 1.3 Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: PostgreSQL 14+
- **ORM**: Spring Data JPA / Hibernate
- **API Documentation**: OpenAPI 3.0 (Swagger)
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito

---

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +createProduct(ProductDTO) ResponseEntity
        +getProduct(Long) ResponseEntity
        +updateProduct(Long, ProductDTO) ResponseEntity
        +deleteProduct(Long) ResponseEntity
        +listProducts(Pageable) ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        -InventoryService inventoryService
        +createProduct(ProductDTO) Product
        +getProductById(Long) Product
        +updateProduct(Long, ProductDTO) Product
        +deleteProduct(Long) void
        +getAllProducts(Pageable) Page~Product~
        -validateProduct(ProductDTO) void
    }

    class ProductRepository {
        <<interface>>
        +findById(Long) Optional~Product~
        +findByCategory(String, Pageable) Page~Product~
        +findByPriceBetween(BigDecimal, BigDecimal) List~Product~
        +save(Product) Product
        +deleteById(Long) void
    }

    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -String sku
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setName(String) void
        +getPrice() BigDecimal
    }

    class InventoryService {
        -InventoryRepository inventoryRepository
        +checkStock(Long) Integer
        +updateStock(Long, Integer) void
        +reserveStock(Long, Integer) boolean
        +releaseStock(Long, Integer) void
    }

    class InventoryRepository {
        <<interface>>
        +findByProductId(Long) Optional~Inventory~
        +save(Inventory) Inventory
    }

    class Inventory {
        -Long id
        -Long productId
        -Integer quantity
        -Integer reservedQuantity
        -LocalDateTime lastUpdated
        +getAvailableQuantity() Integer
        +reserve(Integer) void
        +release(Integer) void
    }

    class OrderController {
        -OrderService orderService
        +createOrder(OrderDTO) ResponseEntity
        +getOrder(Long) ResponseEntity
        +cancelOrder(Long) ResponseEntity
        +listOrders(Long, Pageable) ResponseEntity
    }

    class OrderService {
        -OrderRepository orderRepository
        -ProductService productService
        -InventoryService inventoryService
        +createOrder(OrderDTO) Order
        +getOrderById(Long) Order
        +cancelOrder(Long) void
        +getUserOrders(Long, Pageable) Page~Order~
        -validateOrder(OrderDTO) void
        -processPayment(Order) boolean
    }

    class OrderRepository {
        <<interface>>
        +findById(Long) Optional~Order~
        +findByUserId(Long, Pageable) Page~Order~
        +findByStatus(OrderStatus) List~Order~
        +save(Order) Order
    }

    class Order {
        -Long id
        -Long userId
        -BigDecimal totalAmount
        -OrderStatus status
        -LocalDateTime orderDate
        -List~OrderItem~ items
        +addItem(OrderItem) void
        +calculateTotal() BigDecimal
        +updateStatus(OrderStatus) void
    }

    class OrderItem {
        -Long id
        -Long productId
        -Integer quantity
        -BigDecimal price
        -BigDecimal subtotal
        +calculateSubtotal() BigDecimal
    }

    class ShoppingCartController {
        -ShoppingCartService cartService
        +getCart(Long) ResponseEntity
        +addItem(Long, CartItemDTO) ResponseEntity
        +updateItem(Long, Long, CartItemDTO) ResponseEntity
        +removeItem(Long, Long) ResponseEntity
        +clearCart(Long) ResponseEntity
    }

    class ShoppingCartService {
        -ShoppingCartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +getCartByUserId(Long) ShoppingCart
        +addItemToCart(Long, CartItemDTO) ShoppingCart
        +updateCartItem(Long, Long, CartItemDTO) ShoppingCart
        +removeItemFromCart(Long, Long) void
        +clearCart(Long) void
        +calculateCartTotal(Long) BigDecimal
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long) Optional~ShoppingCart~
        +save(ShoppingCart) ShoppingCart
        +deleteByUserId(Long) void
    }

    class CartItemRepository {
        <<interface>>
        +findByCartId(Long) List~CartItem~
        +findByCartIdAndProductId(Long, Long) Optional~CartItem~
        +save(CartItem) CartItem
        +deleteById(Long) void
    }

    class ShoppingCart {
        -Long id
        -Long userId
        -List~CartItem~ items
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +addItem(CartItem) void
        +removeItem(Long) void
        +updateItem(Long, Integer) void
        +calculateTotal() BigDecimal
        +clear() void
    }

    class CartItem {
        -Long id
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal price
        -LocalDateTime addedAt
        +updateQuantity(Integer) void
        +calculateSubtotal() BigDecimal
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductService --> InventoryService
    ProductRepository --> Product
    InventoryService --> InventoryRepository
    InventoryRepository --> Inventory
    OrderController --> OrderService
    OrderService --> OrderRepository
    OrderService --> ProductService
    OrderService --> InventoryService
    OrderRepository --> Order
    Order --> OrderItem
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductService
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart --> CartItem
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--|| INVENTORY : has
    ORDERS ||--|{ ORDER_ITEMS : includes
    USERS ||--o{ ORDERS : places
    PRODUCTS ||--o{ CART_ITEMS : contains
    SHOPPING_CARTS ||--|{ CART_ITEMS : includes
    USERS ||--|| SHOPPING_CARTS : has

    PRODUCTS {
        bigint id PK
        varchar name
        text description
        decimal price
        varchar category
        varchar sku UK
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY {
        bigint id PK
        bigint product_id FK
        integer quantity
        integer reserved_quantity
        timestamp last_updated
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        decimal total_amount
        varchar status
        timestamp order_date
        timestamp updated_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        integer quantity
        decimal price
        decimal subtotal
    }

    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
    }

    SHOPPING_CARTS {
        bigint id PK
        bigint user_id FK UK
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
        decimal price
        timestamp added_at
    }
```

---

## 3. Sequence Diagrams

### 3.1 Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant InventoryService
    participant Database

    Client->>ProductController: POST /api/products
    ProductController->>ProductService: createProduct(productDTO)
    ProductService->>ProductService: validateProduct(productDTO)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: product saved
    ProductRepository-->>ProductService: product
    ProductService->>InventoryService: initializeInventory(productId)
    InventoryService->>Database: INSERT INTO inventory
    Database-->>InventoryService: inventory created
    InventoryService-->>ProductService: success
    ProductService-->>ProductController: product
    ProductController-->>Client: 201 Created (ProductDTO)
```

### 3.2 Get Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/{id}
    ProductController->>ProductService: getProductById(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: product data
    ProductRepository-->>ProductService: Optional<Product>
    ProductService-->>ProductController: product
    ProductController-->>Client: 200 OK (ProductDTO)
```

### 3.3 Update Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id}
    ProductController->>ProductService: updateProduct(id, productDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: existing product
    ProductRepository-->>ProductService: Optional<Product>
    ProductService->>ProductService: validateProduct(productDTO)
    ProductService->>ProductService: updateProductFields(product, productDTO)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: UPDATE products SET ...
    Database-->>ProductRepository: updated product
    ProductRepository-->>ProductService: product
    ProductService-->>ProductController: product
    ProductController-->>Client: 200 OK (ProductDTO)
```

### 3.4 Delete Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant InventoryService
    participant Database

    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: product
    ProductRepository-->>ProductService: Optional<Product>
    ProductService->>InventoryService: checkStock(id)
    InventoryService-->>ProductService: stock info
    ProductService->>ProductService: validateDeletion()
    ProductService->>ProductRepository: deleteById(id)
    ProductRepository->>Database: DELETE FROM products WHERE id = ?
    Database-->>ProductRepository: success
    ProductRepository-->>ProductService: void
    ProductService->>InventoryService: deleteInventory(id)
    InventoryService->>Database: DELETE FROM inventory WHERE product_id = ?
    Database-->>InventoryService: success
    InventoryService-->>ProductService: void
    ProductService-->>ProductController: void
    ProductController-->>Client: 204 No Content
```

### 3.5 Create Order Flow

```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant ProductService
    participant InventoryService
    participant OrderRepository
    participant Database

    Client->>OrderController: POST /api/orders
    OrderController->>OrderService: createOrder(orderDTO)
    OrderService->>OrderService: validateOrder(orderDTO)
    
    loop For each order item
        OrderService->>ProductService: getProductById(productId)
        ProductService-->>OrderService: product
        OrderService->>InventoryService: reserveStock(productId, quantity)
        InventoryService->>Database: UPDATE inventory SET reserved_quantity = ...
        Database-->>InventoryService: success
        InventoryService-->>OrderService: true
    end
    
    OrderService->>OrderService: calculateTotal()
    OrderService->>OrderService: processPayment(order)
    OrderService->>OrderRepository: save(order)
    OrderRepository->>Database: INSERT INTO orders, order_items
    Database-->>OrderRepository: order saved
    OrderRepository-->>OrderService: order
    OrderService-->>OrderController: order
    OrderController-->>Client: 201 Created (OrderDTO)
```

### 3.6 Get Order Flow

```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant OrderRepository
    participant Database

    Client->>OrderController: GET /api/orders/{id}
    OrderController->>OrderService: getOrderById(id)
    OrderService->>OrderRepository: findById(id)
    OrderRepository->>Database: SELECT * FROM orders o JOIN order_items oi ...
    Database-->>OrderRepository: order with items
    OrderRepository-->>OrderService: Optional<Order>
    OrderService-->>OrderController: order
    OrderController-->>Client: 200 OK (OrderDTO)
```

### 3.7 Cancel Order Flow

```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant OrderRepository
    participant InventoryService
    participant Database

    Client->>OrderController: POST /api/orders/{id}/cancel
    OrderController->>OrderService: cancelOrder(id)
    OrderService->>OrderRepository: findById(id)
    OrderRepository->>Database: SELECT * FROM orders WHERE id = ?
    Database-->>OrderRepository: order
    OrderRepository-->>OrderService: Optional<Order>
    OrderService->>OrderService: validateCancellation(order)
    
    loop For each order item
        OrderService->>InventoryService: releaseStock(productId, quantity)
        InventoryService->>Database: UPDATE inventory SET reserved_quantity = ...
        Database-->>InventoryService: success
        InventoryService-->>OrderService: void
    end
    
    OrderService->>OrderService: order.updateStatus(CANCELLED)
    OrderService->>OrderRepository: save(order)
    OrderRepository->>Database: UPDATE orders SET status = 'CANCELLED'
    Database-->>OrderRepository: updated order
    OrderRepository-->>OrderService: order
    OrderService-->>OrderController: order
    OrderController-->>Client: 200 OK (OrderDTO)
```

### 3.8 Get Shopping Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database

    Client->>CartController: GET /api/cart/{userId}
    CartController->>CartService: getCartByUserId(userId)
    CartService->>CartRepository: findByUserId(userId)
    CartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>CartRepository: cart with items
    CartRepository-->>CartService: Optional<ShoppingCart>
    CartService->>CartService: calculateCartTotal(cart)
    CartService-->>CartController: cart
    CartController-->>Client: 200 OK (CartDTO)
```

### 3.9 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant ProductService
    participant Database

    Client->>CartController: POST /api/cart/{userId}/items
    CartController->>CartService: addItemToCart(userId, cartItemDTO)
    CartService->>CartRepository: findByUserId(userId)
    CartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>CartRepository: cart or null
    CartRepository-->>CartService: Optional<ShoppingCart>
    
    alt Cart doesn't exist
        CartService->>CartRepository: save(new ShoppingCart)
        CartRepository->>Database: INSERT INTO shopping_carts
        Database-->>CartRepository: new cart
        CartRepository-->>CartService: cart
    end
    
    CartService->>ProductService: getProductById(productId)
    ProductService-->>CartService: product
    CartService->>CartService: validateProduct(product)
    CartService->>CartItemRepository: findByCartIdAndProductId(cartId, productId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
    Database-->>CartItemRepository: existing item or null
    CartItemRepository-->>CartService: Optional<CartItem>
    
    alt Item exists
        CartService->>CartService: updateQuantity(existingItem, newQuantity)
    else Item doesn't exist
        CartService->>CartService: createNewCartItem()
    end
    
    CartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: INSERT/UPDATE cart_items
    Database-->>CartItemRepository: saved item
    CartItemRepository-->>CartService: cartItem
    CartService-->>CartController: cart
    CartController-->>Client: 200 OK (CartDTO)
```

### 3.10 Update Cart Item Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant ProductService
    participant Database

    Client->>CartController: PUT /api/cart/{userId}/items/{itemId}
    CartController->>CartService: updateCartItem(userId, itemId, cartItemDTO)
    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: cart item
    CartItemRepository-->>CartService: Optional<CartItem>
    CartService->>CartService: validateOwnership(cartItem, userId)
    CartService->>ProductService: getProductById(productId)
    ProductService-->>CartService: product
    CartService->>CartService: cartItem.updateQuantity(newQuantity)
    CartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: UPDATE cart_items SET quantity = ?
    Database-->>CartItemRepository: updated item
    CartItemRepository-->>CartService: cartItem
    CartService-->>CartController: cart
    CartController-->>Client: 200 OK (CartDTO)
```

### 3.11 Remove Item from Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database

    Client->>CartController: DELETE /api/cart/{userId}/items/{itemId}
    CartController->>CartService: removeItemFromCart(userId, itemId)
    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: cart item
    CartItemRepository-->>CartService: Optional<CartItem>
    CartService->>CartService: validateOwnership(cartItem, userId)
    CartService->>CartItemRepository: deleteById(itemId)
    CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: success
    CartItemRepository-->>CartService: void
    CartService-->>CartController: void
    CartController-->>Client: 204 No Content
```

---

## 4. API Endpoints

### 4.1 Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/products | Create new product | ProductDTO | 201 Created, ProductDTO |
| GET | /api/products/{id} | Get product by ID | - | 200 OK, ProductDTO |
| GET | /api/products | List all products (paginated) | - | 200 OK, Page<ProductDTO> |
| PUT | /api/products/{id} | Update product | ProductDTO | 200 OK, ProductDTO |
| DELETE | /api/products/{id} | Delete product | - | 204 No Content |
| GET | /api/products/category/{category} | Get products by category | - | 200 OK, List<ProductDTO> |
| GET | /api/products/search | Search products | query params | 200 OK, Page<ProductDTO> |

### 4.2 Order Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/orders | Create new order | OrderDTO | 201 Created, OrderDTO |
| GET | /api/orders/{id} | Get order by ID | - | 200 OK, OrderDTO |
| GET | /api/orders/user/{userId} | Get user orders (paginated) | - | 200 OK, Page<OrderDTO> |
| POST | /api/orders/{id}/cancel | Cancel order | - | 200 OK, OrderDTO |
| GET | /api/orders/{id}/status | Get order status | - | 200 OK, OrderStatusDTO |

### 4.3 Inventory Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/inventory/{productId} | Get inventory for product | - | 200 OK, InventoryDTO |
| PUT | /api/inventory/{productId} | Update inventory | InventoryUpdateDTO | 200 OK, InventoryDTO |
| POST | /api/inventory/{productId}/reserve | Reserve stock | ReservationDTO | 200 OK, boolean |
| POST | /api/inventory/{productId}/release | Release reserved stock | ReservationDTO | 200 OK, void |

### 4.4 Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/cart/{userId} | Get user's shopping cart | - | 200 OK, CartDTO |
| POST | /api/cart/{userId}/items | Add item to cart | CartItemDTO | 200 OK, CartDTO |
| PUT | /api/cart/{userId}/items/{itemId} | Update cart item quantity | CartItemDTO | 200 OK, CartDTO |
| DELETE | /api/cart/{userId}/items/{itemId} | Remove item from cart | - | 204 No Content |
| DELETE | /api/cart/{userId} | Clear entire cart | - | 204 No Content |
| GET | /api/cart/{userId}/total | Get cart total | - | 200 OK, BigDecimal |

---

## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_price ON products(price);
```

### 5.2 Inventory Table

```sql
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT reserved_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT reserved_not_exceed_quantity CHECK (reserved_quantity <= quantity)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

### 5.3 Orders Table

```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT total_amount_positive CHECK (total_amount >= 0)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
```

### 5.4 Order Items Table

```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT subtotal_positive CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 5.5 Users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### 5.6 Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
```

### 5.7 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 6. Data Transfer Objects (DTOs)

### 6.1 ProductDTO

```java
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String sku;
    private Integer availableQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}
```

### 6.2 OrderDTO

```java
public class OrderDTO {
    private Long id;
    private Long userId;
    private List<OrderItemDTO> items;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}
```

### 6.3 OrderItemDTO

```java
public class OrderItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
    
    // Getters, setters, constructors
}
```

### 6.4 InventoryDTO

```java
public class InventoryDTO {
    private Long id;
    private Long productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private LocalDateTime lastUpdated;
    
    // Getters, setters, constructors
}
```

### 6.5 CartDTO

```java
public class CartDTO {
    private Long id;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}
```

### 6.6 CartItemDTO

```java
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
    private LocalDateTime addedAt;
    
    // Getters, setters, constructors
}
```

---

## 7. Design Patterns

### 7.1 Repository Pattern
- **Purpose**: Abstracts data access logic
- **Implementation**: Spring Data JPA repositories
- **Benefits**: 
  - Decouples business logic from data access
  - Enables easy testing with mock repositories
  - Provides consistent data access interface

### 7.2 Service Layer Pattern
- **Purpose**: Encapsulates business logic
- **Implementation**: Service classes with @Service annotation
- **Benefits**:
  - Separates business logic from controllers
  - Enables transaction management
  - Promotes code reusability

### 7.3 DTO Pattern
- **Purpose**: Transfers data between layers
- **Implementation**: Separate DTO classes for API requests/responses
- **Benefits**:
  - Decouples API contract from domain model
  - Enables API versioning
  - Reduces over-fetching/under-fetching

### 7.4 Builder Pattern
- **Purpose**: Constructs complex objects step by step
- **Implementation**: Lombok @Builder annotation
- **Benefits**:
  - Improves code readability
  - Handles optional parameters elegantly
  - Ensures object immutability

### 7.5 Aggregate Pattern
- **Purpose**: Groups related entities as a single unit
- **Implementation**: ShoppingCart as aggregate root containing CartItems
- **Benefits**:
  - Maintains consistency boundaries
  - Simplifies transaction management
  - Enforces business rules at aggregate level
  - Ensures data integrity through controlled access

---

## 8. Key Implementation Details

### 8.1 Transaction Management
- Use `@Transactional` annotation on service methods
- Configure appropriate isolation levels
- Handle rollback scenarios for failed operations
- Example:
```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public Order createOrder(OrderDTO orderDTO) {
    // Implementation
}
```

### 8.2 Exception Handling
- Custom exception classes:
  - `ProductNotFoundException`
  - `InsufficientStockException`
  - `OrderNotFoundException`
  - `InvalidOrderStateException`
- Global exception handler using `@ControllerAdvice`
- Consistent error response format

### 8.3 Validation
- Use Bean Validation annotations (@NotNull, @Min, @Max, etc.)
- Custom validators for complex business rules
- Validate at controller and service layers
- Example:
```java
public class ProductDTO {
    @NotBlank(message = "Product name is required")
    private String name;
    
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;
}
```

### 8.4 Pagination and Sorting
- Use Spring Data's `Pageable` interface
- Default page size: 20
- Support sorting by multiple fields
- Example endpoint: `/api/products?page=0&size=20&sort=price,desc`

### 8.5 Logging
- Use SLF4J with Logback
- Log levels:
  - ERROR: System errors, exceptions
  - WARN: Business rule violations
  - INFO: Important business events
  - DEBUG: Detailed execution flow
- Include correlation IDs for request tracking

### 8.6 Security Considerations
- Input validation and sanitization
- SQL injection prevention (using parameterized queries)
- Authentication and authorization (to be implemented)
- Rate limiting for API endpoints
- Sensitive data encryption

### 8.7 Performance Optimization
- Database indexing on frequently queried columns
- Lazy loading for entity relationships
- Caching frequently accessed data (Redis integration planned)
- Connection pooling (HikariCP)
- Query optimization and N+1 problem prevention

### 8.8 Key Features

#### Product Management
- CRUD operations for products
- Category-based product organization
- SKU-based unique identification
- Price management with validation

#### Inventory Management
- Real-time stock tracking
- Stock reservation for pending orders
- Automatic stock release on order cancellation
- Low stock alerts (planned)

#### Order Processing
- Multi-item order support
- Automatic total calculation
- Order status tracking
- Inventory integration for stock management

#### Shopping Cart Management
- Persistent cart storage per user
- Add, update, and remove items
- Automatic price calculation
- Cart item quantity management
- Integration with product catalog
- Cart total calculation
- Clear cart functionality

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Test service layer methods in isolation
- Mock repository dependencies
- Use JUnit 5 and Mockito
- Target coverage: 80%+

### 9.2 Integration Tests
- Test controller-service-repository flow
- Use @SpringBootTest annotation
- Test with H2 in-memory database
- Verify transaction behavior

### 9.3 API Tests
- Use MockMvc for endpoint testing
- Test request/response formats
- Validate error handling
- Test authentication and authorization

---

## 10. Deployment Considerations

### 10.1 Environment Configuration
- Separate profiles for dev, test, prod
- Externalized configuration using application.yml
- Environment-specific database connections
- Secret management for sensitive data

### 10.2 Database Migration
- Use Flyway or Liquibase for schema versioning
- Maintain migration scripts in version control
- Test migrations in staging environment

### 10.3 Monitoring and Observability
- Spring Boot Actuator for health checks
- Metrics collection (Prometheus planned)
- Distributed tracing (Zipkin planned)
- Application logging aggregation

---

## 11. Future Enhancements

1. **Caching Layer**: Implement Redis for frequently accessed data
2. **Search Functionality**: Integrate Elasticsearch for advanced product search
3. **Event-Driven Architecture**: Implement message queues for async processing
4. **Microservices Migration**: Split into separate services as system grows
5. **API Gateway**: Implement for routing and load balancing
6. **Payment Integration**: Add payment gateway integration
7. **Notification Service**: Email/SMS notifications for order updates
8. **Analytics**: Product and order analytics dashboard

---

## 12. Appendix

### 12.1 Glossary
- **SKU**: Stock Keeping Unit - unique identifier for products
- **DTO**: Data Transfer Object - object for transferring data between layers
- **JPA**: Java Persistence API - specification for ORM
- **ORM**: Object-Relational Mapping - technique for converting data between incompatible systems

### 12.2 References
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- Spring Data JPA Documentation: https://spring.io/projects/spring-data-jpa
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- RESTful API Design Best Practices

---

**Document Status**: Approved for Implementation
**Last Updated**: 2024-01-20
**Next Review Date**: 2024-02-20