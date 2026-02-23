# Low Level Design Document

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-commerce Platform. It translates the High Level Design into implementable components, defining the internal structure, algorithms, and interactions of each module.

### 1.2 Scope
This document covers:
- Detailed class designs and relationships
- Database schema specifications
- API endpoint definitions
- Algorithm implementations
- Security implementations
- Error handling mechanisms

### 1.3 Definitions and Acronyms
- **LLD**: Low Level Design
- **HLD**: High Level Design
- **API**: Application Programming Interface
- **DTO**: Data Transfer Object
- **DAO**: Data Access Object
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control

## 2. System Architecture Details

### 2.1 Technology Stack

#### Backend
- **Framework**: Spring Boot 3.1.x
- **Language**: Java 17
- **Build Tool**: Maven 3.8+
- **ORM**: Hibernate 6.x
- **Security**: Spring Security 6.x
- **API Documentation**: SpringDoc OpenAPI 3.x

#### Frontend
- **Framework**: React 18.x
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI 5.x
- **HTTP Client**: Axios
- **Routing**: React Router 6.x

#### Database
- **Primary**: PostgreSQL 15.x
- **Cache**: Redis 7.x
- **Search**: Elasticsearch 8.x

#### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins/GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

### 2.2 Project Structure

```
ecommerce-platform/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── ecommerce/
│   │   │   │           ├── config/
│   │   │   │           ├── controller/
│   │   │   │           ├── service/
│   │   │   │           ├── repository/
│   │   │   │           ├── model/
│   │   │   │           ├── dto/
│   │   │   │           ├── exception/
│   │   │   │           ├── security/
│   │   │   │           └── util/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/
│   │   │           └── migration/
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── docker-compose.yml
```

## 3. Detailed Component Design

### 3.1 User Management Module

#### 3.1.1 User Entity

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
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Column(unique = true)
    private String phoneNumber;
    
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Address> addresses;
    
    @OneToMany(mappedBy = "user")
    private List<Order> orders;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

#### 3.1.2 User Repository

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    
    @Query("SELECT u FROM User u WHERE u.status = :status AND u.createdAt > :date")
    List<User> findRecentActiveUsers(@Param("status") UserStatus status, 
                                      @Param("date") LocalDateTime date);
}
```

#### 3.1.3 User Service

```java
@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    public UserDTO registerUser(UserRegistrationDTO registrationDTO) {
        // Validate input
        validateRegistrationData(registrationDTO);
        
        // Check if user exists
        if (userRepository.existsByEmail(registrationDTO.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }
        
        // Create user entity
        User user = new User();
        user.setEmail(registrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setFirstName(registrationDTO.getFirstName());
        user.setLastName(registrationDTO.getLastName());
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Send welcome email
        emailService.sendWelcomeEmail(savedUser.getEmail());
        
        return convertToDTO(savedUser);
    }
    
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        return convertToDTO(user);
    }
    
    public UserDTO updateUser(Long id, UserUpdateDTO updateDTO) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Update fields
        if (updateDTO.getFirstName() != null) {
            user.setFirstName(updateDTO.getFirstName());
        }
        if (updateDTO.getLastName() != null) {
            user.setLastName(updateDTO.getLastName());
        }
        if (updateDTO.getPhoneNumber() != null) {
            user.setPhoneNumber(updateDTO.getPhoneNumber());
        }
        
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }
    
    private void validateRegistrationData(UserRegistrationDTO dto) {
        if (!EmailValidator.isValid(dto.getEmail())) {
            throw new InvalidInputException("Invalid email format");
        }
        if (!PasswordValidator.isStrong(dto.getPassword())) {
            throw new InvalidInputException("Password does not meet requirements");
        }
    }
    
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .status(user.getStatus())
            .build();
    }
}
```

#### 3.1.4 User Controller

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDTO>> registerUser(
            @Valid @RequestBody UserRegistrationDTO registrationDTO) {
        UserDTO user = userService.registerUser(registrationDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(user, "User registered successfully"));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDTO updateDTO) {
        UserDTO user = userService.updateUser(id, updateDTO);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }
}
```

### 3.2 Product Management Module

