## 3. Component Design

### 3.1 Controller Layer

#### 3.1.1 ProductController

**Responsibility**: Handle HTTP requests for product-related operations

```java
@RestController
@RequestMapping("/api/v1/products")
@Validated
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean subscriptionEligible) {
        // Implementation
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        // Implementation
    }
    
    @GetMapping("/{id}/availability")
    public ResponseEntity<ProductAvailabilityResponse> checkProductAvailability(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        // Implementation
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        // Implementation
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        // Implementation
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        // Implementation
    }
}
```

#### 3.1.2 ShoppingCartController

**Responsibility**: Handle HTTP requests for shopping cart operations

```java
@RestController
@RequestMapping("/api/v1/cart")
@Validated
public class ShoppingCartController {
    
    private final ShoppingCartService shoppingCartService;
    
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        // Implementation
    }
    
    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        // Implementation
    }
    
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        // Implementation
    }
    
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeFromCart(
            @PathVariable Long cartItemId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        // Implementation
    }
    
    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        // Implementation
    }
}
```

#### 3.1.3 CheckoutController

**Responsibility**: Handle HTTP requests for checkout operations

```java
@RestController
@RequestMapping("/api/v1/checkout")
@Validated
public class CheckoutController {
    
    private final CheckoutService checkoutService;
    
    @PostMapping("/initiate")
    public ResponseEntity<CheckoutSessionResponse> initiateCheckout(
            @Valid @RequestBody InitiateCheckoutRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        // Implementation
    }
    
    @PostMapping("/complete")
    public ResponseEntity<OrderResponse> completeCheckout(
            @Valid @RequestBody CompleteCheckoutRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        // Implementation
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<CheckoutSessionResponse> getCheckoutSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") Long userId) {
        // Implementation
    }
}
```

### 3.2 Service Layer

#### 3.2.1 ProductService

**Responsibility**: Business logic for product management

```java
@Service
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    
    public Page<ProductResponse> getAllProducts(Pageable pageable, String category, Boolean subscriptionEligible) {
        // Implementation with filtering
    }
    
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        return productMapper.toResponse(product);
    }
    
    public ProductResponse createProduct(CreateProductRequest request) {
        // Validation and creation logic
    }
    
    public ProductResponse updateProduct(Long id, UpdateProductRequest request) {
        // Update logic with validation
    }
    
    public void deleteProduct(Long id) {
        // Soft delete implementation
    }
    
    public boolean checkStockAvailability(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        return product.getStockQuantity() >= quantity;
    }
    
    public void decrementStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(productId, quantity, product.getStockQuantity());
        }
        
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
    }
    
    public ProductWithPurchaseTypeResponse getProductWithPurchaseTypeInfo(Long productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        return productMapper.toProductWithPurchaseTypeResponse(product);
    }
    
    private void validateProduct(Product product) {
        // Business rule validations
    }
}
```

#### 3.2.2 ShoppingCartService

**Responsibility**: Business logic for shopping cart operations

