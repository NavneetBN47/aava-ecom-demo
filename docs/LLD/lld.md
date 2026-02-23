# Low-Level Design Document: E-commerce Product Management System

## 1. Project Overview

### 1.1 Purpose
This document provides a detailed low-level design for an E-commerce Product Management System. The system enables users to browse products, manage shopping carts, and perform CRUD operations on products.

### 1.2 Scope
The system includes:
- Product catalog management
- Shopping cart functionality
- Category-based product organization
- Product search capabilities
- RESTful API endpoints

### 1.3 Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA/Hibernate
- **API Documentation**: OpenAPI/Swagger
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito

---

## 2. System Architecture

### 2.1 Layered Architecture
The system follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│     Presentation Layer (REST)       │
├─────────────────────────────────────┤
│       Service Layer (Business)      │
├─────────────────────────────────────┤
│    Repository Layer (Data Access)   │
├─────────────────────────────────────┤
│         Database (PostgreSQL)       │
└─────────────────────────────────────┘
```

### 2.2 Class Diagram

```mermaid
classDiagram
    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -Integer stockQuantity
        -Integer maxOrderQuantity
        -String category
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long) void
        +getName() String
        +setName(String) void
        +getDescription() String
        +setDescription(String) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer) void
        +getMaxOrderQuantity() Integer
        +setMaxOrderQuantity(Integer) void
        +getCategory() String
        +setCategory(String) void
    }

    class CartItem {
        -Long id
        -Long productId
        -String productName
        -BigDecimal price
        -Integer quantity
        -BigDecimal subtotal
        -LocalDateTime addedAt
        +getId() Long
        +setId(Long) void
        +getProductId() Long
        +setProductId(Long) void
        +getProductName() String
        +setProductName(String) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal) void
        +getQuantity() Integer
        +setQuantity(Integer) void
        +getAddedAt() LocalDateTime
        +setAddedAt(LocalDateTime) void
        +calculateSubtotal() void
    }

    class ShoppingCart {
        -Long id
        -List~CartItem~ items
        -BigDecimal totalAmount
        +getId() Long
        +setId(Long) void
        +getItems() List~CartItem~
        +addItem(CartItem) void
        +removeItem(Long) void
        +updateItemQuantity(Long, Integer) void
        +calculateTotal() void
        +clear() void
    }

    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity
        +getProductById(Long) ResponseEntity
        +createProduct(Product) ResponseEntity
        +updateProduct(Long, Product) ResponseEntity
        +deleteProduct(Long) ResponseEntity
        +getProductsByCategory(String) ResponseEntity
        +searchProducts(String) ResponseEntity
    }

    class CartController {
        -CartService cartService
        +addToCart(Long, Integer) ResponseEntity
        +getCart() ResponseEntity
        +updateCartItem(Long, Integer) ResponseEntity
        +removeFromCart(Long) ResponseEntity
        +clearCart() ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long) Product
        +createProduct(Product) Product
        +updateProduct(Long, Product) Product
        +deleteProduct(Long) void
        +getProductsByCategory(String) List~Product~
        +searchProducts(String) List~Product~
        +checkStock(Long, Integer) boolean
        +validateOrderQuantity(Long, Integer) boolean
    }

    class CartService {
        -ShoppingCart cart
        -ProductService productService
        +addProductToCart(Long, Integer) CartItem
        +getCart() ShoppingCart
        +updateCartItemQuantity(Long, Integer) void
        +removeCartItem(Long) void
        +clearCart() void
        +calculateCartTotal() BigDecimal
        +validateStockAvailability(Long, Integer) boolean
        +validatePriceConsistency(Long, BigDecimal) boolean
        +enforceQuantityLimits(Long, Integer) boolean
    }

    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findById(Long) Optional~Product~
        +save(Product) Product
        +deleteById(Long) void
        +findByCategory(String) List~Product~
        +searchByNameOrDescription(String) List~Product~
    }

    ProductController --> ProductService
    CartController --> CartService
    ProductService --> ProductRepository
    CartService --> ProductService
    CartService --> ShoppingCart
    ShoppingCart "1" *-- "*" CartItem
    ProductRepository ..> Product
