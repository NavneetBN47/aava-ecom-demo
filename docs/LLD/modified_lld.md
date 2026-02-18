# Low Level Design Document

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the e-commerce platform implementation, focusing on the shopping cart functionality and related components.

### 1.2 Scope
This document covers the detailed design of:
- Shopping Cart Management System
- Product Catalog Integration
- User Session Management
- Order Processing
- Payment Integration
- Inventory Management

### 1.3 Document Conventions
- All class names follow PascalCase convention
- Method names follow camelCase convention
- Database tables use snake_case naming
- API endpoints follow RESTful conventions

## 2. System Architecture

### 2.1 Component Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (React Frontend / Mobile App / Web Interface)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                     │
│         (Authentication, Rate Limiting, Routing)         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Cart Service │  │Product Service│  │Order Service │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ User Service │  │Payment Service│  │Inventory Svc │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                     │
│              (Repository Pattern, ORM)                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                        │
│    (PostgreSQL / MySQL / MongoDB for sessions)          │
└─────────────────────────────────────────────────────────┘
```

## 3. Shopping Cart Module - Detailed Design

### 3.1 Cart Service Class Design

#### 3.1.1 CartService Class
```java
public class CartService {
    private CartRepository cartRepository;
    private ProductService productService;
    private InventoryService inventoryService;
    private PricingService pricingService;
    private CacheManager cacheManager;
    
    // Constructor
    public CartService(CartRepository cartRepository, 
                      ProductService productService,
                      InventoryService inventoryService,
                      PricingService pricingService,
                      CacheManager cacheManager) {
        this.cartRepository = cartRepository;
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.pricingService = pricingService;
        this.cacheManager = cacheManager;
    }
    
    /**
     * Adds an item to the shopping cart
     * @param userId - User identifier
     * @param productId - Product identifier
     * @param quantity - Quantity to add
     * @return CartResponse with updated cart details
     * @throws ProductNotFoundException if product doesn't exist
     * @throws InsufficientInventoryException if stock unavailable
     */
    public CartResponse addItemToCart(String userId, String productId, int quantity) {
        // Validate product exists
        Product product = productService.getProductById(productId);
        if (product == null) {
            throw new ProductNotFoundException("Product not found: " + productId);
        }
        
        // Check inventory availability
        if (!inventoryService.checkAvailability(productId, quantity)) {
            throw new InsufficientInventoryException("Insufficient stock for product: " + productId);
        }
        
        // Get or create cart
        Cart cart = getOrCreateCart(userId);
        
        // Check if item already exists in cart
        CartItem existingItem = cart.findItemByProductId(productId);
        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            CartItem newItem = new CartItem(productId, product.getName(), 
                                           product.getPrice(), quantity);
            cart.addItem(newItem);
        }
        
        // Recalculate cart totals
        recalculateCart(cart);
        
        // Save cart
        cartRepository.save(cart);
        
        // Update cache
        cacheManager.put("cart:" + userId, cart);
        
