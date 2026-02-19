# Low Level Design Document

## 1. Project Overview

This document provides the Low Level Design (LLD) for an E-commerce system built using Spring Boot, Java 21, and PostgreSQL. The system is designed with a modular architecture following Domain-Driven Design (DDD) principles.

### Modules
- **ProductManagement**: Handles product catalog operations including CRUD operations, search, and inventory management
- **ShoppingCartManagement**: Manages shopping cart operations including adding/removing items, updating quantities, and cart retrieval

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a layered architecture pattern:

```
Presentation Layer (Controllers)
        ↓
Business Logic Layer (Services)
        ↓
Data Access Layer (Repositories)
        ↓
Database Layer (PostgreSQL)
```

### 2.2 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +createProduct(ProductDTO) ResponseEntity
        +getProduct(Long) ResponseEntity
        +updateProduct(Long, ProductDTO) ResponseEntity
        +deleteProduct(Long) ResponseEntity
        +searchProducts(String, Pageable) ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        +createProduct(ProductDTO) Product
        +getProductById(Long) Product
        +updateProduct(Long, ProductDTO) Product
        +deleteProduct(Long) void
        +searchProducts(String, Pageable) Page~Product~
        +checkInventory(Long) boolean
    }

    class ProductRepository {
        <<interface>>
        +findById(Long) Optional~Product~
        +findByNameContaining(String, Pageable) Page~Product~
        +findByCategory(String, Pageable) Page~Product~
        +save(Product) Product
        +deleteById(Long) void
    }

    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -Integer stockQuantity
        -String category
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long) void
        +getName() String
        +setName(String) void
    }

    class ProductDTO {
        -String name
        -String description
        -BigDecimal price
        -Integer stockQuantity
        -String category
    }

    class ShoppingCartController {
        -ShoppingCartService shoppingCartService
        +getCart(Long) ResponseEntity
        +addItem(Long, CartItemDTO) ResponseEntity
        +updateItemQuantity(Long, Long, Integer) ResponseEntity
        +removeItem(Long, Long) ResponseEntity
    }

    class ShoppingCartService {
        -ShoppingCartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +getCartByUserId(Long) ShoppingCart
        +addItemToCart(Long, CartItemDTO) ShoppingCart
        +updateCartItemQuantity(Long, Long, Integer) ShoppingCart
        +removeItemFromCart(Long, Long) ShoppingCart
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long) Optional~ShoppingCart~
        +save(ShoppingCart) ShoppingCart
    }

    class CartItemRepository {
        <<interface>>
        +findById(Long) Optional~CartItem~
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
        +updateItemQuantity(Long, Integer) void
        +calculateTotal() BigDecimal
    }

    class CartItem {
        -Long id
        -Long productId
        -String productName
        -BigDecimal price
        -Integer quantity
        -BigDecimal subtotal
        +calculateSubtotal() void
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
    ProductController ..> ProductDTO
    ProductService ..> ProductDTO
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductService
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart "1" *-- "many" CartItem
```

### 2.3 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        INTEGER stock_quantity
        VARCHAR category
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SHOPPING_CARTS {
        BIGINT id PK
        BIGINT user_id
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CART_ITEMS {
        BIGINT id PK
        BIGINT cart_id FK
        BIGINT product_id FK
        VARCHAR product_name
        DECIMAL price
        INTEGER quantity
        DECIMAL subtotal
    }

    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : references
```

## 3. Sequence Diagrams

### 3.1 Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: POST /api/products
    ProductController->>ProductController: Validate ProductDTO
    ProductController->>ProductService: createProduct(productDTO)
    ProductService->>ProductService: Map DTO to Entity
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: Product saved
    ProductRepository-->>ProductService: Product entity
    ProductService-->>ProductController: Product entity
    ProductController-->>Client: 201 Created + Product
```

### 3.2 Get Product by ID Flow

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
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    ProductService->>ProductService: Check if present
    alt Product found
        ProductService-->>ProductController: Product entity
        ProductController-->>Client: 200 OK + Product
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
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
    ProductController->>ProductController: Validate ProductDTO
    ProductController->>ProductService: updateProduct(id, productDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    alt Product exists
        ProductService->>ProductService: Update product fields
        ProductService->>ProductRepository: save(product)
        ProductRepository->>Database: UPDATE products SET ...
        Database-->>ProductRepository: Updated product
        ProductRepository-->>ProductService: Product entity
        ProductService-->>ProductController: Product entity
        ProductController-->>Client: 200 OK + Product
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.4 Delete Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    alt Product exists
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Deletion confirmed
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.5 Search Products Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?keyword=laptop&page=0&size=10
    ProductController->>ProductService: searchProducts(keyword, pageable)
    ProductService->>ProductRepository: findByNameContaining(keyword, pageable)
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE ? LIMIT ? OFFSET ?
    Database-->>ProductRepository: List of products
    ProductRepository-->>ProductService: Page<Product>
    ProductService-->>ProductController: Page<Product>
    ProductController-->>Client: 200 OK + Page<Product>
```

### 3.6 Check Inventory Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/{id}/inventory
    ProductController->>ProductService: checkInventory(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    alt Product exists
        ProductService->>ProductService: Check stockQuantity > 0
        ProductService-->>ProductController: boolean (in stock)
        ProductController-->>Client: 200 OK + {"inStock": true/false}
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.7 Get Products by Category Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/category/{category}?page=0&size=10
    ProductController->>ProductService: getProductsByCategory(category, pageable)
    ProductService->>ProductRepository: findByCategory(category, pageable)
    ProductRepository->>Database: SELECT * FROM products WHERE category = ? LIMIT ? OFFSET ?
    Database-->>ProductRepository: List of products
    ProductRepository-->>ProductService: Page<Product>
    ProductService-->>ProductController: Page<Product>
    ProductController-->>Client: 200 OK + Page<Product>
```

### 3.8 Get Shopping Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant Database

    Client->>ShoppingCartController: GET /api/cart/{userId}
    ShoppingCartController->>ShoppingCartService: getCartByUserId(userId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>ShoppingCartRepository: Cart data with items
    ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
    alt Cart exists
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK + ShoppingCart
    else Cart not found
        ShoppingCartService->>ShoppingCartService: Create new cart
        ShoppingCartService->>ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>Database: INSERT INTO shopping_carts
        Database-->>ShoppingCartRepository: New cart created
        ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK + ShoppingCart
    end
```

### 3.9 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: POST /api/cart/{userId}/items
    ShoppingCartController->>ShoppingCartService: addItemToCart(userId, cartItemDTO)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT cart
    Database-->>ShoppingCartRepository: Cart data
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService->>ProductService: getProductById(productId)
    ProductService-->>ShoppingCartService: Product
    ShoppingCartService->>ShoppingCartService: Create CartItem
    ShoppingCartService->>ShoppingCartService: cart.addItem(cartItem)
    ShoppingCartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: INSERT INTO cart_items
    Database-->>CartItemRepository: CartItem saved
    CartItemRepository-->>ShoppingCartService: CartItem
    ShoppingCartService->>ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>Database: UPDATE shopping_carts
    Database-->>ShoppingCartRepository: Cart updated
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK + ShoppingCart
```

### 3.10 Update Cart Item Quantity Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: PUT /api/cart/{userId}/items/{itemId}
    ShoppingCartController->>ShoppingCartService: updateCartItemQuantity(userId, itemId, quantity)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT cart
    Database-->>ShoppingCartRepository: Cart data
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService->>ShoppingCartService: cart.updateItemQuantity(itemId, quantity)
    ShoppingCartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem data
    CartItemRepository-->>ShoppingCartService: CartItem
    ShoppingCartService->>ShoppingCartService: cartItem.setQuantity(quantity)
    ShoppingCartService->>ShoppingCartService: cartItem.calculateSubtotal()
    ShoppingCartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: UPDATE cart_items
    Database-->>CartItemRepository: CartItem updated
    CartItemRepository-->>ShoppingCartService: CartItem
    ShoppingCartService->>ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>Database: UPDATE shopping_carts
    Database-->>ShoppingCartRepository: Cart updated
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK + ShoppingCart
```

### 3.11 Remove Item from Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: DELETE /api/cart/{userId}/items/{itemId}
    ShoppingCartController->>ShoppingCartService: removeItemFromCart(userId, itemId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT cart
    Database-->>ShoppingCartRepository: Cart data
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService->>ShoppingCartService: cart.removeItem(itemId)
    ShoppingCartService->>CartItemRepository: deleteById(itemId)
    CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: Item deleted
    CartItemRepository-->>ShoppingCartService: void
    ShoppingCartService->>ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>Database: UPDATE shopping_carts
    Database-->>ShoppingCartRepository: Cart updated
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK + ShoppingCart
```

## 4. API Endpoints

### 4.1 Product Management Endpoints

#### Create Product
- **Endpoint**: `POST /api/products`
- **Request Body**:
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "category": "Electronics"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "category": "Electronics",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

#### Get Product by ID
- **Endpoint**: `GET /api/products/{id}`
- **Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "category": "Electronics",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

#### Update Product
- **Endpoint**: `PUT /api/products/{id}`
- **Request Body**:
```json
{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "stockQuantity": 45,
  "category": "Electronics"
}
```
- **Response**: `200 OK`

#### Delete Product
- **Endpoint**: `DELETE /api/products/{id}`
- **Response**: `204 No Content`

#### Search Products
- **Endpoint**: `GET /api/products/search?keyword={keyword}&page={page}&size={size}`
- **Response**: `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "stockQuantity": 50,
      "category": "Electronics"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 1,
  "totalPages": 1
}
```

#### Check Inventory
- **Endpoint**: `GET /api/products/{id}/inventory`
- **Response**: `200 OK`
```json
{
  "inStock": true,
  "quantity": 50
}
```

#### Get Products by Category
- **Endpoint**: `GET /api/products/category/{category}?page={page}&size={size}`
- **Response**: `200 OK` (Same structure as Search Products)

### 4.2 Shopping Cart Management Endpoints

#### Get Shopping Cart
- **Endpoint**: `GET /api/cart/{userId}`
- **Response**: `200 OK`
```json
{
  "id": 1,
  "userId": 123,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Laptop",
      "price": 999.99,
      "quantity": 2,
      "subtotal": 1999.98
    }
  ],
  "total": 1999.98,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T11:00:00"
}
```

#### Add Item to Cart
- **Endpoint**: `POST /api/cart/{userId}/items`
- **Request Body**:
```json
{
  "productId": 1,
  "quantity": 2
}
```
- **Response**: `200 OK` (Returns updated cart)

#### Update Cart Item Quantity
- **Endpoint**: `PUT /api/cart/{userId}/items/{itemId}`
- **Request Body**:
```json
{
  "quantity": 3
}
```
- **Response**: `200 OK` (Returns updated cart)

#### Remove Item from Cart
- **Endpoint**: `DELETE /api/cart/{userId}/items/{itemId}`
- **Response**: `200 OK` (Returns updated cart)

## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.2 Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
```

