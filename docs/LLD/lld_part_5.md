## 12. Monitoring & Logging

### 12.1 Logging Strategy

```java
@Slf4j
@Service
public class CartService {
    
    public CartDTO addItemToCart(Long userId, AddCartItemRequest request) {
        log.info("Adding item to cart - userId: {}, productId: {}, quantity: {}", 
                 userId, request.getProductId(), request.getQuantity());
        
        try {
            // Business logic
            log.debug("Cart item added successfully - userId: {}, itemId: {}", userId, item.getId());
            return cartDTO;
        } catch (Exception e) {
            log.error("Error adding item to cart - userId: {}, productId: {}", 
                     userId, request.getProductId(), e);
            throw e;
        }
    }
}
```

### 12.2 Metrics Collection

1. **Application Metrics**
   - Request count and latency per endpoint
   - Error rate per endpoint
   - Active user sessions
   - Cart operations per minute

2. **Business Metrics**
   - Cart abandonment rate
   - Average cart value
   - Conversion rate (cart to order)
   - Popular products in carts

3. **System Metrics**
   - CPU and memory usage
   - Database connection pool stats
   - Cache hit/miss ratio
   - API response times

## 13. Testing Strategy

### 13.1 Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class CartServiceTest {
    
    @Mock
    private CartRepository cartRepository;
    
    @Mock
    private ProductService productService;
    
    @Mock
    private InventoryService inventoryService;
    
    @InjectMocks
    private CartService cartService;
    
    @Test
    void testAddItemToCart_Success() {
        // Given
        Long userId = 1L;
        AddCartItemRequest request = new AddCartItemRequest();
        request.setProductId(100L);
        request.setQuantity(2);
        
        Cart cart = new Cart();
        cart.setUserId(userId);
        
        ProductDTO product = new ProductDTO();
        product.setId(100L);
        product.setPrice(new BigDecimal("29.99"));
        product.setActive(true);
        
        InventoryDTO inventory = new InventoryDTO();
        inventory.setAvailableQuantity(10);
        
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(productService.getProductById(100L)).thenReturn(product);
        when(inventoryService.getInventoryByProductId(100L)).thenReturn(inventory);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        
        // When
        CartDTO result = cartService.addItemToCart(userId, request);
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        verify(cartRepository).save(any(Cart.class));
    }
    
    @Test
    void testAddItemToCart_InsufficientInventory() {
        // Given
        Long userId = 1L;
        AddCartItemRequest request = new AddCartItemRequest();
        request.setProductId(100L);
        request.setQuantity(20);
        
        Cart cart = new Cart();
        cart.setUserId(userId);
        
        ProductDTO product = new ProductDTO();
        product.setId(100L);
        product.setActive(true);
        
        InventoryDTO inventory = new InventoryDTO();
        inventory.setAvailableQuantity(5);
        
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(productService.getProductById(100L)).thenReturn(product);
        when(inventoryService.getInventoryByProductId(100L)).thenReturn(inventory);
        
        // When & Then
        assertThrows(InsufficientInventoryException.class, 
                    () -> cartService.addItemToCart(userId, request));
    }
}
```

### 13.2 Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class CartControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void testAddItemToCart_Integration() throws Exception {
        AddCartItemRequest request = new AddCartItemRequest();
        request.setProductId(1L);
        request.setQuantity(2);
        
        mockMvc.perform(post("/api/v1/cart/1/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", "Bearer " + getValidToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].productId").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(2));
    }
}
```

### 13.3 Performance Tests

```java
@Test
void testCartPerformance() {
    int iterations = 1000;
    long startTime = System.currentTimeMillis();
    
    for (int i = 0; i < iterations; i++) {
        cartService.getCartByUserId(1L);
    }
    
    long endTime = System.currentTimeMillis();
    long avgTime = (endTime - startTime) / iterations;
    
    assertTrue(avgTime < 50, "Average response time should be less than 50ms");
}
```

## 14. Deployment Configuration

### 14.1 Application Properties

```yaml
spring:
  application:
    name: ecommerce-platform
  
  datasource:
    url: jdbc:postgresql://localhost:5432/ecommerce
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
  
  cache:
    type: redis
    redis:
      time-to-live: 3600000

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

logging:
  level:
    root: INFO
    com.ecommerce: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/ecommerce.log
    max-size: 10MB
    max-history: 30
```

