## 7. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 8. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 9. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

## 10. Shopping Cart Business Logic

### 10.1 Cart Service Layer Implementation

The `CartService` class provides the core business logic for shopping cart operations:

**Key Methods:**

1. **addToCart(Long userId, Long productId)**: Adds a product to the user's cart with quantity 1, or increments quantity if already present
2. **getCart(Long userId)**: Retrieves all cart items with product details, calculates subtotals and total
3. **updateCartItemQuantity(Long cartItemId, Integer quantity)**: Updates item quantity and recalculates totals
4. **removeCartItem(Long cartItemId)**: Removes item from cart and returns updated cart
5. **calculateItemSubtotal(BigDecimal price, Integer quantity)**: Calculates subtotal for a single item
6. **calculateCartTotal(List<CartItem> items)**: Calculates total for all items in cart
7. **isCartEmpty(Long userId)**: Checks if user's cart has no items

### 10.2 Cart Validation Rules

The following validation rules are enforced in the CartService:

1. **Product Existence Validation**: Product must exist in the products table before adding to cart
2. **Quantity Validation**: 
   - Quantity must be a positive integer (> 0)
   - Quantity cannot exceed product's stock_quantity
3. **Duplicate Prevention**: User cannot add the same product twice; instead, quantity is updated
4. **Stock Availability**: When updating quantity, system validates against current stock levels
5. **Cart Item Ownership**: Users can only modify their own cart items

### 10.3 Cart Calculation Logic

**Item Subtotal Calculation:**
```
subtotal = product.price × cartItem.quantity
```

**Cart Total Calculation:**
```
cartTotal = Σ(subtotal for all items in cart)
```

**Automatic Recalculation Triggers:**
- When item quantity is updated
- When item is added to cart
- When item is removed from cart
- When cart is retrieved for display

### 10.4 Empty Cart Handling

When a user's cart is empty:

1. `isCartEmpty()` returns `true`
2. `CartResponse` is constructed with:
   - `isEmpty = true`
   - `message = "Your cart is empty"`
   - `cartTotal = 0.00`
   - `items = []` (empty list)
3. Frontend displays the empty cart message with a "Continue Shopping" link

## 11. Cart-Product Relationship

### 11.1 Data Model Relationship

The shopping cart system establishes a many-to-one relationship between cart items and products:

- **CartItem** entity contains `product_id` as a foreign key referencing **Product** entity
- Each cart item references exactly one product
- Each product can be referenced by multiple cart items (different users)
- Foreign key constraint ensures referential integrity
- CASCADE delete ensures cart items are removed when product is deleted

### 11.2 Product Information in Cart Context

When retrieving cart contents, the system:

1. Fetches all cart items for the user
2. For each cart item, retrieves associated product details:
   - Product name
   - Product price (current price at time of retrieval)
   - Product description (optional)
3. Combines cart item data (quantity) with product data (name, price)
4. Calculates subtotal using current product price
5. Returns enriched `CartItemDetail` objects containing both cart and product information

### 11.3 Price Consistency

Note: The system uses the **current product price** when displaying cart contents. If product price changes after item is added to cart, the new price is reflected. For production systems, consider storing the price at time of addition for order consistency.

## 12. Cart Repository Layer

The `CartRepository` interface extends `JpaRepository<CartItem, Long>` and provides custom query methods:

**Custom Query Methods:**

1. **findByUserId(Long userId)**: Retrieves all cart items for a specific user
   ```java
   List<CartItem> findByUserId(Long userId);
   ```

2. **findCartItemByUserIdAndProductId(Long userId, Long productId)**: Finds a specific cart item for a user-product combination
   ```java
   Optional<CartItem> findCartItemByUserIdAndProductId(Long userId, Long productId);
   ```

3. **deleteCartItem(Long cartItemId)**: Deletes a cart item by ID
   ```java
   @Modifying
   @Query("DELETE FROM CartItem c WHERE c.id = :cartItemId")
   void deleteCartItem(@Param("cartItemId") Long cartItemId);
   ```

**Inherited JpaRepository Methods Used:**
- `save(CartItem cartItem)`: Creates or updates cart item
- `findById(Long id)`: Retrieves cart item by ID
- `existsById(Long id)`: Checks if cart item exists

## 13. Cart Controller Layer

The `CartController` class is annotated with `@RestController` and `@RequestMapping("/api/cart")` and exposes the following endpoints:

**Controller Methods:**

1. **addToCart**: 
   ```java
   @PostMapping("/items")
   public ResponseEntity<CartItem> addToCart(
       @RequestHeader("User-Id") Long userId,
       @RequestBody AddToCartRequest request
   )
   ```