```java
@Service
@Transactional
public class ShoppingCartService {
    
    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final InventoryValidationService inventoryValidationService;
    private final CartCalculationService cartCalculationService;
    private final ShoppingCartMapper cartMapper;
    
    public CartResponse addToCart(AddToCartRequest request, Long userId, String sessionId) {
        // Validate product exists and has sufficient stock
        inventoryValidationService.validateProductAvailability(
            request.getProductId(), 
            request.getQuantity()
        );
        
        // Get or create cart
        ShoppingCart cart = getOrCreateCart(userId, sessionId);
        
        // Check for duplicate items (same product + purchase type)
        Optional<CartItem> existingItem = cartItemRepository
            .findByCartIdAndProductIdAndPurchaseType(
                cart.getId(), 
                request.getProductId(), 
                request.getPurchaseType()
            );
        
        if (existingItem.isPresent()) {
            // Update quantity of existing item
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            // Create new cart item
            CartItem newItem = createCartItem(cart, request);
            cartItemRepository.save(newItem);
        }
        
        // Recalculate cart totals
        cartCalculationService.recalculateCart(cart);
        
        return cartMapper.toResponse(cart);
    }
    
    public CartResponse getCart(Long userId, String sessionId) {
        ShoppingCart cart = findCart(userId, sessionId)
            .orElseThrow(() -> new CartNotFoundException());
        return cartMapper.toResponse(cart);
    }
    
    public CartResponse updateCartItemQuantity(Long cartItemId, Integer quantity, Long userId, String sessionId) {
        ShoppingCart cart = findCart(userId, sessionId)
            .orElseThrow(() -> new CartNotFoundException());
        
        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new CartItemNotFoundException(cartItemId));
        
        // Validate item belongs to cart
        if (!item.getCartId().equals(cart.getId())) {
            throw new UnauthorizedCartAccessException();
        }
        
        // Validate stock availability
        inventoryValidationService.validateProductAvailability(
            item.getProductId(), 
            quantity
        );
        
        item.setQuantity(quantity);
        cartItemRepository.save(item);
        
        // Recalculate cart totals
        cartCalculationService.recalculateCart(cart);
        
        return cartMapper.toResponse(cart);
    }
    
    public CartResponse removeFromCart(Long cartItemId, Long userId, String sessionId) {
        ShoppingCart cart = findCart(userId, sessionId)
            .orElseThrow(() -> new CartNotFoundException());
        
        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new CartItemNotFoundException(cartItemId));
        
        // Validate item belongs to cart
        if (!item.getCartId().equals(cart.getId())) {
            throw new UnauthorizedCartAccessException();
        }
        
        cartItemRepository.delete(item);
        
        // Recalculate cart totals
        cartCalculationService.recalculateCart(cart);
        
        return cartMapper.toResponse(cart);
    }
    
    public void clearCart(Long userId, String sessionId) {
        ShoppingCart cart = findCart(userId, sessionId)
            .orElseThrow(() -> new CartNotFoundException());
        
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setStatus(CartStatus.CLEARED);
        shoppingCartRepository.save(cart);
    }
    
    private ShoppingCart getOrCreateCart(Long userId, String sessionId) {
        return findCart(userId, sessionId)
            .orElseGet(() -> createNewCart(userId, sessionId));
    }
    
    private Optional<ShoppingCart> findCart(Long userId, String sessionId) {
        if (userId != null) {
            return shoppingCartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE);
        } else if (sessionId != null) {
            return shoppingCartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE);
        }
        return Optional.empty();
    }
    
    private ShoppingCart createNewCart(Long userId, String sessionId) {
        ShoppingCart cart = new ShoppingCart();
        cart.setUserId(userId);
        cart.setSessionId(sessionId);
        cart.setStatus(CartStatus.ACTIVE);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setExpiresAt(LocalDateTime.now().plusDays(30));
        return shoppingCartRepository.save(cart);
    }
    
    private CartItem createCartItem(ShoppingCart cart, AddToCartRequest request) {
        Product product = productService.getProductById(request.getProductId());
        
        CartItem item = new CartItem();
        item.setCartId(cart.getId());
        item.setProductId(request.getProductId());
        item.setQuantity(request.getQuantity());
        item.setPurchaseType(request.getPurchaseType());
        
        // Set price based on purchase type
        if (request.getPurchaseType() == PurchaseType.SUBSCRIPTION) {
            item.setUnitPrice(product.getSubscriptionPrice());
        } else {
            item.setUnitPrice(product.getPrice());
        }
        
        item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity())));
        item.setAddedAt(LocalDateTime.now());
        
        return item;
    }
}
```

#### 3.2.3 InventoryValidationService

**Responsibility**: Validate product availability and stock levels