```

### 2.3 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCT {
        BIGINT id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        INTEGER stock_quantity
        INTEGER max_order_quantity
        VARCHAR category
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CART_ITEM {
        BIGINT id PK
        BIGINT product_id FK
        VARCHAR product_name
        DECIMAL price
        INTEGER quantity
        DECIMAL subtotal
        TIMESTAMP added_at
    }

    SHOPPING_CART {
        BIGINT id PK
        DECIMAL total_amount
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SHOPPING_CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : references
```

---

## 3. Detailed Component Design

### 3.1 Product Management

#### 3.1.1 Get All Products

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
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK + Product List
```

**Implementation Details:**
- **Endpoint**: `GET /api/products`
- **Response**: List of all products with pagination support
- **Error Handling**: Returns empty list if no products exist

#### 3.1.2 Get Product By ID

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
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK + Product
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `GET /api/products/{id}`
- **Path Variable**: `id` (Long)
- **Success Response**: 200 OK with product details
- **Error Response**: 404 Not Found if product doesn't exist

#### 3.1.3 Create Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: POST /api/products + Product Data
    ProductController->>ProductController: Validate Request Body
    
    alt Validation Successful
        ProductController->>ProductService: createProduct(product)
        ProductService->>ProductService: Set createdAt, updatedAt
        ProductService->>ProductRepository: save(product)
        ProductRepository->>Database: INSERT INTO products
        Database-->>ProductRepository: Generated ID
        ProductRepository-->>ProductService: Saved Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 201 Created + Product
    else Validation Failed
        ProductController-->>Client: 400 Bad Request + Errors
    end
```

**Implementation Details:**
- **Endpoint**: `POST /api/products`
- **Request Body**: Product JSON
- **Validations**:
  - Name: Required, max 255 characters
  - Price: Required, positive value
  - Stock Quantity: Required, non-negative
  - Max Order Quantity: Optional, positive value
  - Category: Required
- **Success Response**: 201 Created with product details
- **Error Response**: 400 Bad Request for validation errors

#### 3.1.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id} + Product Data
    ProductController->>ProductController: Validate Request Body
    ProductController->>ProductService: updateProduct(id, product)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductService: Update fields, set updatedAt
        ProductService->>ProductRepository: save(updatedProduct)
        ProductRepository->>Database: UPDATE products SET ...
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: Updated Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK + Product
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `PUT /api/products/{id}`
- **Path Variable**: `id` (Long)
- **Request Body**: Product JSON
- **Update Strategy**: Partial update (only provided fields)
- **Success Response**: 200 OK with updated product
- **Error Responses**:
  - 404 Not Found if product doesn't exist
  - 400 Bad Request for validation errors

#### 3.1.5 Delete Product

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
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `DELETE /api/products/{id}`
- **Path Variable**: `id` (Long)
- **Success Response**: 204 No Content
- **Error Response**: 404 Not Found if product doesn't exist

#### 3.1.6 Get Products By Category

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
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK + Product List
```

**Implementation Details:**
- **Endpoint**: `GET /api/products/category/{category}`
- **Path Variable**: `category` (String)
- **Response**: List of products in the specified category
- **Error Handling**: Returns empty list if no products in category

#### 3.1.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>ProductService: searchProducts(keyword)
    ProductService->>ProductRepository: searchByNameOrDescription(keyword)
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE ? OR description LIKE ?
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK + Product List
```

**Implementation Details:**
- **Endpoint**: `GET /api/products/search`
- **Query Parameter**: `keyword` (String)
- **Search Fields**: Product name and description
- **Search Type**: Case-insensitive partial match
- **Response**: List of matching products

