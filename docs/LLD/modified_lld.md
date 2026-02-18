# Low Level Design Document
## E-commerce Product Management System

---

## 1. Project Overview

### 1.1 Purpose
This document provides a detailed low-level design for the E-commerce Product Management System. It describes the internal structure, components, classes, database schema, and interactions required to implement the system.

### 1.2 Scope
The system includes the following modules:
- **ProductManagement**: Handles product catalog operations
- **InventoryManagement**: Manages stock levels and inventory tracking
- **OrderManagement**: Processes customer orders and order lifecycle
- **ShoppingCartManagement**: Manages shopping cart operations and cart items

### 1.3 Technology Stack
- **Backend Framework**: Spring Boot (Java)
- **Database**: PostgreSQL
- **ORM**: Hibernate/JPA
- **API Style**: RESTful
- **Authentication**: JWT-based

---

## 2. System Architecture

### 2.1 Class Diagram

```plantuml
@startuml

' Product Management Classes
class ProductController {
  - productService: ProductService
  + createProduct(ProductDTO): ResponseEntity
  + getProduct(Long): ResponseEntity
  + updateProduct(Long, ProductDTO): ResponseEntity
  + deleteProduct(Long): ResponseEntity
  + listProducts(Pageable): ResponseEntity
}

class ProductService {
  - productRepository: ProductRepository
  - inventoryService: InventoryService
  + createProduct(ProductDTO): Product
  + getProductById(Long): Product
  + updateProduct(Long, ProductDTO): Product
  + deleteProduct(Long): void
  + getAllProducts(Pageable): Page<Product>
  + searchProducts(String): List<Product>
}

class ProductRepository {
  <<interface>>
  + findById(Long): Optional<Product>
  + findByCategory(String): List<Product>
  + findByNameContaining(String): List<Product>
  + save(Product): Product
  + deleteById(Long): void
}

class Product {
  - id: Long
  - name: String
  - description: String
  - price: BigDecimal
  - category: String
  - imageUrl: String
  - createdAt: LocalDateTime
  - updatedAt: LocalDateTime
}

' Inventory Management Classes
class InventoryController {
  - inventoryService: InventoryService
  + getInventory(Long): ResponseEntity
  + updateStock(Long, Integer): ResponseEntity
  + checkAvailability(Long, Integer): ResponseEntity
}

class InventoryService {
  - inventoryRepository: InventoryRepository
  + getInventoryByProductId(Long): Inventory
  + updateStock(Long, Integer): Inventory
  + reserveStock(Long, Integer): boolean
  + releaseStock(Long, Integer): void
  + checkAvailability(Long, Integer): boolean
}

class InventoryRepository {
  <<interface>>
  + findByProductId(Long): Optional<Inventory>
  + save(Inventory): Inventory
}

class Inventory {
  - id: Long
  - productId: Long
  - quantity: Integer
  - reservedQuantity: Integer
  - lastUpdated: LocalDateTime
}

' Order Management Classes
class OrderController {
  - orderService: OrderService
  + createOrder(OrderDTO): ResponseEntity
  + getOrder(Long): ResponseEntity
  + updateOrderStatus(Long, String): ResponseEntity
  + cancelOrder(Long): ResponseEntity
  + getUserOrders(Long): ResponseEntity
}

class OrderService {
  - orderRepository: OrderRepository
  - orderItemRepository: OrderItemRepository
  - inventoryService: InventoryService
  - productService: ProductService
  + createOrder(OrderDTO): Order
  + getOrderById(Long): Order
  + updateOrderStatus(Long, OrderStatus): Order
  + cancelOrder(Long): void
  + getOrdersByUserId(Long): List<Order>
}

class OrderRepository {
  <<interface>>
  + findById(Long): Optional<Order>
  + findByUserId(Long): List<Order>
  + findByStatus(OrderStatus): List<Order>
  + save(Order): Order
}

class OrderItemRepository {
  <<interface>>
  + findByOrderId(Long): List<OrderItem>
  + save(OrderItem): OrderItem
}

class Order {
  - id: Long
  - userId: Long
  - orderDate: LocalDateTime
  - status: OrderStatus
  - totalAmount: BigDecimal
  - shippingAddress: String
  - orderItems: List<OrderItem>
}

class OrderItem {
  - id: Long
  - orderId: Long
  - productId: Long
  - quantity: Integer
  - price: BigDecimal
  - subtotal: BigDecimal
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

' Shopping Cart Management Classes
class ShoppingCartController {
  - shoppingCartService: ShoppingCartService
  + getCart(Long): ResponseEntity
  + addItem(Long, CartItemDTO): ResponseEntity
  + updateItemQuantity(Long, Long, Integer): ResponseEntity
  + removeItem(Long, Long): ResponseEntity
  + clearCart(Long): ResponseEntity
}

class ShoppingCartService {
  - shoppingCartRepository: ShoppingCartRepository
  - cartItemRepository: CartItemRepository
  - productService: ProductService
  - inventoryService: InventoryService
  + getCartByUserId(Long): ShoppingCart
  + addItemToCart(Long, Long, Integer): ShoppingCart
  + updateCartItemQuantity(Long, Long, Integer): ShoppingCart
  + removeItemFromCart(Long, Long): void
  + clearCart(Long): void
  + calculateCartTotal(Long): BigDecimal
}

class ShoppingCartRepository {
  <<interface>>
  + findByUserId(Long): Optional<ShoppingCart>
  + save(ShoppingCart): ShoppingCart
  + deleteByUserId(Long): void
}

class CartItemRepository {
  <<interface>>
  + findByCartId(Long): List<CartItem>
  + findByCartIdAndProductId(Long, Long): Optional<CartItem>
  + save(CartItem): CartItem
  + deleteById(Long): void
}

class ShoppingCart {
  - id: Long
  - userId: Long
  - cartItems: List<CartItem>
  - createdAt: LocalDateTime
  - updatedAt: LocalDateTime
  + addItem(CartItem): void
  + removeItem(Long): void
  + updateItemQuantity(Long, Integer): void
  + calculateTotal(): BigDecimal
  + clear(): void
}

class CartItem {
  - id: Long
  - cartId: Long
  - productId: Long
  - quantity: Integer
  - price: BigDecimal
  - addedAt: LocalDateTime
  + updateQuantity(Integer): void
  + getSubtotal(): BigDecimal
}

' Relationships
ProductController --> ProductService
ProductService --> ProductRepository
ProductService --> InventoryService
ProductRepository --> Product

InventoryController --> InventoryService
InventoryService --> InventoryRepository
InventoryRepository --> Inventory

OrderController --> OrderService
OrderService --> OrderRepository
OrderService --> OrderItemRepository
OrderService --> InventoryService
OrderService --> ProductService
OrderRepository --> Order
OrderItemRepository --> OrderItem
Order --> OrderStatus
Order "1" *-- "many" OrderItem

ShoppingCartController --> ShoppingCartService
ShoppingCartService --> ShoppingCartRepository
ShoppingCartService --> CartItemRepository
ShoppingCartService --> ProductService
ShoppingCartService --> InventoryService
ShoppingCartRepository --> ShoppingCart
CartItemRepository --> CartItem
ShoppingCart "1" *-- "many" CartItem

@enduml
```

