## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        <<@RestController>>
        -ProductService productService
        +getAllProducts(String category, String sortBy, Integer page, Integer size) ResponseEntity~Page~Product~~
        +getProductById(Long id) ResponseEntity~ProductDetailResponse~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +softDeleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword, String category, BigDecimal minPrice, BigDecimal maxPrice, String sortBy, Integer page, Integer size) ResponseEntity~Page~Product~~
    }
    
    class CartController {
        <<@RestController>>
        -CartService cartService
        +addToCart(Long userId, CartItemRequest request) ResponseEntity~CartResponse~
        +viewCart(Long userId) ResponseEntity~CartResponse~
        +updateQuantity(Long userId, Long itemId, Integer quantity) ResponseEntity~CartResponse~
        +removeItem(Long userId, Long itemId) ResponseEntity~Void~
        +clearCart(Long userId) ResponseEntity~Void~
    }
    
    class OrderController {
        <<@RestController>>
        -OrderService orderService
        +createOrder(Long userId, OrderRequest request) ResponseEntity~OrderResponse~
        +getOrderById(Long orderId) ResponseEntity~OrderResponse~
        +getUserOrders(Long userId) ResponseEntity~List~OrderResponse~~
        +updateOrderStatus(Long orderId, OrderStatus status) ResponseEntity~OrderResponse~
        +cancelOrder(Long orderId) ResponseEntity~Void~
    }
    
    class PaymentController {
        <<@RestController>>
        -PaymentService paymentService
        +processPayment(Long orderId, PaymentRequest request) ResponseEntity~PaymentResponse~
        +getPaymentStatus(Long paymentId) ResponseEntity~PaymentResponse~
        +refundPayment(Long paymentId) ResponseEntity~RefundResponse~
    }
    
    class UserController {
        <<@RestController>>
        -UserService userService
        +registerUser(UserRegistrationRequest request) ResponseEntity~UserResponse~
        +getUserProfile(Long userId) ResponseEntity~UserResponse~
        +updateUserProfile(Long userId, UserUpdateRequest request) ResponseEntity~UserResponse~
        +getUserAddresses(Long userId) ResponseEntity~List~Address~~
        +addAddress(Long userId, Address address) ResponseEntity~Address~
    }
    
    class SubscriptionController {
        <<@RestController>>
        -SubscriptionService subscriptionService
        +createSubscription(Long userId, SubscriptionRequest request) ResponseEntity~SubscriptionResponse~
        +getUserSubscriptions(Long userId) ResponseEntity~List~SubscriptionResponse~~
        +updateSubscription(Long subscriptionId, SubscriptionUpdateRequest request) ResponseEntity~SubscriptionResponse~
        +cancelSubscription(Long subscriptionId) ResponseEntity~Void~
    }
    
    class ProductService {
        <<@Service>>
        -ProductRepository productRepository
        +getAllProducts(String category, String sortBy, Integer page, Integer size) Page~Product~
        +getProductById(Long id) ProductDetailResponse
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +softDeleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword, String category, BigDecimal minPrice, BigDecimal maxPrice, String sortBy, Integer page, Integer size) Page~Product~
        +checkInventoryAvailability(Long productId, Integer requestedQuantity) boolean
        +reserveInventory(Long productId, Integer quantity) void
        +releaseInventory(Long productId, Integer quantity) void
        +updateStock(Long productId, Integer quantity) void
        +getAvailableStock(Long productId) Integer
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        -TaxCalculationService taxCalculationService
        -ShippingCalculationService shippingCalculationService
        +addToCart(Long userId, Long productId, Integer quantity, Boolean isSubscription) CartResponse
        +updateQuantity(Long userId, Long itemId, Integer quantity) CartResponse
        +removeFromCart(Long userId, Long itemId) void
        +clearCart(Long userId) void
        +calculateTotals(Long cartId) CartResponse
        +validateInventory(Long productId, Integer quantity) boolean
        +getCart(Long userId) CartResponse
        +applyMinimumProcurementThreshold(Long productId, Integer requestedQuantity) Integer
        +handleEmptyCart(Long userId) CartResponse
        +recalculateCartTotals(Long cartId) CartResponse
    }
    
    class OrderService {
        <<@Service>>
        -OrderRepository orderRepository
        -OrderItemRepository orderItemRepository
        -CartService cartService
        -ProductService productService
        -PaymentService paymentService
        +createOrder(Long userId, OrderRequest request) OrderResponse
        +getOrderById(Long orderId) OrderResponse
        +getUserOrders(Long userId) List~OrderResponse~
        +updateOrderStatus(Long orderId, OrderStatus status) OrderResponse
        +cancelOrder(Long orderId) void
        +processOrderFromCart(Long userId, Long addressId, PaymentMethod paymentMethod) OrderResponse
    }
    
    class PaymentService {
        <<@Service>>
        -PaymentRepository paymentRepository
        -PaymentGatewayAdapter paymentGatewayAdapter
        +processPayment(Long orderId, PaymentRequest request) PaymentResponse
        +getPaymentStatus(Long paymentId) PaymentResponse
        +refundPayment(Long paymentId) RefundResponse
        +validatePaymentDetails(PaymentRequest request) boolean
        +encryptPaymentData(PaymentRequest request) String
    }
    
    class UserService {
        <<@Service>>
        -UserRepository userRepository
        -AddressRepository addressRepository
        +registerUser(UserRegistrationRequest request) UserResponse
        +getUserProfile(Long userId) UserResponse
        +updateUserProfile(Long userId, UserUpdateRequest request) UserResponse
        +getUserAddresses(Long userId) List~Address~
        +addAddress(Long userId, Address address) Address
        +validateUser(Long userId) boolean
    }
    
    class SubscriptionService {
        <<@Service>>
        -SubscriptionRepository subscriptionRepository
        -ProductService productService
        -OrderService orderService
        +createSubscription(Long userId, SubscriptionRequest request) SubscriptionResponse
        +getUserSubscriptions(Long userId) List~SubscriptionResponse~
        +updateSubscription(Long subscriptionId, SubscriptionUpdateRequest request) SubscriptionResponse
        +cancelSubscription(Long subscriptionId) void
        +processSubscriptionRenewal(Long subscriptionId) OrderResponse
    }
    
    class TaxCalculationService {
        <<@Service>>
        -TaxRateRepository taxRateRepository
        +calculateTax(BigDecimal subtotal, String taxCategory, String state) BigDecimal
        +getTaxRate(String taxCategory, String state) BigDecimal
    }
    
    class ShippingCalculationService {
        <<@Service>>
        -ShippingRateRepository shippingRateRepository
        +calculateShipping(BigDecimal weight, String dimensions, String destinationZip) BigDecimal
        +getShippingRate(String zone, BigDecimal weight) BigDecimal
    }
    
    class InventoryValidationService {
        <<@Service>>
        -ProductService productService
        +validateInventoryAvailability(Long productId, Integer quantity) boolean
        +checkStockLevel(Long productId) Integer
        +validateBulkInventory(List~CartItem~ items) Map~Long, Boolean~
    }
    
    class ProductRepository {
        <<@Repository>>
        <<interface>>
        +findAll(Pageable pageable) Page~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +findByCategory(String category, Pageable pageable) Page~Product~
        +findByNameContainingIgnoreCase(String keyword, Pageable pageable) Page~Product~
        +searchProducts(String keyword, String category, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) Page~Product~
        +findByDeletedFalse() List~Product~
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
        +deleteById(Long id) void
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findById(Long id) Optional~CartItem~
        +save(CartItem item) CartItem
        +deleteById(Long id) void
        +deleteByCartId(Long cartId) void
    }
    
    class OrderRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~Order~
        +findByUserId(Long userId) List~Order~
        +save(Order order) Order
    }
    
    class OrderItemRepository {
        <<@Repository>>
        <<interface>>
        +findByOrderId(Long orderId) List~OrderItem~
        +save(OrderItem item) OrderItem
    }
    
    class PaymentRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~Payment~
        +findByOrderId(Long orderId) Optional~Payment~
        +save(Payment payment) Payment
    }
    
    class UserRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~User~
        +findByEmail(String email) Optional~User~
        +save(User user) User
    }
    
    class AddressRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) List~Address~
        +save(Address address) Address
    }
    
    class SubscriptionRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~Subscription~
        +findByUserId(Long userId) List~Subscription~
        +findByStatus(SubscriptionStatus status) List~Subscription~
        +save(Subscription subscription) Subscription
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -Integer availableStock
        -Integer reservedStock
        -Integer minimumProcurementThreshold
        -BigDecimal weight
        -String dimensions
        -String taxCategory
        -Boolean isSubscriptionEligible
        -List~String~ imageUrls
        -String sku
        -String brand
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -Boolean deleted
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
        +getAvailableStock() Integer
        +setAvailableStock(Integer availableStock) void
        +getReservedStock() Integer
        +setReservedStock(Integer reservedStock) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
        +getWeight() BigDecimal
        +setWeight(BigDecimal weight) void
        +getDimensions() String
        +setDimensions(String dimensions) void
        +getTaxCategory() String
        +setTaxCategory(String taxCategory) void
        +getIsSubscriptionEligible() Boolean
        +setIsSubscriptionEligible(Boolean isSubscriptionEligible) void
        +getImageUrls() List~String~
        +setImageUrls(List~String~ imageUrls) void
        +getSku() String
        +setSku(String sku) void
        +getBrand() String
        +setBrand(String brand) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
        +getDeleted() Boolean
        +setDeleted(Boolean deleted) void
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long userId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -Boolean isSubscription
        +getId() Long
        +setId(Long id) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getUnitPrice() BigDecimal
        +setUnitPrice(BigDecimal unitPrice) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
        +getIsSubscription() Boolean
        +setIsSubscription(Boolean isSubscription) void
    }
    
    class Order {
        <<@Entity>>
        -Long id
        -Long userId
        -String orderNumber
        -OrderStatus status
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal shipping
        -BigDecimal grandTotal
        -Long shippingAddressId
        -PaymentMethod paymentMethod
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +getUserId() Long
        +getOrderNumber() String
        +getStatus() OrderStatus
        +getSubtotal() BigDecimal
        +getTax() BigDecimal
        +getShipping() BigDecimal
        +getGrandTotal() BigDecimal
        +getShippingAddressId() Long
        +getPaymentMethod() PaymentMethod
        +getCreatedAt() LocalDateTime
        +getUpdatedAt() LocalDateTime
    }
    
    class OrderItem {
        <<@Entity>>
        -Long id
        -Long orderId
        -Long productId
        -String productName
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -Boolean isSubscription
        +getId() Long
        +getOrderId() Long
        +getProductId() Long
        +getProductName() String
        +getQuantity() Integer
        +getUnitPrice() BigDecimal
        +getSubtotal() BigDecimal
        +getIsSubscription() Boolean
    }
    
    class Payment {
        <<@Entity>>
        -Long id
        -Long orderId
        -PaymentMethod paymentMethod
        -BigDecimal amount
        -PaymentStatus status
        -String transactionId
        -String encryptedPaymentData
        -LocalDateTime processedAt
        +getId() Long
        +getOrderId() Long
        +getPaymentMethod() PaymentMethod
        +getAmount() BigDecimal
        +getStatus() PaymentStatus
        +getTransactionId() String
        +getEncryptedPaymentData() String
        +getProcessedAt() LocalDateTime
    }
    
    class User {
        <<@Entity>>
        -Long id
        -String email
        -String firstName
        -String lastName
        -String phoneNumber
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +getEmail() String
        +getFirstName() String
        +getLastName() String
        +getPhoneNumber() String
        +getCreatedAt() LocalDateTime
        +getUpdatedAt() LocalDateTime
    }
    
    class Address {
        <<@Entity>>
        -Long id
        -Long userId
        -String street
        -String city
        -String state
        -String zipCode
        -String country
        -Boolean isDefault
        +getId() Long
        +getUserId() Long
        +getStreet() String
        +getCity() String
        +getState() String
        +getZipCode() String
        +getCountry() String
        +getIsDefault() Boolean
    }
    
    class Subscription {
        <<@Entity>>
        -Long id
        -Long userId
        -Long productId
        -Integer quantity
        -SubscriptionFrequency frequency
        -SubscriptionStatus status
        -LocalDateTime nextDeliveryDate
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +getUserId() Long
        +getProductId() Long
        +getQuantity() Integer
        +getFrequency() SubscriptionFrequency
        +getStatus() SubscriptionStatus
        +getNextDeliveryDate() LocalDateTime
        +getCreatedAt() LocalDateTime
        +getUpdatedAt() LocalDateTime
    }
    
    class CartResponse {
        <<DTO>>
        -List~CartItemResponse~ items
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal shipping
        -BigDecimal grandTotal
        -Boolean isEmpty
    }
    
    class CartItemResponse {
        <<DTO>>
        -Long itemId
        -String productName
        -BigDecimal unitPrice
        -Integer quantity
        -BigDecimal subtotal
        -Boolean isSubscription
        -Integer availableStock
    }
    
    class ProductDetailResponse {
        <<DTO>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer availableStock
        -Boolean inStock
        -Integer minimumProcurementThreshold
        -Boolean isSubscriptionEligible
        -List~String~ imageUrls
        -String sku
        -String brand
    }
    
    class OrderResponse {
        <<DTO>>
        -Long orderId
        -String orderNumber
        -OrderStatus status
        -List~OrderItemResponse~ items
        -BigDecimal subtotal
        -BigDecimal tax
        -BigDecimal shipping
        -BigDecimal grandTotal
        -Address shippingAddress
        -LocalDateTime createdAt
    }
    
    class OrderItemResponse {
        <<DTO>>
        -Long itemId
        -String productName
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        -Boolean isSubscription
    }
    
    class PaymentResponse {
        <<DTO>>
        -Long paymentId
        -PaymentStatus status
        -String transactionId
        -BigDecimal amount
        -LocalDateTime processedAt
    }
    
    class SubscriptionResponse {
        <<DTO>>
        -Long subscriptionId
        -String productName
        -Integer quantity
        -SubscriptionFrequency frequency
        -SubscriptionStatus status
        -LocalDateTime nextDeliveryDate
    }
    
    class EmptyCartException {
        <<Exception>>
        +EmptyCartException(String message)
    }
    
    class InsufficientInventoryException {
        <<Exception>>
        +InsufficientInventoryException(String message)
    }
    
    class OrderNotFoundException {
        <<Exception>>
        +OrderNotFoundException(String message)
    }
    
    class PaymentFailedException {
        <<Exception>>
        +PaymentFailedException(String message)
    }
    
    class UserNotFoundException {
        <<Exception>>
        +UserNotFoundException(String message)
    }
    
    ProductController --> ProductService : depends on
    CartController --> CartService : depends on
    OrderController --> OrderService : depends on
    PaymentController --> PaymentService : depends on
    UserController --> UserService : depends on
    SubscriptionController --> SubscriptionService : depends on
    ProductService --> ProductRepository : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductService : depends on
    CartService --> TaxCalculationService : depends on
    CartService --> ShippingCalculationService : depends on
    OrderService --> OrderRepository : depends on
    OrderService --> OrderItemRepository : depends on
    OrderService --> CartService : depends on
    OrderService --> ProductService : depends on
    OrderService --> PaymentService : depends on
    PaymentService --> PaymentRepository : depends on
    UserService --> UserRepository : depends on
    UserService --> AddressRepository : depends on
    SubscriptionService --> SubscriptionRepository : depends on
    SubscriptionService --> ProductService : depends on
    SubscriptionService --> OrderService : depends on
    ProductRepository --> Product : manages
    CartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    OrderRepository --> Order : manages
    OrderItemRepository --> OrderItem : manages
    PaymentRepository --> Payment : manages
    UserRepository --> User : manages
    AddressRepository --> Address : manages
    SubscriptionRepository --> Subscription : manages
    ProductService --> Product : operates on
    CartService --> ShoppingCart : operates on
    CartService --> CartItem : operates on
    CartService --> CartResponse : returns
    CartService --> EmptyCartException : throws
    CartService --> InsufficientInventoryException : throws
    OrderService --> Order : operates on
    OrderService --> OrderResponse : returns
    PaymentService --> Payment : operates on
    PaymentService --> PaymentResponse : returns
    UserService --> User : operates on
    SubscriptionService --> Subscription : operates on
