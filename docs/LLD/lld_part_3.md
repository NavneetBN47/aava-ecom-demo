## 7. Exception Handling

### Custom Exceptions

```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}

public class CartNotFoundException extends RuntimeException {
    public CartNotFoundException(Long userId) {
        super("Cart not found for user: " + userId);
    }
}

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long itemId) {
        super("Cart item not found with id: " + itemId);
    }
}

public class OutOfStockException extends RuntimeException {
    public OutOfStockException(String productName) {
        super("Product out of stock: " + productName);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String productName, Integer available, Integer requested) {
        super(String.format("Insufficient stock for %s. Available: %d, Requested: %d", 
            productName, available, requested));
    }
}
```

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(OutOfStockException.class)
    public ResponseEntity<ErrorResponse> handleOutOfStock(OutOfStockException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    // Additional exception handlers...
}
```

---

## 8. Validation Rules

### Product Validation
- Product ID must be positive
- Product name cannot be empty
- Price must be greater than 0
- Stock quantity must be non-negative

### Cart Validation
- User ID must be positive
- Product ID must exist in products table
- Quantity must be between 1 and available stock
- Cannot add more items than available stock

### Business Rules
- Cart items are automatically removed if product is deleted
- Price is captured at the time of adding to cart (price_at_add)
- Cart total is calculated dynamically based on current product prices
- Stock validation occurs before adding/updating cart items

---

## 9. Shopping Cart Module - Detailed Design

### 9.1 Cart Service Implementation

```java
@Service
@Transactional
public class CartServiceImpl implements CartService {
    
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    
    @Override
    public CartDTO getCartByUserId(Long userId) {
        Optional<Cart> cartOpt = cartRepository.findByUserId(userId);
        
        if (cartOpt.isEmpty()) {
            return createEmptyCart(userId);
        }
        
        Cart cart = cartOpt.get();
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        return convertToDTO(cart, items);
    }
    
    @Override
    public CartDTO addItemToCart(Long userId, Long productId, Integer quantity) {
        // Validate product exists and has sufficient stock
        ProductDTO product = productService.getProductById(productId);
        
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(
                product.getName(), 
                product.getStockQuantity(), 
                quantity
            );
        }
        
        // Get or create cart
        Cart cart = cartRepository.findByUserId(userId)
            .orElseGet(() -> createNewCart(userId));
        
        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartItemRepository
            .findByCartIdAndProductId(cart.getId(), productId);
        
        CartItem cartItem;
        if (existingItem.isPresent()) {
            cartItem = existingItem.get();
            int newQuantity = cartItem.getQuantity() + quantity;
            
            if (product.getStockQuantity() < newQuantity) {
                throw new InsufficientStockException(
                    product.getName(),
                    product.getStockQuantity(),
                    newQuantity
                );
            }
            
            cartItem.setQuantity(newQuantity);
        } else {
            cartItem = new CartItem();
            cartItem.setCartId(cart.getId());
            cartItem.setProductId(productId);
            cartItem.setQuantity(quantity);
            cartItem.setPriceAtAdd(product.getPrice());
            cartItem.setAddedAt(LocalDateTime.now());
        }
        
        cartItemRepository.save(cartItem);
        
        return getCartByUserId(userId);
    }
    
    @Override
    public CartDTO updateCartItem(Long userId, Long itemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new CartItemNotFoundException(itemId));
        
        ProductDTO product = productService.getProductById(cartItem.getProductId());
        
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(
                product.getName(),
                product.getStockQuantity(),
                quantity
            );
        }
        
        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        
        return getCartByUserId(userId);
    }
    
    @Override
    public void removeCartItem(Long userId, Long itemId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new CartItemNotFoundException(itemId));
        
        cartItemRepository.deleteById(itemId);
    }
    
    @Override
    public void clearCart(Long userId) {
        Optional<Cart> cartOpt = cartRepository.findByUserId(userId);
        
        if (cartOpt.isPresent()) {
            cartItemRepository.deleteByCartId(cartOpt.get().getId());
        }
    }
    
    @Override
    public BigDecimal calculateCartTotal(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        return items.stream()
            .map(item -> {
                ProductDTO product = productService.getProductById(item.getProductId());
                return product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private Cart createNewCart(Long userId) {
        Cart cart = new Cart();
        cart.setUserId(userId);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }
    
    private CartDTO createEmptyCart(Long userId) {
        CartDTO dto = new CartDTO();
        dto.setUserId(userId);
        dto.setItems(new ArrayList<>());
        dto.setTotalAmount(BigDecimal.ZERO);
        dto.setTotalItems(0);
        return dto;
    }
    
    private CartDTO convertToDTO(Cart cart, List<CartItem> items) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUserId());
        
        List<CartItemDTO> itemDTOs = items.stream()
            .map(this::convertItemToDTO)
            .collect(Collectors.toList());
        
        dto.setItems(itemDTOs);
        dto.setTotalItems(items.size());
        
        BigDecimal total = itemDTOs.stream()
            .map(CartItemDTO::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmount(total);
        
        return dto;
    }
    
    private CartItemDTO convertItemToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        
        ProductDTO product = productService.getProductById(item.getProductId());
        dto.setProduct(product);
        dto.setQuantity(item.getQuantity());
        
        BigDecimal subtotal = product.getPrice()
            .multiply(BigDecimal.valueOf(item.getQuantity()));
        dto.setSubtotal(subtotal);
        
        return dto;
    }
}
```

---

## 10. Repository Layer

### 10.1 Product Repository

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Product> searchByNameOrDescription(
        @Param("keyword") String keyword, 
        Pageable pageable
    );
    
    @Query("SELECT p FROM Product p WHERE p.category = :category")
    Page<Product> findByCategory(
        @Param("category") String category, 
        Pageable pageable
    );
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithStockLock(@Param("id") Long id);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity > 0")
    List<Product> findAvailableProducts();
}
```

