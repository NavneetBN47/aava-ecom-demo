## 8. Real-time Updates

### 8.1 Cart Total Calculation

The system provides real-time cart total updates without page refresh:

1. **Frontend Implementation:**
   - Use AJAX calls for all cart operations (add, update, remove)
   - After each operation, update cart total and item count in UI
   - Display loading indicators during API calls

2. **Backend Calculation:**
   - Cart total is calculated server-side after every cart modification
   - Formula: `cart.total_amount = SUM(cart_items.subtotal)`
   - Each cart item subtotal: `subtotal = unit_price * quantity`

3. **WebSocket Support (Optional Enhancement):**
   - For multi-device synchronization, implement WebSocket notifications
   - Broadcast cart updates to all active sessions for the same user
   - Message format: `{"type": "CART_UPDATE", "cartId": 123, "totalAmount": 299.99}`

4. **Response Format:**
```json
{
  "id": 1,
  "userId": 100,
  "items": [
    {
      "id": 1,
      "productId": 50,
      "quantity": 3,
      "unitPrice": 29.99,
      "subtotal": 89.97,
      "isSubscription": false
    }
  ],
  "totalAmount": 89.97,
  "updatedAt": "2024-01-15T10:30:00"
}
```

## 9. Error Handling

### 9.1 Cart-Specific Exceptions

The system implements custom exception handling for cart operations:

1. **InsufficientStockException:**
   - HTTP Status: 400 Bad Request
   - Message: "Insufficient stock. Available: {available}, Requested: {requested}"
   - Response includes current available stock for user correction

2. **CartItemNotFoundException:**
   - HTTP Status: 404 Not Found
   - Message: "Cart item not found with id: {itemId}"

3. **InvalidQuantityException:**
   - HTTP Status: 400 Bad Request
   - Message: "Invalid quantity. Quantity must be greater than 0"

4. **ProductNotAvailableException:**
   - HTTP Status: 400 Bad Request
   - Message: "Product is currently unavailable"

5. **Exception Handler Implementation:**
```java
@ExceptionHandler(InsufficientStockException.class)
public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
    ErrorResponse error = new ErrorResponse(
        "INSUFFICIENT_STOCK",
        ex.getMessage(),
        LocalDateTime.now()
    );
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

### 9.2 Error Response Format

```json
{
  "errorCode": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock. Available: 5, Requested: 10",
  "timestamp": "2024-01-15T10:30:00",
  "details": {
    "productId": 50,
    "availableStock": 5,
    "requestedQuantity": 10
  }
}
```

## 10. Empty State Handling

### 10.1 Empty Cart Logic

The system provides user-friendly empty cart handling:

1. **Backend Response:**
   - When cart has no items, return cart object with empty items array
   - Set `totalAmount` to 0.00
   - Include `isEmpty` flag in response

2. **Frontend Display:**
   - Show empty cart message: "Your cart is empty"
   - Display "Continue Shopping" button linking to product catalog
   - Show recommended products or recently viewed items

3. **Empty Cart Response:**
```json
{
  "id": 1,
  "userId": 100,
  "items": [],
  "totalAmount": 0.00,
  "isEmpty": true,
  "message": "Your cart is empty. Start shopping to add items!"
}
```

4. **Navigation:**
   - "Continue Shopping" button redirects to: `/products` or `/catalog`
   - Preserve any active filters or search criteria
   - Track empty cart views for analytics

## 11. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 12. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 13. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- Shopping cart with minimum procurement threshold support
- Real-time cart total calculation
- Inventory validation to prevent overselling
- Subscription and one-time purchase support
- Empty cart state handling with user-friendly navigation