#### 3.2.1 Product Entity

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
    private Integer stockQuantity;
    
    private String sku;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductImage> images;
    
    @OneToMany(mappedBy = "product")
    private List<Review> reviews;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @Transient
    public Double getAverageRating() {
        if (reviews == null || reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
            .mapToInt(Review::getRating)
            .average()
            .orElse(0.0);
    }
}
```

#### 3.2.2 Product Service

```java
@Service
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ElasticsearchService elasticsearchService;
    private final CacheManager cacheManager;
    
    @Cacheable(value = "products", key = "#id")
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        return convertToDTO(product);
    }
    
    public Page<ProductDTO> searchProducts(ProductSearchCriteria criteria, Pageable pageable) {
        // Use Elasticsearch for full-text search
        if (criteria.hasSearchQuery()) {
            return elasticsearchService.searchProducts(criteria, pageable);
        }
        
        // Use database for filtered queries
        Specification<Product> spec = ProductSpecification.withCriteria(criteria);
        Page<Product> products = productRepository.findAll(spec, pageable);
        return products.map(this::convertToDTO);
    }
    
    @CacheEvict(value = "products", key = "#result.id")
    public ProductDTO createProduct(ProductCreateDTO createDTO) {
        // Validate category
        Category category = categoryRepository.findById(createDTO.getCategoryId())
            .orElseThrow(() -> new CategoryNotFoundException("Category not found"));
        
        // Create product
        Product product = new Product();
        product.setName(createDTO.getName());
        product.setDescription(createDTO.getDescription());
        product.setPrice(createDTO.getPrice());
        product.setStockQuantity(createDTO.getStockQuantity());
        product.setSku(generateSKU());
        product.setCategory(category);
        product.setActive(true);
        
        Product savedProduct = productRepository.save(product);
        
        // Index in Elasticsearch
        elasticsearchService.indexProduct(savedProduct);
        
        return convertToDTO(savedProduct);
    }
    
    @CacheEvict(value = "products", key = "#id")
    public ProductDTO updateProduct(Long id, ProductUpdateDTO updateDTO) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        
        // Update fields
        if (updateDTO.getName() != null) {
            product.setName(updateDTO.getName());
        }
        if (updateDTO.getDescription() != null) {
            product.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getPrice() != null) {
            product.setPrice(updateDTO.getPrice());
        }
        if (updateDTO.getStockQuantity() != null) {
            product.setStockQuantity(updateDTO.getStockQuantity());
        }
        
        Product updatedProduct = productRepository.save(product);
        
        // Update Elasticsearch index
        elasticsearchService.updateProduct(updatedProduct);
        
        return convertToDTO(updatedProduct);
    }
    
    public void updateStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        
        int newQuantity = product.getStockQuantity() + quantity;
        if (newQuantity < 0) {
            throw new InsufficientStockException("Insufficient stock available");
        }
        
        product.setStockQuantity(newQuantity);
        productRepository.save(product);
    }
    
    private String generateSKU() {
        return "PRD-" + System.currentTimeMillis() + "-" + 
               RandomStringUtils.randomAlphanumeric(6).toUpperCase();
    }
    
    private ProductDTO convertToDTO(Product product) {
        return ProductDTO.builder()
            .id(product.getId())
            .name(product.getName())
            .description(product.getDescription())
            .price(product.getPrice())
            .stockQuantity(product.getStockQuantity())
            .sku(product.getSku())
            .categoryId(product.getCategory().getId())
            .categoryName(product.getCategory().getName())
            .averageRating(product.getAverageRating())
            .active(product.getActive())
            .build();
    }
}
```

### 3.3 Order Management Module

#### 3.3.1 Order Entity

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
    
    @Column(unique = true, nullable = false)
    private String orderNumber;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @Column(nullable = false)
    private BigDecimal subtotal;
    
    @Column(nullable = false)
    private BigDecimal tax;
    
    @Column(nullable = false)
    private BigDecimal shippingCost;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    @ManyToOne
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;
    
    @ManyToOne
    @JoinColumn(name = "billing_address_id")
    private Address billingAddress;
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private LocalDateTime deliveredAt;
    
    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }
    
    public void calculateTotals() {
        this.subtotal = orderItems.stream()
            .map(OrderItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        this.tax = subtotal.multiply(new BigDecimal("0.10")); // 10% tax
        this.totalAmount = subtotal.add(tax).add(shippingCost);
    }
}
```

#### 3.3.2 Order Service