### 14.2 Docker Configuration

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/ecommerce-platform.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 14.3 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      DB_USERNAME: ecommerce_user
      DB_PASSWORD: secure_password
      REDIS_HOST: redis
      JWT_SECRET: your_jwt_secret_key
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

## 15. API Rate Limiting

### 15.1 Rate Limiter Configuration

```java
@Configuration
public class RateLimitConfig {
    
    @Bean
    public RateLimiter rateLimiter() {
        return RateLimiter.create(100.0); // 100 requests per second
    }
}

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    @Autowired
    private RateLimiter rateLimiter;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!rateLimiter.tryAcquire()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return false;
        }
        return true;
    }
}
```

## 16. Scheduled Jobs

### 16.1 Cart Cleanup Job

```java
@Component
@Slf4j
public class CartCleanupJob {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    public void cleanupExpiredCarts() {
        log.info("Starting cart cleanup job");
        LocalDateTime expiryDate = LocalDateTime.now().minusDays(30);
        
        try {
            cartRepository.deleteExpiredCarts(expiryDate);
            log.info("Cart cleanup job completed successfully");
        } catch (Exception e) {
            log.error("Error during cart cleanup job", e);
        }
    }
}
```

### 16.2 Inventory Sync Job

```java
@Component
@Slf4j
public class InventorySyncJob {
    
    @Autowired
    private InventoryService inventoryService;
    
    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void syncInventory() {
        log.info("Starting inventory sync job");
        
        try {
            inventoryService.syncWithExternalSystem();
            log.info("Inventory sync job completed successfully");
        } catch (Exception e) {
            log.error("Error during inventory sync job", e);
        }
    }
}
```

## 17. Disaster Recovery

### 17.1 Backup Strategy

1. **Database Backups**
   - Full backup daily at 1 AM
   - Incremental backups every 6 hours
   - Backups retained for 30 days
   - Backups stored in S3 with encryption

2. **Application State**
   - Redis snapshots every hour
   - Session data replicated across instances
   - Cart data persisted to database

3. **Recovery Procedures**
   - RTO (Recovery Time Objective): 1 hour
   - RPO (Recovery Point Objective): 6 hours
   - Automated recovery scripts
   - Regular disaster recovery drills

### 17.2 High Availability

1. **Application Layer**
   - Multiple application instances behind load balancer
   - Auto-scaling based on CPU and memory
   - Health checks every 30 seconds
   - Graceful shutdown handling

2. **Database Layer**
   - PostgreSQL with streaming replication
   - Automatic failover to standby
   - Read replicas for read-heavy operations

3. **Cache Layer**
   - Redis Sentinel for high availability
   - Automatic failover
   - Data replication across nodes

## 18. Conclusion

This Low Level Design document provides comprehensive technical specifications for the E-Commerce Platform, with detailed focus on the Shopping Cart system. The design ensures:

- **Scalability**: Horizontal scaling capability for all components
- **Reliability**: Robust error handling and recovery mechanisms
- **Performance**: Optimized database queries and caching strategies
- **Security**: Multi-layered security with authentication and authorization
- **Maintainability**: Clean architecture with separation of concerns
- **Testability**: Comprehensive testing strategy at all levels

The implementation follows industry best practices and design patterns, ensuring a production-ready system that can handle high traffic and provide excellent user experience.

## 19. Appendix

### 19.1 Glossary

- **Cart**: A temporary container for products that a user intends to purchase
- **Cart Item**: An individual product entry in a cart with quantity and price
- **SKU**: Stock Keeping Unit - unique identifier for a product
- **Inventory**: Available stock quantity for products
- **Order**: A confirmed purchase request from a user
- **Payment**: Financial transaction for an order
- **JWT**: JSON Web Token for authentication

### 19.2 References

- Spring Boot Documentation: https://spring.io/projects/spring-boot
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Redis Documentation: https://redis.io/documentation
- REST API Best Practices: https://restfulapi.net/
- Mermaid Diagram Syntax: https://mermaid-js.github.io/

### 19.3 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|  
| 1.0 | 2024-01-15 | Development Team | Initial LLD document with complete shopping cart implementation |