# Low Level Design Document

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-commerce Platform. It translates the High Level Design into implementable components, defining the internal structure, algorithms, data models, and interfaces required for development.

### 1.2 Scope
This document covers:
- Detailed component architecture and class designs
- Database schema and data models
- API specifications and interfaces
- Business logic implementation details
- Security implementation
- Performance optimization strategies

Out of scope:
- Infrastructure deployment details (covered in deployment documentation)
- Third-party service integration specifics
- UI/UX implementation details

### 1.3 Definitions and Acronyms
- **LLD**: Low Level Design
- **HLD**: High Level Design
- **API**: Application Programming Interface
- **DTO**: Data Transfer Object
- **DAO**: Data Access Object
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control

## 2. System Architecture Overview

### 2.1 Technology Stack

#### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Build Tool**: Maven
- **ORM**: Spring Data JPA with Hibernate
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7.x
- **Message Queue**: RabbitMQ
- **Search Engine**: Elasticsearch 8.x

#### Security
- Spring Security 6.x
- JWT for authentication
- OAuth 2.0 for social login

#### Testing
- JUnit 5
- Mockito
- TestContainers

### 2.2 Package Structure

```
com.ecommerce
├── config
│   ├── SecurityConfig.java
│   ├── DatabaseConfig.java
│   ├── CacheConfig.java
│   └── MessagingConfig.java
├── controller
│   ├── UserController.java
│   ├── ProductController.java
│   ├── OrderController.java
│   └── PaymentController.java
├── service
│   ├── UserService.java
│   ├── ProductService.java
│   ├── OrderService.java
│   ├── PaymentService.java
│   └── NotificationService.java
├── repository
│   ├── UserRepository.java
│   ├── ProductRepository.java
│   ├── OrderRepository.java
│   └── PaymentRepository.java
├── model
│   ├── entity
│   │   ├── User.java
│   │   ├── Product.java
│   │   ├── Order.java
│   │   └── Payment.java
│   └── dto
│       ├── UserDTO.java
│       ├── ProductDTO.java
│       ├── OrderDTO.java
│       └── PaymentDTO.java
├── security
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
├── exception
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── BusinessException.java
└── util
    ├── ValidationUtil.java
    └── DateUtil.java
```

## 3. Data Models

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │       │   Product    │       │   Category  │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)     │
│ email       │       │ name         │───────│ name        │
│ password    │       │ description  │       │ description │
│ firstName   │       │ price        │       └─────────────┘
│ lastName    │       │ stock        │
│ role        │       │ category_id  │
└──────┬──────┘       └──────┬───────┘
       │                     │
       │                     │
       │    ┌────────────────┘
       │    │
       │    │
┌──────▼────▼──────┐
│      Order       │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ orderDate        │
│ status           │
│ totalAmount      │
└────────┬─────────┘
         │
         │
┌────────▼─────────┐       ┌──────────────┐
│   OrderItem      │       │   Payment    │
├──────────────────┤       ├──────────────┤
│ id (PK)          │       │ id (PK)      │
│ order_id (FK)    │───────│ order_id (FK)│
│ product_id (FK)  │       │ amount       │
│ quantity         │       │ method       │
│ price            │       │ status       │
└──────────────────┘       │ timestamp    │
                           └──────────────┘
```

### 3.2 Entity Classes

#### 3.2.1 User Entity

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @Email
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders;
    
    @Column(name = "created_at")
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
}
```

#### 3.2.2 Product Entity

```java
@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer stock;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    
    @OneToMany(mappedBy = "product")
    private List<OrderItem> orderItems;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "created_at")
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
}
```

#### 3.2.3 Order Entity

```java
@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
    
    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;
    
    @Column(name = "shipping_address")
    private String shippingAddress;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        orderDate = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### 3.2.4 OrderItem Entity

```java
@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
```

#### 3.2.5 Payment Entity

```java
@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
    
    @Column(name = "transaction_id")
    private String transactionId;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
```

### 3.3 Enumerations

```java
public enum UserRole {
    CUSTOMER,
    ADMIN,
    SELLER
}

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}

public enum PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    UPI,
    NET_BANKING,
    WALLET
}

public enum PaymentStatus {
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED
}
```

## 4. API Specifications

### 4.1 User Management APIs

#### 4.1.1 User Registration

```java
@PostMapping("/api/users/register")
public ResponseEntity<UserDTO> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
    UserDTO user = userService.registerUser(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(user);
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "createdAt": "2024-01-15T10:30:00"
}
```

#### 4.1.2 User Login

```java
@PostMapping("/api/users/login")
public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthResponse response = userService.authenticateUser(request);
    return ResponseEntity.ok(response);
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### 4.2 Product Management APIs

#### 4.2.1 Get All Products

