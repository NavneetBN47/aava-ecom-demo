# Low Level Design Document
## E-commerce Product Management System

---

## 1. Project Overview

### 1.1 Purpose
This document provides the low-level design for an E-commerce Product Management System. It details the technical implementation, class structures, database schemas, API endpoints, and interaction flows.

### 1.2 Scope
The system manages:
- Product catalog (CRUD operations)
- Inventory tracking
- Category management
- Product search and filtering
- Shopping Cart Management

### 1.3 Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **API Documentation**: OpenAPI/Swagger
- **Build Tool**: Maven
- **Version Control**: Git

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
        +getAllProducts(Pageable) ResponseEntity
        +searchProducts(String) ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        -CategoryRepository categoryRepository
        -InventoryRepository inventoryRepository
        +createProduct(ProductDTO) Product
        +getProductById(Long) Product
        +updateProduct(Long, ProductDTO) Product
        +deleteProduct(Long) void
        +getAllProducts(Pageable) Page~Product~
        +searchProducts(String) List~Product~
        -validateProduct(ProductDTO) void
    }

    class ProductRepository {
        <<interface>>
        +findById(Long) Optional~Product~
        +findAll(Pageable) Page~Product~
        +findByNameContaining(String) List~Product~
        +findByCategoryId(Long) List~Product~
        +save(Product) Product
        +deleteById(Long) void
    }

    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String sku
        -Category category
        -Inventory inventory
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setName(String) void
        +getPrice() BigDecimal
    }

    class CategoryController {
        -CategoryService categoryService
        +createCategory(CategoryDTO) ResponseEntity
        +getCategory(Long) ResponseEntity
        +updateCategory(Long, CategoryDTO) ResponseEntity
        +deleteCategory(Long) ResponseEntity
        +getAllCategories() ResponseEntity
    }

    class CategoryService {
        -CategoryRepository categoryRepository
        +createCategory(CategoryDTO) Category
        +getCategoryById(Long) Category
        +updateCategory(Long, CategoryDTO) Category
        +deleteCategory(Long) void
        +getAllCategories() List~Category~
    }

    class CategoryRepository {
        <<interface>>
        +findById(Long) Optional~Category~
        +findAll() List~Category~
        +findByName(String) Optional~Category~
        +save(Category) Category
        +deleteById(Long) void
    }

    class Category {
        -Long id
        -String name
        -String description
        -List~Product~ products
        +getId() Long
        +getName() String
        +addProduct(Product) void
    }

    class InventoryService {
        -InventoryRepository inventoryRepository
        +updateStock(Long, Integer) Inventory
        +checkAvailability(Long) boolean
        +getInventoryByProductId(Long) Inventory
    }

    class InventoryRepository {
        <<interface>>
        +findByProductId(Long) Optional~Inventory~
        +save(Inventory) Inventory
    }

    class Inventory {
        -Long id
        -Product product
        -Integer quantity
        -Integer reservedQuantity
        -LocalDateTime lastUpdated
        +updateQuantity(Integer) void
        +isAvailable() boolean
    }

    class ShoppingCartController {
        -ShoppingCartService cartService
        +addItemToCart(Long, CartItemDTO) ResponseEntity
        +removeItemFromCart(Long, Long) ResponseEntity
        +updateCartItem(Long, Long, CartItemDTO) ResponseEntity
        +getCart(Long) ResponseEntity
        +clearCart(Long) ResponseEntity
    }

    class ShoppingCartService {
        -ShoppingCartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addItemToCart(Long, CartItemDTO) ShoppingCart
        +removeItemFromCart(Long, Long) void
        +updateCartItem(Long, Long, CartItemDTO) CartItem
        +getCartByUserId(Long) ShoppingCart
        +clearCart(Long) void
        +calculateCartTotal(Long) BigDecimal
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long) Optional~ShoppingCart~
        +save(ShoppingCart) ShoppingCart
        +deleteById(Long) void
    }

    class CartItemRepository {
        <<interface>>
        +findById(Long) Optional~CartItem~
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
        +calculateTotal() BigDecimal
        +clear() void
    }

    class CartItem {
        -Long id
        -ShoppingCart cart
        -Product product
        -Integer quantity
        -BigDecimal priceAtAddition
        +updateQuantity(Integer) void
        +getSubtotal() BigDecimal
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductService --> CategoryRepository
    ProductService --> InventoryRepository
    ProductRepository --> Product
    Product --> Category
    Product --> Inventory
    
    CategoryController --> CategoryService
    CategoryService --> CategoryRepository
    CategoryRepository --> Category
    Category "1" --> "*" Product
    
    InventoryService --> InventoryRepository
    InventoryRepository --> Inventory
    Inventory "1" --> "1" Product
    
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductRepository
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart "1" --> "*" CartItem
    CartItem "*" --> "1" Product
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS ||--o{ INVENTORY : has
    PRODUCTS }o--|| CATEGORIES : belongs_to
    PRODUCTS ||--o{ CART_ITEMS : contains
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    
    PRODUCTS {
        bigint id PK
        varchar name
        text description
        decimal price
        varchar sku UK
        bigint category_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    CATEGORIES {
        bigint id PK
        varchar name UK
        text description
        timestamp created_at
    }
    
    INVENTORY {
        bigint id PK
        bigint product_id FK
        integer quantity
        integer reserved_quantity
        timestamp last_updated
    }
    
    SHOPPING_CARTS {
        bigint id PK
        bigint user_id UK
        timestamp created_at
        timestamp updated_at
    }
    
    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
        decimal price_at_addition
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
    participant CategoryRepository
    participant InventoryRepository
    participant Database

    Client->>ProductController: POST /api/products
    ProductController->>ProductService: createProduct(productDTO)
    ProductService->>CategoryRepository: findById(categoryId)
    CategoryRepository->>Database: SELECT * FROM categories
    Database-->>CategoryRepository: Category data
    CategoryRepository-->>ProductService: Category
    
    ProductService->>ProductService: validateProduct(productDTO)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: Product saved
    ProductRepository-->>ProductService: Product
    
    ProductService->>InventoryRepository: save(inventory)
    InventoryRepository->>Database: INSERT INTO inventory
    Database-->>InventoryRepository: Inventory saved
    InventoryRepository-->>ProductService: Inventory
    
    ProductService-->>ProductController: Product
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
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    
    alt Product found
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (ProductDTO)
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
    participant CategoryRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id}
    ProductController->>ProductService: updateProduct(id, productDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Product
    
    ProductService->>CategoryRepository: findById(categoryId)
    CategoryRepository->>Database: SELECT * FROM categories
    Database-->>CategoryRepository: Category data
    CategoryRepository-->>ProductService: Category
    
    ProductService->>ProductService: updateProductFields(product, productDTO)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: UPDATE products SET ...
    Database-->>ProductRepository: Updated product
    ProductRepository-->>ProductService: Product
    
    ProductService-->>ProductController: Product
    ProductController-->>Client: 200 OK (ProductDTO)
```

### 3.4 Delete Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant InventoryRepository
    participant Database

    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Product
    
    ProductService->>InventoryRepository: deleteByProductId(id)
    InventoryRepository->>Database: DELETE FROM inventory
    Database-->>InventoryRepository: Deleted
    
    ProductService->>ProductRepository: deleteById(id)
    ProductRepository->>Database: DELETE FROM products
    Database-->>ProductRepository: Deleted
    
    ProductService-->>ProductController: void
    ProductController-->>Client: 204 No Content
```

### 3.5 Search Products Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?query=laptop
    ProductController->>ProductService: searchProducts("laptop")
    ProductService->>ProductRepository: findByNameContaining("laptop")
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE '%laptop%'
    Database-->>ProductRepository: List of products
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<ProductDTO>)
```

### 3.6 Create Category Flow

```mermaid
sequenceDiagram
    participant Client
    participant CategoryController
    participant CategoryService
    participant CategoryRepository
    participant Database

    Client->>CategoryController: POST /api/categories
    CategoryController->>CategoryService: createCategory(categoryDTO)
    CategoryService->>CategoryRepository: findByName(name)
    CategoryRepository->>Database: SELECT * FROM categories WHERE name = ?
    Database-->>CategoryRepository: Optional<Category>
    
    alt Category exists
        CategoryService-->>CategoryController: throw CategoryExistsException
        CategoryController-->>Client: 409 Conflict
    else Category doesn't exist
        CategoryService->>CategoryRepository: save(category)
        CategoryRepository->>Database: INSERT INTO categories
        Database-->>CategoryRepository: Category saved
        CategoryRepository-->>CategoryService: Category
        CategoryService-->>CategoryController: Category
        CategoryController-->>Client: 201 Created (CategoryDTO)
    end
```

### 3.7 Update Inventory Flow

```mermaid
sequenceDiagram
    participant Client
    participant InventoryService
    participant InventoryRepository
    participant Database

    Client->>InventoryService: updateStock(productId, quantity)
    InventoryService->>InventoryRepository: findByProductId(productId)
    InventoryRepository->>Database: SELECT * FROM inventory WHERE product_id = ?
    Database-->>InventoryRepository: Inventory data
    InventoryRepository-->>InventoryService: Inventory
    
    InventoryService->>InventoryService: inventory.updateQuantity(quantity)
    InventoryService->>InventoryRepository: save(inventory)
    InventoryRepository->>Database: UPDATE inventory SET quantity = ?
    Database-->>InventoryRepository: Updated inventory
    InventoryRepository-->>InventoryService: Inventory
    InventoryService-->>Client: Inventory
```

### 3.8 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database

    Client->>ShoppingCartController: POST /api/carts/{userId}/items
    ShoppingCartController->>ShoppingCartService: addItemToCart(userId, cartItemDTO)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>ShoppingCartRepository: Cart data or empty
    ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart doesn't exist
        ShoppingCartService->>ShoppingCartService: Create new cart
        ShoppingCartService->>ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>Database: INSERT INTO shopping_carts
        Database-->>ShoppingCartRepository: Cart created
    end
    
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ShoppingCartService: Product
    
    ShoppingCartService->>CartItemRepository: findByCartIdAndProductId(cartId, productId)
    CartItemRepository->>Database: SELECT * FROM cart_items
    Database-->>CartItemRepository: CartItem or empty
    
    alt Item exists in cart
        ShoppingCartService->>ShoppingCartService: Update quantity
    else New item
        ShoppingCartService->>ShoppingCartService: Create new cart item
    end
    
    ShoppingCartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: INSERT/UPDATE cart_items
    Database-->>CartItemRepository: CartItem saved
    CartItemRepository-->>ShoppingCartService: CartItem
    
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK (CartDTO)
```

### 3.9 Remove Item from Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: DELETE /api/carts/{userId}/items/{itemId}
    ShoppingCartController->>ShoppingCartService: removeItemFromCart(userId, itemId)
    ShoppingCartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem data
    CartItemRepository-->>ShoppingCartService: CartItem
    
    ShoppingCartService->>ShoppingCartService: Validate item belongs to user's cart
    ShoppingCartService->>CartItemRepository: deleteById(itemId)
    CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: Deleted
    
    ShoppingCartService-->>ShoppingCartController: void
    ShoppingCartController-->>Client: 204 No Content
```

### 3.10 Update Cart Item Quantity Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: PUT /api/carts/{userId}/items/{itemId}
    ShoppingCartController->>ShoppingCartService: updateCartItem(userId, itemId, cartItemDTO)
    ShoppingCartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem data
    CartItemRepository-->>ShoppingCartService: CartItem
    
    ShoppingCartService->>ShoppingCartService: Validate and update quantity
    ShoppingCartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: UPDATE cart_items SET quantity = ?
    Database-->>CartItemRepository: Updated CartItem
    CartItemRepository-->>ShoppingCartService: CartItem
    
    ShoppingCartService-->>ShoppingCartController: CartItem
    ShoppingCartController-->>Client: 200 OK (CartItemDTO)
```

### 3.11 Get Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant Database

    Client->>ShoppingCartController: GET /api/carts/{userId}
    ShoppingCartController->>ShoppingCartService: getCartByUserId(userId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>ShoppingCartRepository: Cart with items
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    
    ShoppingCartService->>ShoppingCartService: calculateCartTotal()
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK (CartDTO)
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
| GET | `/api/products` | Get all products (paginated) | - | 200 OK |
| GET | `/api/products/search` | Search products | query param | 200 OK |

### Category Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/categories` | Create new category | CategoryDTO | 201 Created |
| GET | `/api/categories/{id}` | Get category by ID | - | 200 OK |
| PUT | `/api/categories/{id}` | Update category | CategoryDTO | 200 OK |
| DELETE | `/api/categories/{id}` | Delete category | - | 204 No Content |
| GET | `/api/categories` | Get all categories | - | 200 OK |

### Inventory Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| PUT | `/api/inventory/{productId}` | Update stock quantity | InventoryDTO | 200 OK |
| GET | `/api/inventory/{productId}` | Get inventory status | - | 200 OK |
| GET | `/api/inventory/{productId}/availability` | Check availability | - | 200 OK |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/carts/{userId}/items` | Add item to cart | CartItemDTO | 200 OK |
| DELETE | `/api/carts/{userId}/items/{itemId}` | Remove item from cart | - | 204 No Content |
| PUT | `/api/carts/{userId}/items/{itemId}` | Update cart item quantity | CartItemDTO | 200 OK |
| GET | `/api/carts/{userId}` | Get user's cart | - | 200 OK |
| DELETE | `/api/carts/{userId}` | Clear cart | - | 204 No Content |

---

## 5. Database Schema

### Products Table
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
```

### Categories Table
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_name ON categories(name);
```

### Inventory Table
```sql
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_reserved CHECK (reserved_quantity >= 0)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
```

### Shopping Carts Table
```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_carts_user ON shopping_carts(user_id);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_addition DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
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
    private String sku;
    private Long categoryId;
    private String categoryName;
    private Integer stockQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Validation annotations
    @NotNull(message = "Product name is required")
    @Size(min = 3, max = 255)
    private String name;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;
    
    @NotNull(message = "SKU is required")
    @Pattern(regexp = "^[A-Z0-9-]+$")
    private String sku;
}
```

### CategoryDTO
```java
public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private Integer productCount;
    private LocalDateTime createdAt;
    
    @NotNull(message = "Category name is required")
    @Size(min = 2, max = 100)
    private String name;
}
```

### InventoryDTO
```java
public class InventoryDTO {
    private Long id;
    private Long productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private LocalDateTime lastUpdated;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
}
```

### CartDTO
```java
public class CartDTO {
    private Long id;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal totalAmount;
    private Integer totalItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### CartItemDTO
```java
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal priceAtAddition;
    private BigDecimal subtotal;
    private LocalDateTime addedAt;
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
```

---

## 7. Design Patterns Used

### 7.1 Repository Pattern
- Abstracts data access logic
- Provides clean separation between business logic and data access
- Implemented via Spring Data JPA interfaces

### 7.2 Service Layer Pattern
- Encapsulates business logic
- Provides transaction management
- Coordinates between controllers and repositories

### 7.3 DTO Pattern
- Separates internal domain models from API contracts
- Provides data validation
- Reduces over-fetching and under-fetching

### 7.4 Controller Pattern
- Handles HTTP requests/responses
- Delegates business logic to service layer
- Manages request validation and error handling

### 7.5 Aggregate Pattern
- ShoppingCart acts as an aggregate root managing CartItems
- Ensures consistency of cart operations
- Encapsulates cart business rules and invariants
- Controls access to cart items through the cart entity

---

## 8. Key Features

### 8.1 Product Management
- Full CRUD operations for products
- SKU-based unique identification
- Category association
- Automatic timestamp management
- Soft delete capability (can be implemented)

### 8.2 Category Management
- Hierarchical category structure support
- Product count tracking
- Cascade delete prevention for categories with products

### 8.3 Inventory Tracking
- Real-time stock quantity management
- Reserved quantity for pending orders
- Available quantity calculation
- Low stock alerts (can be implemented)

### 8.4 Search and Filter
- Product name search
- Category-based filtering
- Price range filtering (can be implemented)
- Pagination support

### 8.5 Shopping Cart Management
- User-specific cart management
- Add/remove/update cart items
- Automatic cart creation on first item addition
- Price preservation at time of addition
- Real-time cart total calculation
- Duplicate product prevention in cart
- Quantity validation
- Cart persistence across sessions

---

## 9. Error Handling

### Exception Hierarchy
```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(Long id) {
        super("Category not found with id: " + id);
    }
}

public class CategoryExistsException extends RuntimeException {
    public CategoryExistsException(String name) {
        super("Category already exists with name: " + name);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(Long productId) {
        super("Insufficient stock for product: " + productId);
    }
}

public class InvalidProductDataException extends RuntimeException {
    public InvalidProductDataException(String message) {
        super(message);
    }
}
```

### Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.toList());
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            errors,
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 10. Security Considerations

### 10.1 Input Validation
- All DTOs use Bean Validation annotations
- SQL injection prevention via parameterized queries (JPA)
- XSS prevention through input sanitization

### 10.2 Authentication & Authorization
- JWT-based authentication (to be implemented)
- Role-based access control (ADMIN, USER)
- Endpoint security configuration

### 10.3 Data Protection
- Sensitive data encryption
- HTTPS enforcement
- CORS configuration

---

## 11. Performance Optimization

### 11.1 Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling (HikariCP)
- Query optimization
- Lazy loading for relationships

### 11.2 Caching Strategy
- Redis cache for frequently accessed products
- Category cache
- Cache invalidation on updates

### 11.3 Pagination
- Implemented for product listing
- Configurable page size
- Prevents memory issues with large datasets

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Service layer tests with mocked repositories
- Repository tests with H2 in-memory database
- DTO validation tests

### 12.2 Integration Tests
- Controller tests with MockMvc
- End-to-end API tests
- Database integration tests

### 12.3 Test Coverage Goals
- Minimum 80% code coverage
- Critical path coverage: 100%

---

## 13. Deployment Architecture

### 13.1 Environment Configuration
- Development: Local PostgreSQL
- Staging: Cloud-hosted PostgreSQL
- Production: Managed database service

### 13.2 CI/CD Pipeline
- Automated builds on commit
- Automated testing
- Docker containerization
- Kubernetes deployment

---

## 14. Monitoring and Logging

### 14.1 Logging
- SLF4J with Logback
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/Response logging

### 14.2 Monitoring
- Spring Boot Actuator endpoints
- Prometheus metrics
- Grafana dashboards
- Application health checks

---

## 15. Future Enhancements

1. **Product Reviews and Ratings**
   - User review system
   - Rating aggregation
   - Review moderation

2. **Advanced Search**
   - Elasticsearch integration
   - Faceted search
   - Auto-complete suggestions

3. **Recommendation Engine**
   - Collaborative filtering
   - Content-based recommendations
   - Personalized product suggestions

4. **Multi-language Support**
   - Internationalization (i18n)
   - Localized product descriptions
   - Currency conversion

5. **Image Management**
   - Product image upload
   - Image optimization
   - CDN integration

6. **Order Management Integration**
   - Cart to order conversion
   - Order history
   - Payment processing

---

## 16. Appendix

### 16.1 Glossary
- **SKU**: Stock Keeping Unit - Unique product identifier
- **DTO**: Data Transfer Object - Object for data transfer between layers
- **JPA**: Java Persistence API - ORM specification
- **CRUD**: Create, Read, Update, Delete operations

### 16.2 References
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- Spring Data JPA: https://spring.io/projects/spring-data-jpa
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- RESTful API Design Best Practices

### 16.3 Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-15 | Development Team | Initial LLD document |
| 1.1 | 2024-01-20 | Development Team | Added error handling section |
| 1.2 | 2024-01-25 | Development Team | Added shopping cart management |

---

**Document Status**: Approved  
**Last Updated**: 2024-01-25  
**Next Review Date**: 2024-02-25