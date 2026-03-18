## 10. Validation Rules

### 10.1 Cart Item Quantity Validation

- **Minimum Quantity:** 1 (must be positive integer)
- **Maximum Quantity:** Based on product stock availability
- **Data Type:** Integer only
- **Validation Point:** Before adding to cart or updating quantity

**Validation Logic:**
```java
if (quantity < 1) {
    throw new InvalidQuantityException("Quantity must be at least 1");
}
if (quantity > product.getStockQuantity()) {
    throw new InsufficientStockException("Requested quantity exceeds available stock");
}
```

### 10.2 Product Availability Validation

**Pre-Add to Cart Checks:**
1. Product must exist in database
2. Product must have sufficient stock (stock_quantity >= requested quantity)
3. Product must be active/available for purchase

**Validation Sequence:**
```java
Product product = productRepository.findById(productId)
    .orElseThrow(() -> new ProductNotFoundException("Product not found"));

if (product.getStockQuantity() < quantity) {
    throw new InsufficientStockException(
        "Only " + product.getStockQuantity() + " items available in stock"
    );
}
```

### 10.3 Cart Operation Validation

- Customer ID must be valid and non-null
- Cart item ID must exist when updating or deleting
- Product ID must be valid when adding to cart
- Quantity updates must maintain positive values

## 11. Error Handling

### 11.1 Custom Exception Classes

**CartNotFoundException**
- **HTTP Status:** 404 Not Found
- **Trigger:** When cart for given customer ID doesn't exist
- **Message:** "Shopping cart not found for customer: {customerId}"

**CartItemNotFoundException**
- **HTTP Status:** 404 Not Found
- **Trigger:** When cart item ID doesn't exist during update/delete
- **Message:** "Cart item not found: {itemId}"

**InsufficientStockException**
- **HTTP Status:** 400 Bad Request
- **Trigger:** When requested quantity exceeds available stock
- **Message:** "Insufficient stock. Available: {available}, Requested: {requested}"

**InvalidQuantityException**
- **HTTP Status:** 400 Bad Request
- **Trigger:** When quantity is less than 1 or invalid
- **Message:** "Invalid quantity. Must be positive integer >= 1"

**ProductNotFoundException**
- **HTTP Status:** 404 Not Found
- **Trigger:** When product ID doesn't exist
- **Message:** "Product not found: {productId}"

### 11.2 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(CartNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartNotFound(CartNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "CART_NOT_FOUND"));
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "CART_ITEM_NOT_FOUND"));
    }
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage(), "INSUFFICIENT_STOCK"));
    }
    
    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ErrorResponse> handleInvalidQuantity(InvalidQuantityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage(), "INVALID_QUANTITY"));
    }
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "PRODUCT_NOT_FOUND"));
    }
}
```

### 11.3 Error Response Format

```json
{
    "message": "Detailed error message",
    "errorCode": "ERROR_CODE_CONSTANT",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/cart/items/123"
}
```

## 12. UI Integration

### 12.1 Frontend Integration Points

**Figma Design Alignment:**
All API responses are structured to match the Figma prototype specifications for seamless frontend integration.

### 12.2 Cart Display Response Format

**GET /api/cart Response Structure:**
```json
{
    "id": 1,
    "customerId": 12345,
    "total": 299.97,
    "status": "ACTIVE",
    "items": [
        {
            "id": 1,
            "productId": 101,
            "productName": "Wireless Mouse",
            "productPrice": 29.99,
            "quantity": 2,
            "subtotal": 59.98,
            "productImage": "https://example.com/images/mouse.jpg"
        },
        {
            "id": 2,
            "productId": 102,
            "productName": "USB Keyboard",
            "productPrice": 79.99,
            "quantity": 3,
            "subtotal": 239.97,
            "productImage": "https://example.com/images/keyboard.jpg"
        }
    ],
    "itemCount": 2,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Empty Cart Response:**
```json
{
    "id": null,
    "customerId": 12345,
    "total": 0.00,
    "status": "EMPTY",
    "items": [],
    "itemCount": 0,
    "message": "Your cart is empty",
    "continueShoppingLink": "/products"
}
```

### 12.3 UI Component Mapping

**Cart Item Display Requirements:**
- Product Name: `item.productName`
- Product Price: `item.productPrice` (formatted as currency)
- Quantity: `item.quantity` (editable input field)
- Subtotal: `item.subtotal` (formatted as currency)
- Remove Button: Triggers DELETE `/api/cart/items/{itemId}`

**Cart Summary Display:**
- Total Items: `cart.itemCount`
- Cart Total: `cart.total` (formatted as currency)
- Last Updated: `cart.updatedAt` (formatted timestamp)

**Interactive Elements:**
- Quantity Update: On change → PUT `/api/cart/items/{itemId}` with new quantity
- Remove Item: On click → DELETE `/api/cart/items/{itemId}`
- Add to Cart: On click → POST `/api/cart/items` with productId and quantity=1

### 12.4 Real-time Updates

**Automatic Recalculation Display:**
- Subtotal updates immediately when quantity changes
- Cart total updates automatically after any item modification
- UI reflects updated values from API response without page reload

**Loading States:**
- Show loading indicator during API calls
- Disable quantity inputs during update operations
- Display success/error messages based on API response

### 12.5 Empty Cart State

**Display Requirements:**
- Show message: "Your cart is empty"
- Display "Continue Shopping" button linking to `/products`
- Hide cart summary section
- Show empty cart icon/illustration as per Figma design

**Conditional Rendering:**
```javascript
if (cart.items.length === 0) {
    // Render empty cart state
    showEmptyCartMessage();
    showContinueShoppingButton();
} else {
    // Render cart items and summary
    renderCartItems(cart.items);
    renderCartSummary(cart.total, cart.itemCount);
}
```