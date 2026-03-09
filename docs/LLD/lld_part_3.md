## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

### 8.1 Shopping Cart Key Features (NEW)

- **Add to Cart with Validation:** Products can be added to cart with minimum procurement threshold validation and stock availability checking
- **Real-time Cart Updates:** Instant subtotal and total recalculation without page refresh when quantities change
- **Cart Persistence:** Customer carts are persisted in database and retrieved across sessions
- **Inventory Integration:** Cart operations validate against real-time product inventory
- **Empty Cart Handling:** Graceful handling of empty cart state with appropriate user messaging
- **Quantity Management:** Update cart item quantities with real-time validation and error feedback
- **Cart Item Removal:** Remove individual products from cart with automatic total recalculation
- **Cart Summary:** Comprehensive cart totals including item count, subtotals, and grand total
- **Stock Limit Enforcement:** Prevents adding quantities exceeding available stock with clear error messages
- **Minimum Threshold Logic:** Enforces minimum procurement thresholds for applicable products

## 9. Shopping Cart Business Logic (NEW)

### 9.1 Minimum Procurement Threshold Handling

**Requirement:** AC-1 - Minimum Procurement Threshold validation

**Implementation:**
- When adding product to cart, check if product has `minimumProcurementThreshold` set
- If threshold exists and requested quantity < threshold, reject with error message
- Error message: "Minimum order quantity for this product is {threshold} units"
- Allow quantities >= threshold to proceed

**Code Logic:**
```java
if (product.getMinimumProcurementThreshold() != null) {
    if (quantity < product.getMinimumProcurementThreshold()) {
        throw new MinimumThresholdException(
            "Minimum order quantity for this product is " + 
            product.getMinimumProcurementThreshold() + " units"
        );
    }
}
```

### 9.2 Real-time Update Mechanism

**Requirement:** AC-3 - Instant updates without page refresh

**Implementation Options:**

**Option 1: AJAX Polling**
- Frontend polls cart summary endpoint every 2-3 seconds
- Updates UI with latest totals
- Simple but higher server load

**Option 2: WebSocket (Recommended)**
- Establish WebSocket connection on cart page load
- Server pushes cart updates when quantity changes
- Real-time, efficient, low latency

**Option 3: Server-Sent Events (SSE)**
- Server pushes cart total updates to client
- Unidirectional, simpler than WebSocket
- Good for read-only updates

**WebSocket Implementation:**
```java
@MessageMapping("/cart/update")
@SendTo("/topic/cart/{customerId}")
public CartSummary updateCartTotals(UpdateQuantityRequest request) {
    CartItem updatedItem = cartService.updateCartItemQuantity(
        request.getCartItemId(), 
        request.getQuantity()
    );
    return cartService.calculateCartTotals(updatedItem.getCartId());
}
```

### 9.3 Empty Cart State Management

**Requirement:** AC-5 - Empty cart handling

**Implementation:**
- Check if cart exists and has items
- If cart is null or cartItems list is empty, return empty state response
- Frontend displays: "Your cart is empty" message
- Provide "Continue Shopping" button linking back to product catalog

**Response Structure:**
```json
{
  "cartId": null,
  "customerId": 12345,
  "cartItems": [],
  "totalItems": 0,
  "totalAmount": 0.00,
  "isEmpty": true,
  "message": "Your cart is empty"
}
```

### 9.4 Inventory Validation System

**Requirement:** AC-6 - Stock quantity validation

**Implementation:**

**InventoryValidationService Methods:**

1. **validateStockAvailability(productId, requestedQuantity)**
   - Fetch product from database
   - Compare requestedQuantity with product.stockQuantity
   - Return true if requestedQuantity <= stockQuantity
   - Return false otherwise

2. **checkMinimumProcurementThreshold(product, quantity)**
   - Check if product.minimumProcurementThreshold is set
   - Validate quantity >= threshold
   - Return validation result

3. **getAvailableStock(productId)**
   - Return current stock quantity for product
   - Used for displaying available stock to user

**Error Messages:**
- "Insufficient stock. Only {availableStock} units available."
- "Requested quantity exceeds available stock."
- "Product is currently out of stock."