### 2.2 Entity Relationship Diagram

```plantuml
@startuml

entity "PRODUCTS" as products {
  * id : BIGINT <<PK>>
  --
  * name : VARCHAR(255)
  description : TEXT
  * price : DECIMAL(10,2)
  category : VARCHAR(100)
  image_url : VARCHAR(500)
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "INVENTORY" as inventory {
  * id : BIGINT <<PK>>
  --
  * product_id : BIGINT <<FK>>
  * quantity : INTEGER
  reserved_quantity : INTEGER
  last_updated : TIMESTAMP
}

entity "ORDERS" as orders {
  * id : BIGINT <<PK>>
  --
  * user_id : BIGINT
  * order_date : TIMESTAMP
  * status : VARCHAR(50)
  * total_amount : DECIMAL(10,2)
  shipping_address : TEXT
}

entity "ORDER_ITEMS" as order_items {
  * id : BIGINT <<PK>>
  --
  * order_id : BIGINT <<FK>>
  * product_id : BIGINT <<FK>>
  * quantity : INTEGER
  * price : DECIMAL(10,2)
  * subtotal : DECIMAL(10,2)
}

entity "SHOPPING_CARTS" as shopping_carts {
  * id : BIGINT <<PK>>
  --
  * user_id : BIGINT <<UNIQUE>>
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "CART_ITEMS" as cart_items {
  * id : BIGINT <<PK>>
  --
  * cart_id : BIGINT <<FK>>
  * product_id : BIGINT <<FK>>
  * quantity : INTEGER
  * price : DECIMAL(10,2)
  added_at : TIMESTAMP
}

products ||--|| inventory : "has"
orders ||--o{ order_items : "contains"
products ||--o{ order_items : "referenced in"
shopping_carts ||--o{ cart_items : "contains"
products ||--o{ cart_items : "referenced in"

@enduml
```

