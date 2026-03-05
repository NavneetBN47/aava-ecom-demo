## 19. Shopping Cart Performance Requirements

**Requirement Reference:** Story Summary - real-time price updates

### 19.1 Response Time Targets

**API Response Time SLAs:**

| Operation | Target Response Time | Maximum Response Time |
|-----------|---------------------|----------------------|
| Add to Cart | < 200ms | < 500ms |
| Get Cart | < 150ms | < 300ms |
| Update Quantity | < 200ms | < 500ms |
| Remove Item | < 150ms | < 300ms |
| Calculate Totals | < 100ms | < 200ms |

**Performance Monitoring:**
- Track P50, P95, and P99 response times
- Alert on response times exceeding thresholds
- Monitor database query performance

### 19.2 Scalability Requirements

**Concurrent Users:**
- Support 10,000 concurrent active carts
- Handle 1,000 cart operations per second
- Scale horizontally to handle peak loads

**Database Scalability:**
- Read replicas for cart retrieval operations
- Write master for cart modifications
- Connection pooling with minimum 20, maximum 100 connections

**Caching Strategy:**
- Cache product information for 5 minutes
- Cache cart data for 1 minute
- Use Redis for distributed caching

### 19.3 Performance Optimization Strategies

**Database Optimization:**
```sql
-- Optimize cart retrieval with covering index
CREATE INDEX idx_cart_user_updated ON carts(user_id, updated_at) 
INCLUDE (id, subtotal, tax, total);

-- Optimize cart items retrieval
CREATE INDEX idx_cart_items_cart_covering ON cart_items(cart_id) 
INCLUDE (product_id, product_name, unit_price, quantity, subtotal);
```

**Query Optimization:**
- Use JOIN FETCH to avoid N+1 query problem
- Implement pagination for large carts
- Use batch operations for multiple item updates

**Caching Implementation:**
```java
@Cacheable(value = "carts", key = "#cartId")
public Cart getCartById(Long cartId) {
    return cartRepository.findById(cartId)
        .orElseThrow(() -> new CartNotFoundException(cartId));
}

@CacheEvict(value = "carts", key = "#cart.id")
public Cart updateCart(Cart cart) {
    return cartRepository.save(cart);
}
```

**Asynchronous Processing:**
- Calculate shipping costs asynchronously
- Update product prices in background
- Send cart abandonment emails asynchronously

### 19.4 Load Testing Requirements

**Load Test Scenarios:**
1. **Normal Load:** 1,000 users, 100 operations/second
2. **Peak Load:** 5,000 users, 500 operations/second
3. **Stress Test:** 10,000 users, 1,000 operations/second
4. **Spike Test:** Sudden increase from 100 to 5,000 users

**Performance Metrics to Monitor:**
- Response time (average, P95, P99)
- Throughput (requests per second)
- Error rate (percentage of failed requests)
- CPU utilization
- Memory usage
- Database connection pool usage

### 19.5 Performance Monitoring and Alerting

**Monitoring Tools:**
- Application Performance Monitoring (APM) with New Relic or Datadog
- Database performance monitoring
- Real-time dashboards for cart operations

**Alert Thresholds:**
- Response time > 500ms for 5 consecutive minutes
- Error rate > 1% for 2 consecutive minutes
- Database connection pool > 80% utilization
- CPU utilization > 80% for 10 minutes

## 20. Shopping Cart Testing Strategy

**Requirement Reference:** Story Description - all acceptance criteria

### 20.1 Unit Testing for Cart Logic

**Test Coverage Requirements:**
- Minimum 80% code coverage
- 100% coverage for business logic methods
- All edge cases and error conditions tested

**Unit Test Examples:**

```java
@Test
public void testCalculateItemSubtotal_ValidInput_ReturnsCorrectSubtotal() {
    // Arrange
    BigDecimal unitPrice = new BigDecimal("29.99");
    Integer quantity = 3;
    BigDecimal expectedSubtotal = new BigDecimal("89.97");
    
    // Act
    BigDecimal actualSubtotal = calculationEngine.calculateItemSubtotal(unitPrice, quantity);
    
    // Assert
    assertEquals(expectedSubtotal, actualSubtotal);
}

@Test
public void testAddItemToCart_InsufficientStock_ThrowsException() {
    // Arrange
    Long cartId = 1L;
    Long productId = 456L;
    Integer quantity = 100;
    when(inventoryService.validateStock(productId, quantity))
        .thenReturn(ValidationResult.failure("Insufficient stock"));
    
    // Act & Assert
    assertThrows(InsufficientStockException.class, () -> {
        cartService.addItemToCart(cartId, productId, quantity);
    });
}

@Test
public void testUpdateItemQuantity_ValidQuantity_UpdatesCartTotals() {
    // Arrange
    Long itemId = 1L;
    Integer newQuantity = 5;
    CartItem item = createTestCartItem(itemId, new BigDecimal("29.99"), 2);
    when(cartItemRepository.findById(itemId)).thenReturn(Optional.of(item));
    
    // Act
    Cart updatedCart = cartService.updateItemQuantity(itemId, newQuantity);
    
    // Assert
    assertEquals(newQuantity, updatedCart.getItems().get(0).getQuantity());
    assertEquals(new BigDecimal("149.95"), updatedCart.getSubtotal());
}
```

### 20.2 Integration Testing for API Endpoints

