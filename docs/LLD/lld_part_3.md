## 7. Controller Layer

### 7.1 ProductController

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    private final ProductService productService;
    
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        ProductDTO created = productService.createProduct(productDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
    
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        ProductDTO updated = productService.updateProduct(id, productDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String keyword) {
        List<ProductDTO> products = productService.searchProducts(keyword);
        return ResponseEntity.ok(products);
    }
}
```

### 7.2 CategoryController

```java
@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    
    private final CategoryService categoryService;
    
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        CategoryDTO created = categoryService.createCategory(categoryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategory(@PathVariable Long id) {
        CategoryDTO category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
    
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/root")
    public ResponseEntity<List<CategoryDTO>> getRootCategories() {
        List<CategoryDTO> categories = categoryService.getRootCategories();
        return ResponseEntity.ok(categories);
    }
}
```

### 7.3 InventoryController

```java
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    
    private final InventoryService inventoryService;
    
    @PutMapping("/product/{productId}")
    public ResponseEntity<InventoryDTO> updateInventory(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        InventoryDTO updated = inventoryService.updateInventory(productId, quantity);
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryDTO> getInventory(@PathVariable Long productId) {
        InventoryDTO inventory = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(inventory);
    }
    
    @PostMapping("/reserve/{productId}")
    public ResponseEntity<Void> reserveStock(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        inventoryService.reserveStock(productId, quantity);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/release/{productId}")
    public ResponseEntity<Void> releaseStock(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        inventoryService.releaseStock(productId, quantity);
        return ResponseEntity.ok().build();
    }
}
```

### 7.4 CartController

```java
@RestController
@RequestMapping("/api/cart")
public class CartController {
    
    private final CartService cartService;
    
    @PostMapping("/add")
    public ResponseEntity<CartDTO> addToCart(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody AddToCartRequest request) {
        CartDTO cart = cartService.addToCart(userId, request);
        return ResponseEntity.ok(cart);
    }
    
    @GetMapping
    public ResponseEntity<CartDTO> getCart(@RequestHeader("X-User-Id") Long userId) {
        CartDTO cart = cartService.getCartDetails(userId);
        return ResponseEntity.ok(cart);
    }
    
    @PutMapping("/update")
    public ResponseEntity<CartDTO> updateCartItem(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateQuantityRequest request) {
        CartDTO cart = cartService.updateCartItemQuantity(userId, request);
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long productId) {
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/empty")
    public ResponseEntity<Boolean> isCartEmpty(@RequestHeader("X-User-Id") Long userId) {
        boolean isEmpty = cartService.isCartEmpty(userId);
        return ResponseEntity.ok(isEmpty);
    }
}
```

## 8. DTO Classes

### 8.1 ProductDTO

```java
public class ProductDTO {
    private Long id;
    
    @NotBlank(message = "Product name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;
    
    private String sku;
    
    private Long categoryId;
    
    private Integer minimumProcurementThreshold;
    
    // Getters and setters
}
```

### 8.2 CategoryDTO

```java
public class CategoryDTO {
    private Long id;
    
    @NotBlank(message = "Category name is required")
    private String name;
    
    private String description;
    
    private Long parentId;
    
    // Getters and setters
}
```

### 8.3 InventoryDTO

```java
public class InventoryDTO {
    private Long id;
    
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
    
    private Integer reservedQuantity;
    
    private Integer availableQuantity;
    
    // Getters and setters
}
```

### 8.4 CartDTO

```java
public class CartDTO {
    private Long id;
    
    private Long userId;
    
    private List<CartItemDTO> items;
    
    private Integer totalItems;
    
    private BigDecimal totalPrice;
    
    // Getters and setters
}
```

### 8.5 CartItemDTO

```java
public class CartItemDTO {
    private Long id;
    
    private Long productId;
    
    private String productName;
    
    private Integer quantity;
    
    private BigDecimal price;
    
    private BigDecimal subtotal;
    
    // Getters and setters
}
```

### 8.6 AddToCartRequest

```java
public class AddToCartRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    // Getters and setters
}
```

### 8.7 UpdateQuantityRequest

```java
public class UpdateQuantityRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    // Getters and setters
}
```

## 9. Exception Handling

### 9.1 Custom Exceptions

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
```

### 9.2 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.toList());
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed: " + String.join(", ", errors),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

## 10. Business Logic

### 10.1 Product Management Rules
- Products must have unique SKU codes
- Price must be greater than zero
- Products can be soft-deleted (isActive flag)
- Products must belong to a valid category

### 10.2 Inventory Management Rules
- Inventory quantity cannot be negative
- Reserved quantity tracks items in pending orders
- Available quantity = Total quantity - Reserved quantity
- Low stock alerts when quantity falls below threshold

### 10.3 Category Management Rules
- Categories can have parent-child relationships
- Root categories have no parent
- Hierarchical structure supports unlimited depth

### 10.4 Shopping Cart Rules
- Each user can have one active cart at a time
- Cart items must reference valid products
- Quantity must meet minimum procurement threshold if specified
- Stock availability must be validated before adding items
- Cart automatically calculates total price
- Items can be updated or removed from cart
- Subscription logic applies for recurring purchases
