## 3. Detailed Component Design

### 3.1 User Management Component

#### 3.1.1 User Controller
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<UserDTO> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        UserDTO user = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long userId) {
        UserDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long userId, 
                                             @Valid @RequestBody UserUpdateRequest request) {
        UserDTO user = userService.updateUser(userId, request);
        return ResponseEntity.ok(user);
    }
}
```

#### 3.1.2 User Service
```java
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public UserDTO registerUser(UserRegistrationRequest request) {
        validateUserRegistration(request);
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setCreatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        return mapToDTO(savedUser);
    }
    
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        return mapToDTO(user);
    }
    
    private void validateUserRegistration(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("User already exists with email: " + request.getEmail());
        }
    }
}
```

### 3.2 Product Catalog Component

#### 3.2.1 Product Controller
```java
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @GetMapping
    public ResponseEntity<Page<ProductDTO>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category) {
        Page<ProductDTO> products = productService.getAllProducts(page, size, category);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{productId}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long productId) {
        ProductDTO product = productService.getProductById(productId);
        return ResponseEntity.ok(product);
    }
    
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductDTO product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }
}
```

### 3.3 Order Management Component

#### 3.3.1 Order Controller
```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody OrderCreateRequest request) {
        OrderDTO order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
    
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long orderId) {
        OrderDTO order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getUserOrders(@PathVariable Long userId) {
        List<OrderDTO> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }
}
```

### 3.4 Payment Processing Component

#### 3.4.1 Payment Controller
```java
@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/process")
    public ResponseEntity<PaymentDTO> processPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentDTO payment = paymentService.processPayment(request);
        return ResponseEntity.ok(payment);
    }
    
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long paymentId) {
        PaymentDTO payment = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(payment);
    }
}
```

### 3.5 Inventory Management Component

#### 3.5.1 Inventory Controller
```java
@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    
    @Autowired
    private InventoryService inventoryService;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryDTO> getInventory(@PathVariable Long productId) {
        InventoryDTO inventory = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(inventory);
    }
    
    @PutMapping("/product/{productId}")
    public ResponseEntity<InventoryDTO> updateInventory(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryUpdateRequest request) {
        InventoryDTO inventory = inventoryService.updateInventory(productId, request);
        return ResponseEntity.ok(inventory);
    }
}
```

### 3.6 Notification Component

#### 3.6.1 Notification Service
```java
@Service
public class NotificationService {
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SmsService smsService;
    
    @Async
    public void sendOrderConfirmation(Order order) {
        String subject = "Order Confirmation - Order #" + order.getId();
        String body = buildOrderConfirmationEmail(order);
        emailService.sendEmail(order.getUser().getEmail(), subject, body);
    }
    
    @Async
    public void sendPaymentConfirmation(Payment payment) {
        String subject = "Payment Confirmation - Payment #" + payment.getId();
        String body = buildPaymentConfirmationEmail(payment);
        emailService.sendEmail(payment.getOrder().getUser().getEmail(), subject, body);
    }
}
```

### 3.7 Authentication & Authorization Component

#### 3.7.1 Security Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/api/v1/auth/**").permitAll()
                .antMatchers("/api/v1/products/**").permitAll()
                .antMatchers("/api/v1/cart/**").authenticated()
                .antMatchers("/api/v1/orders/**").authenticated()
                .antMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
```

### 3.8 Shopping Cart Controller

```java
@RestController
@RequestMapping("/api/v1/cart")
@Validated
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    @GetMapping("/{userId}")
    public ResponseEntity<CartDTO> getCart(@PathVariable Long userId) {
        CartDTO cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }
    
    @PostMapping("/{userId}/items")
    public ResponseEntity<CartDTO> addItemToCart(
            @PathVariable Long userId,
            @Valid @RequestBody AddCartItemRequest request) {
        CartDTO cart = cartService.addItemToCart(userId, request);
        return ResponseEntity.ok(cart);
    }
    
    @PutMapping("/{userId}/items/{itemId}")
    public ResponseEntity<CartDTO> updateCartItem(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartDTO cart = cartService.updateCartItem(userId, itemId, request);
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/{userId}/items/{itemId}")
    public ResponseEntity<CartDTO> removeItemFromCart(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        CartDTO cart = cartService.removeItemFromCart(userId, itemId);
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{userId}/merge")
    public ResponseEntity<CartDTO> mergeCart(
            @PathVariable Long userId,
            @Valid @RequestBody MergeCartRequest request) {
        CartDTO cart = cartService.mergeCart(userId, request);
        return ResponseEntity.ok(cart);
    }
}
```

### 3.9 Shopping Cart Service

