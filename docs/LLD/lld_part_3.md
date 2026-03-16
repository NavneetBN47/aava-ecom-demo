## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

## 9. Shopping Cart Business Logic

### 9.1 Add to Cart Logic

**Quantity Defaulting Rules:**
- If quantity is not provided or is 0:
  - Check if product has `minimumProcurementThreshold`
  - If threshold exists, set quantity to threshold value
  - If no threshold, default to 1
- If quantity is explicitly provided, use that value
- Always validate against available inventory before adding

**Subscription Type Handling:**
- Support two types: "one-time" and "subscription"
- Store subscription type with each cart item
- Apply appropriate quantity logic based on purchase type

### 9.2 Cart Total Calculation

**Real-time Calculation:**
- Line item subtotal = quantity × unit_price
- Cart total = SUM(all cart item subtotals)
- Recalculate on every quantity update or item removal
- Update cart `updated_at` timestamp on any modification

### 9.3 Inventory Validation Rules

**Validation Points:**
- Before adding item to cart
- Before updating cart item quantity
- Check: requested_quantity <= product.stock_quantity
- Return error if validation fails with clear message

### 9.4 Empty Cart Handling

**Empty State Detection:**
- Check if cart exists for customer
- Check if cart has any items
- If empty, return response with:
  - Empty indicator flag
  - Message: "Your cart is empty"
  - Suggestion to navigate to product catalog

## 10. Validation Rules

### 10.1 Product Validation
- Product name: Required, max 255 characters
- Price: Required, must be positive, max 2 decimal places
- Category: Required, max 100 characters
- Stock quantity: Required, must be non-negative
- Minimum procurement threshold: Optional, must be positive if provided

### 10.2 Cart Item Validation
- Product ID: Required, must exist in products table
- Quantity: Must be positive integer
- Quantity must not exceed available stock
- Subscription type: Required, must be "one-time" or "subscription"
- Unit price: Must match current product price at time of addition

### 10.3 Cart Operation Validation
- Customer ID: Required for all cart operations
- Cart item ID: Must exist for update/delete operations
- Quantity updates: Must pass inventory validation
- Subtotal calculation: Must be accurate (quantity × unit_price)

## 11. Error Handling

### 11.1 Custom Exceptions

**ProductNotFoundException:**
- Thrown when product ID not found
- HTTP Status: 404 Not Found
- Message: "Product with ID {id} not found"

**CartItemNotFoundException:**
- Thrown when cart item ID not found
- HTTP Status: 404 Not Found
- Message: "Cart item with ID {id} not found"

**InsufficientInventoryException:**
- Thrown when requested quantity exceeds stock
- HTTP Status: 400 Bad Request
- Message: "Requested quantity {quantity} exceeds available stock {stock}"

**InvalidQuantityException:**
- Thrown when quantity is invalid (negative or zero when not allowed)
- HTTP Status: 400 Bad Request
- Message: "Invalid quantity provided"

### 11.2 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
    
    @ExceptionHandler(InsufficientInventoryException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientInventory(InsufficientInventoryException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage()));
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
    
    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ErrorResponse> handleInvalidQuantity(InvalidQuantityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage()));
    }
}
```

## 12. Service Layer Implementation Details

### 12.1 CartService Methods

**addItemToCart(customerId, productId, quantity, subscriptionType):**
1. Fetch product by ID
2. Determine final quantity using threshold logic
3. Validate inventory availability
4. Find or create shopping cart for customer
5. Create cart item with calculated subtotal
6. Save cart item to database
7. Return created cart item

**getCart(customerId):**
1. Find cart by customer ID
2. If cart not found, return empty cart response
3. Fetch all cart items for the cart
4. If no items, return empty cart message
5. Enrich each cart item with product details
6. Calculate cart total
7. Return complete shopping cart with items and total

**updateCartItemQuantity(cartItemId, quantity):**
1. Find cart item by ID
2. Fetch associated product
3. Validate new quantity against stock
4. Calculate new subtotal
5. Update cart item quantity and subtotal
6. Save updated cart item
7. Recalculate cart total
8. Return updated cart item

**removeCartItem(cartItemId):**
1. Find cart item by ID
2. Store cart ID for later use
3. Delete cart item from database
4. Fetch remaining cart items
5. Recalculate cart total
6. Update cart timestamp
7. Return success

**calculateCartTotals(cartId):**
1. Fetch all cart items for cart
2. Sum all item subtotals
3. Return total amount

**validateInventory(productId, quantity):**
1. Fetch product by ID
2. Compare requested quantity with stock quantity
3. Return true if sufficient, throw exception if not

**handleEmptyCart(customerId):**
1. Create empty cart response object
2. Set empty flag to true
3. Set message: "Your cart is empty"
4. Add navigation suggestion
5. Return empty cart response

## 13. Controller Layer Implementation Details

### 13.1 CartController Endpoints

**POST /api/cart/items:**
- Request Body: `{ "customerId": Long, "productId": Long, "quantity": Integer, "subscriptionType": String }`
- Response: CartItem with HTTP 201 Created
- Error Responses: 400 (insufficient inventory), 404 (product not found)

**GET /api/cart?customerId={customerId}:**
- Query Parameter: customerId (required)
- Response: ShoppingCart with items and total, HTTP 200 OK
- Empty cart returns 200 with empty message

**PUT /api/cart/items/{cartItemId}:**
- Path Variable: cartItemId
- Request Body: `{ "quantity": Integer }`
- Response: Updated CartItem with new totals, HTTP 200 OK
- Error Responses: 400 (insufficient inventory), 404 (cart item not found)

**DELETE /api/cart/items/{cartItemId}:**
- Path Variable: cartItemId
- Response: HTTP 204 No Content
- Error Response: 404 (cart item not found)

## 14. Repository Layer Implementation Details

### 14.1 CartRepository Interface

```java
@Repository
public interface CartRepository extends JpaRepository<ShoppingCart, Long> {
    Optional<ShoppingCart> findByCustomerId(Long customerId);
}
```

### 14.2 CartItemRepository Interface

```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartId(Long cartId);
    void deleteByCartId(Long cartId);
}
```

## 15. Data Transfer Objects (DTOs)

### 15.1 CartItemRequest

```java
public class CartItemRequest {
    private Long customerId;
    private Long productId;
    private Integer quantity;
    private String subscriptionType;
    
    // Getters and setters
}
```

### 15.2 QuantityUpdateRequest

```java
public class QuantityUpdateRequest {
    private Integer quantity;
    
    // Getters and setters
}
```

### 15.3 CartResponse

```java
public class CartResponse {
    private Long cartId;
    private Long customerId;
    private List<CartItemResponse> items;
    private BigDecimal cartTotal;
    private boolean isEmpty;
    private String message;
    private LocalDateTime updatedAt;
    
    // Getters and setters
}
```

### 15.4 CartItemResponse

```java
public class CartItemResponse {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String subscriptionType;
    
    // Getters and setters
}
```