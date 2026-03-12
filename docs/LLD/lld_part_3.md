## 9. Business Logic

### 9.1 Minimum Procurement Threshold Logic

When adding a product to the cart:
- If the product has a `minimumProcurementThreshold` value set, the system automatically sets the quantity to this threshold value when the user first adds the product
- Users can adjust the quantity after the initial add, but validation ensures it doesn't exceed available inventory
- This logic applies to both subscription and one-time purchase scenarios

### 9.2 Inventory Validation

- **Real-time validation:** Before adding or updating cart items, the system validates against current inventory levels
- **Stock reservation:** When items are added to cart, inventory is reserved to prevent overselling
- **Stock release:** When items are removed from cart or quantity is reduced, reserved inventory is released back
- **Concurrent access handling:** Database-level locking ensures inventory consistency during concurrent operations

### 9.3 Cart State Management

- **Session persistence:** Cart data persists across user sessions in the database
- **Cart expiration:** Carts can be configured with expiration policies (implementation detail)
- **Synchronization:** Cart state is synchronized between client and server on each operation
- **Empty cart handling:** System gracefully handles empty cart scenarios with appropriate responses

## 10. Error Handling

### 10.1 Cart-Specific Exceptions

**CartItemNotFoundException**
- **HTTP Status:** 404 Not Found
- **Scenario:** When attempting to update or remove a cart item that doesn't exist
- **Response:** `{"error": "Cart item not found", "itemId": <id>}`

**InsufficientInventoryException**
- **HTTP Status:** 400 Bad Request
- **Scenario:** When requested quantity exceeds available inventory
- **Response:** `{"error": "Insufficient inventory", "productId": <id>, "available": <quantity>, "requested": <quantity>}`

**InvalidQuantityException**
- **HTTP Status:** 400 Bad Request
- **Scenario:** When quantity is less than 1 or invalid
- **Response:** `{"error": "Invalid quantity", "quantity": <value>}`

**ProductNotFoundException**
- **HTTP Status:** 404 Not Found
- **Scenario:** When attempting to add a non-existent product to cart
- **Response:** `{"error": "Product not found", "productId": <id>}`

### 10.2 Error Response Format

All error responses follow a consistent structure:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "path": "/api/cart/items"
}
```

## 11. Data Validation

### 11.1 Cart Item Validation Rules

**Quantity Validation:**
- Minimum value: 1
- Maximum value: Available stock quantity
- Must be a positive integer
- Validation occurs before add and update operations

**Inventory Availability:**
- Real-time check against current stock levels
- Considers already reserved inventory in other carts
- Prevents overselling scenarios

**Cart Item Existence:**
- Validates cart item exists before update or delete operations
- Returns appropriate 404 error if not found

**Product Validation:**
- Ensures product exists and is active
- Validates product price is current
- Checks product is not discontinued

### 11.2 Input Validation

**CartItemRequest validation:**
```java
public class CartItemRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @Min(value = 1, message = "Quantity must be at least 1")
    @NotNull(message = "Quantity is required")
    private Integer quantity;
}
```

**Quantity Update validation:**
```java
public class QuantityUpdateRequest {
    @Min(value = 1, message = "Quantity must be at least 1")
    @NotNull(message = "Quantity is required")
    private Integer quantity;
}
```