---

## 3. Sequence Diagrams

### 3.1 Create Product Flow

```plantuml
@startuml
actor Client
participant ProductController
participant ProductService
participant ProductRepository
participant InventoryService
participant InventoryRepository

Client -> ProductController: POST /api/products
activate ProductController

ProductController -> ProductService: createProduct(productDTO)
activate ProductService

ProductService -> ProductRepository: save(product)
activate ProductRepository
ProductRepository --> ProductService: savedProduct
deactivate ProductRepository

ProductService -> InventoryService: createInventory(productId)
activate InventoryService

InventoryService -> InventoryRepository: save(inventory)
activate InventoryRepository
InventoryRepository --> InventoryService: savedInventory
deactivate InventoryRepository

InventoryService --> ProductService: inventory
deactivate InventoryService

ProductService --> ProductController: product
deactivate ProductService

ProductController --> Client: 201 Created (ProductDTO)
deactivate ProductController
@enduml
```

### 3.2 Get Product Flow

```plantuml
@startuml
actor Client
participant ProductController
participant ProductService
participant ProductRepository

Client -> ProductController: GET /api/products/{id}
activate ProductController

ProductController -> ProductService: getProductById(id)
activate ProductService

ProductService -> ProductRepository: findById(id)
activate ProductRepository
ProductRepository --> ProductService: Optional<Product>
deactivate ProductRepository

alt Product Found
    ProductService --> ProductController: product
    ProductController --> Client: 200 OK (ProductDTO)
else Product Not Found
    ProductService --> ProductController: throw ProductNotFoundException
    ProductController --> Client: 404 Not Found
end

deactivate ProductService
deactivate ProductController
@enduml
```

### 3.3 Update Inventory Flow

```plantuml
@startuml
actor Client
participant InventoryController
participant InventoryService
participant InventoryRepository

Client -> InventoryController: PUT /api/inventory/{productId}
activate InventoryController

InventoryController -> InventoryService: updateStock(productId, quantity)
activate InventoryService

InventoryService -> InventoryRepository: findByProductId(productId)
activate InventoryRepository
InventoryRepository --> InventoryService: Optional<Inventory>
deactivate InventoryRepository

alt Inventory Found
    InventoryService -> InventoryService: updateQuantity(quantity)
    InventoryService -> InventoryRepository: save(inventory)
    activate InventoryRepository
    InventoryRepository --> InventoryService: updatedInventory
    deactivate InventoryRepository
    InventoryService --> InventoryController: inventory
    InventoryController --> Client: 200 OK (InventoryDTO)
else Inventory Not Found
    InventoryService --> InventoryController: throw InventoryNotFoundException
    InventoryController --> Client: 404 Not Found
end

deactivate InventoryService
deactivate InventoryController
@enduml
```

### 3.4 Create Order Flow

```plantuml
@startuml
actor Client
participant OrderController
participant OrderService
participant InventoryService
participant ProductService
participant OrderRepository
participant OrderItemRepository

Client -> OrderController: POST /api/orders
activate OrderController

OrderController -> OrderService: createOrder(orderDTO)
activate OrderService

loop for each item in order
    OrderService -> ProductService: getProductById(productId)
    activate ProductService
    ProductService --> OrderService: product
    deactivate ProductService
    
    OrderService -> InventoryService: checkAvailability(productId, quantity)
    activate InventoryService
    InventoryService --> OrderService: isAvailable
    deactivate InventoryService
    
    alt Stock Available
        OrderService -> InventoryService: reserveStock(productId, quantity)
        activate InventoryService
        InventoryService --> OrderService: success
        deactivate InventoryService
    else Stock Unavailable
        OrderService --> OrderController: throw InsufficientStockException
        OrderController --> Client: 400 Bad Request
    end
end

OrderService -> OrderRepository: save(order)
activate OrderRepository
OrderRepository --> OrderService: savedOrder
deactivate OrderRepository

loop for each item
    OrderService -> OrderItemRepository: save(orderItem)
    activate OrderItemRepository
    OrderItemRepository --> OrderService: savedOrderItem
    deactivate OrderItemRepository
end

OrderService --> OrderController: order
deactivate OrderService

OrderController --> Client: 201 Created (OrderDTO)
deactivate OrderController
@enduml
```