```java
@GetMapping("/api/products")
public ResponseEntity<Page<ProductDTO>> getAllProducts(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(required = false) String category,
    @RequestParam(required = false) String search
) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ProductDTO> products = productService.getAllProducts(pageable, category, search);
    return ResponseEntity.ok(products);
}
```

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "stock": 50,
      "category": "Electronics",
      "imageUrl": "https://example.com/laptop.jpg"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 100,
  "totalPages": 10
}
```

#### 4.2.2 Create Product (Admin Only)

```java
@PostMapping("/api/products")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductRequest request) {
    ProductDTO product = productService.createProduct(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(product);
}
```

### 4.3 Order Management APIs

#### 4.3.1 Create Order

```java
@PostMapping("/api/orders")
public ResponseEntity<OrderDTO> createOrder(
    @Valid @RequestBody OrderRequest request,
    @AuthenticationPrincipal UserDetails userDetails
) {
    OrderDTO order = orderService.createOrder(request, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED).body(order);
}
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ],
  "shippingAddress": "123 Main St, City, State 12345"
}
```

**Response:**
```json
{
  "id": 1001,
  "orderDate": "2024-01-15T14:30:00",
  "status": "PENDING",
  "totalAmount": 2999.97,
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "quantity": 2,
      "price": 999.99,
      "subtotal": 1999.98
    },
    {
      "productId": 3,
      "productName": "Mouse",
      "quantity": 1,
      "price": 999.99,
      "subtotal": 999.99
    }
  ],
  "shippingAddress": "123 Main St, City, State 12345"
}
```

#### 4.3.2 Get Order by ID

```java
@GetMapping("/api/orders/{orderId}")
public ResponseEntity<OrderDTO> getOrder(
    @PathVariable Long orderId,
    @AuthenticationPrincipal UserDetails userDetails
) {
    OrderDTO order = orderService.getOrderById(orderId, userDetails.getUsername());
    return ResponseEntity.ok(order);
}
```

### 4.4 Payment APIs

#### 4.4.1 Process Payment

```java
@PostMapping("/api/payments")
public ResponseEntity<PaymentDTO> processPayment(
    @Valid @RequestBody PaymentRequest request,
    @AuthenticationPrincipal UserDetails userDetails
) {
    PaymentDTO payment = paymentService.processPayment(request, userDetails.getUsername());
    return ResponseEntity.ok(payment);
}
```

**Request Body:**
```json
{
  "orderId": 1001,
  "method": "CREDIT_CARD",
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "id": 5001,
  "orderId": 1001,
  "amount": 2999.97,
  "method": "CREDIT_CARD",
  "status": "COMPLETED",
  "transactionId": "TXN123456789",
  "timestamp": "2024-01-15T14:35:00"
}
```

## 5. Service Layer Implementation

### 5.1 UserService

```java
@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    
    public UserService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }
    
    public UserDTO registerUser(UserRegistrationRequest request) {
        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered");
        }
        
        // Create user entity
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(UserRole.CUSTOMER);
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Convert to DTO and return
        return convertToDTO(savedUser);
    }
    
    public AuthResponse authenticateUser(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException("Invalid credentials"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Invalid credentials");
        }
        
        // Generate JWT token
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole());
        
        // Create response
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setType("Bearer");
        response.setExpiresIn(3600);
        response.setUser(convertToDTO(user));
        
        return response;
    }
    
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
```

### 5.2 ProductService

```java
@Service
@Transactional(readOnly = true)
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    
    public ProductService(ProductRepository productRepository,
                         CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }
    
    public Page<ProductDTO> getAllProducts(Pageable pageable, String category, String search) {
        Page<Product> products;
        
        if (search != null && !search.isEmpty()) {
            products = productRepository.searchProducts(search, pageable);
        } else if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategoryName(category, pageable);
        } else {
            products = productRepository.findAll(pageable);
        }
        
        return products.map(this::convertToDTO);
    }
    
    @Transactional
    public ProductDTO createProduct(ProductRequest request) {
        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        // Create product
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());
        
        // Save product
        Product savedProduct = productRepository.save(product);
        
        return convertToDTO(savedProduct);
    }
    
    @Transactional
    public void updateStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        int newStock = product.getStock() - quantity;
        if (newStock < 0) {
            throw new BusinessException("Insufficient stock");
        }
        
        product.setStock(newStock);
        productRepository.save(product);
    }
    
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStock(product.getStock());
        dto.setCategory(product.getCategory().getName());
        dto.setImageUrl(product.getImageUrl());
        return dto;
    }
}
```

### 5.3 OrderService

```java
@Service
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    
    public OrderService(OrderRepository orderRepository,
                       UserRepository userRepository,
                       ProductService productService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }
    
    public OrderDTO createOrder(OrderRequest request, String userEmail) {
        // Find user
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setShippingAddress(request.getShippingAddress());
        
        // Process order items
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        for (OrderItemRequest itemRequest : request.getItems()) {
            // Get product
            Product product = productService.getProductEntity(itemRequest.getProductId());
            
            // Validate stock
            if (product.getStock() < itemRequest.getQuantity()) {
                throw new BusinessException("Insufficient stock for product: " + product.getName());
            }
            
            // Create order item
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(product.getPrice());
            
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
            
            // Update product stock
            productService.updateStock(product.getId(), itemRequest.getQuantity());
        }
        
        order.setOrderItems(orderItems);
        order.setTotalAmount(totalAmount);
        
        // Save order
        Order savedOrder = orderRepository.save(order);
        
        return convertToDTO(savedOrder);
    }
    
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        // Verify order belongs to user
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException("Unauthorized access to order");
        }
        
        return convertToDTO(order);
    }
    
    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        order.setStatus(status);
        orderRepository.save(order);
    }
    
    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());
        
        List<OrderItemDTO> itemDTOs = order.getOrderItems().stream()
            .map(this::convertItemToDTO)
            .collect(Collectors.toList());
        dto.setItems(itemDTOs);
        
        return dto;
    }
    
    private OrderItemDTO convertItemToDTO(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setSubtotal(item.getSubtotal());
        return dto;
    }
}
```

### 5.4 PaymentService

```java
@Service
@Transactional
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    
    public PaymentService(PaymentRepository paymentRepository,
                         OrderRepository orderRepository,
                         OrderService orderService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }
    
    public PaymentDTO processPayment(PaymentRequest request, String userEmail) {
        // Find order
        Order order = orderRepository.findById(request.getOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        // Verify order belongs to user
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException("Unauthorized access to order");
        }
        
        // Verify order status
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException("Order is not in pending status");
        }
        
        // Create payment
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setMethod(request.getMethod());
        
        try {
            // Process payment with payment gateway
            String transactionId = processWithPaymentGateway(request);
            
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setTransactionId(transactionId);
            
            // Update order status
            orderService.updateOrderStatus(order.getId(), OrderStatus.CONFIRMED);
            
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            throw new BusinessException("Payment processing failed: " + e.getMessage());
        }
        
        // Save payment
        Payment savedPayment = paymentRepository.save(payment);
        
        return convertToDTO(savedPayment);
    }
    
    private String processWithPaymentGateway(PaymentRequest request) {
        // Integration with payment gateway
        // This is a placeholder - actual implementation would call external API
        return "TXN" + System.currentTimeMillis();
    }
    
    private PaymentDTO convertToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setOrderId(payment.getOrder().getId());
        dto.setAmount(payment.getAmount());
        dto.setMethod(payment.getMethod());
        dto.setStatus(payment.getStatus());
        dto.setTransactionId(payment.getTransactionId());
        dto.setTimestamp(payment.getTimestamp());
        return dto;
    }
}
```

## 6. Security Implementation

### 6.1 JWT Token Provider

```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    public String generateToken(String email, UserRole role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
            .setSubject(email)
            .claim("role", role.name())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();
        
        return claims.getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### 6.2 JWT Authentication Filter

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                  CustomUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            
            if (jwt != null && tokenProvider.validateToken(jwt)) {
                String email = tokenProvider.getEmailFromToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Could not set user authentication in security context", e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 6.3 Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                         CustomUserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/users/register", "/api/users/login").permitAll()
                .requestMatchers("/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
```

## 7. Exception Handling

### 7.1 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            LocalDateTime.now(),
            errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

### 7.2 Custom Exceptions

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}

@Data
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, String> errors;
    
    public ErrorResponse(int status, String message, LocalDateTime timestamp) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }
}
```

## 8. Performance Considerations

### 8.1 Database Optimization

#### 8.1.1 Indexing Strategy

```sql
-- User table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Product table indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);

-- Order table indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);

-- Payment table indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### 8.1.2 Query Optimization

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategory(@Param("id") Long id);
    
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
}
```

### 8.3 Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

## 9. Testing Strategy

### 9.1 Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private JwtTokenProvider tokenProvider;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void testRegisterUser_Success() {
        // Arrange
        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setFirstName("John");
        request.setLastName("Doe");
        
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        
        // Act
        UserDTO result = userService.registerUser(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }
    
    @Test
    void testRegisterUser_EmailAlreadyExists() {
        // Arrange
        UserRegistrationRequest request = new UserRegistrationRequest();
        request.setEmail("existing@example.com");
        
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        
        // Act & Assert
        assertThrows(BusinessException.class, () -> userService.registerUser(request));
    }
}
```

### 9.2 Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class OrderControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @Test
    void testCreateOrder_Success() throws Exception {
        // Arrange
        OrderRequest request = new OrderRequest();
        // ... set up request
        
        String token = "Bearer valid-jwt-token";
        
        // Act & Assert
        mockMvc.perform(post("/api/orders")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.status").value("PENDING"));
    }
}
```

## 10. Logging and Monitoring

### 10.1 Logging Configuration

```java
@Slf4j
@Service
public class OrderService {
    
    public OrderDTO createOrder(OrderRequest request, String userEmail) {
        log.info("Creating order for user: {}", userEmail);
        
        try {
            // Order creation logic
            OrderDTO order = processOrder(request, userEmail);
            
            log.info("Order created successfully. Order ID: {}", order.getId());
            return order;
            
        } catch (Exception e) {
            log.error("Error creating order for user: {}", userEmail, e);
            throw e;
        }
    }
}
```

### 10.2 Application Monitoring

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

## 11. Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the E-commerce Platform. It covers all essential components including data models, API specifications, service implementations, security measures, and performance optimizations. The design follows industry best practices and ensures scalability, maintainability, and security of the application.