### 5.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT subtotal_non_negative CHECK (subtotal >= 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 6. Technology Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: PostgreSQL 15+
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven / Gradle
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Validation**: Jakarta Bean Validation
- **Logging**: SLF4J with Logback

## 7. Design Patterns Used

### 7.1 Repository Pattern
- Abstracts data access logic
- Provides a collection-like interface for accessing domain objects
- Implemented through Spring Data JPA repositories

### 7.2 Service Layer Pattern
- Encapsulates business logic
- Provides transaction boundaries
- Coordinates between controllers and repositories

### 7.3 DTO Pattern
- Separates internal domain models from API contracts
- Reduces coupling between layers
- Provides data validation at API boundary

### 7.4 Dependency Injection
- Constructor-based injection for required dependencies
- Promotes loose coupling and testability
- Managed by Spring IoC container

### 7.5 Aggregate Pattern
- ShoppingCart acts as an aggregate root managing CartItems
- Ensures consistency boundaries within the shopping cart domain
- All modifications to cart items go through the ShoppingCart aggregate

## 8. Key Features

### 8.1 Product Management
- Complete CRUD operations for products
- Pagination support for product listings
- Search functionality by product name
- Category-based product filtering
- Real-time inventory tracking
- Stock quantity validation

### 8.2 Shopping Cart Management
- User-specific shopping cart creation and retrieval
- Add products to cart with quantity specification
- Update item quantities in cart
- Remove items from cart
- Automatic subtotal and total calculation
- Cart persistence across sessions