### 3.5 Cancel Order Flow

```plantuml
@startuml
actor Client
participant OrderController
participant OrderService
participant OrderRepository
participant OrderItemRepository
participant InventoryService

Client -> OrderController: DELETE /api/orders/{id}
activate OrderController

OrderController -> OrderService: cancelOrder(orderId)
activate OrderService

OrderService -> OrderRepository: findById(orderId)
activate OrderRepository
OrderRepository --> OrderService: Optional<Order>
deactivate OrderRepository

alt Order Found and Cancellable
    OrderService -> OrderItemRepository: findByOrderId(orderId)
    activate OrderItemRepository
    OrderItemRepository --> OrderService: List<OrderItem>
    deactivate OrderItemRepository
    
    loop for each order item
        OrderService -> InventoryService: releaseStock(productId, quantity)
        activate InventoryService
        InventoryService --> OrderService: success
        deactivate InventoryService
    end
    
    OrderService -> OrderService: setStatus(CANCELLED)
    OrderService -> OrderRepository: save(order)
    activate OrderRepository
    OrderRepository --> OrderService: updatedOrder
    deactivate OrderRepository
    
    OrderService --> OrderController: success
    OrderController --> Client: 200 OK
else Order Not Found or Not Cancellable
    OrderService --> OrderController: throw Exception
    OrderController --> Client: 400/404 Error
end

deactivate OrderService
deactivate OrderController
@enduml
```

### 3.6 Search Products Flow

```plantuml
@startuml
actor Client
participant ProductController
participant ProductService
participant ProductRepository

Client -> ProductController: GET /api/products/search?query=laptop
activate ProductController

ProductController -> ProductService: searchProducts("laptop")
activate ProductService

ProductService -> ProductRepository: findByNameContaining("laptop")
activate ProductRepository
ProductRepository --> ProductService: List<Product>
deactivate ProductRepository

ProductService --> ProductController: List<Product>
deactivate ProductService

ProductController --> Client: 200 OK (List<ProductDTO>)
deactivate ProductController
@enduml
```

### 3.7 Check Stock Availability Flow

```plantuml
@startuml
actor Client
participant InventoryController
participant InventoryService
participant InventoryRepository

Client -> InventoryController: GET /api/inventory/{productId}/availability?quantity=5
activate InventoryController

InventoryController -> InventoryService: checkAvailability(productId, 5)
activate InventoryService

InventoryService -> InventoryRepository: findByProductId(productId)
activate InventoryRepository
InventoryRepository --> InventoryService: Optional<Inventory>
deactivate InventoryRepository

alt Inventory Found
    InventoryService -> InventoryService: calculate available = quantity - reservedQuantity
    alt available >= requested
        InventoryService --> InventoryController: true
        InventoryController --> Client: 200 OK {"available": true}
    else available < requested
        InventoryService --> InventoryController: false
        InventoryController --> Client: 200 OK {"available": false}
    end
else Inventory Not Found
    InventoryService --> InventoryController: false
    InventoryController --> Client: 200 OK {"available": false}
end

deactivate InventoryService
deactivate InventoryController
@enduml
```

### 3.8 Add Item to Cart Flow

