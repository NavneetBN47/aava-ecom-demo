# Low Level Design Document

## E-commerce Product Management System

---

## 1. Project Overview

### System Name
E-commerce Product Management System

### Modules
- **ProductManagement**: Handles CRUD operations for products
- **ShoppingCartManagement**: Manages shopping cart operations including adding, viewing, updating, and removing items

### Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Programming Language**: Java 21
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **Build Tool**: Maven/Gradle
- **API Style**: RESTful

---

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(ProductDTO dto) ResponseEntity~Product~
        +updateProduct(Long id, ProductDTO dto) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword) ResponseEntity~List~Product~~
    }

    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Product
        +createProduct(ProductDTO dto) Product
        +updateProduct(Long id, ProductDTO dto) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }

    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingOrDescriptionContaining(String name, String desc) List~Product~
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
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer stockQuantity) void
        +getCategory() String
        +setCategory(String category) void
    }

    class ProductDTO {
        -String name
        -String description
        -BigDecimal price
        -Integer stockQuantity
        -String category
        +validate() boolean
    }

    class ShoppingCartController {
        -ShoppingCartService shoppingCartService
        +addProductToCart(Long userId, Long productId, Integer quantity) ResponseEntity~ShoppingCart~
        +getCartByUserId(Long userId) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ResponseEntity~ShoppingCart~
        +removeItemFromCart(Long userId, Long cartItemId) ResponseEntity~Void~
    }

    class ShoppingCartService {
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addProductToCart(Long userId, Long productId, Integer quantity) ShoppingCart
        +getCartByUserId(Long userId) ShoppingCart
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ShoppingCart
        +removeItemFromCart(Long userId, Long cartItemId) void
        +calculateCartTotal(ShoppingCart cart) BigDecimal
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
    }

    class CartItemRepository {
        <<interface>>
        +findById(Long id) Optional~CartItem~
        +save(CartItem item) CartItem
        +deleteById(Long id) void
    }

    class ShoppingCart {
        -Long id
        -Long userId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +addItem(CartItem item) void
        +removeItem(Long itemId) void
        +updateItemQuantity(Long itemId, Integer quantity) void
        +calculateTotal() BigDecimal
    }

    class CartItem {
        -Long id
        -Long productId
        -String productName
        -BigDecimal price
        -Integer quantity
        -BigDecimal subtotal
        +calculateSubtotal() BigDecimal
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductService --> Product
    ProductController --> ProductDTO
    ProductRepository --> Product
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductRepository
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart --> CartItem
```

### 2.2 Entity Relationship Diagram

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
        DECIMAL total_amount
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
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```

---

## 3. Sequence Diagrams

### 3.1 Get All Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products
    ProductController->>ProductService: getAllProducts()
    ProductService->>ProductRepository: findAll()
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.2 Get Product By ID

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
    
    alt Product Found
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.3 Create Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: POST /api/products (ProductDTO)
    ProductController->>ProductController: validate(ProductDTO)
    
    alt Valid Input
        ProductController->>ProductService: createProduct(ProductDTO)
        ProductService->>ProductService: map DTO to Product entity
        ProductService->>ProductRepository: save(Product)
        ProductRepository->>Database: INSERT INTO products
        Database-->>ProductRepository: Product (with ID)
        ProductRepository-->>ProductService: Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 201 Created (Product)
    else Invalid Input
        ProductController-->>Client: 400 Bad Request
    end
```

### 3.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id} (ProductDTO)
    ProductController->>ProductService: updateProduct(id, ProductDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductService: update Product fields
        ProductService->>ProductRepository: save(Product)
        ProductRepository->>Database: UPDATE products SET ...
        Database-->>ProductRepository: Updated Product
        ProductRepository-->>ProductService: Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.5 Delete Product

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
    
    alt Product Exists
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.6 Get Products By Category

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/category/{category}
    ProductController->>ProductService: getProductsByCategory(category)
    ProductService->>ProductRepository: findByCategory(category)
    ProductRepository->>Database: SELECT * FROM products WHERE category = ?
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>ProductService: searchProducts(keyword)
    ProductService->>ProductRepository: findByNameContainingOrDescriptionContaining(keyword)
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE ? OR description LIKE ?
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.8 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database

    Client->>ShoppingCartController: POST /api/cart/{userId}/items
    ShoppingCartController->>ShoppingCartService: addProductToCart(userId, productId, quantity)
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists and In Stock
        Database-->>ProductRepository: Product
        ProductRepository-->>ShoppingCartService: Optional<Product>
        ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
        ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
        
        alt Cart Exists
            Database-->>ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        else Cart Does Not Exist
            Database-->>ShoppingCartRepository: null
            ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
            ShoppingCartService->>ShoppingCartService: create new ShoppingCart
        end
        
        ShoppingCartService->>ShoppingCartService: create CartItem
        ShoppingCartService->>CartItemRepository: save(CartItem)
        CartItemRepository->>Database: INSERT INTO cart_items
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: CartItem
        ShoppingCartService->>ShoppingCartService: calculateCartTotal()
        ShoppingCartService->>ShoppingCartRepository: save(ShoppingCart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Product Not Found or Out of Stock
        Database-->>ProductRepository: null or insufficient stock
        ProductRepository-->>ShoppingCartService: Optional.empty() or Product
        ShoppingCartService-->>ShoppingCartController: throw Exception
        ShoppingCartController-->>Client: 404 Not Found or 400 Bad Request
    end
```

### 3.9 View Shopping Cart

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
    
    alt Cart Exists
        Database-->>ShoppingCartRepository: ShoppingCart with CartItems
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Cart Not Found
        Database-->>ShoppingCartRepository: null
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: empty ShoppingCart
        ShoppingCartController-->>Client: 200 OK (empty cart)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database

    Client->>ShoppingCartController: PUT /api/cart/{userId}/items/{cartItemId}
    ShoppingCartController->>ShoppingCartService: updateCartItemQuantity(userId, cartItemId, quantity)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart and Item Exist
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService->>CartItemRepository: findById(cartItemId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: Optional<CartItem>
        ShoppingCartService->>ProductRepository: findById(productId)
        ProductRepository->>Database: SELECT * FROM products WHERE id = ?
        
        alt Sufficient Stock
            Database-->>ProductRepository: Product
            ProductRepository-->>ShoppingCartService: Optional<Product>
            ShoppingCartService->>ShoppingCartService: update CartItem quantity
            ShoppingCartService->>CartItemRepository: save(CartItem)
            CartItemRepository->>Database: UPDATE cart_items
            Database-->>CartItemRepository: CartItem
            CartItemRepository-->>ShoppingCartService: CartItem
            ShoppingCartService->>ShoppingCartService: calculateCartTotal()
            ShoppingCartService->>ShoppingCartRepository: save(ShoppingCart)
            ShoppingCartRepository->>Database: UPDATE shopping_carts
            Database-->>ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: 200 OK (ShoppingCart)
        else Insufficient Stock
            Database-->>ProductRepository: Product with low stock
            ProductRepository-->>ShoppingCartService: Optional<Product>
            ShoppingCartService-->>ShoppingCartController: throw InsufficientStockException
            ShoppingCartController-->>Client: 400 Bad Request
        end
    else Cart or Item Not Found
        Database-->>ShoppingCartRepository: null
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: throw NotFoundException
        ShoppingCartController-->>Client: 404 Not Found
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: DELETE /api/cart/{userId}/items/{cartItemId}
    ShoppingCartController->>ShoppingCartService: removeItemFromCart(userId, cartItemId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart and Item Exist
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService->>CartItemRepository: findById(cartItemId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: Optional<CartItem>
        ShoppingCartService->>CartItemRepository: deleteById(cartItemId)
        CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
        Database-->>CartItemRepository: success
        CartItemRepository-->>ShoppingCartService: void
        ShoppingCartService->>ShoppingCartService: calculateCartTotal()
        ShoppingCartService->>ShoppingCartRepository: save(ShoppingCart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
        ShoppingCartService-->>ShoppingCartController: void
        ShoppingCartController-->>Client: 204 No Content
    else Cart or Item Not Found
        Database-->>ShoppingCartRepository: null
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: throw NotFoundException
        ShoppingCartController-->>Client: 404 Not Found
    end
```

---

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | `200 OK` - List of products |
| GET | `/api/products/{id}` | Get product by ID | None | `200 OK` - Product<br>`404 Not Found` |
| POST | `/api/products` | Create new product | ProductDTO | `201 Created` - Product<br>`400 Bad Request` |
| PUT | `/api/products/{id}` | Update product | ProductDTO | `200 OK` - Product<br>`404 Not Found` |
| DELETE | `/api/products/{id}` | Delete product | None | `204 No Content`<br>`404 Not Found` |
| GET | `/api/products/category/{category}` | Get products by category | None | `200 OK` - List of products |
| GET | `/api/products/search?keyword={keyword}` | Search products | None | `200 OK` - List of products |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/{userId}/items` | Add product to cart | `{"productId": Long, "quantity": Integer}` | `200 OK` - ShoppingCart<br>`404 Not Found`<br>`400 Bad Request` |
| GET | `/api/cart/{userId}` | View shopping cart | None | `200 OK` - ShoppingCart |
| PUT | `/api/cart/{userId}/items/{cartItemId}` | Update cart item quantity | `{"quantity": Integer}` | `200 OK` - ShoppingCart<br>`404 Not Found`<br>`400 Bad Request` |
| DELETE | `/api/cart/{userId}/items/{cartItemId}` | Remove item from cart | None | `204 No Content`<br>`404 Not Found` |

---

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
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
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 6. Technology Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Build Tool**: Maven or Gradle

### Database
- **RDBMS**: PostgreSQL 15+
- **ORM**: Spring Data JPA with Hibernate

### API
- **Style**: RESTful
- **Documentation**: SpringDoc OpenAPI (Swagger)

### Testing
- **Unit Testing**: JUnit 5, Mockito
- **Integration Testing**: Spring Boot Test, Testcontainers

---

## 7. Design Patterns Used

### 1. Repository Pattern
- **Purpose**: Abstracts data access logic
- **Implementation**: `ProductRepository`, `ShoppingCartRepository`, `CartItemRepository` interfaces extending `JpaRepository`
- **Benefits**: 
  - Decouples business logic from data access
  - Easier to test and maintain
  - Provides consistent data access interface

### 2. Service Layer Pattern
- **Purpose**: Encapsulates business logic
- **Implementation**: `ProductService`, `ShoppingCartService` classes
- **Benefits**:
  - Separates business logic from controllers
  - Promotes reusability
  - Easier transaction management

### 3. DTO (Data Transfer Object) Pattern
- **Purpose**: Transfers data between layers
- **Implementation**: `ProductDTO` for API requests
- **Benefits**:
  - Decouples API contract from domain model
  - Validation at API boundary
  - Prevents over-exposure of entity details

### 4. RESTful API Pattern
- **Purpose**: Standardized API design
- **Implementation**: HTTP methods (GET, POST, PUT, DELETE) with resource-based URLs
- **Benefits**:
  - Intuitive and standardized
  - Stateless communication
  - Cacheable responses

### 5. Aggregate Pattern
- **Purpose**: Manages consistency boundaries and encapsulates related entities
- **Implementation**: `ShoppingCart` acts as an aggregate root managing `CartItem` entities
- **Benefits**:
  - Ensures data consistency within the shopping cart boundary
  - Encapsulates business rules for cart operations
  - Simplifies transaction management
  - Controls access to cart items through the aggregate root

---

## 8. Key Features

### Product Management
1. **CRUD Operations**: Complete create, read, update, and delete functionality for products
2. **Category Filtering**: Ability to retrieve products by category
3. **Search Functionality**: Search products by name or description
4. **Stock Management**: Track product inventory levels
5. **Validation**: Input validation for product data
6. **Error Handling**: Proper HTTP status codes and error messages
7. **Timestamps**: Automatic tracking of creation and update times

### Shopping Cart Management
1. **Add to Cart**: Users can add products to their shopping cart with specified quantities
2. **View Cart**: Retrieve complete shopping cart with all items and total amount
3. **Update Quantity**: Modify the quantity of items already in the cart
4. **Remove Items**: Delete specific items from the shopping cart
5. **Stock Validation**: Ensures requested quantities don't exceed available stock
6. **Automatic Calculations**: Real-time calculation of item subtotals and cart total
7. **Cart Persistence**: Shopping carts are persisted per user
8. **Cascade Operations**: Removing a cart automatically removes associated cart items

---

## 9. Error Handling Strategy

### Exception Types
1. **ProductNotFoundException**: Thrown when product ID doesn't exist
2. **InvalidInputException**: Thrown for validation failures
3. **DatabaseException**: Thrown for database operation failures

### HTTP Status Codes
- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side errors

---

## 10. Security Considerations

1. **Input Validation**: All inputs validated before processing
2. **SQL Injection Prevention**: Using JPA parameterized queries
3. **Authentication**: To be implemented (JWT/OAuth2)
4. **Authorization**: Role-based access control (future enhancement)

---

## 11. Performance Optimization

1. **Database Indexing**: Indexes on frequently queried columns (category, name)
2. **Connection Pooling**: HikariCP for efficient database connections
3. **Lazy Loading**: JPA lazy loading for related entities
4. **Caching**: Redis cache for frequently accessed products (future enhancement)

---

## 12. Future Enhancements

1. **Pagination**: Implement pagination for product listings
2. **Sorting**: Add sorting capabilities (by price, name, date)
3. **Image Management**: Support for product images
4. **Reviews and Ratings**: Customer review system
5. **Inventory Alerts**: Notifications for low stock
6. **Bulk Operations**: Batch product updates
7. **Advanced Search**: Filters by price range, multiple categories
8. **Audit Logging**: Track all product changes

---

**Document Version**: 1.1  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Approved