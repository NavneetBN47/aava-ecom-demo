## 9. Data Transfer Objects (DTOs)

### 9.1 CartDTO

```java
public class CartDTO {
    private Long id;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private String status;
    private String message; // For empty cart: "Your cart is empty"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters and setters
}
```

### 9.2 CartItemDTO

```java
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private Integer availableStock;
    
    // Getters and setters
}
```

### 9.3 AddCartItemRequest

```java
public class AddCartItemRequest {
    @NotNull
    private Long userId;
    
    @NotNull
    private Long productId;
    
    @Min(1)
    private Integer quantity;
    
    private Boolean isSubscription; // For subscription-based quantity logic
    
    // Getters and setters
}
```

### 9.4 UpdateCartItemRequest

```java
public class UpdateCartItemRequest {
    @NotNull
    @Min(1)
    private Integer quantity;
    
    // Getters and setters
}
```

### 9.5 ProductAvailabilityDTO

```java
public class ProductAvailabilityDTO {
    private Long productId;
    private String productName;
    private Integer availableStock;
    private Integer minQuantity;
    private Boolean isAvailable;
    
    // Getters and setters
}
```

## 10. Business Logic

### 10.1 Minimum Procurement Threshold Logic

When adding a product to cart (AC-1):
- Check if product has a `minQuantity` field set
- If `minQuantity` exists and requested quantity < `minQuantity`, set quantity to `minQuantity`
- If `minQuantity` is null or 0, use requested quantity (default 1)
- Support for `minimumProcurementThreshold` field for advanced threshold management

```java
public Integer applyMinimumQuantityThreshold(Product product, Integer requestedQuantity) {
    // Use minimumProcurementThreshold if set, otherwise fall back to minQuantity
    Integer threshold = product.getMinimumProcurementThreshold() != null 
        ? product.getMinimumProcurementThreshold() 
        : product.getMinQuantity();
    
    if (threshold != null && threshold > 0) {
        return Math.max(requestedQuantity, threshold);
    }
    return requestedQuantity;
}
```

### 10.2 Subscription-Based Quantity Calculation

When adding products based on subscription or one-time buy (AC-1):
- If `isSubscription` flag is true, apply subscription quantity rules
- For one-time purchases, use standard quantity logic
- Subscription products may have different minimum thresholds
- Check `subscriptionEligible` field on Product entity

```java
public Integer calculateQuantityByPurchaseType(Product product, Integer requestedQuantity, Boolean isSubscription) {
    if (isSubscription != null && isSubscription) {
        // Verify product is subscription eligible
        if (!Boolean.TRUE.equals(product.getSubscriptionEligible())) {
            throw new InvalidSubscriptionException("Product is not eligible for subscription");
        }
        // Apply subscription-specific quantity rules
        return applySubscriptionQuantityRules(product, requestedQuantity);
    }
    return applyMinimumQuantityThreshold(product, requestedQuantity);
}

private Integer applySubscriptionQuantityRules(Product product, Integer requestedQuantity) {
    Integer threshold = product.getMinimumProcurementThreshold();
    if (threshold != null && threshold > 0) {
        return Math.max(requestedQuantity, threshold);
    }
    return requestedQuantity;
}
```

### 10.3 Real-Time Total Calculation

For instant updates without page refresh (AC-3):
- Calculate subtotal for each cart item: `quantity × unitPrice`
- Sum all subtotals to get cart subtotal
- Apply tax calculation if applicable
- Calculate final total
- Performance requirement: < 200ms

```java
@Transactional
public CartDTO calculateCartTotals(Cart cart) {
    List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
    
    BigDecimal subtotal = items.stream()
        .map(item -> item.getUnitPrice().multiply(new BigDecimal(item.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    BigDecimal tax = subtotal.multiply(new BigDecimal("0.10")); // 10% tax
    BigDecimal total = subtotal.add(tax);
    
    return buildCartDTO(cart, items, subtotal, tax, total);
}
```

### 10.4 Inventory Validation

Real-time stock validation before quantity updates (AC-6):
- Check current stock quantity from products table
- Validate requested quantity ≤ available stock
- Throw `InsufficientStockException` if validation fails
- Display inventory validation error to user

```java
public void validateInventory(Long productId, Integer requestedQuantity) {
    Product product = productRepository.findByIdWithStock(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    if (product.getStockQuantity() < requestedQuantity) {
        throw new InsufficientStockException(
            String.format("Insufficient stock. Available: %d, Requested: %d", 
                product.getStockQuantity(), requestedQuantity)
        );
    }
}
```

### 10.5 Empty Cart State Handling

Logic to handle and display empty cart state (AC-5):
- Check if cart exists for user
- Check if cart has any items
- If no cart or no items, return CartDTO with message "Your cart is empty"
- Set items list to empty array
- Set all totals to 0.00