        return new CartResponse(cart);
    }
    
    /**
     * Updates quantity of an item in cart
     * @param userId - User identifier
     * @param productId - Product identifier
     * @param quantity - New quantity
     * @return CartResponse with updated cart details
     */
    public CartResponse updateCartItem(String userId, String productId, int quantity) {
        Cart cart = getCart(userId);
        if (cart == null) {
            throw new CartNotFoundException("Cart not found for user: " + userId);
        }
        
        CartItem item = cart.findItemByProductId(productId);
        if (item == null) {
            throw new CartItemNotFoundException("Item not found in cart: " + productId);
        }
        
        // Check inventory for new quantity
        if (!inventoryService.checkAvailability(productId, quantity)) {
            throw new InsufficientInventoryException("Insufficient stock for requested quantity");
        }
        
        item.setQuantity(quantity);
        recalculateCart(cart);
        cartRepository.save(cart);
        cacheManager.put("cart:" + userId, cart);
        
        return new CartResponse(cart);
    }
    
    /**
     * Removes an item from cart
     * @param userId - User identifier
     * @param productId - Product identifier
     * @return CartResponse with updated cart details
     */
    public CartResponse removeItemFromCart(String userId, String productId) {
        Cart cart = getCart(userId);
        if (cart == null) {
            throw new CartNotFoundException("Cart not found for user: " + userId);
        }
        
        cart.removeItem(productId);
        recalculateCart(cart);
        cartRepository.save(cart);
        cacheManager.put("cart:" + userId, cart);
        
        return new CartResponse(cart);
    }
    
    /**
     * Retrieves current cart for user
     * @param userId - User identifier
     * @return CartResponse with cart details
     */
    public CartResponse getCart(String userId) {
        // Try cache first
        Cart cart = cacheManager.get("cart:" + userId, Cart.class);
        if (cart != null) {
            return new CartResponse(cart);
        }
        
        // Fetch from database
        cart = cartRepository.findByUserId(userId);
        if (cart != null) {
            cacheManager.put("cart:" + userId, cart);
            return new CartResponse(cart);
        }
        
        return new CartResponse(new Cart(userId));
    }
    
    /**
     * Clears all items from cart
     * @param userId - User identifier
     */
    public void clearCart(String userId) {
        Cart cart = getCart(userId);
        if (cart != null) {
            cart.clearItems();
            cartRepository.save(cart);
            cacheManager.evict("cart:" + userId);
        }
    }
    
    /**
     * Applies discount code to cart
     * @param userId - User identifier
     * @param discountCode - Discount code to apply
     * @return CartResponse with updated pricing
     */
    public CartResponse applyDiscount(String userId, String discountCode) {
        Cart cart = getCart(userId);
        if (cart == null) {
            throw new CartNotFoundException("Cart not found for user: " + userId);
        }
        
        Discount discount = pricingService.validateDiscount(discountCode);
        if (discount == null || !discount.isValid()) {
            throw new InvalidDiscountException("Invalid or expired discount code");
        }
        
        cart.setDiscountCode(discountCode);
        cart.setDiscount(discount);
        recalculateCart(cart);
        cartRepository.save(cart);
        cacheManager.put("cart:" + userId, cart);
        
        return new CartResponse(cart);
    }
    
    // Private helper methods
    private Cart getOrCreateCart(String userId) {
        Cart cart = cartRepository.findByUserId(userId);
        if (cart == null) {
            cart = new Cart(userId);
        }
        return cart;
    }
    
    private void recalculateCart(Cart cart) {
        BigDecimal subtotal = BigDecimal.ZERO;
        
        for (CartItem item : cart.getItems()) {
            BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
            item.setTotalPrice(itemTotal);
            subtotal = subtotal.add(itemTotal);
        }
        
        cart.setSubtotal(subtotal);
        
        // Apply discount if present
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (cart.getDiscount() != null) {
            discountAmount = pricingService.calculateDiscount(subtotal, cart.getDiscount());
        }
        cart.setDiscountAmount(discountAmount);
        
        // Calculate tax
        BigDecimal taxableAmount = subtotal.subtract(discountAmount);
        BigDecimal tax = pricingService.calculateTax(taxableAmount);
        cart.setTax(tax);
        
        // Calculate total
        BigDecimal total = taxableAmount.add(tax);
        cart.setTotal(total);
        
        cart.setLastUpdated(LocalDateTime.now());
    }
}
```

#### 3.1.2 Cart Domain Model
```java
public class Cart {
    private String cartId;
    private String userId;
    private List<CartItem> items;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal tax;
    private BigDecimal total;
    private String discountCode;
    private Discount discount;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private CartStatus status;
    
    // Constructor
    public Cart(String userId) {
        this.cartId = UUID.randomUUID().toString();
        this.userId = userId;
        this.items = new ArrayList<>();
        this.subtotal = BigDecimal.ZERO;
        this.discountAmount = BigDecimal.ZERO;
        this.tax = BigDecimal.ZERO;
        this.total = BigDecimal.ZERO;
        this.createdAt = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
        this.status = CartStatus.ACTIVE;
    }
    
    // Business methods
    public void addItem(CartItem item) {
        this.items.add(item);
    }
    
    public void removeItem(String productId) {
        this.items.removeIf(item -> item.getProductId().equals(productId));
    }
    
    public CartItem findItemByProductId(String productId) {
        return items.stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .orElse(null);
    }
    
    public void clearItems() {
        this.items.clear();
        this.subtotal = BigDecimal.ZERO;
        this.discountAmount = BigDecimal.ZERO;
        this.tax = BigDecimal.ZERO;
        this.total = BigDecimal.ZERO;
        this.discountCode = null;
        this.discount = null;
    }
    
    public int getTotalItemCount() {
        return items.stream()
            .mapToInt(CartItem::getQuantity)
            .sum();
    }
    
    // Getters and Setters
    // ... (standard getters and setters for all fields)
}
```

#### 3.1.3 CartItem Domain Model
```java
public class CartItem {
    private String itemId;
    private String productId;
    private String productName;
    private String productImage;
    private BigDecimal price;
    private int quantity;
    private BigDecimal totalPrice;
    private Map<String, String> attributes; // For variants like size, color
    private LocalDateTime addedAt;
    
