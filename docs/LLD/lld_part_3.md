## 8. Error Handling

### 8.1 Empty Cart Handling (AC-5)

Implemented in `ShoppingCartController.getCart()`:

**Scenario 1: Cart exists but has no items**
```json
{
  "cartId": 123,
  "customerId": 456,
  "items": [],
  "total": 0.00,
  "message": "Your cart is empty",
  "redirectToCatalog": true
}
```

**Scenario 2: Cart does not exist for customer**
```json
{
  "cartId": null,
  "customerId": 456,
  "items": [],
  "total": 0.00,
  "message": "Your cart is empty",
  "redirectToCatalog": true
}
```

HTTP Status: 200 OK (not an error, just empty state)

### 8.2 Inventory Validation Exception (AC-6)

**Exception Class:**
```java
public class InventoryValidationException extends RuntimeException {
    public InventoryValidationException(String message) {
        super(message);
    }
}
```

**Global Exception Handler:**
```java
@ExceptionHandler(InventoryValidationException.class)
public ResponseEntity<ErrorResponse> handleInventoryValidationException(
    InventoryValidationException ex) {
    
    ErrorResponse error = new ErrorResponse(
        "INVENTORY_INSUFFICIENT",
        ex.getMessage(),
        LocalDateTime.now()
    );
    
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

**Error Response Format:**
```json
{
  "errorCode": "INVENTORY_INSUFFICIENT",
  "message": "Requested quantity (50) exceeds available stock (30)",
  "timestamp": "2024-01-15T10:30:00"
}
```

HTTP Status: 400 Bad Request

### 8.3 Other Exception Handling

**ProductNotFoundException:**
- Thrown when product ID not found
- HTTP Status: 404 Not Found

**CartItemNotFoundException:**
- Thrown when cart item ID not found
- HTTP Status: 404 Not Found

**ValidationException:**
- Thrown for invalid input data (e.g., negative quantity, null required fields)
- HTTP Status: 400 Bad Request

## 9. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 10. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository, ShoppingCartRepository, and CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors
6. **Service Layer Pattern:** Business logic encapsulation in service classes

## 11. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- **Shopping cart management** with add, view, update, and remove operations
- **Real-time cart calculations** with instant subtotal and total updates without page refresh
- **Inventory validation** to prevent overselling and ensure stock availability
- **Minimum procurement threshold handling** for automatic quantity setting
- **Subscription-based quantity logic** to differentiate between subscription and one-time purchases
- **Empty cart handling** with user-friendly messaging and catalog redirection
- **Foreign key relationships** ensuring data integrity between carts, items, and products
- **Cascade delete operations** for maintaining referential integrity
- **Audit timestamps** (created_at, updated_at) for tracking cart and item changes