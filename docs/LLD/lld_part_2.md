## 6. Service Layer

### 6.1 ProductService

```java
@Service
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    
    public ProductDTO createProduct(ProductDTO productDTO) {
        validateProductData(productDTO);
        
        Product product = new Product();
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setSku(productDTO.getSku());
        product.setMinimumProcurementThreshold(productDTO.getMinimumProcurementThreshold());
        product.setCreatedAt(LocalDateTime.now());
        product.setIsActive(true);
        
        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }
        
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }
    
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }
    
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setMinimumProcurementThreshold(productDTO.getMinimumProcurementThreshold());
        product.setUpdatedAt(LocalDateTime.now());
        
        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }
    
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }
    
    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String keyword) {
        return productRepository.searchProducts(keyword).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public boolean validateStockAvailability(Long productId, Integer requestedQuantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        Inventory inventory = product.getInventory();
        if (inventory == null) {
            return false;
        }
        
        int availableQuantity = inventory.getQuantity() - inventory.getReservedQuantity();
        return availableQuantity >= requestedQuantity;
    }
    
    private void validateProductData(ProductDTO productDTO) {
        if (productDTO.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Price must be greater than zero");
        }
    }
    
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setSku(product.getSku());
        dto.setMinimumProcurementThreshold(product.getMinimumProcurementThreshold());
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
        }
        return dto;
    }
}
```

### 6.2 CategoryService

```java
@Service
@Transactional
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        
        if (categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        }
        
        Category savedCategory = categoryRepository.save(category);
        return convertToDTO(savedCategory);
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        return convertToDTO(category);
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getRootCategories() {
        return categoryRepository.findByParentIsNull().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        if (category.getParent() != null) {
            dto.setParentId(category.getParent().getId());
        }
        return dto;
    }
}
```

### 6.3 InventoryService

```java
@Service
@Transactional
public class InventoryService {
    
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    
    public InventoryDTO updateInventory(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        Inventory inventory = inventoryRepository.findByProduct(product)
            .orElseGet(() -> {
                Inventory newInventory = new Inventory();
                newInventory.setProduct(product);
                newInventory.setReservedQuantity(0);
                return newInventory;
            });
        
        inventory.setQuantity(quantity);
        inventory.setLastUpdated(LocalDateTime.now());
        
        Inventory savedInventory = inventoryRepository.save(inventory);
        return convertToDTO(savedInventory);
    }
    
    @Transactional(readOnly = true)
    public InventoryDTO getInventoryByProductId(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
        return convertToDTO(inventory);
    }
    
    public void reserveStock(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
        
        int availableQuantity = inventory.getQuantity() - inventory.getReservedQuantity();
        if (availableQuantity < quantity) {
            throw new InvalidRequestException("Insufficient stock available");
        }
        
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepository.save(inventory);
    }
    
    public void releaseStock(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
        
        inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
        inventoryRepository.save(inventory);
    }
    
    private InventoryDTO convertToDTO(Inventory inventory) {
        InventoryDTO dto = new InventoryDTO();
        dto.setId(inventory.getId());
        dto.setProductId(inventory.getProduct().getId());
        dto.setQuantity(inventory.getQuantity());
        dto.setReservedQuantity(inventory.getReservedQuantity());
        dto.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());
        return dto;
    }
}
```

### 6.4 CartService

```java
@Service
@Transactional
public class CartService {
    
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    
    public CartDTO addToCart(Long userId, AddToCartRequest request) {
        ShoppingCart cart = cartRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseGet(() -> createNewCart(userId));
        
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // Validate stock availability
        if (!inventoryService.validateStockAvailability(request.getProductId(), request.getQuantity())) {
            throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
        }
        
        // Check minimum procurement threshold
        if (product.getMinimumProcurementThreshold() != null && 
            request.getQuantity() < product.getMinimumProcurementThreshold()) {
            throw new InvalidRequestException("Quantity must be at least " + 
                product.getMinimumProcurementThreshold() + " units");
        }
        
        CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product)
            .orElseGet(() -> {
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setQuantity(0);
                newItem.setAddedAt(LocalDateTime.now());
                return newItem;
            });
        
        cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
        cartItemRepository.save(cartItem);
        
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        
        return convertToDTO(cart);
    }
    
    @Transactional(readOnly = true)
    public CartDTO getCartDetails(Long userId) {
        ShoppingCart cart = cartRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Active cart not found for user"));
        return convertToDTO(cart);
    }
    
    public CartDTO updateCartItemQuantity(Long userId, UpdateQuantityRequest request) {
        ShoppingCart cart = cartRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));
        
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));
        
        // Validate stock availability
        if (!inventoryService.validateStockAvailability(request.getProductId(), request.getQuantity())) {
            throw new InsufficientStockException("Insufficient stock for requested quantity");
        }
        
        // Check minimum procurement threshold
        if (product.getMinimumProcurementThreshold() != null && 
            request.getQuantity() < product.getMinimumProcurementThreshold()) {
            throw new InvalidRequestException("Quantity must be at least " + 
                product.getMinimumProcurementThreshold() + " units");
        }
        
        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);
        
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        
        return convertToDTO(cart);
    }
    
    public void removeFromCart(Long userId, Long productId) {
        ShoppingCart cart = cartRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));
        
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        cartItemRepository.deleteByCartAndProduct(cart, product);
        
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }
    
    @Transactional(readOnly = true)
    public boolean isCartEmpty(Long userId) {
        ShoppingCart cart = cartRepository.findByUserIdAndIsActiveTrue(userId)
            .orElse(null);
        
        if (cart == null) {
            return true;
        }
        
        List<CartItem> items = cartItemRepository.findByCart(cart);
        return items.isEmpty();
    }
    
    private ShoppingCart createNewCart(Long userId) {
        ShoppingCart cart = new ShoppingCart();
        cart.setUserId(userId);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        cart.setIsActive(true);
        return cartRepository.save(cart);
    }
    
    private CartDTO convertToDTO(ShoppingCart cart) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUserId());
        
        List<CartItem> items = cartItemRepository.findByCart(cart);
        List<CartItemDTO> itemDTOs = items.stream()
            .map(this::convertItemToDTO)
            .collect(Collectors.toList());
        
        dto.setItems(itemDTOs);
        dto.setTotalItems(items.size());
        
        BigDecimal totalPrice = items.stream()
            .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalPrice(totalPrice);
        
        return dto;
    }
    
    private CartItemDTO convertItemToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getProduct().getPrice());
        dto.setSubtotal(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        return dto;
    }
}
```