2. **getCart**:
   ```java
   @GetMapping
   public ResponseEntity<CartResponse> getCart(
       @RequestHeader("User-Id") Long userId
   )
   ```

3. **updateCartItemQuantity**:
   ```java
   @PutMapping("/items/{cartItemId}")
   public ResponseEntity<CartResponse> updateCartItemQuantity(
       @PathVariable Long cartItemId,
       @RequestBody UpdateQuantityRequest request
   )
   ```

4. **removeCartItem**:
   ```java
   @DeleteMapping("/items/{cartItemId}")
   public ResponseEntity<CartResponse> removeCartItem(
       @PathVariable Long cartItemId
   )
   ```

**Request/Response Handling:**
- Uses `@Valid` annotation for request body validation
- Returns appropriate HTTP status codes (200, 201, 404, 400)
- Handles exceptions through `@ExceptionHandler` methods
- Uses `@RequestHeader` for user identification (in production, use JWT/session)

## 14. Exception Handling for Cart Operations

**Custom Exceptions:**

1. **ProductNotFoundException**: Thrown when attempting to add non-existent product to cart
2. **CartItemNotFoundException**: Thrown when attempting to update/delete non-existent cart item
3. **InsufficientStockException**: Thrown when requested quantity exceeds available stock
4. **InvalidQuantityException**: Thrown when quantity is zero or negative

**Global Exception Handler:**

```java
@RestControllerAdvice
public class CartExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("Product not found", ex.getMessage()));
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("Cart item not found", ex.getMessage()));
    }
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Insufficient stock", ex.getMessage()));
    }
    
    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ErrorResponse> handleInvalidQuantity(InvalidQuantityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Invalid quantity", ex.getMessage()));
    }
}
```

## 15. Testing Considerations

### 15.1 Unit Tests for Cart Service

- Test addToCart with new product
- Test addToCart with existing product (quantity increment)
- Test addToCart with non-existent product
- Test addToCart with insufficient stock
- Test getCart with items
- Test getCart with empty cart
- Test updateCartItemQuantity with valid quantity
- Test updateCartItemQuantity exceeding stock
- Test removeCartItem with valid item
- Test removeCartItem with non-existent item
- Test calculation methods (subtotal, total)

### 15.2 Integration Tests for Cart API

- Test complete add-to-cart flow
- Test view cart with multiple items
- Test update quantity and verify recalculation
- Test remove item and verify cart update
- Test empty cart response
- Test concurrent cart modifications
- Test cart operations with invalid user

### 15.3 Repository Tests

- Test findByUserId returns correct items
- Test findCartItemByUserIdAndProductId finds existing item
- Test unique constraint on user_id + product_id
- Test cascade delete when product is removed
- Test quantity check constraint

## 16. Performance Optimization

### 16.1 Database Indexes

- Index on `cart_items.user_id` for fast user cart retrieval
- Index on `cart_items.product_id` for product reference lookups
- Composite unique index on `(user_id, product_id)` prevents duplicates and speeds up duplicate checks

### 16.2 Query Optimization

- Use JOIN FETCH in custom queries to avoid N+1 problem when loading cart with products
- Implement pagination for users with large carts
- Cache product information for frequently accessed items

### 16.3 Caching Strategy

- Cache cart totals with short TTL (time-to-live)
- Invalidate cache on cart modifications
- Consider Redis for session-based cart storage in high-traffic scenarios

## 17. Security Considerations

### 17.1 User Authorization

- Verify user owns cart items before allowing modifications
- Implement proper authentication (JWT tokens, OAuth2)
- Validate user_id from authenticated session, not from request parameters

### 17.2 Input Validation

- Validate quantity is positive integer
- Validate product_id exists before cart operations
- Sanitize all user inputs to prevent SQL injection
- Implement rate limiting on cart operations

### 17.3 Data Integrity

- Use database transactions for cart modifications
- Implement optimistic locking to handle concurrent updates
- Validate stock availability at checkout, not just at add-to-cart

## 18. Future Enhancements

### 18.1 Potential Features

- Save for later functionality
- Cart expiration (remove items after X days)
- Guest cart support with session-based storage
- Cart sharing functionality
- Wishlist integration
- Price drop notifications for cart items
- Bulk operations (clear cart, move all to wishlist)

### 18.2 Scalability Improvements

- Implement event-driven architecture for cart updates
- Use message queues for cart synchronization across services
- Implement CQRS pattern for read-heavy cart operations
- Consider NoSQL database for cart storage in microservices architecture