### 3.2 Shopping Cart Management

#### 3.2.1 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant ShoppingCart

    Client->>CartController: POST /api/cart/items + {productId, quantity}
    CartController->>CartService: addProductToCart(productId, quantity)
    CartService->>ProductService: getProductById(productId)
    
    alt Product Exists
        ProductService-->>CartService: Product
        CartService->>CartService: validateStockAvailability(productId, quantity)
        CartService->>CartService: enforceQuantityLimits(productId, quantity)
        CartService->>CartService: validatePriceConsistency(productId, price)
        
        alt All Validations Pass
            CartService->>ShoppingCart: addItem(cartItem)
            ShoppingCart->>ShoppingCart: calculateSubtotal()
            ShoppingCart->>ShoppingCart: calculateTotal()
            ShoppingCart-->>CartService: Updated Cart
            CartService-->>CartController: CartItem
            CartController-->>Client: 201 Created + CartItem
        else Validation Failed
            CartService-->>CartController: throw ValidationException
            CartController-->>Client: 400 Bad Request
        end
    else Product Not Found
        ProductService-->>CartService: throw ProductNotFoundException
        CartService-->>CartController: Exception
        CartController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `POST /api/cart/items`
- **Request Body**: `{productId: Long, quantity: Integer}`
- **Validations**:
  - Product must exist
  - Quantity must be positive
  - Sufficient stock must be available
  - Quantity must not exceed max_order_quantity
  - Price consistency check
- **Success Response**: 201 Created with cart item details
- **Error Responses**:
  - 404 Not Found if product doesn't exist
  - 400 Bad Request if validation fails

#### 3.2.2 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ShoppingCart

    Client->>CartController: GET /api/cart
    CartController->>CartService: getCart()
    CartService->>ShoppingCart: getItems()
    ShoppingCart-->>CartService: List<CartItem>
    CartService->>ShoppingCart: getTotalAmount()
    ShoppingCart-->>CartService: BigDecimal
    CartService-->>CartController: ShoppingCart
    CartController-->>Client: 200 OK + Cart Details
```

**Implementation Details:**
- **Endpoint**: `GET /api/cart`
- **Response**: Complete cart with items and total amount
- **Cart Details Include**:
  - List of cart items
  - Individual item subtotals
  - Total cart amount

#### 3.2.3 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant ShoppingCart

    Client->>CartController: PUT /api/cart/items/{itemId} + {quantity}
    CartController->>CartService: updateCartItemQuantity(itemId, quantity)
    CartService->>ShoppingCart: findItem(itemId)
    
    alt Item Exists
        ShoppingCart-->>CartService: CartItem
        CartService->>ProductService: checkStock(productId, quantity)
        
        alt Stock Available
            ProductService-->>CartService: true
            CartService->>ShoppingCart: updateItemQuantity(itemId, quantity)
            ShoppingCart->>ShoppingCart: calculateSubtotal()
            ShoppingCart->>ShoppingCart: calculateTotal()
            ShoppingCart-->>CartService: Updated Cart
            CartService-->>CartController: void
            CartController-->>Client: 200 OK
        else Insufficient Stock
            ProductService-->>CartService: false
            CartService-->>CartController: throw InsufficientStockException
            CartController-->>Client: 400 Bad Request
        end
    else Item Not Found
        ShoppingCart-->>CartService: null
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `PUT /api/cart/items/{itemId}`
- **Path Variable**: `itemId` (Long)
- **Request Body**: `{quantity: Integer}`
- **Validations**:
  - Cart item must exist
  - Quantity must be positive
  - Sufficient stock must be available
- **Success Response**: 200 OK
- **Error Responses**:
  - 404 Not Found if cart item doesn't exist
  - 400 Bad Request if insufficient stock

#### 3.2.4 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ShoppingCart

    Client->>CartController: DELETE /api/cart/items/{itemId}
    CartController->>CartService: removeCartItem(itemId)
    CartService->>ShoppingCart: findItem(itemId)
    
    alt Item Exists
        ShoppingCart-->>CartService: CartItem
        CartService->>ShoppingCart: removeItem(itemId)
        ShoppingCart->>ShoppingCart: calculateTotal()
        ShoppingCart-->>CartService: Updated Cart
        CartService-->>CartController: void
        CartController-->>Client: 204 No Content
    else Item Not Found
        ShoppingCart-->>CartService: null
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

**Implementation Details:**
- **Endpoint**: `DELETE /api/cart/items/{itemId}`
- **Path Variable**: `itemId` (Long)
- **Success Response**: 204 No Content
- **Error Response**: 404 Not Found if cart item doesn't exist

---

## 4. API Endpoints Summary

### 4.1 Product Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | - | 200 OK + List<Product> |
| GET | `/api/products/{id}` | Get product by ID | - | 200 OK + Product |
| POST | `/api/products` | Create new product | Product | 201 Created + Product |
| PUT | `/api/products/{id}` | Update product | Product | 200 OK + Product |
| DELETE | `/api/products/{id}` | Delete product | - | 204 No Content |
| GET | `/api/products/category/{category}` | Get products by category | - | 200 OK + List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products | - | 200 OK + List<Product> |

### 4.2 Cart Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart | {productId, quantity} | 201 Created + CartItem |
| GET | `/api/cart` | View shopping cart | - | 200 OK + ShoppingCart |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | {quantity} | 200 OK |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | - | 204 No Content |
| DELETE | `/api/cart` | Clear cart | - | 204 No Content |

---

## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    max_order_quantity INTEGER DEFAULT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_stock ON products(stock_quantity);
```