### 10.2 Cart Repository

```java
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    Optional<Cart> findByUserId(Long userId);
    
    void deleteByUserId(Long userId);
    
    @Query("SELECT c FROM Cart c WHERE c.updatedAt < :cutoffDate")
    List<Cart> findAbandonedCarts(@Param("cutoffDate") LocalDateTime cutoffDate);
}
```

### 10.3 Cart Item Repository

```java
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    
    void deleteByCartId(Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.productId = :productId")
    List<CartItem> findByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cartId = :cartId")
    Integer countItemsInCart(@Param("cartId") Long cartId);
}
```

---

## 11. Controller Layer

### 11.1 Product Controller

```java
@RestController
@RequestMapping("/api/products")
@Validated
public class ProductController {
    
    private final ProductService productService;
    
    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(
            @PathVariable @Positive Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
    
    @GetMapping
    public ResponseEntity<Page<ProductDTO>> getAllProducts(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        Page<ProductDTO> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductDTO> products = productService.searchProducts(keyword, pageable);
        return ResponseEntity.ok(products);
    }
}
```

### 11.2 Cart Controller

```java
@RestController
@RequestMapping("/api/cart")
@Validated
public class CartController {
    
    private final CartService cartService;
    
    @Autowired
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }
    
    @GetMapping("/{userId}")
    public ResponseEntity<CartDTO> getCart(
            @PathVariable @Positive Long userId) {
        CartDTO cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }
    
    @PostMapping("/{userId}/items")
    public ResponseEntity<CartDTO> addItemToCart(
            @PathVariable @Positive Long userId,
            @RequestBody @Valid AddCartItemRequest request) {
        CartDTO cart = cartService.addItemToCart(
            userId, 
            request.getProductId(), 
            request.getQuantity()
        );
        return ResponseEntity.ok(cart);
    }
    
    @PutMapping("/{userId}/items/{itemId}")
    public ResponseEntity<CartDTO> updateCartItem(
            @PathVariable @Positive Long userId,
            @PathVariable @Positive Long itemId,
            @RequestBody @Valid UpdateCartItemRequest request) {
        CartDTO cart = cartService.updateCartItem(userId, itemId, request.getQuantity());
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/{userId}/items/{itemId}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable @Positive Long userId,
            @PathVariable @Positive Long itemId) {
        cartService.removeCartItem(userId, itemId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(
            @PathVariable @Positive Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 12. Service Layer Interfaces

### 12.1 Product Service Interface

```java
public interface ProductService {
    ProductDTO getProductById(Long id);
    Page<ProductDTO> getAllProducts(Pageable pageable);
    Page<ProductDTO> searchProducts(String keyword, Pageable pageable);
    boolean checkInventoryAvailability(Long productId, Integer requestedQuantity);
    void reserveInventory(Long productId, Integer quantity);
}
```

### 12.2 Cart Service Interface

```java
public interface CartService {
    CartDTO getCartByUserId(Long userId);
    CartDTO addItemToCart(Long userId, Long productId, Integer quantity);
    CartDTO updateCartItem(Long userId, Long itemId, Integer quantity);
    void removeCartItem(Long userId, Long itemId);
    void clearCart(Long userId);
    BigDecimal calculateCartTotal(Cart cart);
}
```

---
