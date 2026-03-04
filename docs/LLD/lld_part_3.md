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

### 5.1 Shopping Cart Module - Database Schema

**Shopping Cart Table**

```sql
CREATE TABLE shopping_cart (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL UNIQUE,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'ABANDONED', 'CONVERTED'))
);

CREATE INDEX idx_shopping_cart_customer ON shopping_cart(customer_id);
CREATE INDEX idx_shopping_cart_status ON shopping_cart(status);
```

**Cart Items Table**

```sql
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    added_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_cart(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

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

## 9. Shopping Cart Module - Business Logic

### 9.1 Automatic Total Recalculation

**Trigger Events:**
- Item added to cart
- Item quantity updated
- Item removed from cart

**Recalculation Process:**
1. Calculate subtotal for each cart item: `subtotal = unitPrice × quantity`
2. Sum all cart item subtotals: `totalAmount = Σ(subtotal)`
3. Update shopping_cart.total_amount
4. Update shopping_cart.last_modified_date

**Implementation:**
```java
public BigDecimal calculateCartTotal(Long cartId) {
    List<CartItem> items = cartItemRepository.findByCartId(cartId);
    BigDecimal total = items.stream()
        .map(CartItem::getSubtotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return total;
}
```

### 9.2 Empty Cart State Handling

**Detection Logic:**
- Cart exists but has zero items
- Cart does not exist for customer

**Response:**
```json
{
  "message": "Your cart is empty",
  "continueShoppingLink": "/products"
}
```

**Implementation:**
```java
public CartResponse getCartDetails(Long customerId) {
    Optional<ShoppingCart> cartOpt = shoppingCartRepository.findActiveCartByCustomerId(customerId);
    
    if (cartOpt.isEmpty()) {
        return EmptyCartResponse.builder()
            .message("Your cart is empty")
            .continueShoppingLink("/products")
            .build();
    }
    
    ShoppingCart cart = cartOpt.get();
    List<CartItem> items = cartItemRepository.findByCartId(cart.getCartId());
    
    if (items.isEmpty()) {
        return EmptyCartResponse.builder()
            .message("Your cart is empty")
            .continueShoppingLink("/products")
            .build();
    }
    
    return buildCartResponse(cart, items);
}
```

### 9.3 Stock Validation

**Validation Points:**
- Before adding item to cart
- Before updating item quantity

**Validation Logic:**
```java
public void validateStock(Long productId, Integer requestedQuantity) {
    Product product = productService.getProductById(productId);
    
    if (product.getStockQuantity() < requestedQuantity) {
        throw new ProductOutOfStockException(
            String.format("Product %s has only %d items in stock", 
                product.getName(), product.getStockQuantity())
        );
    }
}
```

## 10. Shopping Cart Module - Exception Handling

### 10.1 Custom Exceptions

**CartNotFoundException**
- **HTTP Status:** 404 Not Found
- **Scenario:** Cart does not exist for given customer
- **Message:** "Shopping cart not found for customer ID: {customerId}"

**CartItemNotFoundException**
- **HTTP Status:** 404 Not Found
- **Scenario:** Cart item does not exist
- **Message:** "Cart item not found with ID: {itemId}"

**InvalidQuantityException**
- **HTTP Status:** 400 Bad Request
- **Scenario:** Quantity is zero, negative, or exceeds maximum allowed
- **Message:** "Invalid quantity: {quantity}. Quantity must be between 1 and {maxQuantity}"

**ProductOutOfStockException**
- **HTTP Status:** 400 Bad Request
- **Scenario:** Requested quantity exceeds available stock
- **Message:** "Product {productName} has only {availableStock} items in stock"

**CartOperationException**
- **HTTP Status:** 500 Internal Server Error
- **Scenario:** Unexpected error during cart operation
- **Message:** "Failed to perform cart operation: {details}"

### 10.2 Global Exception Handler

```java
@RestControllerAdvice
public class CartExceptionHandler {
    
    @ExceptionHandler(CartNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartNotFound(CartNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ErrorResponse> handleInvalidQuantity(InvalidQuantityException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(ProductOutOfStockException.class)
    public ResponseEntity<ErrorResponse> handleProductOutOfStock(ProductOutOfStockException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(CartOperationException.class)
    public ResponseEntity<ErrorResponse> handleCartOperation(CartOperationException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## 11. Shopping Cart Module - Service Layer Implementation

### 11.1 ShoppingCartService Methods

**getOrCreateCart(Long customerId)**
- Checks if active cart exists for customer
- Creates new cart if not exists
- Returns existing or newly created cart

**addItemToCart(Long customerId, Long productId, Integer quantity)**
- Validates product exists and has sufficient stock
- Gets or creates cart for customer
- Checks if product already in cart
- If exists: updates quantity
- If not exists: creates new cart item
- Calculates subtotal and updates cart total
- Returns updated cart response

**updateItemQuantity(Long itemId, Integer quantity)**
- Validates quantity is positive
- Finds cart item by ID
- Validates product stock availability
- Updates quantity and recalculates subtotal
- Recalculates cart total
- Returns updated cart response

**removeItemFromCart(Long itemId)**
- Finds cart item by ID
- Deletes cart item
- Recalculates cart total
- Returns updated cart response

**getCartDetails(Long customerId)**
- Finds active cart for customer
- If cart not found or empty: returns empty cart response
- Retrieves all cart items
- Enriches items with product details
- Returns complete cart response

**clearCart(Long customerId)**
- Finds active cart for customer
- Deletes all cart items
- Resets cart total to zero
- Returns empty cart response

**calculateCartTotal(Long cartId)**
- Retrieves all items for cart
- Sums all item subtotals
- Returns total amount

### 11.2 CartItemService Methods

**calculateSubtotal(CartItem item)**
- Multiplies unit price by quantity
- Returns subtotal amount

**validateQuantity(Integer quantity)**
- Checks quantity is positive
- Checks quantity does not exceed maximum allowed (e.g., 99)
- Returns validation result

**updateCartItemQuantity(Long itemId, Integer quantity)**
- Finds cart item by ID
- Updates quantity
- Recalculates subtotal
- Saves and returns updated cart item

**removeCartItem(Long itemId)**
- Finds cart item by ID
- Deletes cart item from database

## 12. Shopping Cart Module - Repository Layer

### 12.1 ShoppingCartRepository

```java
@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    
    Optional<ShoppingCart> findByCustomerId(Long customerId);
    
    @Query("SELECT sc FROM ShoppingCart sc WHERE sc.customerId = :customerId AND sc.status = 'ACTIVE'")
    Optional<ShoppingCart> findActiveCartByCustomerId(@Param("customerId") Long customerId);
    
    boolean existsByCustomerId(Long customerId);
}
```

### 12.2 CartItemRepository

```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    
    @Modifying
    @Transactional
    void deleteByCartIdAndProductId(Long cartId, Long productId);
    
    Long countByCartId(Long cartId);
}
```

## 13. Shopping Cart Module - Controller Layer

### 13.1 ShoppingCartController

```java
@RestController
@RequestMapping("/api/cart")
public class ShoppingCartController {
    
    @Autowired
    private ShoppingCartService shoppingCartService;
    
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItemToCart(@Valid @RequestBody AddToCartRequest request) {
        CartResponse response = shoppingCartService.addItemToCart(
            request.getCustomerId(), 
            request.getProductId(), 
            request.getQuantity()
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam Long customerId) {
        Object response = shoppingCartService.getCartDetails(customerId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = shoppingCartService.updateItemQuantity(itemId, request.getQuantity());
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeCartItem(@PathVariable Long itemId) {
        CartResponse response = shoppingCartService.removeItemFromCart(itemId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping
    public ResponseEntity<EmptyCartResponse> clearCart(@RequestParam Long customerId) {
        EmptyCartResponse response = shoppingCartService.clearCart(customerId);
        return ResponseEntity.ok(response);
    }
}
```

---

**Document Version:** 2.0  
**Last Updated:** 2024-01-15  
**Changes:** Added Shopping Cart Module (Story SCRUM-343) with complete entity layer, repository layer, service layer, controller layer, DTOs, exception handling, business logic, and database schema