```java
@Service
public class InventoryValidationService {
    
    private final ProductRepository productRepository;
    
    public void validateProductAvailability(Long productId, Integer requestedQuantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        
        // Check if product is active
        if (!product.isActive()) {
            throw new ProductNotAvailableException(productId, "Product is not active");
        }
        
        // Check stock quantity
        if (product.getStockQuantity() < requestedQuantity) {
            throw new InsufficientStockException(
                productId, 
                requestedQuantity, 
                product.getStockQuantity()
            );
        }
        
        // Check min/max quantity constraints
        if (product.getMinQuantity() != null && requestedQuantity < product.getMinQuantity()) {
            throw new QuantityConstraintException(
                productId, 
                "Quantity below minimum: " + product.getMinQuantity()
            );
        }
        
        if (product.getMaxQuantity() != null && requestedQuantity > product.getMaxQuantity()) {
            throw new QuantityConstraintException(
                productId, 
                "Quantity exceeds maximum: " + product.getMaxQuantity()
            );
        }
    }
    
    public boolean isProductAvailable(Long productId, Integer quantity) {
        try {
            validateProductAvailability(productId, quantity);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

#### 3.2.4 CartCalculationService

**Responsibility**: Calculate cart totals and apply business rules

```java
@Service
public class CartCalculationService {
    
    private final CartItemRepository cartItemRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    
    public void recalculateCart(ShoppingCart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        
        for (CartItem item : items) {
            // Recalculate item subtotal
            BigDecimal itemSubtotal = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(itemSubtotal);
            cartItemRepository.save(item);
            
            subtotal = subtotal.add(itemSubtotal);
        }
        
        // Calculate tax (example: 10% tax rate)
        tax = subtotal.multiply(BigDecimal.valueOf(0.10));
        total = subtotal.add(tax);
        
        // Update cart totals
        cart.setSubtotal(subtotal);
        cart.setTax(tax);
        cart.setTotal(total);
        cart.setUpdatedAt(LocalDateTime.now());
        
        shoppingCartRepository.save(cart);
    }
    
    public CartTotals calculateTotals(Long cartId) {
        ShoppingCart cart = shoppingCartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException());
        
        List<CartItem> items = cartItemRepository.findByCartId(cartId);
        
        BigDecimal subtotal = items.stream()
            .map(CartItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.10));
        BigDecimal total = subtotal.add(tax);
        
        return new CartTotals(subtotal, tax, total);
    }
}
```

### 3.3 Repository Layer

#### 3.3.1 ProductRepository

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Page<Product> findByCategory(String category, Pageable pageable);
    
    Page<Product> findByIsSubscriptionEligible(Boolean isSubscriptionEligible, Pageable pageable);
    
    Page<Product> findByCategoryAndIsSubscriptionEligible(
        String category, 
        Boolean isSubscriptionEligible, 
        Pageable pageable
    );
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true")
    Page<Product> findAllActive(Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity < :threshold")
    List<Product> findLowStockProducts(@Param("threshold") Integer threshold);
    
    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity WHERE p.id = :productId")
    int decrementStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}
```

#### 3.3.2 ShoppingCartRepository

```java
@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    
    Optional<ShoppingCart> findByUserIdAndStatus(Long userId, CartStatus status);
    
    Optional<ShoppingCart> findBySessionIdAndStatus(String sessionId, CartStatus status);
    
    @Query("SELECT c FROM ShoppingCart c WHERE c.expiresAt < :now AND c.status = :status")
    List<ShoppingCart> findExpiredCarts(
        @Param("now") LocalDateTime now, 
        @Param("status") CartStatus status
    );
    
    @Modifying
    @Query("UPDATE ShoppingCart c SET c.status = :newStatus WHERE c.id IN :cartIds")
    int updateCartStatus(
        @Param("cartIds") List<Long> cartIds, 
        @Param("newStatus") CartStatus newStatus
    );
}
```

#### 3.3.3 CartItemRepository

```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    Optional<CartItem> findByCartIdAndProductIdAndPurchaseType(
        Long cartId, 
        Long productId, 
        PurchaseType purchaseType
    );
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);
    
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cartId = :cartId")
    int countItemsInCart(@Param("cartId") Long cartId);
    
    @Query("SELECT SUM(ci.quantity) FROM CartItem ci WHERE ci.cartId = :cartId")
    Integer getTotalQuantityInCart(@Param("cartId") Long cartId);
}
```
