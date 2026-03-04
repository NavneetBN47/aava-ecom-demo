## 9. Shopping Cart Business Logic

### 9.1 Cart Calculation Logic

**Subtotal Calculation:**
- Subtotal = Quantity × Price at Addition
- Calculated automatically when item is added or quantity is updated
- Uses priceAtAddition to maintain price consistency even if product price changes

**Cart Total Calculation:**
- Cart Total = Sum of all item subtotals
- Recalculated automatically when:
  - Item is added to cart
  - Item quantity is updated
  - Item is removed from cart

### 9.2 Empty Cart Handling

**Empty Cart Response:**
```json
{
  "message": "Your cart is empty",
  "continueShoppingLink": "/products",
  "totalItems": 0,
  "totalAmount": 0.00
}
```

**Conditions for Empty Cart:**
- No cart exists for customer
- Cart exists but has no items
- All items have been removed

### 9.3 Cart Service Methods

**CartService Implementation:**

```java
@Service
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * Add item to cart with default quantity 1
     */
    public CartItem addItemToCart(Long customerId, Long productId, Integer quantity) {
        // Get or create cart for customer
        ShoppingCart cart = cartRepository.findByCustomerId(customerId)
            .orElseGet(() -> createNewCart(customerId));
        
        // Get product details
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        
        // Create cart item
        CartItem cartItem = new CartItem();
        cartItem.setCartId(cart.getId());
        cartItem.setProductId(productId);
        cartItem.setQuantity(quantity != null ? quantity : 1);
        cartItem.setPriceAtAddition(product.getPrice());
        cartItem.setSubtotal(cartItem.getQuantity() * product.getPrice());
        
        // Save cart item
        CartItem savedItem = cartItemRepository.save(cartItem);
        
        // Recalculate cart total
        calculateTotals(cart);
        
        return savedItem;
    }
    
    /**
     * Get cart with all items or empty cart message
     */
    public ShoppingCart getCart(Long customerId) {
        Optional<ShoppingCart> cartOpt = cartRepository.findByCustomerId(customerId);
        
        if (cartOpt.isEmpty()) {
            return createEmptyCartResponse();
        }
        
        ShoppingCart cart = cartOpt.get();
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        if (items.isEmpty()) {
            return createEmptyCartResponse();
        }
        
        cart.setItems(items);
        return cart;
    }
    
    /**
     * Update item quantity with automatic recalculation
     */
    public CartItem updateItemQuantity(Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new CartItemNotFoundException("Cart item not found"));
        
        // Update quantity and recalculate subtotal
        item.setQuantity(quantity);
        item.setSubtotal(quantity * item.getPriceAtAddition());
        
        CartItem updatedItem = cartItemRepository.save(item);
        
        // Recalculate cart total
        ShoppingCart cart = cartRepository.findById(item.getCartId())
            .orElseThrow(() -> new CartNotFoundException("Cart not found"));
        calculateTotals(cart);
        
        return updatedItem;
    }
    
    /**
     * Remove item from cart and update totals
     */
    public void removeItem(Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new CartItemNotFoundException("Cart item not found"));
        
        Long cartId = item.getCartId();
        cartItemRepository.deleteById(itemId);
        
        // Recalculate cart total
        ShoppingCart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found"));
        calculateTotals(cart);
    }
    
    /**
     * Calculate cart totals (sum of all subtotals)
     */
    public void calculateTotals(ShoppingCart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        BigDecimal total = items.stream()
            .map(CartItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        cart.setTotalAmount(total);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }
    
    private ShoppingCart createNewCart(Long customerId) {
        ShoppingCart cart = new ShoppingCart();
        cart.setCustomerId(customerId);
        cart.setStatus("ACTIVE");
        cart.setTotalAmount(BigDecimal.ZERO);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }
    
    private ShoppingCart createEmptyCartResponse() {
        ShoppingCart emptyCart = new ShoppingCart();
        emptyCart.setTotalAmount(BigDecimal.ZERO);
        emptyCart.setItems(new ArrayList<>());
        return emptyCart;
    }
}
```

## 10. Entity Models

### 10.1 ShoppingCart Entity

```java
@Entity
@Table(name = "shopping_carts")
public class ShoppingCart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "customer_id", nullable = false, unique = true)
    private Long customerId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @OneToMany(mappedBy = "cartId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CartItem> items;
    
    // Getters and Setters
}
```

### 10.2 CartItem Entity

```java
@Entity
@Table(name = "cart_items")
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "cart_id", nullable = false)
    private Long cartId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "price_at_addition", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtAddition;
    
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    
    // Getters and Setters
}
```

## 11. Repository Layer

### 11.1 CartRepository

```java
@Repository
public interface CartRepository extends JpaRepository<ShoppingCart, Long> {
    
    Optional<ShoppingCart> findByCustomerId(Long customerId);
    
    @Query("SELECT c FROM ShoppingCart c WHERE c.customerId = :customerId AND c.status = 'ACTIVE'")
    Optional<ShoppingCart> findActiveCartByCustomerId(@Param("customerId") Long customerId);
}
```

### 11.2 CartItemRepository

```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.productId = :productId")
    Optional<CartItem> findByCartIdAndProductId(@Param("cartId") Long cartId, @Param("productId") Long productId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId")
    void deleteAllByCartId(@Param("cartId") Long cartId);
}
```

## 12. Controller Layer

### 12.1 CartController

```java
@RestController
@RequestMapping("/api/cart")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    /**
     * Add product to cart with default quantity 1
     */
    @PostMapping("/items")
    public ResponseEntity<CartItem> addItemToCart(
            @RequestParam Long customerId,
            @RequestParam Long productId,
            @RequestParam(required = false, defaultValue = "1") Integer quantity) {
        
        CartItem cartItem = cartService.addItemToCart(customerId, productId, quantity);
        return ResponseEntity.status(HttpStatus.CREATED).body(cartItem);
    }
    
    /**
     * View cart with all items (name, price, quantity, subtotal)
     */
    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam Long customerId) {
        ShoppingCart cart = cartService.getCart(customerId);
        
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("message", "Your cart is empty");
            emptyResponse.put("continueShoppingLink", "/products");
            emptyResponse.put("totalItems", 0);
            emptyResponse.put("totalAmount", 0.00);
            return ResponseEntity.ok(emptyResponse);
        }
        
        return ResponseEntity.ok(cart);
    }
    
    /**
     * Update item quantity with automatic recalculation
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartItem> updateItemQuantity(
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        
        CartItem updatedItem = cartService.updateItemQuantity(itemId, quantity);
        return ResponseEntity.ok(updatedItem);
    }
    
    /**
     * Remove item from cart and update totals
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long itemId) {
        cartService.removeItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
```