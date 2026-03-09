## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.1 Shopping Cart Database Schema

**Requirement Reference:** Epic: Cart management, Story: Cart functionality

#### Carts Table

```sql
CREATE TABLE carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_status CHECK (status IN ('ACTIVE', 'ABANDONED', 'CHECKED_OUT', 'EMPTY'))
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_updated_at ON carts(updated_at);
```

#### Cart Items Table

```sql
CREATE TABLE cart_items (
    item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price_snapshot DECIMAL(10,2) NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    max_quantity INTEGER NOT NULL DEFAULT 999,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_quantity_min CHECK (quantity >= min_quantity),
    CONSTRAINT chk_quantity_max CHECK (quantity <= max_quantity),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_added_at ON cart_items(added_at);
```

**Schema Features:**
- Foreign key constraints ensure referential integrity
- Unique constraint prevents duplicate products in same cart
- Check constraints enforce quantity validation rules
- Indexes optimize query performance for cart retrieval and product lookups
- Cascade delete ensures orphaned records are cleaned up
- `price_snapshot` preserves price at time of addition for consistency

**Reason for Addition:** Missing database schema definition for cart data storage

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

## 9. Business Logic

### 9.1 Real-Time Inventory Validation

**Requirement Reference:** Epic: Inventory management, Story: Inventory validation, AC-6

**Mechanism:**
Before adding or updating cart items, the system performs real-time inventory validation to prevent overselling.

**Validation Flow:**
1. Retrieve current product inventory from database
2. Check if requested quantity ≤ available stock
3. If insufficient, return error with available quantity
4. If sufficient, proceed with cart operation
5. Optionally implement soft reservation during cart session

**Implementation:**
```java
public boolean validateInventoryAvailability(Long productId, Integer requestedQuantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException(productId));
    
    return product.getStockQuantity() >= requestedQuantity;
}
```

**Error Handling:**
- Return HTTP 400 with message: "Insufficient inventory. Available: {available_quantity}"
- Suggest alternative quantity or notify when back in stock

**Reason for Addition:** Missing inventory check logic to prevent overselling

### 9.2 Minimum Procurement Threshold Validation

**Requirement Reference:** Story: Minimum procurement thresholds, AC-1

**Business Rule:**
Each product may have a minimum procurement threshold that must be met when adding to cart or updating quantities.

**Validation Logic:**
1. Retrieve product's `min_quantity` from database
2. Compare requested quantity against minimum threshold
3. If quantity < min_quantity, reject operation
4. Display clear error message with minimum requirement

**Implementation:**
```java
public void validateMinimumQuantity(CartItem cartItem, Product product) {
    Integer minQuantity = product.getMinQuantity();
    if (cartItem.getQuantity() < minQuantity) {
        throw new MinimumQuantityException(
            String.format("Minimum order quantity for %s is %d units", 
                product.getName(), minQuantity)
        );
    }
}
```

**UI Behavior:**
- Display minimum quantity requirement on product page
- Pre-populate quantity field with minimum value
- Show validation error if user attempts to add less than minimum

**Reason for Addition:** Missing business rule enforcement for minimum quantities

### 9.3 Cart Total Calculation Logic

**Requirement Reference:** Epic: Cart management, Story: Cart functionality, AC-2, AC-3

**Calculation Components:**
1. **Subtotal:** Sum of (quantity × price_snapshot) for all cart items
2. **Tax:** Calculated based on subtotal and applicable tax rate
3. **Grand Total:** Subtotal + Tax

**Implementation:**
```java
public void calculateCartTotals(ShoppingCart cart) {
    BigDecimal subtotal = cart.getItems().stream()
        .map(item -> item.getPriceSnapshot()
            .multiply(BigDecimal.valueOf(item.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    BigDecimal taxRate = new BigDecimal("0.08"); // 8% tax rate
    BigDecimal tax = subtotal.multiply(taxRate)
        .setScale(2, RoundingMode.HALF_UP);
    
    BigDecimal grandTotal = subtotal.add(tax);
    
    cart.setSubtotal(subtotal);
    cart.setTax(tax);
    cart.setGrandTotal(grandTotal);
}
```

**Recalculation Triggers:**
- Item added to cart
- Item quantity updated
- Item removed from cart
- Price changes (using price_snapshot to maintain consistency)

**Reason for Addition:** Missing price calculation logic for cart totals

### 9.4 Empty Cart Handling