### 5.2 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

### 5.3 Shopping Cart Table

```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Presentation Layer Components

### 6.1 Shopping Cart UI Component

#### 6.1.1 Cart Component Architecture

```mermaid
flowchart TD
    A[Cart Component] --> B[Item List Display]
    A --> C[Quantity Selector]
    A --> D[Remove Button]
    A --> E[Total Display]
    A --> F[Checkout Button]
    
    B --> G[Product Image]
    B --> H[Product Name]
    B --> I[Unit Price]
    B --> J[Subtotal]
    
    C --> K[Increment Button]
    C --> L[Decrement Button]
    C --> M[Quantity Input]
    
    E --> N[Subtotal Calculation]
    E --> O[Tax Calculation]
    E --> P[Grand Total]
    
    F --> Q[Validate Cart]
    F --> R[Navigate to Checkout]
```

#### 6.1.2 Cart Component Features

**Core Features:**
- **Item List Display**: Shows all items currently in the shopping cart
  - Product image thumbnail
  - Product name and description
  - Unit price
  - Quantity selector
  - Subtotal per item
  - Remove button for each item

- **Quantity Selector**: Interactive controls for adjusting item quantities
  - Increment button (+)
  - Decrement button (-)
  - Direct quantity input field
  - Real-time validation against stock availability
  - Enforcement of max_order_quantity limits

- **Remove Button**: Allows users to remove items from cart
  - Confirmation dialog for accidental removals
  - Immediate cart total recalculation
  - Smooth animation for item removal

- **Total Display**: Shows comprehensive pricing breakdown
  - Subtotal of all items
  - Tax calculation (if applicable)
  - Shipping costs (if applicable)
  - Grand total amount
  - Currency formatting

- **Checkout Button**: Initiates the checkout process
  - Validates cart contents
  - Checks stock availability
  - Navigates to checkout page
  - Disabled state when cart is empty

**Responsive Design:**
- Mobile-first approach
- Adaptive layout for tablets and desktops
- Touch-friendly controls
- Optimized for various screen sizes
- Accessible keyboard navigation

#### 6.1.3 Cart Component State Management

```mermaid
sequenceDiagram
    participant User
    participant CartUI
    participant StateManager
    participant CartAPI
    participant Backend

    User->>CartUI: Add Item to Cart
    CartUI->>StateManager: Update Local State
    StateManager->>CartAPI: POST /api/cart/items
    CartAPI->>Backend: Add Item Request
    Backend-->>CartAPI: Item Added Response
    CartAPI-->>StateManager: Update State with Response
    StateManager-->>CartUI: Render Updated Cart
    CartUI-->>User: Display Updated Cart