```java
@Service
@Transactional
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private InventoryService inventoryService;
    
    @Autowired
    private PriceCalculator priceCalculator;
    
    @Autowired
    private CartValidator cartValidator;
    
    public CartDTO getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseGet(() -> createNewCart(userId));
        return mapToDTO(cart);
    }
    
    public CartDTO addItemToCart(Long userId, AddCartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseGet(() -> createNewCart(userId));
        
        // Validate product exists and is available
        ProductDTO product = productService.getProductById(request.getProductId());
        cartValidator.validateProductAvailability(product, request.getQuantity());
        
        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
            .filter(item -> item.getProductId().equals(request.getProductId()))
            .findFirst();
        
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            cartValidator.validateQuantity(product, newQuantity);
            item.setQuantity(newQuantity);
            item.setUpdatedAt(LocalDateTime.now());
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(request.getProductId());
            newItem.setQuantity(request.getQuantity());
            newItem.setPrice(product.getPrice());
            newItem.setCreatedAt(LocalDateTime.now());
            newItem.setUpdatedAt(LocalDateTime.now());
            cart.getItems().add(newItem);
        }
        
        updateCartTotals(cart);
        Cart savedCart = cartRepository.save(cart);
        return mapToDTO(savedCart);
    }
    
    public CartDTO updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        CartItem item = cart.getItems().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new CartItemNotFoundException("Cart item not found: " + itemId));
        
        ProductDTO product = productService.getProductById(item.getProductId());
        cartValidator.validateQuantity(product, request.getQuantity());
        
        item.setQuantity(request.getQuantity());
        item.setUpdatedAt(LocalDateTime.now());
        
        updateCartTotals(cart);
        Cart savedCart = cartRepository.save(cart);
        return mapToDTO(savedCart);
    }
    
    public CartDTO removeItemFromCart(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        
        updateCartTotals(cart);
        Cart savedCart = cartRepository.save(cart);
        return mapToDTO(savedCart);
    }
    
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        cart.getItems().clear();
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setTax(BigDecimal.ZERO);
        cart.setTotal(BigDecimal.ZERO);
        cartRepository.save(cart);
    }
    
    public CartDTO mergeCart(Long userId, MergeCartRequest request) {
        Cart userCart = cartRepository.findByUserId(userId)
            .orElseGet(() -> createNewCart(userId));
        
        for (CartItemDTO guestItem : request.getGuestCartItems()) {
            AddCartItemRequest addRequest = new AddCartItemRequest();
            addRequest.setProductId(guestItem.getProductId());
            addRequest.setQuantity(guestItem.getQuantity());
            addItemToCart(userId, addRequest);
        }
        
        return getCartByUserId(userId);
    }
    
    private Cart createNewCart(Long userId) {
        Cart cart = new Cart();
        cart.setUserId(userId);
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setTax(BigDecimal.ZERO);
        cart.setTotal(BigDecimal.ZERO);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }
    
    private void updateCartTotals(Cart cart) {
        BigDecimal subtotal = cart.getItems().stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal tax = priceCalculator.calculateTax(subtotal);
        BigDecimal total = subtotal.add(tax);
        
        cart.setSubtotal(subtotal);
        cart.setTax(tax);
        cart.setTotal(total);
        cart.setUpdatedAt(LocalDateTime.now());
    }
    
    private CartDTO mapToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUserId());
        dto.setItems(cart.getItems().stream()
            .map(this::mapItemToDTO)
            .collect(Collectors.toList()));
        dto.setSubtotal(cart.getSubtotal());
        dto.setTax(cart.getTax());
        dto.setTotal(cart.getTotal());
        dto.setCreatedAt(cart.getCreatedAt());
        dto.setUpdatedAt(cart.getUpdatedAt());
        return dto;
    }
    
    private CartItemDTO mapItemToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProductId());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
```

### 3.10 Shopping Cart Repository

```java
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    Optional<Cart> findByUserId(Long userId);
    
    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.items WHERE c.userId = :userId")
    Optional<Cart> findByUserIdWithItems(@Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM Cart c WHERE c.updatedAt < :expiryDate")
    void deleteExpiredCarts(@Param("expiryDate") LocalDateTime expiryDate);
    
    boolean existsByUserId(Long userId);
}

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.userId = :userId AND ci.productId = :productId")
    Optional<CartItem> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cart.id = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);
}
```

### 3.11 Shopping Cart Entities

```java
@Entity
@Table(name = "carts")
public class Cart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();
    
    @Column(name = "subtotal", precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    @Column(name = "tax", precision = 10, scale = 2)
    private BigDecimal tax;
    
    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Getters and setters
}

@Entity
@Table(name = "cart_items")
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Getters and setters
}
```

### 3.12 Shopping Cart DTOs and Validators

```java
@Data
public class CartDTO {
    private Long id;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
public class CartItemDTO {
    private Long id;
    private Long productId;
    private Integer quantity;
    private BigDecimal price;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
public class AddCartItemRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100")
    private Integer quantity;
}

@Data
public class UpdateCartItemRequest {
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100")
    private Integer quantity;
}

@Data
public class MergeCartRequest {
    @NotNull(message = "Guest cart items are required")
    private List<CartItemDTO> guestCartItems;
}

@Component
public class CartValidator {
    
    @Autowired
    private InventoryService inventoryService;
    
    public void validateProductAvailability(ProductDTO product, Integer quantity) {
        if (!product.isActive()) {
            throw new ProductNotAvailableException("Product is not available: " + product.getId());
        }
        
        InventoryDTO inventory = inventoryService.getInventoryByProductId(product.getId());
        if (inventory.getAvailableQuantity() < quantity) {
            throw new InsufficientInventoryException(
                "Insufficient inventory for product: " + product.getId() + 
                ". Available: " + inventory.getAvailableQuantity() + 
                ", Requested: " + quantity);
        }
    }
    
    public void validateQuantity(ProductDTO product, Integer quantity) {
        if (quantity < 1) {
            throw new InvalidQuantityException("Quantity must be at least 1");
        }
        
        if (quantity > 100) {
            throw new InvalidQuantityException("Quantity cannot exceed 100");
        }
        
        InventoryDTO inventory = inventoryService.getInventoryByProductId(product.getId());
        if (inventory.getAvailableQuantity() < quantity) {
            throw new InsufficientInventoryException(
                "Insufficient inventory for product: " + product.getId() + 
                ". Available: " + inventory.getAvailableQuantity() + 
                ", Requested: " + quantity);
        }
    }
}

@Component
public class PriceCalculator {
    
    private static final BigDecimal TAX_RATE = new BigDecimal("0.08"); // 8% tax
    
    public BigDecimal calculateTax(BigDecimal subtotal) {
        return subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
    }
    
    public BigDecimal calculateTotal(BigDecimal subtotal, BigDecimal tax) {
        return subtotal.add(tax);
    }
}
```
