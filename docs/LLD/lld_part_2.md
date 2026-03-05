## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        <<@RestController>>
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword) ResponseEntity~List~Product~~
    }
    
    class ProductService {
        <<@Service>>
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Product
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }
    
    class ProductRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingIgnoreCase(String keyword) List~Product~
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getCategory() String
        +setCategory(String category) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer stockQuantity) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addToCart(Long productId, Integer quantity) ResponseEntity~CartItem~
        +viewCart() ResponseEntity~Cart~
        +updateQuantity(Long cartItemId, Integer quantity) ResponseEntity~CartItem~
        +removeItem(Long cartItemId) ResponseEntity~Cart~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addItemToCart(Long productId, Integer quantity) CartItem
        +getCart() Cart
        +updateItemQuantity(Long cartItemId, Integer quantity) CartItem
        +removeItemFromCart(Long cartItemId) Cart
        +calculateSubtotal(CartItem item) BigDecimal
        +calculateTotal(Cart cart) BigDecimal
        +isCartEmpty(Cart cart) boolean
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Cart~
        +findById(Long id) Optional~Cart~
        +save(Cart cart) Cart
        +deleteById(Long id) void
        +findByUserId(Long userId) Optional~Cart~
        +findByStatus(String status) List~Cart~
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~CartItem~
        +findById(Long id) Optional~CartItem~
        +save(CartItem cartItem) CartItem
        +deleteById(Long id) void
        +findByCartId(Long cartId) List~CartItem~
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
    }
    
    class Cart {
        <<@Entity>>
        -Long id
        -Long userId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
        +getTotalAmount() BigDecimal
        +setTotalAmount(BigDecimal totalAmount) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -Product product
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProduct() Product
        +setProduct(Product product) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductRepository : depends on
    CartRepository --> Cart : manages
    CartItemRepository --> CartItem : manages
    Cart --> CartItem : contains
    CartItem --> Product : references
```

### 2.1.1 User Authentication Module Class Diagram

```mermaid
classDiagram
    class UserController {
        <<@RestController>>
        -UserService userService
        -AuthenticationService authenticationService
        +register(UserRegistrationRequest request) ResponseEntity~User~
        +login(LoginRequest request) ResponseEntity~AuthenticationResponse~
        +logout(String token) ResponseEntity~Void~
        +getUserProfile(Long userId) ResponseEntity~User~
        +updateUserProfile(Long userId, UserUpdateRequest request) ResponseEntity~User~
    }
    
    class UserService {
        <<@Service>>
        -UserRepository userRepository
        -PasswordEncoder passwordEncoder
        +createUser(UserRegistrationRequest request) User
        +getUserById(Long id) User
        +getUserByEmail(String email) User
        +updateUser(Long id, UserUpdateRequest request) User
        +validateUser(String email, String password) boolean
    }
    
    class AuthenticationService {
        <<@Service>>
        -UserService userService
        -JwtTokenProvider jwtTokenProvider
        -SessionRepository sessionRepository
        +authenticate(String email, String password) AuthenticationResponse
        +validateToken(String token) boolean
        +logout(String token) void
        +refreshToken(String token) String
    }
    
    class UserRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~User~
        +findById(Long id) Optional~User~
        +findByEmail(String email) Optional~User~
        +save(User user) User
        +deleteById(Long id) void
        +existsByEmail(String email) boolean
    }
    
    class SessionRepository {
        <<@Repository>>
        <<interface>>
        +findByToken(String token) Optional~Session~
        +save(Session session) Session
        +deleteByToken(String token) void
        +deleteByUserId(Long userId) void
    }
    
    class User {
        <<@Entity>>
        -Long id
        -String email
        -String password
        -String firstName
        -String lastName
        -String phoneNumber
        -String address
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -String status
        +getId() Long
        +setId(Long id) void
        +getEmail() String
        +setEmail(String email) void
        +getPassword() String
        +setPassword(String password) void
        +getFirstName() String
        +setFirstName(String firstName) void
        +getLastName() String
        +setLastName(String lastName) void
        +getPhoneNumber() String
        +setPhoneNumber(String phoneNumber) void
        +getAddress() String
        +setAddress(String address) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getStatus() String
        +setStatus(String status) void
    }
    
    class Session {
        <<@Entity>>
        -Long id
        -Long userId
        -String token
        -LocalDateTime createdAt
        -LocalDateTime expiresAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getToken() String
        +setToken(String token) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getExpiresAt() LocalDateTime
        +setExpiresAt(LocalDateTime expiresAt) void
    }
    
    UserController --> UserService : depends on
    UserController --> AuthenticationService : depends on
    UserService --> UserRepository : depends on
    AuthenticationService --> UserService : depends on
    AuthenticationService --> SessionRepository : depends on
    UserRepository --> User : manages
    SessionRepository --> Session : manages