```

### 2.2 Sequence Diagrams

#### 2.2.1 Enhanced Product Search with Filtering and Pagination

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/search?keyword=laptop&category=electronics&minPrice=500&maxPrice=2000&sortBy=price&page=0&size=20
    ProductController->>ProductService: searchProducts(keyword, category, minPrice, maxPrice, sortBy, page, size)
    ProductService->>ProductRepository: searchProducts(keyword, category, minPrice, maxPrice, pageable)
    ProductRepository->>Database: SELECT with filters, sorting, pagination
    Database-->>ProductRepository: Page<Product>
    ProductRepository-->>ProductService: Page<Product>
    ProductService-->>ProductController: Page<Product>
    ProductController-->>Client: 200 OK with paginated results
```

#### 2.2.2 Get Product By ID with Real-time Availability

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/{id}
    ProductController->>ProductService: getProductById(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT product
    Database-->>ProductRepository: Product
    ProductRepository-->>ProductService: Product
    ProductService->>ProductService: Calculate availableStock = stockQuantity - reservedStock
    ProductService->>ProductService: Determine inStock status
    ProductService->>ProductService: Build ProductDetailResponse with availability
    ProductService-->>ProductController: ProductDetailResponse
    ProductController-->>Client: 200 OK with product details and availability
```

#### 2.2.3 Add to Cart with Inventory Validation and Minimum Procurement Threshold

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant InventoryValidationService
    participant CartRepository
    participant CartItemRepository
    participant Database
    
    Client->>CartController: POST /api/cart/add {userId, productId, quantity, isSubscription}
    CartController->>CartService: addToCart(userId, productId, quantity, isSubscription)
    CartService->>ProductService: getProductById(productId)
    ProductService-->>CartService: Product
    CartService->>CartService: applyMinimumProcurementThreshold(productId, quantity)
    Note over CartService: If quantity < minimumProcurementThreshold,<br/>set quantity = minimumProcurementThreshold
    CartService->>InventoryValidationService: validateInventoryAvailability(productId, adjustedQuantity)
    InventoryValidationService->>ProductService: getAvailableStock(productId)
    ProductService-->>InventoryValidationService: availableStock
    alt Insufficient Inventory
        InventoryValidationService-->>CartService: false
        CartService-->>CartController: throw InsufficientInventoryException
        CartController-->>Client: 400 Bad Request
    else Sufficient Inventory
        InventoryValidationService-->>CartService: true
        CartService->>CartRepository: findByUserId(userId)
        CartRepository-->>CartService: ShoppingCart
        CartService->>CartItemRepository: save(CartItem)
        CartItemRepository->>Database: INSERT cart_item
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>CartService: CartItem
        CartService->>CartService: recalculateCartTotals(cartId)
        CartService->>TaxCalculationService: calculateTax(subtotal, taxCategory, state)
        TaxCalculationService-->>CartService: tax
        CartService->>ShippingCalculationService: calculateShipping(weight, dimensions, zip)
        ShippingCalculationService-->>CartService: shipping
        CartService->>CartService: Build CartResponse
        CartService-->>CartController: CartResponse
        CartController-->>Client: 200 OK with updated cart
    end
```

#### 2.2.4 Real-time Cart Updates and Recalculation

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant TaxCalculationService
    participant ShippingCalculationService
    participant CartItemRepository
    participant Database
    
    Client->>CartController: PUT /api/cart/update-quantity {userId, itemId, quantity}
    CartController->>CartService: updateQuantity(userId, itemId, quantity)
    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository-->>CartService: CartItem
    CartService->>CartService: validateInventory(productId, quantity)
    alt Insufficient Inventory
        CartService-->>CartController: throw InsufficientInventoryException
        CartController-->>Client: 400 Bad Request
    else Sufficient Inventory
        CartService->>CartItemRepository: update quantity and subtotal
        CartItemRepository->>Database: UPDATE cart_item
        Database-->>CartItemRepository: Updated CartItem
        CartService->>CartService: recalculateCartTotals(cartId)
        CartService->>CartItemRepository: findByCartId(cartId)
        CartItemRepository-->>CartService: List<CartItem>
        CartService->>CartService: Calculate new subtotal
        CartService->>TaxCalculationService: calculateTax(subtotal, taxCategory, state)
        TaxCalculationService-->>CartService: tax
        CartService->>ShippingCalculationService: calculateShipping(weight, dimensions, zip)
        ShippingCalculationService-->>CartService: shipping
        CartService->>CartService: Calculate grandTotal
        CartService->>CartService: Build CartResponse
        CartService-->>CartController: CartResponse
        CartController-->>Client: 200 OK with recalculated cart
    end
```

#### 2.2.5 Cart Item Removal

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database
    
    Client->>CartController: DELETE /api/cart/remove/{userId}/{itemId}
    CartController->>CartService: removeFromCart(userId, itemId)
    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository-->>CartService: CartItem
    CartService->>CartItemRepository: deleteById(itemId)
    CartItemRepository->>Database: DELETE FROM cart_item
    Database-->>CartItemRepository: Success
    CartService->>CartService: recalculateCartTotals(cartId)
    CartService-->>CartController: void
    CartController-->>Client: 204 No Content
```

#### 2.2.6 Empty Cart Handling

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database
    
    Client->>CartController: GET /api/cart/{userId}
    CartController->>CartService: getCart(userId)
    CartService->>CartItemRepository: findByCartId(cartId)
    CartItemRepository->>Database: SELECT cart items
    Database-->>CartItemRepository: Empty List
    CartItemRepository-->>CartService: Empty List<CartItem>
    CartService->>CartService: handleEmptyCart(userId)
    CartService->>CartService: Build CartResponse with isEmpty=true
    CartService-->>CartController: CartResponse {isEmpty: true, items: [], totals: 0}
    CartController-->>Client: 200 OK with empty cart response
```

#### 2.2.7 Order Creation from Cart

```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant CartService
    participant ProductService
    participant PaymentService
    participant OrderRepository
    participant OrderItemRepository
    participant Database
    
    Client->>OrderController: POST /api/orders/create {userId, addressId, paymentMethod}
    OrderController->>OrderService: createOrder(userId, orderRequest)
    OrderService->>CartService: getCart(userId)
    CartService-->>OrderService: CartResponse
    alt Empty Cart
        OrderService-->>OrderController: throw EmptyCartException
        OrderController-->>Client: 400 Bad Request
    else Cart Has Items
        OrderService->>ProductService: reserveInventory for all items
        ProductService-->>OrderService: Success
        OrderService->>OrderService: Generate orderNumber
        OrderService->>OrderRepository: save(Order)
        OrderRepository->>Database: INSERT order
        Database-->>OrderRepository: Order
        loop For each cart item
            OrderService->>OrderItemRepository: save(OrderItem)
            OrderItemRepository->>Database: INSERT order_item
        end
        OrderService->>PaymentService: processPayment(orderId, paymentRequest)
        PaymentService-->>OrderService: PaymentResponse
        alt Payment Success
            OrderService->>OrderService: Update order status to CONFIRMED
            OrderService->>CartService: clearCart(userId)
            OrderService->>OrderService: Build OrderResponse
            OrderService-->>OrderController: OrderResponse
            OrderController-->>Client: 201 Created with order details
        else Payment Failed
            OrderService->>ProductService: releaseInventory for all items
            OrderService->>OrderRepository: Update order status to FAILED
            OrderService-->>OrderController: throw PaymentFailedException
            OrderController-->>Client: 400 Bad Request
        end
    end
```

#### 2.2.8 Payment Processing

```mermaid
sequenceDiagram
    participant OrderService
    participant PaymentService
    participant PaymentGatewayAdapter
    participant PaymentRepository
    participant ExternalPaymentGateway
    participant Database
    
    OrderService->>PaymentService: processPayment(orderId, paymentRequest)
    PaymentService->>PaymentService: validatePaymentDetails(paymentRequest)
    PaymentService->>PaymentService: encryptPaymentData(paymentRequest)
    PaymentService->>PaymentGatewayAdapter: initiatePayment(encryptedData, amount)
    PaymentGatewayAdapter->>ExternalPaymentGateway: POST /payment/process
    ExternalPaymentGateway-->>PaymentGatewayAdapter: transactionId, status
    PaymentGatewayAdapter-->>PaymentService: PaymentResult
    PaymentService->>PaymentRepository: save(Payment)
    PaymentRepository->>Database: INSERT payment
    Database-->>PaymentRepository: Payment
    PaymentService->>PaymentService: Build PaymentResponse
    PaymentService-->>OrderService: PaymentResponse
```

#### 2.2.9 Subscription Management

```mermaid
sequenceDiagram
    participant Client
    participant SubscriptionController
    participant SubscriptionService
    participant ProductService
    participant SubscriptionRepository
    participant Database
    
    Client->>SubscriptionController: POST /api/subscriptions/create {userId, productId, quantity, frequency}
    SubscriptionController->>SubscriptionService: createSubscription(userId, subscriptionRequest)
    SubscriptionService->>ProductService: getProductById(productId)
    ProductService-->>SubscriptionService: Product
    alt Product not subscription eligible
        SubscriptionService-->>SubscriptionController: throw InvalidSubscriptionException
        SubscriptionController-->>Client: 400 Bad Request
    else Product is subscription eligible
        SubscriptionService->>SubscriptionService: Calculate nextDeliveryDate based on frequency
        SubscriptionService->>SubscriptionRepository: save(Subscription)
        SubscriptionRepository->>Database: INSERT subscription
        Database-->>SubscriptionRepository: Subscription
        SubscriptionService->>SubscriptionService: Build SubscriptionResponse
        SubscriptionService-->>SubscriptionController: SubscriptionResponse
        SubscriptionController-->>Client: 201 Created with subscription details
    end
```

#### 2.2.10 Soft Delete Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: softDeleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT product
    Database-->>ProductRepository: Product
    ProductRepository-->>ProductService: Product
    ProductService->>ProductService: Set deleted = true, updatedAt = now()
    ProductService->>ProductRepository: save(Product)
    ProductRepository->>Database: UPDATE product SET deleted=true
    Database-->>ProductRepository: Updated Product
    ProductService-->>ProductController: void
    ProductController-->>Client: 204 No Content
```