**Integration Test Scenarios:**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class CartControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testAddToCart_ValidRequest_ReturnsCreated() throws Exception {
        // Arrange
        String requestBody = """{
            "cartId": 1,
            "productId": 456,
            "quantity": 2
        }""";
        
        // Act & Assert
        mockMvc.perform(post("/api/cart/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cartId").value(1))
                .andExpect(jsonPath("$.items[0].productId").value(456))
                .andExpect(jsonPath("$.items[0].quantity").value(2));
    }
    
    @Test
    public void testGetCart_ExistingCart_ReturnsCart() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/cart/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cartId").value(1))
                .andExpect(jsonPath("$.items").isArray());
    }
    
    @Test
    public void testUpdateCartItem_ValidQuantity_ReturnsUpdatedCart() throws Exception {
        // Arrange
        String requestBody = "{\"quantity\": 5}";
        
        // Act & Assert
        mockMvc.perform(put("/api/cart/item/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(5));
    }
    
    @Test
    public void testRemoveCartItem_ExistingItem_ReturnsUpdatedCart() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/cart/item/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }
}
```

### 20.3 End-to-End Testing for User Workflows

**E2E Test Scenarios:**

**Scenario 1: Complete Shopping Cart Flow**
```gherkin
Feature: Shopping Cart Complete Flow
  
  Scenario: User adds items, updates quantities, and proceeds to checkout
    Given user is on the product catalog page
    When user clicks "Add to Cart" for "Wireless Mouse"
    Then cart badge shows "1" item
    And success message "Product added to cart" is displayed
    
    When user navigates to cart page
    Then cart displays "Wireless Mouse" with quantity "1"
    And cart subtotal shows "$29.99"
    
    When user updates quantity to "3"
    Then item subtotal updates to "$89.97"
    And cart total updates to "$98.87" (including tax)
    
    When user clicks "Proceed to Checkout"
    Then user is redirected to checkout page
    And checkout page displays cart items and totals
```

**Scenario 2: Out of Stock Handling**
```gherkin
Feature: Out of Stock Product Handling
  
  Scenario: User attempts to add out-of-stock product
    Given product "USB Keyboard" is out of stock
    When user clicks "Add to Cart" for "USB Keyboard"
    Then error message "This product is currently out of stock" is displayed
    And product is not added to cart
    And cart badge remains unchanged
```

**Scenario 3: Empty Cart Display**
```gherkin
Feature: Empty Cart Display
  
  Scenario: User views empty cart
    Given user has no items in cart
    When user navigates to cart page
    Then empty cart message "Your cart is empty" is displayed
    And "Continue Shopping" button is visible
    And cart totals are not displayed
```

### 20.4 Test Data Management

**Test Data Setup:**
```java
@TestConfiguration
public class CartTestDataConfig {
    
    @Bean
    public Cart createTestCart() {
        Cart cart = new Cart();
        cart.setId(1L);
        cart.setUserId(100L);
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setTax(BigDecimal.ZERO);
        cart.setTotal(BigDecimal.ZERO);
        return cart;
    }
    
    @Bean
    public Product createTestProduct() {
        Product product = new Product();
        product.setId(456L);
        product.setName("Wireless Mouse");
        product.setPrice(new BigDecimal("29.99"));
        product.setStockQuantity(50);
        return product;
    }
}
```

### 20.5 Test Automation and CI/CD Integration

**Automated Test Execution:**
- Unit tests run on every commit
- Integration tests run on pull requests
- E2E tests run on staging deployment
- Performance tests run nightly

**CI/CD Pipeline Configuration:**
```yaml
# .github/workflows/cart-tests.yml
name: Shopping Cart Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up JDK 21
      uses: actions/setup-java@v2
      with:
        java-version: '21'
    
    - name: Run Unit Tests
      run: ./mvnw test
    
    - name: Run Integration Tests
      run: ./mvnw verify -P integration-tests
    
    - name: Generate Test Coverage Report
      run: ./mvnw jacoco:report
    
    - name: Upload Coverage to Codecov
      uses: codecov/codecov-action@v2
```

**Test Reporting:**
- JUnit test reports
- Code coverage reports (JaCoCo)
- Integration test results
- E2E test screenshots and videos
- Performance test metrics

---

## 21. Appendix

### 21.1 Glossary

- **Cart Session:** The duration during which a user's cart remains active and accessible
- **Item Subtotal:** The total price for a single cart item (unit price × quantity)
- **Cart Subtotal:** The sum of all item subtotals before taxes and fees
- **Tax Rate:** The percentage applied to the cart subtotal to calculate tax
- **Cart Total:** The final amount including subtotal, tax, and any additional fees
- **Inventory Reservation:** Temporary hold on product stock during checkout process
- **Cart Abandonment:** When a user adds items to cart but does not complete checkout

### 21.2 References

- Epic SCRUM-344: E-commerce Platform Development
- Story SCRUM-343: Shopping Cart Functionality Implementation
- Product Management System LLD (Sections 1-8)
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- REST API Best Practices: https://restfulapi.net/

### 21.3 Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-01-15 | Development Team | Initial Product Management LLD |
| 2.0 | 2024-01-15 | Development Team | Added Shopping Cart Module (Sections 9-20) |

---

**Document Status:** Complete  
**Last Updated:** 2024-01-15  
**Next Review Date:** 2024-02-15