```

### 2.1.2 Order Management Module Class Diagram

```mermaid
classDiagram
    class OrderController {
        <<@RestController>>
        -OrderService orderService
        +createOrder(OrderRequest request) ResponseEntity~Order~
        +getOrderById(Long orderId) ResponseEntity~Order~
        +getUserOrders(Long userId) ResponseEntity~List~Order~~
        +updateOrderStatus(Long orderId, String status) ResponseEntity~Order~
        +cancelOrder(Long orderId) ResponseEntity~Order~
    }
    
    class OrderService {
        <<@Service>>
        -OrderRepository orderRepository
        -OrderItemRepository orderItemRepository
        -CartService cartService
        -InventoryValidationService inventoryValidationService
        -PaymentService paymentService
        +createOrderFromCart(Long userId, OrderRequest request) Order
        +getOrderById(Long orderId) Order
        +getUserOrders(Long userId) List~Order~
        +updateOrderStatus(Long orderId, String status) Order
        +cancelOrder(Long orderId) Order
        +calculateOrderTotal(Order order) BigDecimal
    }
    
    class OrderRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Order~
        +findById(Long id) Optional~Order~
        +findByUserId(Long userId) List~Order~
        +save(Order order) Order
        +deleteById(Long id) void
        +findByStatus(String status) List~Order~
    }
    
    class OrderItemRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~OrderItem~
        +findById(Long id) Optional~OrderItem~
        +findByOrderId(Long orderId) List~OrderItem~
        +save(OrderItem orderItem) OrderItem
        +deleteById(Long id) void
    }
    
    class Order {
        <<@Entity>>
        -Long id
        -Long userId
        -String orderNumber
        -List~OrderItem~ items
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal shippingCost
        -BigDecimal grandTotal
        -String status
        -String shippingAddress
        -String paymentMethod
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getOrderNumber() String
        +setOrderNumber(String orderNumber) void
        +getItems() List~OrderItem~
        +setItems(List~OrderItem~ items) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getTax() BigDecimal
        +setTax(BigDecimal tax) void
        +getShippingCost() BigDecimal
        +setShippingCost(BigDecimal shippingCost) void
        +getGrandTotal() BigDecimal
        +setGrandTotal(BigDecimal grandTotal) void
        +getStatus() String
        +setStatus(String status) void
        +getShippingAddress() String
        +setShippingAddress(String shippingAddress) void
        +getPaymentMethod() String
        +setPaymentMethod(String paymentMethod) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class OrderItem {
        <<@Entity>>
        -Long id
        -Long orderId
        -Long productId
        -Product product
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        +getId() Long
        +setId(Long id) void
        +getOrderId() Long
        +setOrderId(Long orderId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getProduct() Product
        +setProduct(Product product) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
    }
    
    OrderController --> OrderService : depends on
    OrderService --> OrderRepository : depends on
    OrderService --> OrderItemRepository : depends on
    OrderService --> CartService : depends on
    OrderRepository --> Order : manages
    OrderItemRepository --> OrderItem : manages
    Order --> OrderItem : contains
    OrderItem --> Product : references
```

### 2.1.3 Payment Processing Module Class Diagram

```mermaid
classDiagram
    class PaymentController {
        <<@RestController>>
        -PaymentService paymentService
        +processPayment(PaymentRequest request) ResponseEntity~PaymentResponse~
        +getPaymentStatus(String transactionId) ResponseEntity~PaymentStatus~
        +refundPayment(String transactionId) ResponseEntity~RefundResponse~
    }
    
    class PaymentService {
        <<@Service>>
        -PaymentRepository paymentRepository
        -PaymentGatewayAdapter paymentGatewayAdapter
        -OrderService orderService
        +processPayment(PaymentRequest request) PaymentResponse
        +getPaymentStatus(String transactionId) PaymentStatus
        +refundPayment(String transactionId) RefundResponse
        +validatePaymentDetails(PaymentRequest request) boolean
    }
    
    class PaymentGatewayAdapter {
        <<@Service>>
        -StripePaymentGateway stripeGateway
        -PayPalPaymentGateway paypalGateway
        +processPayment(PaymentRequest request) PaymentResponse
        +getPaymentStatus(String transactionId) PaymentStatus
        +refundPayment(String transactionId) RefundResponse
    }
    
    class PaymentRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Payment~
        +findById(Long id) Optional~Payment~
        +findByTransactionId(String transactionId) Optional~Payment~
        +findByOrderId(Long orderId) List~Payment~
        +save(Payment payment) Payment
    }
    
    class Payment {
        <<@Entity>>
        -Long id
        -Long orderId
        -String transactionId
        -String paymentMethod
        -BigDecimal amount
        -String currency
        -String status
        -String gatewayResponse
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getOrderId() Long
        +setOrderId(Long orderId) void
        +getTransactionId() String
        +setTransactionId(String transactionId) void
        +getPaymentMethod() String
        +setPaymentMethod(String paymentMethod) void
        +getAmount() BigDecimal
        +setAmount(BigDecimal amount) void
        +getCurrency() String
        +setCurrency(String currency) void
        +getStatus() String
        +setStatus(String status) void
        +getGatewayResponse() String
        +setGatewayResponse(String gatewayResponse) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    PaymentController --> PaymentService : depends on
    PaymentService --> PaymentRepository : depends on
    PaymentService --> PaymentGatewayAdapter : depends on
    PaymentService --> OrderService : depends on
    PaymentRepository --> Payment : manages
```

### 2.1.4 Shipping Integration Module Class Diagram

```mermaid
classDiagram
    class ShippingController {
        <<@RestController>>
        -ShippingService shippingService
        +calculateShippingRates(ShippingRateRequest request) ResponseEntity~List~ShippingRate~~
        +createShipment(ShipmentRequest request) ResponseEntity~Shipment~
        +trackShipment(String trackingNumber) ResponseEntity~ShipmentTracking~
        +getDeliveryEstimate(ShippingRateRequest request) ResponseEntity~DeliveryEstimate~
    }
    
    class ShippingService {
        <<@Service>>
        -ShippingRepository shippingRepository
        -ShippingCarrierAdapter shippingCarrierAdapter
        -OrderService orderService
        +calculateShippingRates(ShippingRateRequest request) List~ShippingRate~
        +createShipment(ShipmentRequest request) Shipment
        +trackShipment(String trackingNumber) ShipmentTracking
        +getDeliveryEstimate(ShippingRateRequest request) DeliveryEstimate
    }
    
    class ShippingCarrierAdapter {
        <<@Service>>
        -FedExCarrier fedexCarrier
        -UPSCarrier upsCarrier
        -USPSCarrier uspsCarrier
        +getRates(ShippingRateRequest request) List~ShippingRate~
        +createShipment(ShipmentRequest request) Shipment
        +trackShipment(String trackingNumber) ShipmentTracking
    }
    
    class ShippingRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Shipment~
        +findById(Long id) Optional~Shipment~
        +findByTrackingNumber(String trackingNumber) Optional~Shipment~
        +findByOrderId(Long orderId) Optional~Shipment~
        +save(Shipment shipment) Shipment
    }
    
    class Shipment {
        <<@Entity>>
        -Long id
        -Long orderId
        -String trackingNumber
        -String carrier
        -String serviceType
        -String fromAddress
        -String toAddress
        -BigDecimal weight
        -BigDecimal shippingCost
        -String status
        -LocalDateTime estimatedDelivery
        -LocalDateTime actualDelivery
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getOrderId() Long
        +setOrderId(Long orderId) void
        +getTrackingNumber() String
        +setTrackingNumber(String trackingNumber) void
        +getCarrier() String
        +setCarrier(String carrier) void
        +getServiceType() String
        +setServiceType(String serviceType) void
        +getFromAddress() String
        +setFromAddress(String fromAddress) void
        +getToAddress() String
        +setToAddress(String toAddress) void
        +getWeight() BigDecimal
        +setWeight(BigDecimal weight) void
        +getShippingCost() BigDecimal
        +setShippingCost(BigDecimal shippingCost) void
        +getStatus() String
        +setStatus(String status) void
        +getEstimatedDelivery() LocalDateTime
        +setEstimatedDelivery(LocalDateTime estimatedDelivery) void
        +getActualDelivery() LocalDateTime
        +setActualDelivery(LocalDateTime actualDelivery) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    ShippingController --> ShippingService : depends on
    ShippingService --> ShippingRepository : depends on
    ShippingService --> ShippingCarrierAdapter : depends on
    ShippingService --> OrderService : depends on
    ShippingRepository --> Shipment : manages
```

### 2.1.5 Customer Notification System Class Diagram

```mermaid
classDiagram
    class NotificationService {
        <<@Service>>
        -NotificationRepository notificationRepository
        -EmailService emailService
        -SMSService smsService
        +sendOrderConfirmation(Order order) void
        +sendShippingUpdate(Shipment shipment) void
        +sendDeliveryNotification(Shipment shipment) void
        +sendPaymentConfirmation(Payment payment) void
    }
    
    class EmailService {
        <<@Service>>
        -JavaMailSender mailSender
        +sendEmail(String to, String subject, String body) void
        +sendOrderConfirmationEmail(Order order) void
        +sendShippingUpdateEmail(Shipment shipment) void
    }
    
    class SMSService {
        <<@Service>>
        -TwilioClient twilioClient
        +sendSMS(String phoneNumber, String message) void
        +sendOrderConfirmationSMS(Order order) void
        +sendDeliveryNotificationSMS(Shipment shipment) void
    }
    
    class NotificationRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Notification~
        +findById(Long id) Optional~Notification~
        +findByUserId(Long userId) List~Notification~
        +save(Notification notification) Notification
    }
    
    class Notification {
        <<@Entity>>
        -Long id
        -Long userId
        -String type
        -String channel
        -String recipient
        -String subject
        -String message
        -String status
        -LocalDateTime sentAt
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getType() String
        +setType(String type) void
        +getChannel() String
        +setChannel(String channel) void
        +getRecipient() String
        +setRecipient(String recipient) void
        +getSubject() String
        +setSubject(String subject) void
        +getMessage() String
        +setMessage(String message) void
        +getStatus() String
        +setStatus(String status) void
        +getSentAt() LocalDateTime
        +setSentAt(LocalDateTime sentAt) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    NotificationService --> NotificationRepository : depends on
    NotificationService --> EmailService : depends on
    NotificationService --> SMSService : depends on
    NotificationRepository --> Notification : manages
```

### 2.1.6 Inventory Validation Service Class Diagram

```mermaid
classDiagram
    class InventoryValidationService {
        <<@Service>>
        -ProductRepository productRepository
        -InventoryRepository inventoryRepository
        +validateStock(Long productId, Integer quantity) boolean
        +reserveStock(Long productId, Integer quantity) void
        +releaseStock(Long productId, Integer quantity) void
        +updateStock(Long productId, Integer quantity) void
        +checkStockAvailability(Long productId) Integer
    }
    
    class InventoryRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Inventory~
        +findById(Long id) Optional~Inventory~
        +findByProductId(Long productId) Optional~Inventory~
        +save(Inventory inventory) Inventory
    }
    
    class Inventory {
        <<@Entity>>
        -Long id
        -Long productId
        -Integer availableQuantity
        -Integer reservedQuantity
        -Integer totalQuantity
        -LocalDateTime lastUpdated
        +getId() Long
        +setId(Long id) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getAvailableQuantity() Integer
        +setAvailableQuantity(Integer availableQuantity) void
        +getReservedQuantity() Integer
        +setReservedQuantity(Integer reservedQuantity) void
        +getTotalQuantity() Integer
        +setTotalQuantity(Integer totalQuantity) void
        +getLastUpdated() LocalDateTime
        +setLastUpdated(LocalDateTime lastUpdated) void
    }
    
    InventoryValidationService --> ProductRepository : depends on
    InventoryValidationService --> InventoryRepository : depends on
    InventoryRepository --> Inventory : manages
```

### 2.1.7 Cart Cost Breakdown Calculation Class Diagram

```mermaid
classDiagram
    class CostCalculationService {
        <<@Service>>
        -TaxCalculationService taxCalculationService
        -ShippingCostService shippingCostService
        +calculateCartCostBreakdown(Cart cart) CartCostBreakdown
        +calculateSubtotal(List~CartItem~ items) BigDecimal
        +calculateGrandTotal(CartCostBreakdown breakdown) BigDecimal
    }
    
    class TaxCalculationService {
        <<@Service>>
        -TaxRateRepository taxRateRepository
        +calculateTax(BigDecimal subtotal, String state) BigDecimal
        +getTaxRate(String state) BigDecimal
    }
    
    class ShippingCostService {
        <<@Service>>
        -ShippingService shippingService
        +calculateShippingCost(Cart cart, String address) BigDecimal
        +getEstimatedShippingCost(BigDecimal weight, String zipCode) BigDecimal
    }
    
    class TaxRateRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~TaxRate~
        +findByState(String state) Optional~TaxRate~
        +save(TaxRate taxRate) TaxRate
    }
    
    class TaxRate {
        <<@Entity>>
        -Long id
        -String state
        -BigDecimal rate
        -LocalDateTime effectiveDate
        +getId() Long
        +setId(Long id) void
        +getState() String
        +setState(String state) void
        +getRate() BigDecimal
        +setRate(BigDecimal rate) void
        +getEffectiveDate() LocalDateTime
        +setEffectiveDate(LocalDateTime effectiveDate) void
    }
    
    class CartCostBreakdown {
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal shippingCost
        -BigDecimal grandTotal
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getTax() BigDecimal
        +setTax(BigDecimal tax) void
        +getShippingCost() BigDecimal
        +setShippingCost(BigDecimal shippingCost) void
        +getGrandTotal() BigDecimal
        +setGrandTotal(BigDecimal grandTotal) void
    }
    
    CostCalculationService --> TaxCalculationService : depends on
    CostCalculationService --> ShippingCostService : depends on
    TaxCalculationService --> TaxRateRepository : depends on
    ShippingCostService --> ShippingService : depends on
    TaxRateRepository --> TaxRate : manages
    CostCalculationService --> CartCostBreakdown : creates
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CART {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id "NOT NULL"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, MAX_LENGTH(50), DEFAULT 'ACTIVE'"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_in
```

### 2.2.1 Extended Entity Relationship Diagram with New Modules

```mermaid
erDiagram
    USERS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR email "NOT NULL, UNIQUE, MAX_LENGTH(255)"
        VARCHAR password "NOT NULL, MAX_LENGTH(255)"
        VARCHAR first_name "NOT NULL, MAX_LENGTH(100)"
        VARCHAR last_name "NOT NULL, MAX_LENGTH(100)"
        VARCHAR phone_number "NULLABLE, MAX_LENGTH(20)"
        TEXT address "NULLABLE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        VARCHAR status "NOT NULL, MAX_LENGTH(50), DEFAULT 'ACTIVE'"
    }
    
    SESSIONS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id FK "NOT NULL"
        VARCHAR token "NOT NULL, UNIQUE, MAX_LENGTH(500)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP expires_at "NOT NULL"
    }
    
    ORDERS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id FK "NOT NULL"
        VARCHAR order_number "NOT NULL, UNIQUE, MAX_LENGTH(50)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
        DECIMAL tax "NOT NULL, PRECISION(10,2)"
        DECIMAL shipping_cost "NOT NULL, PRECISION(10,2)"
        DECIMAL grand_total "NOT NULL, PRECISION(10,2)"
        VARCHAR status "NOT NULL, MAX_LENGTH(50)"
        TEXT shipping_address "NOT NULL"
        VARCHAR payment_method "NOT NULL, MAX_LENGTH(50)"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    ORDER_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL"
        DECIMAL unit_price "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    PAYMENTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        VARCHAR transaction_id "NOT NULL, UNIQUE, MAX_LENGTH(100)"
        VARCHAR payment_method "NOT NULL, MAX_LENGTH(50)"
        DECIMAL amount "NOT NULL, PRECISION(10,2)"
        VARCHAR currency "NOT NULL, MAX_LENGTH(3), DEFAULT 'USD'"
        VARCHAR status "NOT NULL, MAX_LENGTH(50)"
        TEXT gateway_response "NULLABLE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    SHIPMENTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT order_id FK "NOT NULL"
        VARCHAR tracking_number "NOT NULL, UNIQUE, MAX_LENGTH(100)"
        VARCHAR carrier "NOT NULL, MAX_LENGTH(50)"
        VARCHAR service_type "NOT NULL, MAX_LENGTH(50)"
        TEXT from_address "NOT NULL"
        TEXT to_address "NOT NULL"
        DECIMAL weight "NOT NULL, PRECISION(10,2)"
        DECIMAL shipping_cost "NOT NULL, PRECISION(10,2)"
        VARCHAR status "NOT NULL, MAX_LENGTH(50)"
        TIMESTAMP estimated_delivery "NULLABLE"
        TIMESTAMP actual_delivery "NULLABLE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    NOTIFICATIONS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id FK "NOT NULL"
        VARCHAR type "NOT NULL, MAX_LENGTH(50)"
        VARCHAR channel "NOT NULL, MAX_LENGTH(50)"
        VARCHAR recipient "NOT NULL, MAX_LENGTH(255)"
        VARCHAR subject "NULLABLE, MAX_LENGTH(255)"
        TEXT message "NOT NULL"
        VARCHAR status "NOT NULL, MAX_LENGTH(50)"
        TIMESTAMP sent_at "NULLABLE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    INVENTORY {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT product_id FK "NOT NULL, UNIQUE"
        INTEGER available_quantity "NOT NULL, DEFAULT 0"
        INTEGER reserved_quantity "NOT NULL, DEFAULT 0"
        INTEGER total_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP last_updated "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    TAX_RATES {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR state "NOT NULL, UNIQUE, MAX_LENGTH(50)"
        DECIMAL rate "NOT NULL, PRECISION(5,4)"
        TIMESTAMP effective_date "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ ORDERS : places
    USERS ||--o{ NOTIFICATIONS : receives
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o| PAYMENTS : has
    ORDERS ||--o| SHIPMENTS : has
    PRODUCTS ||--o{ ORDER_ITEMS : referenced_in
    PRODUCTS ||--o| INVENTORY : has
```