```plantuml
@startuml
actor Client
participant ShoppingCartController
participant ShoppingCartService
participant ShoppingCartRepository
participant CartItemRepository
participant ProductService
participant InventoryService

Client -> ShoppingCartController: POST /api/cart/{userId}/items
activate ShoppingCartController

ShoppingCartController -> ShoppingCartService: addItemToCart(userId, productId, quantity)
activate ShoppingCartService

ShoppingCartService -> ProductService: getProductById(productId)
activate ProductService
ProductService --> ShoppingCartService: product
deactivate ProductService

ShoppingCartService -> InventoryService: checkAvailability(productId, quantity)
activate InventoryService
InventoryService --> ShoppingCartService: isAvailable
deactivate InventoryService

alt Stock Available
    ShoppingCartService -> ShoppingCartRepository: findByUserId(userId)
    activate ShoppingCartRepository
    ShoppingCartRepository --> ShoppingCartService: Optional<ShoppingCart>
    deactivate ShoppingCartRepository
    
    alt Cart Exists
        ShoppingCartService -> CartItemRepository: findByCartIdAndProductId(cartId, productId)
        activate CartItemRepository
        CartItemRepository --> ShoppingCartService: Optional<CartItem>
        deactivate CartItemRepository
        
        alt Item Exists in Cart
            ShoppingCartService -> ShoppingCartService: updateQuantity(existingQty + newQty)
        else Item Not in Cart
            ShoppingCartService -> ShoppingCartService: createNewCartItem()
        end
    else Cart Does Not Exist
        ShoppingCartService -> ShoppingCartRepository: save(newCart)
        activate ShoppingCartRepository
        ShoppingCartRepository --> ShoppingCartService: savedCart
        deactivate ShoppingCartRepository
        
        ShoppingCartService -> ShoppingCartService: createNewCartItem()
    end
    
    ShoppingCartService -> CartItemRepository: save(cartItem)
    activate CartItemRepository
    CartItemRepository --> ShoppingCartService: savedCartItem
    deactivate CartItemRepository
    
    ShoppingCartService --> ShoppingCartController: shoppingCart
    ShoppingCartController --> Client: 200 OK (ShoppingCartDTO)
else Stock Unavailable
    ShoppingCartService --> ShoppingCartController: throw InsufficientStockException
    ShoppingCartController --> Client: 400 Bad Request
end

deactivate ShoppingCartService
deactivate ShoppingCartController
@enduml
```

### 3.9 Update Cart Item Quantity Flow

```plantuml
@startuml
actor Client
participant ShoppingCartController
participant ShoppingCartService
participant CartItemRepository
participant InventoryService

Client -> ShoppingCartController: PUT /api/cart/{userId}/items/{itemId}
activate ShoppingCartController

ShoppingCartController -> ShoppingCartService: updateCartItemQuantity(userId, itemId, newQuantity)
activate ShoppingCartService

ShoppingCartService -> CartItemRepository: findById(itemId)
activate CartItemRepository
CartItemRepository --> ShoppingCartService: Optional<CartItem>
deactivate CartItemRepository

alt Item Found
    ShoppingCartService -> InventoryService: checkAvailability(productId, newQuantity)
    activate InventoryService
    InventoryService --> ShoppingCartService: isAvailable
    deactivate InventoryService
    
    alt Stock Available
        ShoppingCartService -> ShoppingCartService: cartItem.updateQuantity(newQuantity)
        ShoppingCartService -> CartItemRepository: save(cartItem)
        activate CartItemRepository
        CartItemRepository --> ShoppingCartService: updatedCartItem
        deactivate CartItemRepository
        
        ShoppingCartService --> ShoppingCartController: shoppingCart
        ShoppingCartController --> Client: 200 OK (ShoppingCartDTO)
    else Stock Unavailable
        ShoppingCartService --> ShoppingCartController: throw InsufficientStockException
        ShoppingCartController --> Client: 400 Bad Request
    end
else Item Not Found
    ShoppingCartService --> ShoppingCartController: throw CartItemNotFoundException
    ShoppingCartController --> Client: 404 Not Found
end

deactivate ShoppingCartService
deactivate ShoppingCartController
@enduml
```

### 3.10 Remove Item from Cart Flow

```plantuml
@startuml
actor Client
participant ShoppingCartController
participant ShoppingCartService
participant CartItemRepository

Client -> ShoppingCartController: DELETE /api/cart/{userId}/items/{itemId}
activate ShoppingCartController

ShoppingCartController -> ShoppingCartService: removeItemFromCart(userId, itemId)
activate ShoppingCartService

ShoppingCartService -> CartItemRepository: findById(itemId)
activate CartItemRepository
CartItemRepository --> ShoppingCartService: Optional<CartItem>
deactivate CartItemRepository

alt Item Found and Belongs to User's Cart
    ShoppingCartService -> CartItemRepository: deleteById(itemId)
    activate CartItemRepository
    CartItemRepository --> ShoppingCartService: success
    deactivate CartItemRepository
    
    ShoppingCartService --> ShoppingCartController: success
    ShoppingCartController --> Client: 204 No Content
else Item Not Found or Unauthorized
    ShoppingCartService --> ShoppingCartController: throw Exception
    ShoppingCartController --> Client: 404 Not Found / 403 Forbidden
end

deactivate ShoppingCartService
deactivate ShoppingCartController
@enduml
```

