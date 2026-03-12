## 9. Business Logic Implementation

### 9.1 Real-Time Price Calculation Engine

**Purpose:** Calculate line item subtotals and cart totals with instant updates

**Implementation:**
- Subtotal calculation: `quantity × unit_price`
- Cart total calculation: `SUM(all cart_items.subtotal)`
- Triggered on: add item, update quantity, remove item
- Real-time updates without page refresh

**Service Methods:**
```java
public BigDecimal calculateSubtotal(Long itemId) {
    CartItem item = cartItemRepository.findById(itemId)
        .orElseThrow(() -> new CartItemNotFoundException(itemId));
    BigDecimal subtotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
    item.setSubtotal(subtotal);
    cartItemRepository.save(item);
    return subtotal;
}

public BigDecimal calculateCartTotal(Long cartId) {
    return cartItemRepository.calculateCartTotal(cartId);
}
```

### 9.2 Minimum Procurement Threshold Logic

**Purpose:** Handle default quantities based on product thresholds and subscription types

**Business Rules:**
- If product has `minimum_procurement_threshold` set, use that value as default quantity
- If no threshold set, default quantity is 1
- For subscription-eligible products, apply threshold logic
- For one-time purchases, allow quantity of 1 unless threshold specified

**Implementation:**
```java
public Integer determineDefaultQuantity(Product product, boolean isSubscription) {
    if (product.getMinimumProcurementThreshold() != null && product.getMinimumProcurementThreshold() > 0) {
        return product.getMinimumProcurementThreshold();
    }
    return 1;
}
```

### 9.3 Inventory Validation Service

**Purpose:** Real-time inventory checking and stock availability validation

**Validation Rules:**
- Check if product exists
- Verify inventory tracking is enabled
- Compare requested quantity with available stock
- Throw `InsufficientStockException` if stock insufficient

**Implementation:**
```java
public void validateInventoryAvailability(Long productId, Integer requestedQuantity) {
    Product product = productService.getProductById(productId);
    
    if (!product.getInventoryTrackingEnabled()) {
        return; // Skip validation if tracking disabled
    }
    
    if (product.getStockQuantity() < requestedQuantity) {
        throw new InsufficientStockException(
            String.format("Insufficient stock for product %s. Available: %d, Requested: %d",
                product.getName(), product.getStockQuantity(), requestedQuantity)
        );
    }
}
```

## 10. Error Handling

### Product-Specific Exceptions
- `ProductNotFoundException`: Thrown when product ID not found
- `InvalidProductDataException`: Thrown for invalid product data

### Cart-Specific Exceptions

**CartNotFoundException**
- **Thrown when:** Cart ID does not exist
- **HTTP Status:** 404 Not Found
- **Message:** "Cart with ID {cartId} not found"

**InsufficientStockException**
- **Thrown when:** Requested quantity exceeds available stock
- **HTTP Status:** 400 Bad Request
- **Message:** "Insufficient stock for product {productName}. Available: {available}, Requested: {requested}"
- **Trigger:** Real-time inventory validation during add/update operations

**InvalidQuantityException**
- **Thrown when:** Quantity is zero, negative, or exceeds maximum allowed
- **HTTP Status:** 400 Bad Request
- **Message:** "Invalid quantity: {quantity}. Must be positive and within allowed limits"

**CartItemNotFoundException**
- **Thrown when:** Cart item ID does not exist
- **HTTP Status:** 404 Not Found
- **Message:** "Cart item with ID {itemId} not found"

### Global Exception Handler
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(CartNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartNotFound(CartNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "CART_NOT_FOUND"));
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
}
```

## 11. Frontend Integration

### Cart Management UI Components

**CartDisplay Component**
- Display all cart items with product details
- Show product name, unit price, quantity, subtotal for each item
- Display cart total prominently
- Real-time updates on any changes

**QuantityControl Component**
- Increment/decrement buttons
- Direct quantity input field
- Real-time validation
- Instant subtotal and total recalculation
- Disable controls if stock insufficient

**RemoveButton Component**
- Delete button for each cart item
- Confirmation dialog (optional)
- Automatic total recalculation on removal
- Visual feedback on successful removal

**EmptyCartState Component**
- Display when cart has no items
- Show message: "Your cart is empty"
- Provide "Return to Catalog" button
- Optional: Show recently viewed products

**InventoryValidation Component**
- Display error messages for insufficient stock
- Show available quantity
- Suggest alternative actions
- Real-time validation feedback

### Frontend-Backend Integration Flow

```mermaid
flowchart TD
    A[User Action] --> B{Action Type}
    B -->|Add to Cart| C[POST /api/cart/items]
    B -->|Update Quantity| D[PUT /api/cart/items/{itemId}/quantity]
    B -->|Remove Item| E[DELETE /api/cart/items/{itemId}]
    B -->|View Cart| F[GET /api/cart/{cartId}]
    
    C --> G[Inventory Validation]
    D --> G
    G -->|Valid| H[Update Cart]
    G -->|Invalid| I[Show Error Message]
    
    H --> J[Recalculate Totals]
    J --> K[Update UI]
    
    E --> J
    F --> K
    
    I --> L[Display Stock Error]
    L --> M[Suggest Alternatives]