```java
@Service
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    
    public OrderDTO createOrder(OrderCreateDTO createDTO, Long userId) {
        // Validate user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Create order
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setShippingCost(calculateShippingCost(createDTO));
        
        // Add order items
        for (OrderItemDTO itemDTO : createDTO.getItems()) {
            ProductDTO product = productService.getProductById(itemDTO.getProductId());
            
            // Check stock availability
            if (product.getStockQuantity() < itemDTO.getQuantity()) {
                throw new InsufficientStockException(
                    "Insufficient stock for product: " + product.getName());
            }
            
            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(convertToEntity(product));
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setPrice(product.getPrice());
            orderItem.setSubtotal(product.getPrice()
                .multiply(new BigDecimal(itemDTO.getQuantity())));
            
            order.addOrderItem(orderItem);
        }
        
        // Calculate totals
        order.calculateTotals();
        
        // Set addresses
        order.setShippingAddress(getAddress(createDTO.getShippingAddressId()));
        order.setBillingAddress(getAddress(createDTO.getBillingAddressId()));
        
        // Save order
        Order savedOrder = orderRepository.save(order);
        
        // Update product stock
        for (OrderItem item : savedOrder.getOrderItems()) {
            productService.updateStock(item.getProduct().getId(), -item.getQuantity());
        }
        
        // Send order confirmation
        notificationService.sendOrderConfirmation(savedOrder);
        
        return convertToDTO(savedOrder);
    }
    
    public OrderDTO getOrderById(Long id, Long userId) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException("Order not found"));
        
        // Verify order belongs to user
        if (!order.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Access denied");
        }
        
        return convertToDTO(order);
    }
    
    public List<OrderDTO> getUserOrders(Long userId, Pageable pageable) {
        Page<Order> orders = orderRepository.findByUserId(userId, pageable);
        return orders.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found"));
        
        // Validate status transition
        validateStatusTransition(order.getStatus(), newStatus);
        
        order.setStatus(newStatus);
        
        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        
        Order updatedOrder = orderRepository.save(order);
        
        // Send status update notification
        notificationService.sendOrderStatusUpdate(updatedOrder);
        
        return convertToDTO(updatedOrder);
    }
    
    public void cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found"));
        
        // Verify order belongs to user
        if (!order.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Access denied");
        }
        
        // Check if order can be cancelled
        if (!order.getStatus().isCancellable()) {
            throw new InvalidOrderStateException("Order cannot be cancelled");
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        // Restore product stock
        for (OrderItem item : order.getOrderItems()) {
            productService.updateStock(item.getProduct().getId(), item.getQuantity());
        }
        
        // Process refund if payment was made
        if (order.getPayment() != null && 
            order.getPayment().getStatus() == PaymentStatus.COMPLETED) {
            paymentService.processRefund(order.getPayment().getId());
        }
        
        notificationService.sendOrderCancellation(order);
    }
    
    private String generateOrderNumber() {
        return "ORD-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + 
               "-" + RandomStringUtils.randomNumeric(6);
    }
    
    private BigDecimal calculateShippingCost(OrderCreateDTO createDTO) {
        // Simple shipping cost calculation
        // In real implementation, this would be more complex
        return new BigDecimal("10.00");
    }
    
    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        // Define valid transitions
        Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
            OrderStatus.PENDING, List.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, List.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, List.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, List.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, List.of(OrderStatus.RETURNED)
        );
        
        if (!validTransitions.getOrDefault(current, List.of()).contains(next)) {
            throw new InvalidStatusTransitionException(
                "Cannot transition from " + current + " to " + next);
        }
    }
    
    private OrderDTO convertToDTO(Order order) {
        return OrderDTO.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .userId(order.getUser().getId())
            .status(order.getStatus())
            .subtotal(order.getSubtotal())
            .tax(order.getTax())
            .shippingCost(order.getShippingCost())
            .totalAmount(order.getTotalAmount())
            .items(order.getOrderItems().stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList()))
            .createdAt(order.getCreatedAt())
            .build();
    }
}
```

### 3.4 Payment Module