    // Constructor
    public CartItem(String productId, String productName, BigDecimal price, int quantity) {
        this.itemId = UUID.randomUUID().toString();
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.quantity = quantity;
        this.totalPrice = price.multiply(new BigDecimal(quantity));
        this.attributes = new HashMap<>();
        this.addedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    // ... (standard getters and setters for all fields)
}
```

### 3.2 Database Schema

#### 3.2.1 Carts Table
```sql
CREATE TABLE carts (
    cart_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00,
    discount_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_last_updated (last_updated)
);
```

#### 3.2.2 Cart Items Table
```sql
CREATE TABLE cart_items (
    item_id VARCHAR(36) PRIMARY KEY,
    cart_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    attributes JSON,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);
```

### 3.3 API Endpoints

#### 3.3.1 Add Item to Cart
```
POST /api/v1/cart/items

Request Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Request Body:
{
    "productId": "prod_12345",
    "quantity": 2,
    "attributes": {
        "size": "M",
        "color": "Blue"
    }
}

Response (200 OK):
{
    "status": "success",
    "data": {
        "cartId": "cart_67890",
        "userId": "user_123",
        "items": [
            {
                "itemId": "item_111",
                "productId": "prod_12345",
                "productName": "T-Shirt",
                "price": 29.99,
                "quantity": 2,
                "totalPrice": 59.98,
                "attributes": {
                    "size": "M",
                    "color": "Blue"
                }
            }
        ],
        "subtotal": 59.98,
        "discountAmount": 0.00,
        "tax": 5.40,
        "total": 65.38,
        "itemCount": 2
    }
}

Error Responses:
- 404: Product not found
- 400: Insufficient inventory
- 401: Unauthorized
```

#### 3.3.2 Update Cart Item
```
PUT /api/v1/cart/items/{productId}

Request Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Request Body:
{
    "quantity": 3
}

Response (200 OK):
{
    "status": "success",
    "data": {
        // Updated cart object
    }
}
```

#### 3.3.3 Remove Item from Cart
```
DELETE /api/v1/cart/items/{productId}

Request Headers:
- Authorization: Bearer {token}

Response (200 OK):
{
    "status": "success",
    "message": "Item removed from cart",
    "data": {
        // Updated cart object
    }
}
```

#### 3.3.4 Get Cart
```
GET /api/v1/cart

Request Headers:
- Authorization: Bearer {token}

Response (200 OK):
{
    "status": "success",
    "data": {
        // Complete cart object
    }
}
```

#### 3.3.5 Clear Cart
```
DELETE /api/v1/cart

Request Headers:
- Authorization: Bearer {token}

Response (200 OK):
{
    "status": "success",
    "message": "Cart cleared successfully"
}
```

#### 3.3.6 Apply Discount
```
POST /api/v1/cart/discount

Request Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Request Body:
{
    "discountCode": "SUMMER2024"
}

Response (200 OK):
{
    "status": "success",
    "data": {
        // Updated cart with discount applied
    }
}
```

### 3.4 Repository Layer

#### 3.4.1 CartRepository Interface
```java
public interface CartRepository {
    Cart findByUserId(String userId);
    Cart findByCartId(String cartId);
    Cart save(Cart cart);
    void delete(String cartId);
    List<Cart> findInactiveCarts(LocalDateTime before);
    List<Cart> findByStatus(CartStatus status);
}
```

#### 3.4.2 CartRepositoryImpl
```java
@Repository
public class CartRepositoryImpl implements CartRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public Cart findByUserId(String userId) {
        String sql = "SELECT * FROM carts WHERE user_id = ? AND status = 'ACTIVE'";
        try {
            return jdbcTemplate.queryForObject(sql, new CartRowMapper(), userId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
    
    @Override
    public Cart save(Cart cart) {
        String sql = "INSERT INTO carts (cart_id, user_id, subtotal, discount_amount, " +
                    "tax, total, discount_code, status, created_at, last_updated) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "subtotal = ?, discount_amount = ?, tax = ?, total = ?, " +
                    "discount_code = ?, status = ?, last_updated = ?";
        
        jdbcTemplate.update(sql,
            cart.getCartId(), cart.getUserId(), cart.getSubtotal(),
            cart.getDiscountAmount(), cart.getTax(), cart.getTotal(),
            cart.getDiscountCode(), cart.getStatus().toString(),
            cart.getCreatedAt(), cart.getLastUpdated(),
            // For update
            cart.getSubtotal(), cart.getDiscountAmount(), cart.getTax(),
            cart.getTotal(), cart.getDiscountCode(), cart.getStatus().toString(),
            cart.getLastUpdated()
        );
        
        // Save cart items
        saveCartItems(cart);
        
        return cart;
    }
    
    private void saveCartItems(Cart cart) {
        // Delete existing items
        String deleteSql = "DELETE FROM cart_items WHERE cart_id = ?";
        jdbcTemplate.update(deleteSql, cart.getCartId());
        
        // Insert new items
        String insertSql = "INSERT INTO cart_items (item_id, cart_id, product_id, " +
                          "product_name, product_image, price, quantity, total_price, " +
                          "attributes, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        for (CartItem item : cart.getItems()) {
            jdbcTemplate.update(insertSql,
                item.getItemId(), cart.getCartId(), item.getProductId(),
                item.getProductName(), item.getProductImage(), item.getPrice(),
                item.getQuantity(), item.getTotalPrice(),
                convertAttributesToJson(item.getAttributes()), item.getAddedAt()
            );
        }
    }
    
    // Additional methods implementation...
}
```

## 4. Integration Points

### 4.1 Product Service Integration
```java
public interface ProductService {
    Product getProductById(String productId);
    List<Product> getProductsByIds(List<String> productIds);
    boolean isProductAvailable(String productId);
    ProductPrice getCurrentPrice(String productId);
}
```

### 4.2 Inventory Service Integration
```java
public interface InventoryService {
    boolean checkAvailability(String productId, int quantity);
    void reserveInventory(String productId, int quantity, String reservationId);
    void releaseInventory(String reservationId);
    int getAvailableQuantity(String productId);
}
```

### 4.3 Pricing Service Integration
```java
public interface PricingService {
    Discount validateDiscount(String discountCode);
    BigDecimal calculateDiscount(BigDecimal amount, Discount discount);
    BigDecimal calculateTax(BigDecimal amount);
    BigDecimal calculateShipping(Cart cart, Address address);
}
```

## 5. Caching Strategy

### 5.1 Cache Configuration
```java
@Configuration
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        RedisCacheManager cacheManager = RedisCacheManager.builder()
            .cacheDefaults(defaultCacheConfig())
            .withCacheConfiguration("cart", cartCacheConfig())
            .build();
        return cacheManager;
    }
    