```

## 12. Service Layer Architecture

### CartService
**Responsibilities:**
- Orchestrate cart operations
- Coordinate between CartItemService and InventoryValidationService
- Manage cart lifecycle
- Calculate cart totals
- Handle cart state management

**Key Methods:**
- `getCartById(Long cartId): Cart`
- `addItemToCart(Long cartId, Long productId, Integer quantity): Cart`
- `updateItemQuantity(Long itemId, Integer quantity): Cart`
- `removeItem(Long itemId): void`
- `calculateCartTotal(Long cartId): BigDecimal`
- `isCartEmpty(Long cartId): boolean`

### CartItemService
**Responsibilities:**
- Manage individual cart items
- Validate quantities
- Calculate subtotals
- Handle item-level operations

**Key Methods:**
- `createCartItem(Long cartId, Long productId, Integer quantity): CartItem`
- `updateQuantity(Long itemId, Integer quantity): CartItem`
- `calculateSubtotal(Long itemId): BigDecimal`
- `validateQuantity(Integer quantity): void`
- `deleteCartItem(Long itemId): void`

### InventoryValidationService
**Responsibilities:**
- Real-time inventory checking
- Stock availability validation
- Prevent overselling
- Provide stock level information

**Key Methods:**
- `validateInventoryAvailability(Long productId, Integer quantity): void`
- `checkStockLevel(Long productId): Integer`
- `isStockSufficient(Long productId, Integer requestedQuantity): boolean`

## 13. Controller Layer Architecture

### CartController
**Base Path:** `/api/cart`

**Endpoints:**

```java
@RestController
@RequestMapping("/api/cart")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    @GetMapping("/{cartId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long cartId) {
        Cart cart = cartService.getCartById(cartId);
        return ResponseEntity.ok(cart);
    }
    
    @PostMapping("/items")
    public ResponseEntity<Cart> addItemToCart(@RequestBody CartItemRequest request) {
        Cart cart = cartService.addItemToCart(
            request.getCartId(),
            request.getProductId(),
            request.getQuantity()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(cart);
    }
    
    @PutMapping("/items/{itemId}/quantity")
    public ResponseEntity<Cart> updateItemQuantity(
            @PathVariable Long itemId,
            @RequestBody QuantityUpdateRequest request) {
        Cart cart = cartService.updateItemQuantity(itemId, request.getQuantity());
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItemFromCart(@PathVariable Long itemId) {
        cartService.removeItem(itemId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{cartId}/empty-state")
    public ResponseEntity<EmptyCartResponse> getEmptyCartState(@PathVariable Long cartId) {
        boolean isEmpty = cartService.isCartEmpty(cartId);
        if (isEmpty) {
            return ResponseEntity.ok(new EmptyCartResponse(
                "Your cart is empty",
                "/catalog",
                "Return to Catalog"
            ));
        }
        return ResponseEntity.ok(new EmptyCartResponse("Cart has items", null, null));
    }
}
```

## 14. Repository Layer Architecture

### CartRepository
```java
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);
    Optional<Cart> findBySessionId(String sessionId);
    List<Cart> findByStatus(String status);
}
```

### CartItemRepository
```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartId(Long cartId);
    
    @Query("SELECT SUM(ci.subtotal) FROM CartItem ci WHERE ci.cartId = :cartId")
    BigDecimal calculateCartTotal(@Param("cartId") Long cartId);
    
    void deleteByCartId(Long cartId);
}
```

## 15. Validation and Constraints

### Cart Validation Rules
- Cart must have either `user_id` or `session_id`
- Cart status must be valid (ACTIVE, ABANDONED, COMPLETED)
- Cart cannot be modified if status is COMPLETED

### Cart Item Validation Rules
- Quantity must be positive (> 0)
- Product must exist and be active
- Unit price must match current product price
- Subtotal must equal quantity × unit_price
- Cannot add duplicate products (merge quantities instead)

### Inventory Validation Rules
- Requested quantity must not exceed available stock
- Stock validation occurs before add/update operations
- Real-time validation with immediate feedback
- Graceful handling of concurrent stock updates

## 16. Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (cart_id, product_id, user_id, session_id)
- Efficient JOIN operations for cart item retrieval
- Batch operations for multiple item updates
- Connection pooling for database connections

### Caching Strategy
- Cache product information for cart operations
- Cache cart totals with invalidation on updates
- Session-based cart caching
- Redis integration for distributed caching (optional)

### Real-Time Calculation Optimization
- Calculate subtotals at database level when possible
- Use database triggers for automatic total updates (optional)
- Minimize round trips for calculation operations
- Batch calculation updates

## 17. Security Considerations

### Cart Access Control
- Validate user ownership of cart
- Session-based cart isolation
- Prevent unauthorized cart modifications
- Secure cart ID generation

### Input Validation
- Sanitize all user inputs
- Validate quantity ranges
- Prevent SQL injection through parameterized queries
- Validate product IDs before operations

### Data Protection
- Encrypt sensitive cart data
- Secure session management
- HTTPS for all cart operations
- CSRF protection for state-changing operations