### 3.11 Get Shopping Cart Flow

```plantuml
@startuml
actor Client
participant ShoppingCartController
participant ShoppingCartService
participant ShoppingCartRepository
participant CartItemRepository

Client -> ShoppingCartController: GET /api/cart/{userId}
activate ShoppingCartController

ShoppingCartController -> ShoppingCartService: getCartByUserId(userId)
activate ShoppingCartService

ShoppingCartService -> ShoppingCartRepository: findByUserId(userId)
activate ShoppingCartRepository
ShoppingCartRepository --> ShoppingCartService: Optional<ShoppingCart>
deactivate ShoppingCartRepository

alt Cart Found
    ShoppingCartService -> CartItemRepository: findByCartId(cartId)
    activate CartItemRepository
    CartItemRepository --> ShoppingCartService: List<CartItem>
    deactivate CartItemRepository
    
    ShoppingCartService -> ShoppingCartService: calculateCartTotal()
    ShoppingCartService --> ShoppingCartController: shoppingCart
    ShoppingCartController --> Client: 200 OK (ShoppingCartDTO)
else Cart Not Found
    ShoppingCartService -> ShoppingCartService: createEmptyCart(userId)
    ShoppingCartService -> ShoppingCartRepository: save(newCart)
    activate ShoppingCartRepository
    ShoppingCartRepository --> ShoppingCartService: savedCart
    deactivate ShoppingCartRepository
    
    ShoppingCartService --> ShoppingCartController: emptyCart
    ShoppingCartController --> Client: 200 OK (EmptyCartDTO)
end

deactivate ShoppingCartService
deactivate ShoppingCartController
@enduml
```

---

## 4. API Endpoints

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/products` | Create new product | ProductDTO | 201 Created |
| GET | `/api/products/{id}` | Get product by ID | - | 200 OK |
| PUT | `/api/products/{id}` | Update product | ProductDTO | 200 OK |
| DELETE | `/api/products/{id}` | Delete product | - | 204 No Content |
| GET | `/api/products` | List all products (paginated) | - | 200 OK |
| GET | `/api/products/search` | Search products | query param | 200 OK |

### Inventory Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/inventory/{productId}` | Get inventory for product | - | 200 OK |
| PUT | `/api/inventory/{productId}` | Update stock quantity | InventoryUpdateDTO | 200 OK |
| GET | `/api/inventory/{productId}/availability` | Check stock availability | quantity param | 200 OK |

### Order Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/orders` | Create new order | OrderDTO | 201 Created |
| GET | `/api/orders/{id}` | Get order by ID | - | 200 OK |
| PUT | `/api/orders/{id}/status` | Update order status | StatusUpdateDTO | 200 OK |
| DELETE | `/api/orders/{id}` | Cancel order | - | 200 OK |
| GET | `/api/orders/user/{userId}` | Get user's orders | - | 200 OK |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/cart/{userId}` | Get user's shopping cart | - | 200 OK |
| POST | `/api/cart/{userId}/items` | Add item to cart | CartItemDTO | 200 OK |
| PUT | `/api/cart/{userId}/items/{itemId}` | Update item quantity | QuantityUpdateDTO | 200 OK |
| DELETE | `/api/cart/{userId}/items/{itemId}` | Remove item from cart | - | 204 No Content |
| DELETE | `/api/cart/{userId}` | Clear entire cart | - | 204 No Content |

---

## 5. Database Schema