**Validation Flow:**
```java
public boolean validateStockAvailability(Long productId, Integer requestedQuantity) {
    Product product = productService.getProductById(productId);
    
    if (product.getStockQuantity() < requestedQuantity) {
        throw new InsufficientStockException(
            "Insufficient stock. Only " + product.getStockQuantity() + 
            " units available."
        );
    }
    
    return true;
}
```

## 10. Exception Handling for Shopping Cart (NEW)

### 10.1 Custom Exceptions

```java
// Insufficient stock exception
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}

// Minimum threshold exception
public class MinimumThresholdException extends RuntimeException {
    public MinimumThresholdException(String message) {
        super(message);
    }
}

// Cart item not found exception
public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(String message) {
        super(message);
    }
}

// Cart not found exception
public class CartNotFoundException extends RuntimeException {
    public CartNotFoundException(String message) {
        super(message);
    }
}
```

### 10.2 Global Exception Handler

```java
@RestControllerAdvice
public class CartExceptionHandler {
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        ErrorResponse error = new ErrorResponse(
            "INSUFFICIENT_STOCK",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MinimumThresholdException.class)
    public ResponseEntity<ErrorResponse> handleMinimumThreshold(MinimumThresholdException ex) {
        ErrorResponse error = new ErrorResponse(
            "MINIMUM_THRESHOLD_NOT_MET",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            "CART_ITEM_NOT_FOUND",
            ex.getMessage(),
            HttpStatus.NOT_FOUND.value()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
}
```

## 11. Data Transfer Objects (DTOs) for Shopping Cart (NEW)

### 11.1 Request DTOs

```java
// Add to cart request
public class AddToCartRequest {
    private Long customerId;
    private Long productId;
    private Integer quantity;
    // getters and setters
}

// Update quantity request
public class UpdateQuantityRequest {
    private Integer quantity;
    // getters and setters
}
```

### 11.2 Response DTOs

```java
// Cart summary response
public class CartSummary {
    private Long cartId;
    private Long customerId;
    private Integer totalItems;
    private BigDecimal totalAmount;
    private List<CartItemDTO> items;
    private Boolean isEmpty;
    private String message;
    // getters and setters
}

// Cart item DTO
public class CartItemDTO {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private Integer availableStock;
    // getters and setters
}
```

## 12. Required Modifications to Existing Components (NEW)

### 12.1 Product Entity Enhancements

**Current State:** Product entity has basic fields (id, name, description, price, category, stockQuantity, createdAt)

**Required Changes:**
- Add `minimumProcurementThreshold` field (Integer, nullable)
- Add `subscriptionEligible` field (Boolean, default false)

**Updated Product Entity:**
```java
@Entity
@Table(name = "products")
public class Product {
    // ... existing fields ...
    
    @Column(name = "minimum_procurement_threshold")
    private Integer minimumProcurementThreshold;
    
    @Column(name = "subscription_eligible", nullable = false)
    private Boolean subscriptionEligible = false;
    
    // getters and setters
}
```

### 12.2 ProductService Enhancements

**Current State:** ProductService handles basic CRUD operations

**Required Additions:**
- Add inventory validation methods
- Add product availability checking
- Add stock reservation logic (optional for cart checkout)

**New Methods:**
```java
@Service
public class ProductService {
    // ... existing methods ...
    
    public boolean isStockAvailable(Long productId, Integer requestedQuantity) {
        Product product = getProductById(productId);
        return product.getStockQuantity() >= requestedQuantity;
    }
    
    public Integer getAvailableStock(Long productId) {
        Product product = getProductById(productId);
        return product.getStockQuantity();
    }
    
    public void validateMinimumThreshold(Product product, Integer quantity) {
        if (product.getMinimumProcurementThreshold() != null) {
            if (quantity < product.getMinimumProcurementThreshold()) {
                throw new MinimumThresholdException(
                    "Minimum order quantity for this product is " + 
                    product.getMinimumProcurementThreshold() + " units"
                );
            }
        }
    }
}
```

### 12.3 ProductController Enhancements

**Current State:** ProductController provides standard REST endpoints

**Required Additions:**
- Add endpoint to check product availability for cart
- Add endpoint to get product details with stock info