## 9. Error Handling

### Common Error Responses

#### Product Not Found
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Product not found with id: 1",
  "path": "/api/products/1"
}
```

#### Validation Error
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be positive"
    }
  ],
  "path": "/api/products"
}
```

## 10. Security Considerations

- Input validation on all API endpoints
- SQL injection prevention through parameterized queries (JPA)
- Price and quantity constraints at database level
- Transaction management for data consistency
- Proper error handling without exposing sensitive information

## 11. Performance Optimizations

- Database indexing on frequently queried columns
- Pagination for large result sets
- Connection pooling for database connections
- Lazy loading for entity relationships
- Caching strategies for frequently accessed data (future enhancement)

## 12. Testing Strategy

### Unit Tests
- Service layer business logic
- Repository custom queries
- DTO validation rules

### Integration Tests
- Controller endpoints
- Database operations
- End-to-end API flows

### Test Coverage Goals
- Minimum 80% code coverage
- All critical paths tested
- Edge cases and error scenarios covered

## 13. Future Enhancements

- Product image management
- Product reviews and ratings
- Advanced search with filters (price range, ratings, etc.)
- Product recommendations
- Inventory alerts for low stock
- Bulk product operations
- Product variants (size, color, etc.)
- Shopping cart checkout process
- Order management integration
- Payment processing integration
- Wishlist functionality