#### 3.4.1 Payment Entity

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
    
    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Column(unique = true, nullable = false)
    private String transactionId;
    
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    private String paymentGatewayResponse;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    private LocalDateTime completedAt;
}
```

#### 3.4.2 Payment Service

```java
@Service
@Transactional
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentGatewayService paymentGatewayService;
    
    public PaymentDTO processPayment(PaymentRequestDTO requestDTO) {
        // Validate order
        Order order = orderRepository.findById(requestDTO.getOrderId())
            .orElseThrow(() -> new OrderNotFoundException("Order not found"));
        
        // Check if payment already exists
        if (paymentRepository.existsByOrderId(order.getId())) {
            throw new PaymentAlreadyExistsException("Payment already processed for this order");
        }
        
        // Create payment record
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setTransactionId(generateTransactionId());
        payment.setPaymentMethod(requestDTO.getPaymentMethod());
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PENDING);
        
        Payment savedPayment = paymentRepository.save(payment);
        
        try {
            // Process payment through gateway
            PaymentGatewayResponse response = paymentGatewayService.processPayment(
                PaymentGatewayRequest.builder()
                    .transactionId(payment.getTransactionId())
                    .amount(payment.getAmount())
                    .paymentMethod(requestDTO.getPaymentMethod())
                    .cardDetails(requestDTO.getCardDetails())
                    .build()
            );
            
            // Update payment status
            savedPayment.setStatus(PaymentStatus.COMPLETED);
            savedPayment.setCompletedAt(LocalDateTime.now());
            savedPayment.setPaymentGatewayResponse(response.toString());
            
            // Update order status
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            
        } catch (PaymentGatewayException e) {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setPaymentGatewayResponse(e.getMessage());
            throw new PaymentProcessingException("Payment processing failed", e);
        } finally {
            paymentRepository.save(savedPayment);
        }
        
        return convertToDTO(savedPayment);
    }
    
    public void processRefund(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));
        
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new InvalidPaymentStateException("Only completed payments can be refunded");
        }
        
        try {
            paymentGatewayService.processRefund(payment.getTransactionId());
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
        } catch (PaymentGatewayException e) {
            throw new RefundProcessingException("Refund processing failed", e);
        }
    }
    
    private String generateTransactionId() {
        return "TXN-" + System.currentTimeMillis() + "-" + 
               RandomStringUtils.randomAlphanumeric(8).toUpperCase();
    }
    
    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
            .id(payment.getId())
            .orderId(payment.getOrder().getId())
            .transactionId(payment.getTransactionId())
            .paymentMethod(payment.getPaymentMethod())
            .status(payment.getStatus())
            .amount(payment.getAmount())
            .createdAt(payment.getCreatedAt())
            .completedAt(payment.getCompletedAt())
            .build();
    }
}
```

## 4. Database Design

### 4.1 Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories Table
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products Table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id BIGINT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Product Images Table
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders Table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id BIGINT,
    billing_address_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(id)
);

-- Order Items Table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments Table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Reviews Table
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(product_id, user_id)
);

-- Shopping Cart Table
CREATE TABLE shopping_cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart Items Table
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(cart_id, product_id)
);
```

### 4.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

## 5. API Specifications

### 5.1 Authentication APIs

#### POST /api/v1/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

#### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    }
  }
}
```

### 5.2 Product APIs

#### GET /api/v1/products
**Query Parameters:**
- page (default: 0)
- size (default: 20)
- sort (default: createdAt,desc)
- categoryId (optional)
- minPrice (optional)
- maxPrice (optional)
- search (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "stockQuantity": 50,
        "sku": "PRD-123456",
        "categoryId": 1,
        "categoryName": "Electronics",
        "averageRating": 4.5,
        "images": [
          {
            "id": 1,
            "url": "https://example.com/image1.jpg",
            "isPrimary": true
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 100,
      "totalPages": 5
    }
  }
}
```

#### GET /api/v1/products/{id}
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "stockQuantity": 50,
    "sku": "PRD-123456",
    "categoryId": 1,
    "categoryName": "Electronics",
    "averageRating": 4.5,
    "reviewCount": 25,
    "images": [
      {
        "id": 1,
        "url": "https://example.com/image1.jpg",
        "isPrimary": true
      }
    ],
    "specifications": {
      "brand": "BrandName",
      "model": "Model123",
      "warranty": "1 year"
    }
  }
}
```

### 5.3 Order APIs

#### POST /api/v1/orders
**Request:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddressId": 1,
  "billingAddressId": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240115-123456",
    "status": "PENDING",
    "subtotal": 199.98,
    "tax": 19.99,
    "shippingCost": 10.00,
    "totalAmount": 229.97,
    "items": [
      {
        "productId": 1,
        "productName": "Product Name",
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/orders/{id}
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240115-123456",
    "status": "CONFIRMED",
    "subtotal": 199.98,
    "tax": 19.99,
    "shippingCost": 10.00,
    "totalAmount": 229.97,
    "items": [
      {
        "productId": 1,
        "productName": "Product Name",
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98
      }
    ],
    "shippingAddress": {
      "addressLine1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "payment": {
      "transactionId": "TXN-123456",
      "method": "CREDIT_CARD",
      "status": "COMPLETED"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

## 6. Security Implementation

### 6.1 JWT Authentication

```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;
    
    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
        
        return Jwts.builder()
            .setSubject(Long.toString(userPrincipal.getId()))
            .claim("email", userPrincipal.getEmail())
            .claim("role", userPrincipal.getRole())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();
        
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty");
        }
        return false;
    }
}
```

### 6.2 Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .cors().and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/products/**").permitAll()
                .requestMatchers("/api/v1/categories/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter(), 
                UsernamePasswordAuthenticationFilter.class);
        
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

### 6.3 Input Validation

```java
public class UserRegistrationDTO {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",
             message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
    private String password;
    
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String phoneNumber;
}
```

## 7. Error Handling

### 7.1 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage(), ex.getErrors()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("Validation failed", errors));
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
            UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(
            Exception ex) {
        logger.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred"));
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

public class ValidationException extends RuntimeException {
    private Map<String, String> errors;
    
    public ValidationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }
    
    public Map<String, String> getErrors() {
        return errors;
    }
}

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
```