```java
public CartDTO getCart(Long userId) {
    Optional<Cart> cartOpt = cartRepository.findByUserId(userId);
    
    if (cartOpt.isEmpty()) {
        return createEmptyCartDTO(userId);
    }
    
    Cart cart = cartOpt.get();
    List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
    
    if (items.isEmpty()) {
        CartDTO dto = new CartDTO();
        dto.setUserId(userId);
        dto.setItems(new ArrayList<>());
        dto.setMessage("Your cart is empty");
        dto.setSubtotal(BigDecimal.ZERO);
        dto.setTotal(BigDecimal.ZERO);
        return dto;
    }
    
    return calculateCartTotals(cart);
}
```

### 10.6 Product Validation for Cart Operations

Enhanced product validation methods for cart operations:

```java
public void validateProductForCart(Long productId, Integer quantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    // Check stock availability
    if (!checkStockAvailability(productId, quantity)) {
        throw new InsufficientStockException(
            String.format("Insufficient stock for product %s", product.getName())
        );
    }
    
    // Check max order quantity if set
    if (product.getMaxOrderQuantity() != null && quantity > product.getMaxOrderQuantity()) {
        throw new MaxOrderQuantityExceededException(
            String.format("Maximum order quantity is %d", product.getMaxOrderQuantity())
        );
    }
}

public Integer getMinimumProcurementThreshold(Long productId) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    return product.getMinimumProcurementThreshold() != null 
        ? product.getMinimumProcurementThreshold() 
        : product.getMinQuantity();
}

public boolean checkStockAvailability(Long productId, Integer quantity) {
    Product product = productRepository.findByIdWithStock(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    return product.getStockQuantity() >= quantity;
}
```

## 11. Exception Handling

### 11.1 InsufficientStockException

Custom exception for inventory validation failures (AC-6):

```java
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
```

### 11.2 CartItemNotFoundException

Exception for cart item not found scenarios:

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(String message) {
        super(message);
    }
}
```

### 11.3 InvalidSubscriptionException

Exception for invalid subscription attempts:

```java
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidSubscriptionException extends RuntimeException {
    public InvalidSubscriptionException(String message) {
        super(message);
    }
}
```

### 11.4 MaxOrderQuantityExceededException

Exception for exceeding maximum order quantity:

```java
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class MaxOrderQuantityExceededException extends RuntimeException {
    public MaxOrderQuantityExceededException(String message) {
        super(message);
    }
}
```

### 11.5 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        ErrorResponse error = new ErrorResponse(
            "INSUFFICIENT_STOCK",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            "CART_ITEM_NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            "PRODUCT_NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(InvalidSubscriptionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSubscription(InvalidSubscriptionException ex) {
        ErrorResponse error = new ErrorResponse(
            "INVALID_SUBSCRIPTION",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(MaxOrderQuantityExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxOrderQuantityExceeded(MaxOrderQuantityExceededException ex) {
        ErrorResponse error = new ErrorResponse(
            "MAX_ORDER_QUANTITY_EXCEEDED",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
```

## 12. Validation Rules

### 12.1 Cart Item Validation

Input validation for cart item quantities (AC-3, AC-6):

```java
public class AddCartItemRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 9999, message = "Quantity cannot exceed 9999")
    private Integer quantity;
    
    private Boolean isSubscription;
}

public class UpdateCartItemRequest {
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 9999, message = "Quantity cannot exceed 9999")
    private Integer quantity;
}
```

### 12.2 Product Validation

Enhanced product validation with minimum quantity and subscription fields:

```java
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name cannot exceed 255 characters")
    private String name;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;
    
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQuantity;
    
    @Min(value = 1, message = "Minimum procurement threshold must be at least 1")
    private Integer minimumProcurementThreshold;
    
    private Boolean subscriptionEligible;
    
    @Min(value = 1, message = "Maximum order quantity must be at least 1")
    private Integer maxOrderQuantity;
}
```

## 13. Security

### 13.1 Cart Access Control

Cart access control to ensure users can only access their own carts:

```java
@Service
public class CartSecurityService {
    
    public void validateCartAccess(Long userId, Long cartId) {
        Cart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found"));
        
        if (!cart.getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("You do not have permission to access this cart");
        }
    }
    
    public void validateCartItemAccess(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new CartItemNotFoundException("Cart item not found"));
        
        Cart cart = cartRepository.findById(cartItem.getCartId())
            .orElseThrow(() -> new CartNotFoundException("Cart not found"));
        
        if (!cart.getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("You do not have permission to modify this cart item");
        }
    }
}
```

### 13.2 Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/products/**").permitAll()
                .requestMatchers("/api/cart/**").authenticated()
                .anyRequest().authenticated()
            )
            .csrf().disable();
        
        return http.build();
    }
}
```