```

**State Management Features:**
- Local state synchronization with backend
- Optimistic UI updates
- Error handling and rollback
- Loading states for async operations
- Real-time cart total calculation

---

## 7. Session Management and Authentication

### 7.1 Cart Persistence Strategy

#### 7.1.1 Session-Based Cart Management

```mermaid
flowchart TD
    A[User Session] --> B{Authenticated?}
    B -->|Yes| C[User-Specific Cart]
    B -->|No| D[Guest Cart]
    
    C --> E[Store in Database]
    C --> F[Link to User ID]
    C --> G[Persist Across Sessions]
    
    D --> H[Store in Session]
    D --> I[Temporary Storage]
    D --> J[Convert on Login]
    
    J --> K[Merge with User Cart]
    K --> L[Resolve Conflicts]
    L --> M[Update Database]
```

#### 7.1.2 Cart Persistence Implementation

**Authenticated Users:**
- Cart data stored in database
- Linked to user account via user_id
- Persists across multiple sessions
- Accessible from any device
- Automatic synchronization

**Guest Users:**
- Cart data stored in HTTP session
- Temporary storage (session lifetime)
- Browser-specific
- Converted to persistent cart on login
- Support for guest checkout

#### 7.1.3 Guest Cart to User Cart Migration

```mermaid
sequenceDiagram
    participant Guest
    participant Frontend
    participant AuthService
    participant CartService
    participant Database

    Guest->>Frontend: Add Items to Guest Cart
    Frontend->>Frontend: Store in Session
    Guest->>Frontend: Login/Register
    Frontend->>AuthService: Authenticate User
    AuthService-->>Frontend: Authentication Success
    Frontend->>CartService: Merge Guest Cart with User Cart
    CartService->>Database: Fetch User's Existing Cart
    Database-->>CartService: User Cart Data
    CartService->>CartService: Merge Items (Handle Duplicates)
    CartService->>Database: Update User Cart
    Database-->>CartService: Success
    CartService-->>Frontend: Merged Cart
    Frontend->>Frontend: Clear Session Cart
    Frontend-->>Guest: Display Merged Cart
```

**Migration Rules:**
1. Fetch existing user cart from database
2. Merge guest cart items with user cart
3. Handle duplicate products:
   - Sum quantities if same product exists
   - Validate against stock availability
   - Respect max_order_quantity limits
4. Update cart totals
5. Persist merged cart to database
6. Clear session-based guest cart

### 7.2 Authentication Integration

#### 7.2.1 Cart API Authentication Requirements

**Endpoint Authentication Matrix:**

| Endpoint | Authentication Required | Guest Access |
|----------|------------------------|-------------|
| POST /api/cart/items | Optional | Yes (Session) |
| GET /api/cart | Optional | Yes (Session) |
| PUT /api/cart/items/{itemId} | Optional | Yes (Session) |
| DELETE /api/cart/items/{itemId} | Optional | Yes (Session) |
| DELETE /api/cart | Optional | Yes (Session) |

**Authentication Flow:**
- JWT token validation for authenticated users
- Session ID validation for guest users
- Automatic cart migration on authentication
- Secure cart data isolation

#### 7.2.2 Session Security

**Security Measures:**
- Secure session cookie configuration
- HTTPS enforcement
- Session timeout management
- CSRF protection
- XSS prevention
- Cart data encryption in transit

**Session Configuration:**
```yaml
server:
  servlet:
    session:
      timeout: 30m
      cookie:
        secure: true
        http-only: true
        same-site: strict
