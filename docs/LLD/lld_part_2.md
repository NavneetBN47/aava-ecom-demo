## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.2 Carts Table

```sql
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_carts_user_id UNIQUE (user_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
```

### 5.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_addition DECIMAL(10, 2) NOT NULL CHECK (price_at_addition >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uk_cart_items_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 6. Technology Stack Details

### 6.1 Backend Technologies
- **Spring Boot 3.x**: Main application framework
- **Spring Web**: RESTful API development
- **Spring Data JPA**: Database abstraction layer
- **Hibernate**: ORM implementation
- **PostgreSQL Driver**: Database connectivity

### 6.2 Java 21 Features Used
- Records for DTOs
- Pattern matching
- Text blocks for SQL queries
- Enhanced switch expressions
- Virtual threads (if applicable)

### 6.3 Database
- **PostgreSQL 15+**: Primary database
- **Connection Pooling**: HikariCP (default in Spring Boot)
- **Migration Tool**: Flyway or Liquibase (recommended)

---

## 7. Design Patterns

### 7.1 Layered Architecture
- **Controller Layer**: Handles HTTP requests/responses
- **Service Layer**: Contains business logic
- **Repository Layer**: Data access abstraction
- **Entity Layer**: Domain models

### 7.2 Repository Pattern
- Spring Data JPA repositories provide abstraction over data access
- Custom query methods using method naming conventions
- `@Query` annotations for complex queries

### 7.3 DTO Pattern
- Separate DTOs for request/response
- Prevents exposure of internal entity structure
- Enables validation at API boundary

### 7.4 Dependency Injection
- Constructor-based injection (recommended)
- Loose coupling between components
- Easier testing with mocks

---

## 8. Key Features

### 8.1 Product Management
- Full CRUD operations for products
- Stock quantity tracking
- Category-based organization
- Price validation
- Timestamp tracking (created/updated)

### 8.2 Shopping Cart Management
- Add products to cart
- Update item quantities
- Remove items from cart
- View cart contents
- Automatic total calculation
- Price snapshot at addition time

### 8.3 Data Validation
- Input validation using Bean Validation (JSR-380)
- Business rule validation in service layer
- Database constraints for data integrity

### 8.4 Error Handling
- Custom exception classes
- Global exception handler using `@ControllerAdvice`
- Standardized error response format

---

## 9. Business Logic

### 9.1 Cart Total Calculation

The cart total is calculated by summing all cart item subtotals:

```java
public BigDecimal calculateCartTotal(Cart cart) {
    return cart.getItems().stream()
        .map(CartItem::getSubtotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

**Rules:**
1. Each cart item subtotal = quantity × price_at_addition
2. Cart total = sum of all item subtotals
3. Prices are stored with 2 decimal precision
4. All calculations use `BigDecimal` for precision

### 9.2 Cart Item Subtotal Calculation

```java
public BigDecimal calculateSubtotal(Integer quantity, BigDecimal priceAtAddition) {
    return priceAtAddition.multiply(BigDecimal.valueOf(quantity));
}
```

### 9.3 Product Availability Validation

Before adding items to cart or updating quantities:

```java
public boolean validateProductAvailability(Long productId, Integer requestedQuantity) {
    Product product = getProductById(productId);
    return product.getStockQuantity() >= requestedQuantity;
}
```

**Rules:**
1. Product must exist
2. Requested quantity must not exceed stock quantity
3. Stock quantity must be non-negative

---

## 10. Validation Rules

### 10.1 Product Validation

**ProductDTO Validation:**
```java
public record ProductDTO(
    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255, message = "Name must be between 3 and 255 characters")
    String name,
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 integer digits and 2 decimal places")
    BigDecimal price,
    
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    Integer stockQuantity,
    
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    String category
) {}
```

### 10.2 Cart Validation

**AddToCartRequest Validation:**
```java
public record AddToCartRequest(
    @NotNull(message = "User ID is required")
    @Positive(message = "User ID must be positive")
    Long userId,
    
    @NotNull(message = "Product ID is required")
    @Positive(message = "Product ID must be positive")
    Long productId,
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100 per transaction")
    Integer quantity
) {}
```

**UpdateQuantityRequest Validation:**
```java
public record UpdateQuantityRequest(
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100")
    Integer quantity
) {}
```

---

## 11. Error Handling

### 11.1 Custom Exceptions

```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}

public class CartNotFoundException extends RuntimeException {
    public CartNotFoundException(Long userId) {
        super("Cart not found for user id: " + userId);
    }
}

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long id) {
        super("Cart item not found with id: " + id);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(Long productId, Integer requested, Integer available) {
        super(String.format("Insufficient stock for product %d. Requested: %d, Available: %d", 
            productId, requested, available));
    }
}

public class InvalidQuantityException extends RuntimeException {
    public InvalidQuantityException(String message) {
        super(message);
    }
}
```

### 11.2 Global Exception Handler

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

    @ExceptionHandler(CartNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartNotFound(CartNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            LocalDateTime.now(),
            errors
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

### 11.3 Error Response Format

```java
public record ErrorResponse(
    int status,
    String message,
    LocalDateTime timestamp,
    Map<String, String> validationErrors
) {
    public ErrorResponse(int status, String message, LocalDateTime timestamp) {
        this(status, message, timestamp, null);
    }
}
```

---