## 8. Caching Strategy

### 8.1 Redis Configuration

```java
@Configuration
@EnableCaching
public class RedisConfig {
    
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("localhost");
        config.setPort(6379);
        return new LettuceConnectionFactory(config);
    }
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```

### 8.2 Cache Usage

```java
@Service
public class ProductService {
    
    @Cacheable(value = "products", key = "#id")
    public ProductDTO getProductById(Long id) {
        // Method implementation
    }
    
    @CacheEvict(value = "products", key = "#id")
    public void updateProduct(Long id, ProductUpdateDTO updateDTO) {
        // Method implementation
    }
    
    @CacheEvict(value = "products", allEntries = true)
    public void clearProductCache() {
        // Clears all product cache entries
    }
}
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
    private EmailService emailService;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void testRegisterUser_Success() {
        // Arrange
        UserRegistrationDTO registrationDTO = new UserRegistrationDTO();
        registrationDTO.setEmail("test@example.com");
        registrationDTO.setPassword("Password123!");
        registrationDTO.setFirstName("John");
        registrationDTO.setLastName("Doe");
        
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        
        // Act
        UserDTO result = userService.registerUser(registrationDTO);
        
        // Assert
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        verify(emailService).sendWelcomeEmail("test@example.com");
    }
    
    @Test
    void testRegisterUser_EmailAlreadyExists() {
        // Arrange
        UserRegistrationDTO registrationDTO = new UserRegistrationDTO();
        registrationDTO.setEmail("existing@example.com");
        
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        // Act & Assert
        assertThrows(UserAlreadyExistsException.class, 
            () -> userService.registerUser(registrationDTO));
    }
}
```

### 9.2 Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    @WithMockUser(roles = "CUSTOMER")
    void testCreateOrder_Success() throws Exception {
        // Arrange
        OrderCreateDTO createDTO = new OrderCreateDTO();
        // Set up DTO
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDTO)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.orderNumber").exists());
    }
}
```

## 10. Deployment Configuration

### 10.1 Docker Configuration

```dockerfile
# Backend Dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 10.2 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/ecommerce
      SPRING_REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 11. Monitoring and Logging

### 11.1 Logging Configuration

```yaml
logging:
  level:
    root: INFO
    com.ecommerce: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 30
```

### 11.2 Metrics Configuration

```java
@Configuration
public class MetricsConfig {
    
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config().commonTags(
            "application", "ecommerce-platform",
            "environment", "production"
        );
    }
}
```

## 12. Performance Optimization

### 12.1 Database Query Optimization

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.images " +
           "WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);
    
    @Query("SELECT p FROM Product p " +
           "WHERE p.category.id = :categoryId " +
           "AND p.active = true " +
           "AND p.stockQuantity > 0")
    Page<Product> findAvailableProductsByCategory(
        @Param("categoryId") Long categoryId, 
        Pageable pageable);
}
```

### 12.2 Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

## 13. Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the E-commerce Platform. It covers all major components including user management, product catalog, order processing, and payment handling. The design emphasizes:

- **Scalability**: Through caching, connection pooling, and efficient database queries
- **Security**: Via JWT authentication, input validation, and secure password handling
- **Maintainability**: Using clean code principles, proper layering, and comprehensive testing
- **Performance**: Through optimization strategies and monitoring capabilities

**Status**: Complete and Ready for Review