```

---

## 8. Error Handling

### 8.1 Exception Hierarchy

```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String productName, int requested, int available) {
        super(String.format("Insufficient stock for %s. Requested: %d, Available: %d", 
            productName, requested, available));
    }
}

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long id) {
        super("Cart item not found with id: " + id);
    }
}

public class QuantityLimitExceededException extends RuntimeException {
    public QuantityLimitExceededException(String productName, int requested, int maxAllowed) {
        super(String.format("Quantity limit exceeded for %s. Requested: %d, Maximum allowed: %d",
            productName, requested, maxAllowed));
    }
}

public class PriceValidationException extends RuntimeException {
    public PriceValidationException(String message) {
        super(message);
    }
}
```

### 8.2 Global Exception Handler

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
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(QuantityLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleQuantityLimitExceeded(QuantityLimitExceededException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(PriceValidationException.class)
    public ResponseEntity<ErrorResponse> handlePriceValidation(PriceValidationException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
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
            "Validation failed: " + String.join(", ", errors),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
}
```

---

## 9. Design Patterns Used

### 9.1 Repository Pattern
- Abstracts data access logic
- Provides clean separation between business logic and data access
- Implemented via Spring Data JPA

### 9.2 Service Layer Pattern
- Encapsulates business logic
- Provides transaction management
- Coordinates between controllers and repositories

### 9.3 DTO Pattern
- Separates internal domain models from API contracts
- Provides data validation
- Reduces over-fetching/under-fetching

### 9.4 Singleton Pattern
- Shopping cart instance (session-scoped)
- Service beans (application-scoped)

---

## 10. Security Considerations

### 10.1 Input Validation
- All user inputs validated using Bean Validation (JSR-380)
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

### 10.2 Data Validation Rules

**Product:**
- Name: Required, 1-255 characters
- Description: Optional, max 2000 characters
- Price: Required, positive, max 2 decimal places
- Stock Quantity: Required, non-negative integer
- Max Order Quantity: Optional, positive integer
- Category: Required, 1-100 characters

**Cart Item:**
- Product ID: Required, must exist
- Quantity: Required, positive integer, max 999
- Must not exceed max_order_quantity if set
- Must not exceed available stock

---

## 11. Performance Considerations

### 11.1 Database Optimization
- Indexes on frequently queried columns (category, name, product_id)
- Connection pooling via HikariCP
- Lazy loading for relationships
- Query optimization via JPA criteria

### 11.2 Caching Strategy
- Product catalog caching (Redis/Caffeine)
- Cache invalidation on product updates
- Session-based cart storage

### 11.3 Pagination
- Implement pagination for product listings
- Default page size: 20 items
- Maximum page size: 100 items

---

## 12. Testing Strategy

### 12.1 Unit Tests

#### 12.1.1 Cart Service Tests

**Test Coverage:**
- `testAddProductToCart_Success`
- `testAddProductToCart_ProductNotFound`
- `testAddProductToCart_InsufficientStock`
- `testAddProductToCart_QuantityLimitExceeded`
- `testUpdateCartItemQuantity_Success`
- `testUpdateCartItemQuantity_ItemNotFound`
- `testRemoveCartItem_Success`
- `testClearCart_Success`
- `testCalculateCartTotal_MultipleItems`
- `testValidateStockAvailability_Success`
- `testValidateStockAvailability_Failure`
- `testEnforceQuantityLimits_WithinLimit`
- `testEnforceQuantityLimits_ExceedsLimit`
- `testValidatePriceConsistency_Success`
- `testValidatePriceConsistency_PriceMismatch`

#### 12.1.2 Cart API Tests