**New Endpoints:**
```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    // ... existing endpoints ...
    
    @GetMapping("/{id}/availability")
    public ResponseEntity<ProductAvailability> checkAvailability(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        Product product = productService.getProductById(id);
        boolean available = productService.isStockAvailable(id, quantity);
        
        ProductAvailability availability = new ProductAvailability(
            product.getId(),
            product.getStockQuantity(),
            available,
            product.getMinimumProcurementThreshold()
        );
        
        return ResponseEntity.ok(availability);
    }
}
```

## 13. Testing Strategy for Shopping Cart (NEW)

### 13.1 Unit Tests

**CartService Tests:**
- Test addProductToCart with valid data
- Test addProductToCart with insufficient stock
- Test addProductToCart with minimum threshold violation
- Test updateCartItemQuantity with valid quantity
- Test updateCartItemQuantity exceeding stock
- Test removeCartItem
- Test calculateCartTotals
- Test empty cart handling

**InventoryValidationService Tests:**
- Test validateStockAvailability with sufficient stock
- Test validateStockAvailability with insufficient stock
- Test checkMinimumProcurementThreshold

### 13.2 Integration Tests

**Cart API Tests:**
- Test POST /api/cart/items - successful add
- Test POST /api/cart/items - stock validation failure
- Test GET /api/cart/{customerId} - cart with items
- Test GET /api/cart/{customerId} - empty cart
- Test PUT /api/cart/items/{cartItemId} - update quantity
- Test DELETE /api/cart/items/{cartItemId} - remove item
- Test GET /api/cart/{customerId}/summary - cart totals

### 13.3 End-to-End Tests

- Complete cart flow: add → update → remove → checkout
- Real-time update verification
- Concurrent cart operations
- Cart persistence across sessions

## 14. Performance Considerations for Shopping Cart (NEW)

### 14.1 Database Optimization

- Index on `carts.customer_id` for fast cart retrieval
- Index on `cart_items.cart_id` for efficient item queries
- Index on `cart_items.product_id` for product lookups
- Composite index on `(cart_id, product_id)` for uniqueness

### 14.2 Caching Strategy

- Cache active carts in Redis with TTL
- Cache product stock information
- Invalidate cache on cart updates
- Use cache-aside pattern for cart retrieval

### 14.3 Query Optimization

- Use JOIN FETCH for cart with items retrieval
- Batch product lookups for cart items
- Use database-level SUM for cart totals
- Implement pagination for large carts

## 15. Security Considerations for Shopping Cart (NEW)

### 15.1 Authorization

- Verify customer owns cart before operations
- Implement JWT-based authentication
- Validate customer ID matches authenticated user

### 15.2 Input Validation

- Validate quantity > 0
- Validate product ID exists
- Validate customer ID format
- Sanitize all user inputs

### 15.3 Rate Limiting

- Limit cart operations per customer per minute
- Prevent cart abuse and spam
- Implement exponential backoff for failures

## 16. Deployment and Configuration (NEW)

### 16.1 Application Properties

```properties
# Cart Configuration
app.cart.max-items-per-cart=50
app.cart.session-timeout-minutes=30
app.cart.enable-real-time-updates=true

# WebSocket Configuration
spring.websocket.enabled=true
spring.websocket.endpoint=/ws/cart

# Redis Cache Configuration
spring.redis.host=localhost
spring.redis.port=6379
spring.cache.type=redis
spring.cache.redis.time-to-live=1800000
```

### 16.2 Database Migration

- Use Flyway or Liquibase for schema versioning
- Create migration scripts for cart tables
- Add migration for product table alterations
- Ensure backward compatibility

## 17. Monitoring and Logging (NEW)

### 17.1 Logging Strategy

- Log all cart operations (add, update, remove)
- Log inventory validation failures
- Log real-time update events
- Use structured logging (JSON format)

### 17.2 Metrics

- Track cart abandonment rate
- Monitor average cart value
- Track cart-to-order conversion rate
- Monitor API response times
- Track inventory validation failures

### 17.3 Alerts

- Alert on high cart operation failure rate
- Alert on database connection issues
- Alert on cache failures
- Alert on WebSocket connection drops