### Products Table
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Inventory Table
```sql
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

### Orders Table
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Shopping Carts Table
```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
```

### Cart Items Table
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
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 6. Data Transfer Objects (DTOs)

### ProductDTO
```java
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String imageUrl;
    private Integer availableQuantity;
}
```

### OrderDTO
```java
public class OrderDTO {
    private Long id;
    private Long userId;
    private LocalDateTime orderDate;
    private String status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private List<OrderItemDTO> items;
}
```

### OrderItemDTO
```java
public class OrderItemDTO {
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
}
```

### InventoryDTO
```java
public class InventoryDTO {
    private Long productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private LocalDateTime lastUpdated;
}
```

---

## 7. Design Patterns Used

### 7.1 Layered Architecture
- **Controller Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic
- **Repository Layer**: Manages data persistence
- **Entity Layer**: Represents database tables

### 7.2 Repository Pattern
- Abstracts data access logic
- Provides a collection-like interface for accessing domain objects
- Implemented using Spring Data JPA

### 7.3 Service Pattern
- Encapsulates business logic
- Coordinates between controllers and repositories
- Handles transaction management

### 7.4 DTO Pattern
- Separates internal domain models from external API contracts
- Reduces coupling between layers
- Provides data validation and transformation

### 7.5 Dependency Injection
- Uses Spring's IoC container
- Promotes loose coupling
- Facilitates testing through mock injection

### 7.6 Aggregate Pattern
- ShoppingCart acts as an aggregate root managing CartItems
- Ensures consistency boundaries within the cart domain
- All cart item modifications go through the ShoppingCart aggregate
- Maintains invariants such as quantity validation and total calculation

---

## 8. Key Implementation Details

### 8.1 Transaction Management
- Use `@Transactional` annotation for methods that modify data
- Order creation and inventory updates must be atomic
- Rollback on any failure during order processing

### 8.2 Inventory Reservation
- When order is created, stock is reserved (not immediately deducted)
- Reserved quantity is tracked separately
- Stock is released if order is cancelled
- Actual deduction happens when order is confirmed

### 8.3 Error Handling
- Custom exceptions for domain-specific errors
- Global exception handler using `@ControllerAdvice`
- Proper HTTP status codes for different error scenarios

### 8.4 Validation
- Input validation using Bean Validation annotations
- Business rule validation in service layer
- Database constraints for data integrity

### 8.5 Pagination
- Use Spring Data's `Pageable` interface
- Default page size: 20 items
- Support for sorting by multiple fields

### 8.6 Key Features

#### Product Management
- CRUD operations for products
- Category-based filtering
- Search functionality
- Image URL storage

#### Inventory Management
- Real-time stock tracking
- Reserved quantity management
- Stock availability checks
- Automatic inventory updates

#### Order Management
- Order creation with multiple items
- Order status tracking
- Order cancellation with stock release
- User order history

#### Shopping Cart Management
- Persistent shopping carts per user
- Add/update/remove cart items
- Real-time cart total calculation
- Stock availability validation before adding items
- Automatic cart creation for new users
- Cart item quantity management with inventory checks

---

## 9. Security Considerations

### 9.1 Authentication
- JWT-based authentication
- Token validation on protected endpoints
- User identity verification

### 9.2 Authorization
- Role-based access control
- Users can only access their own orders
- Admin role for product and inventory management

### 9.3 Data Validation
- Input sanitization
- SQL injection prevention through parameterized queries
- XSS prevention in API responses

---

## 10. Performance Optimization

### 10.1 Database Indexing
- Indexes on frequently queried columns
- Composite indexes for multi-column queries
- Regular index maintenance

### 10.2 Caching Strategy
- Cache frequently accessed products
- Cache inventory data with short TTL
- Invalidate cache on updates

### 10.3 Query Optimization
- Use pagination for large result sets
- Avoid N+1 query problems
- Use appropriate fetch strategies

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Test service layer business logic
- Mock repository dependencies
- Test edge cases and error scenarios

### 11.2 Integration Tests
- Test controller endpoints
- Test database interactions
- Test transaction management

### 11.3 Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All API endpoints tested

---

## 12. Deployment Considerations

### 12.1 Environment Configuration
- Separate configurations for dev, staging, and production
- Externalized configuration using environment variables
- Secure storage of sensitive credentials

### 12.2 Database Migration
- Use Flyway or Liquibase for version control
- Automated migration on deployment
- Rollback scripts for each migration

### 12.3 Monitoring and Logging
- Structured logging using SLF4J
- Application metrics using Micrometer
- Health check endpoints
- Error tracking and alerting

---

## 13. Future Enhancements

### 13.1 Planned Features
- Product reviews and ratings
- Wishlist functionality
- Advanced search with filters
- Recommendation engine
- Multi-warehouse inventory support

### 13.2 Scalability Improvements
- Microservices architecture
- Event-driven communication
- Distributed caching
- Database sharding

---

## 14. Appendix

### 14.1 Glossary
- **SKU**: Stock Keeping Unit
- **DTO**: Data Transfer Object
- **JPA**: Java Persistence API
- **REST**: Representational State Transfer

### 14.2 References
- Spring Boot Documentation
- Spring Data JPA Documentation
- PostgreSQL Documentation
- RESTful API Design Best Practices

---

**Document Version**: 1.1  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Approved
