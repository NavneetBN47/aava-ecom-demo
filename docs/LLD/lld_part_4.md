## 13. Entity Classes

### 13.1 Product Entity

```java
@Entity
@Table(name = "products")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;
    
    @Column(length = 100)
    private String category;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    @Column(name = "minimum_order_quantity")
    private Integer minimumOrderQuantity = 1;
    
    @Column(name = "is_subscription_eligible")
    private Boolean isSubscriptionEligible = false;
    
    @Column(name = "subscription_price", precision = 10, scale = 2)
    private BigDecimal subscriptionPrice;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and setters
}
```

### 13.2 Cart Entity

```java
@Entity
@Table(name = "carts")
public class Cart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    @OneToMany(mappedBy = "cartId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and setters
}
```

### 13.3 Cart Item Entity

```java
@Entity
@Table(name = "cart_items", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"cart_id", "product_id"}))
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "cart_id", nullable = false)
    private Long cartId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(nullable = false)
    private Integer quantity = 1;
    
    @Column(name = "price_at_add", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtAdd;
    
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
    
    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
    
    // Getters and setters
}
```

---

## 14. Configuration Classes

### 14.1 Database Configuration

```java
@Configuration
@EnableJpaRepositories(basePackages = "com.ecommerce.repository")
@EnableTransactionManagement
public class DatabaseConfig {
    
    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(env.getProperty("spring.datasource.url"));
        config.setUsername(env.getProperty("spring.datasource.username"));
        config.setPassword(env.getProperty("spring.datasource.password"));
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        return new HikariDataSource(config);
    }
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan("com.ecommerce.entity");
        
        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);
        em.setJpaProperties(hibernateProperties());
        
        return em;
    }
    
    private Properties hibernateProperties() {
        Properties properties = new Properties();
        properties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        properties.put("hibernate.show_sql", "false");
        properties.put("hibernate.format_sql", "true");
        properties.put("hibernate.hbm2ddl.auto", "validate");
        properties.put("hibernate.jdbc.batch_size", "20");
        properties.put("hibernate.order_inserts", "true");
        properties.put("hibernate.order_updates", "true");
        
        return properties;
    }
    
    @Bean
    public PlatformTransactionManager transactionManager() {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory().getObject());
        return transactionManager;
    }
}
```

### 14.2 Web Configuration

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
    
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.defaultContentType(MediaType.APPLICATION_JSON);
    }
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return mapper;
    }
}
```

---

## 15. Testing Strategy

### 15.1 Unit Tests

```java
@ExtendWith(MockitoExtension.class)
public class CartServiceTest {
    
    @Mock
    private CartRepository cartRepository;
    
    @Mock
    private CartItemRepository cartItemRepository;
    
    @Mock
    private ProductService productService;
    
    @InjectMocks
    private CartServiceImpl cartService;
    
    @Test
    public void testAddItemToCart_NewCart() {
        // Given
        Long userId = 1L;
        Long productId = 100L;
        Integer quantity = 2;
        
        ProductDTO product = new ProductDTO();
        product.setId(productId);
        product.setPrice(new BigDecimal("29.99"));
        product.setStockQuantity(10);
        
        when(productService.getProductById(productId)).thenReturn(product);
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());
        
        Cart newCart = new Cart();
        newCart.setId(1L);
        newCart.setUserId(userId);
        when(cartRepository.save(any(Cart.class))).thenReturn(newCart);
        
        // When
        CartDTO result = cartService.addItemToCart(userId, productId, quantity);
        
        // Then
        assertNotNull(result);
        verify(cartRepository).save(any(Cart.class));
        verify(cartItemRepository).save(any(CartItem.class));
    }
    
    @Test
    public void testAddItemToCart_InsufficientStock() {
        // Given
        Long userId = 1L;
        Long productId = 100L;
        Integer quantity = 15;
        
        ProductDTO product = new ProductDTO();
        product.setId(productId);
        product.setStockQuantity(10);
        product.setName("Test Product");
        
        when(productService.getProductById(productId)).thenReturn(product);
        
        // When & Then
        assertThrows(InsufficientStockException.class, () -> {
            cartService.addItemToCart(userId, productId, quantity);
        });
    }
}
```

### 15.2 Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CartControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    public void testAddItemToCart_Success() throws Exception {
        AddCartItemRequest request = new AddCartItemRequest();
        request.setProductId(1L);
        request.setQuantity(2);
        
        mockMvc.perform(post("/api/cart/1/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalAmount").exists());
    }
    
    @Test
    public void testGetCart_EmptyCart() throws Exception {
        mockMvc.perform(get("/api/cart/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(999))
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.totalAmount").value(0));
    }
}
```

---

## 16. Performance Considerations

### 16.1 Database Optimization
- Indexes on frequently queried columns (user_id, product_id, category)
- Connection pooling with HikariCP
- Batch processing for bulk operations
- Pessimistic locking for inventory management

### 16.2 Caching Strategy
```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("products", "carts");
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(1000));
        return cacheManager;
    }
}

@Service
public class ProductServiceImpl implements ProductService {
    
    @Cacheable(value = "products", key = "#id")
    public ProductDTO getProductById(Long id) {
        // Implementation
    }
    
    @CacheEvict(value = "products", key = "#id")
    public void evictProductCache(Long id) {
        // Cache eviction
    }
}
```

### 16.3 Query Optimization
- Use pagination for list endpoints
- Implement lazy loading for relationships
- Use projections for read-only queries
- Optimize N+1 query problems with JOIN FETCH

---

## 17. Security Considerations

### 17.1 Input Validation
```java
public class AddCartItemRequest {
    
    @NotNull(message = "Product ID is required")
    @Positive(message = "Product ID must be positive")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100")
    private Integer quantity;
    
    // Getters and setters
}
```

### 17.2 Authorization
- Implement user authentication via JWT tokens
- Ensure users can only access their own carts
- Validate user ownership before cart operations

### 17.3 SQL Injection Prevention
- Use parameterized queries (JPA handles this)
- Validate and sanitize all user inputs
- Use @Query with named parameters

---

## 18. Monitoring and Logging

### 18.1 Logging Configuration
```java
@Slf4j
@Service
public class CartServiceImpl implements CartService {
    
    @Override
    public CartDTO addItemToCart(Long userId, Long productId, Integer quantity) {
        log.info("Adding item to cart - userId: {}, productId: {}, quantity: {}", 
                 userId, productId, quantity);
        
        try {
            // Implementation
            log.debug("Item successfully added to cart for user: {}", userId);
            return cartDTO;
        } catch (Exception e) {
            log.error("Error adding item to cart - userId: {}, productId: {}", 
                     userId, productId, e);
            throw e;
        }
    }
}
```

### 18.2 Metrics
- Track API response times
- Monitor database query performance
- Alert on high error rates
- Track cart abandonment rates

---