**Test Coverage:**
- `testAddToCart_ValidRequest_Returns201`
- `testAddToCart_InvalidProductId_Returns404`
- `testAddToCart_InsufficientStock_Returns400`
- `testGetCart_ReturnsCartDetails_Returns200`
- `testUpdateCartItem_ValidRequest_Returns200`
- `testUpdateCartItem_InvalidItemId_Returns404`
- `testRemoveFromCart_ValidRequest_Returns204`
- `testRemoveFromCart_InvalidItemId_Returns404`
- `testClearCart_Returns204`

#### 12.1.3 Product Service Tests

**Test Coverage:**
- Service layer business logic
- Repository custom queries
- Utility methods
- Stock validation logic
- Quantity limit enforcement

### 12.2 Integration Tests

#### 12.2.1 Cart Checkout Flow Integration Test

**Test Scenario:**
1. Create test products
2. Add multiple products to cart
3. Update quantities
4. Validate cart totals
5. Remove items
6. Clear cart
7. Verify database state

**Test Coverage:**
- End-to-end cart workflow
- Database transaction integrity
- API endpoint integration
- Session management
- Guest to user cart migration

### 12.3 Test Data
- Use H2 in-memory database for tests
- Test data builders for object creation
- Mockito for mocking dependencies

### 12.4 Coverage Target
- Overall coverage target: **85%**
- Critical path coverage: **95%**
- Service layer coverage: **90%**
- Controller layer coverage: **85%**
- Repository layer coverage: **80%**

---

## 13. Deployment Considerations

### 13.1 Environment Configuration
- Development: H2 database, debug logging
- Staging: PostgreSQL, info logging
- Production: PostgreSQL with replication, error logging

### 13.2 Configuration Properties

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  session:
    store-type: redis
    redis:
      namespace: ecommerce:session
  
server:
  port: 8080
  servlet:
    session:
      timeout: 30m
      cookie:
        secure: true
        http-only: true
        same-site: strict
  
logging:
  level:
    root: INFO
    com.ecommerce: DEBUG
```

---

## 14. Future Enhancements

1. **User Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - User-specific carts

2. **Order Management**
   - Checkout process
   - Order history
   - Payment integration

3. **Advanced Features**
   - Product reviews and ratings
   - Wishlist functionality
   - Product recommendations
   - Inventory management
   - Multi-currency support

4. **Performance Improvements**
   - Redis caching
   - CDN for product images
   - Database read replicas
   - Elasticsearch for product search

---

## 15. Appendix

### 15.1 Sample Request/Response

**Create Product Request:**
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "maxOrderQuantity": 5,
  "category": "Electronics"
}
```

**Create Product Response:**
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "maxOrderQuantity": 5,
  "category": "Electronics",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**Add to Cart Request:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Cart Response:**
```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Laptop",
      "price": 999.99,
      "quantity": 2,
      "subtotal": 1999.98,
      "addedAt": "2024-01-15T10:35:00"
    }
  ],
  "totalAmount": 1999.98
}
```

### 15.2 Key Features Summary

1. **Product Management**
   - Complete CRUD operations
   - Category-based filtering
   - Search functionality
   - Stock management
   - Order quantity limits

2. **Shopping Cart**
   - Add/remove items
   - Update quantities
   - Real-time total calculation
   - Stock validation
   - Quantity limit enforcement
   - Price consistency validation
   - Guest cart support
   - Cart persistence for authenticated users

3. **Data Integrity**
   - Foreign key constraints
   - Transaction management
   - Optimistic locking

4. **API Design**
   - RESTful principles
   - Consistent error handling
   - Comprehensive validation
   - Clear documentation

5. **UI Components**
   - Responsive cart interface
   - Interactive quantity controls
   - Real-time updates
   - Accessible design

6. **Session Management**
   - Guest cart support
   - User cart persistence
   - Automatic cart migration
   - Secure session handling

---

**Document Version**: 2.0  
**Last Updated**: 2024-01-15  
**Author**: Development Team  
**Status**: Approved