**Requirement Reference:** Story: Cart operations, AC-5

**Empty Cart States:**
1. **New User:** No cart exists yet
2. **All Items Removed:** Cart exists but contains zero items
3. **Checkout Complete:** Cart cleared after successful order

**Handling Logic:**
```java
public void handleEmptyCart(ShoppingCart cart) {
    if (cart.getItems().isEmpty()) {
        cart.setStatus("EMPTY");
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setTax(BigDecimal.ZERO);
        cart.setGrandTotal(BigDecimal.ZERO);
        cartRepository.save(cart);
    }
}
```

**UI Behavior:**
- Display "Your cart is empty" message
- Show "Continue Shopping" button
- Optionally display recommended products
- Hide checkout button when cart is empty

**Reason for Addition:** Missing empty cart state management as specified in AC-5

### 9.5 Data Persistence Mechanism

**Requirement Reference:** Epic: Cart management, Story: Cart functionality, AC-2

**Persistence Strategy:**

**Authenticated Users:**
- Cart data stored in PostgreSQL database
- Persists across sessions and devices
- Associated with user_id

**Guest Users (Optional Enhancement):**
- Cart data stored in browser session/local storage
- Temporary cart created with session ID
- Merged with user cart upon login

**Session Management:**
- Active carts automatically saved on every modification
- Abandoned cart detection after 30 days of inactivity
- Periodic cleanup job removes abandoned carts

**Cart Merge Logic (Login):**
```java
public ShoppingCart mergeGuestCartWithUserCart(ShoppingCart guestCart, Long userId) {
    Optional<ShoppingCart> userCart = cartRepository.findByUserId(userId);
    
    if (userCart.isPresent()) {
        // Merge guest items into existing user cart
        for (CartItem guestItem : guestCart.getItems()) {
            addOrUpdateItem(userCart.get(), guestItem);
        }
        calculateCartTotals(userCart.get());
        return cartRepository.save(userCart.get());
    } else {
        // Convert guest cart to user cart
        guestCart.setUserId(userId);
        return cartRepository.save(guestCart);
    }
}
```

**Reason for Addition:** Missing cart data storage specification

## 10. Error Handling

**Requirement Reference:** Story: All acceptance criteria

### 10.1 Cart Operation Error Codes

| Error Code | HTTP Status | Description | User Message |
|------------|-------------|-------------|--------------||
| CART_001 | 404 | Cart not found | "Shopping cart not found" |
| CART_002 | 404 | Cart item not found | "Item not found in cart" |
| CART_003 | 400 | Invalid quantity | "Quantity must be a positive integer" |
| CART_004 | 400 | Below minimum threshold | "Minimum order quantity is {min} units" |
| CART_005 | 400 | Exceeds maximum limit | "Maximum order quantity is {max} units" |
| CART_006 | 400 | Insufficient inventory | "Only {available} units available" |
| CART_007 | 404 | Product not found | "Product not found" |
| CART_008 | 403 | Unauthorized access | "You don't have permission to modify this cart" |
| CART_009 | 400 | Duplicate product | "Product already in cart. Update quantity instead." |
| CART_010 | 500 | Cart calculation error | "Error calculating cart totals" |

### 10.2 Exception Handling Strategy

**Custom Exceptions:**
```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long productId) {
        super("Product not found with ID: " + productId);
    }
}

public class InsufficientInventoryException extends RuntimeException {
    private Integer availableQuantity;
    
    public InsufficientInventoryException(Integer available) {
        super("Insufficient inventory. Available: " + available);
        this.availableQuantity = available;
    }
}

public class MinimumQuantityException extends RuntimeException {
    public MinimumQuantityException(String message) {
        super(message);
    }
}

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long itemId) {
        super("Cart item not found with ID: " + itemId);
    }
}
```

**Global Exception Handler:**
```java
@RestControllerAdvice
public class CartExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("CART_007", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(InsufficientInventoryException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientInventory(InsufficientInventoryException ex) {
        ErrorResponse error = new ErrorResponse("CART_006", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(MinimumQuantityException.class)
    public ResponseEntity<ErrorResponse> handleMinimumQuantity(MinimumQuantityException ex) {
        ErrorResponse error = new ErrorResponse("CART_004", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("CART_002", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

**Error Response Format:**
```json
{
  "errorCode": "CART_006",
  "message": "Only 15 units available",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/cart/items"
}
```

**Reason for Addition:** Missing error handling specifications for cart operations