    private RedisCacheConfiguration cartCacheConfig() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(24))
            .serializeValuesWith(SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()));
    }
}
```

### 5.2 Cache Keys
- Cart: `cart:{userId}`
- Cart Items: `cart:items:{cartId}`
- Product Prices: `product:price:{productId}`
- Inventory: `inventory:{productId}`

## 6. Error Handling

### 6.1 Exception Hierarchy
```java
public class CartException extends RuntimeException {
    private String errorCode;
    private HttpStatus httpStatus;
    
    public CartException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}

public class CartNotFoundException extends CartException {
    public CartNotFoundException(String message) {
        super(message, "CART_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}

public class ProductNotFoundException extends CartException {
    public ProductNotFoundException(String message) {
        super(message, "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}

public class InsufficientInventoryException extends CartException {
    public InsufficientInventoryException(String message) {
        super(message, "INSUFFICIENT_INVENTORY", HttpStatus.BAD_REQUEST);
    }
}

public class InvalidDiscountException extends CartException {
    public InvalidDiscountException(String message) {
        super(message, "INVALID_DISCOUNT", HttpStatus.BAD_REQUEST);
    }
}
```

### 6.2 Global Exception Handler
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(CartException.class)
    public ResponseEntity<ErrorResponse> handleCartException(CartException ex) {
        ErrorResponse error = new ErrorResponse(
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, ex.getHttpStatus());
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## 7. Security Considerations

### 7.1 Authentication & Authorization
- All cart endpoints require valid JWT token
- Users can only access their own carts
- Admin users can view any cart for support purposes

### 7.2 Data Validation
```java
public class CartValidator {
    
    public void validateAddItemRequest(AddItemRequest request) {
        if (request.getProductId() == null || request.getProductId().isEmpty()) {
            throw new ValidationException("Product ID is required");
        }
        
        if (request.getQuantity() <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }
        
        if (request.getQuantity() > 100) {
            throw new ValidationException("Quantity cannot exceed 100");
        }
    }
}
```

### 7.3 Rate Limiting
- Cart operations: 100 requests per minute per user
- Add to cart: 20 requests per minute per user

## 8. Performance Optimization

### 8.1 Database Indexing
- Index on `user_id` in carts table
- Index on `cart_id` in cart_items table
- Index on `product_id` in cart_items table
- Composite index on `(user_id, status)` in carts table

### 8.2 Query Optimization
- Use batch operations for multiple item updates
- Implement pagination for cart history
- Use database connection pooling

### 8.3 Caching Strategy
- Cache cart data for 24 hours
- Invalidate cache on cart updates
- Use Redis for distributed caching

## 9. Monitoring & Logging

### 9.1 Metrics to Track
- Cart creation rate
- Cart abandonment rate
- Average items per cart
- Cart to order conversion rate
- API response times
- Cache hit/miss ratio

### 9.2 Logging Strategy
```java
@Slf4j
public class CartService {
    
    public CartResponse addItemToCart(String userId, String productId, int quantity) {
        log.info("Adding item to cart - userId: {}, productId: {}, quantity: {}", 
                 userId, productId, quantity);
        
        try {
            // Business logic
            log.debug("Item added successfully to cart: {}", cartId);
            return response;
        } catch (Exception e) {
            log.error("Error adding item to cart - userId: {}, productId: {}", 
                     userId, productId, e);
            throw e;
        }
    }
}
```

## 10. Testing Strategy

### 10.1 Unit Tests
```java
@ExtendWith(MockitoExtension.class)
public class CartServiceTest {
    
    @Mock
    private CartRepository cartRepository;
    
    @Mock
    private ProductService productService;
    
    @Mock
    private InventoryService inventoryService;
    
    @InjectMocks
    private CartService cartService;
    
    @Test
    public void testAddItemToCart_Success() {
        // Arrange
        String userId = "user123";
        String productId = "prod456";
        int quantity = 2;
        
        Product product = new Product(productId, "Test Product", new BigDecimal("29.99"));
        when(productService.getProductById(productId)).thenReturn(product);
        when(inventoryService.checkAvailability(productId, quantity)).thenReturn(true);
        
        // Act
        CartResponse response = cartService.addItemToCart(userId, productId, quantity);
        
        // Assert
        assertNotNull(response);
        assertEquals(1, response.getItemCount());
        verify(cartRepository, times(1)).save(any(Cart.class));
    }
    
    @Test
    public void testAddItemToCart_ProductNotFound() {
        // Arrange
        String userId = "user123";
        String productId = "invalid";
        when(productService.getProductById(productId)).thenReturn(null);
        
        // Act & Assert
        assertThrows(ProductNotFoundException.class, () -> {
            cartService.addItemToCart(userId, productId, 1);
        });
    }
}
```

### 10.2 Integration Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
public class CartControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testAddItemToCart_Integration() throws Exception {
        String requestBody = "{"
            + "\"productId\": \"prod123\","
            + "\"quantity\": 2"
            + "}";
        
        mockMvc.perform(post("/api/v1/cart/items")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + getTestToken())
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.itemCount").value(2));
    }
}
```

## 11. Deployment Considerations

### 11.1 Environment Configuration
```yaml
# application.yml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}

cart:
  max-items: 100
  session-timeout: 86400 # 24 hours
  cache-ttl: 3600 # 1 hour
```

### 11.2 Scaling Strategy
- Horizontal scaling of application servers
- Database read replicas for cart retrieval
- Redis cluster for distributed caching
- Load balancer for traffic distribution

## 12. Future Enhancements

### 12.1 Planned Features
1. **Wishlist Integration**: Move items between cart and wishlist
2. **Save for Later**: Temporary storage for items
3. **Cart Sharing**: Share cart with other users
4. **Price Alerts**: Notify when cart items go on sale
5. **Abandoned Cart Recovery**: Email reminders for incomplete purchases
6. **Multi-currency Support**: Handle different currencies
7. **Guest Cart Migration**: Merge guest cart with user cart on login

### 12.2 Technical Improvements
1. Implement event-driven architecture for cart updates
2. Add GraphQL support for flexible data fetching
3. Implement real-time inventory updates via WebSocket
4. Add machine learning for personalized recommendations

## 13. Appendix

### 13.1 Glossary
- **Cart**: A temporary collection of items a user intends to purchase
- **Cart Item**: Individual product entry in a cart
- **Subtotal**: Sum of all item prices before discounts and tax
- **Discount**: Price reduction applied to cart
- **Tax**: Sales tax calculated on cart total

### 13.2 References
- REST API Design Best Practices
- Spring Boot Documentation
- Redis Caching Strategies
- E-commerce Design Patterns

### 13.3 Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-15 | Dev Team | Initial LLD document |
| 1.1 | 2024-02-01 | Dev Team | Added caching strategy |
| 1.2 | 2024-02-15 | Dev Team | Enhanced error handling |

---

**Document Status**: Approved
**Last Updated**: 2024-02-15
**Next Review Date**: 2024-03-15
