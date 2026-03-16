## 6. Service Layer

### 6.1 ProductService

```java
package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.exception.ProductNotFoundException;
import com.ecommerce.product.exception.InsufficientStockException;
import com.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    
    private final ProductRepository productRepository;
    
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product: {}", request.getName());
        
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .isSubscriptionEligible(request.getIsSubscriptionEligible())
                .subscriptionPrice(request.getSubscriptionPrice())
                .subscriptionInterval(request.getSubscriptionInterval())
                .minQuantity(request.getMinQuantity())
                .maxQuantity(request.getMaxQuantity())
                .build();
        
        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully with ID: {}", savedProduct.getId());
        
        return mapToResponse(savedProduct);
    }
    
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        log.info("Fetching product with ID: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + id));
        
        return mapToResponse(product);
    }
    
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        log.info("Fetching all products with pagination: {}", pageable);
        
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(this::mapToResponse);
    }
    
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product with ID: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + id));
        
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        product.setIsSubscriptionEligible(request.getIsSubscriptionEligible());
        product.setSubscriptionPrice(request.getSubscriptionPrice());
        product.setSubscriptionInterval(request.getSubscriptionInterval());
        product.setMinQuantity(request.getMinQuantity());
        product.setMaxQuantity(request.getMaxQuantity());
        
        Product updatedProduct = productRepository.save(product);
        log.info("Product updated successfully with ID: {}", updatedProduct.getId());
        
        return mapToResponse(updatedProduct);
    }
    
    @Transactional
    public void deleteProduct(Long id) {
        log.info("Deleting product with ID: {}", id);
        
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException("Product not found with ID: " + id);
        }
        
        productRepository.deleteById(id);
        log.info("Product deleted successfully with ID: {}", id);
    }
    
    @Transactional(readOnly = true)
    public boolean checkStockAvailability(Long productId, Integer requestedQuantity) {
        log.info("Checking stock availability for product ID: {} with quantity: {}", productId, requestedQuantity);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        
        return product.getStockQuantity() >= requestedQuantity;
    }
    
    @Transactional
    public void decrementStock(Long productId, Integer quantity) {
        log.info("Decrementing stock for product ID: {} by quantity: {}", productId, quantity);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException("Insufficient stock for product ID: " + productId);
        }
        
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
        
        log.info("Stock decremented successfully for product ID: {}", productId);
    }
    
    @Transactional(readOnly = true)
    public ProductResponse getProductWithPurchaseTypeInfo(Long productId) {
        log.info("Fetching product with purchase type info for ID: {}", productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        
        return mapToResponse(product);
    }
    
    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .isSubscriptionEligible(product.getIsSubscriptionEligible())
                .subscriptionPrice(product.getSubscriptionPrice())
                .subscriptionInterval(product.getSubscriptionInterval())
                .minQuantity(product.getMinQuantity())
                .maxQuantity(product.getMaxQuantity())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
```

### 6.2 ShoppingCartService

```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.CartResponse;
import com.ecommerce.cart.dto.CartItemResponse;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.entity.ShoppingCart;
import com.ecommerce.cart.exception.CartNotFoundException;
import com.ecommerce.cart.exception.CartItemNotFoundException;
import com.ecommerce.cart.repository.CartItemRepository;
import com.ecommerce.cart.repository.ShoppingCartRepository;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShoppingCartService {
    
    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final InventoryValidationService inventoryValidationService;
    private final CartCalculationService cartCalculationService;
    
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} to cart for user {}", request.getProductId(), userId);
        
        // Validate product exists and has sufficient stock
        inventoryValidationService.validateInventory(request.getProductId(), request.getQuantity());
        
        // Get or create cart
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    ShoppingCart newCart = ShoppingCart.builder()
                            .userId(userId)
                            .build();
                    return cartRepository.save(newCart);
                });
        
        // Check for duplicate item with same purchase type
        cartItemRepository.findByCartIdAndProductIdAndPurchaseType(
                cart.getId(), 
                request.getProductId(), 
                request.getPurchaseType()
        ).ifPresentOrElse(
                existingItem -> {
                    // Update quantity if item already exists
                    int newQuantity = existingItem.getQuantity() + request.getQuantity();
                    inventoryValidationService.validateInventory(request.getProductId(), newQuantity);
                    existingItem.setQuantity(newQuantity);
                    cartItemRepository.save(existingItem);
                    log.info("Updated existing cart item quantity to {}", newQuantity);
                },
                () -> {
                    // Add new item
                    CartItem newItem = CartItem.builder()
                            .cart(cart)
                            .productId(request.getProductId())
                            .quantity(request.getQuantity())
                            .purchaseType(request.getPurchaseType())
                            .build();
                    cart.addItem(newItem);
                    cartItemRepository.save(newItem);
                    log.info("Added new item to cart");
                }
        );
        
        return buildCartResponse(cart);
    }
    
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        log.info("Fetching cart for user {}", userId);
        
        ShoppingCart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        return buildCartResponse(cart);
    }
    
    @Transactional
    public CartResponse updateCartItemQuantity(Long userId, Long itemId, Integer newQuantity) {
        log.info("Updating cart item {} quantity to {} for user {}", itemId, newQuantity, userId);
        
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new CartItemNotFoundException("Cart item not found: " + itemId));
        
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to user's cart");
        }
        
        inventoryValidationService.validateInventory(item.getProductId(), newQuantity);
        
        item.setQuantity(newQuantity);
        cartItemRepository.save(item);
        
        return buildCartResponse(cart);
    }
    
    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        log.info("Removing cart item {} for user {}", itemId, userId);
        
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new CartItemNotFoundException("Cart item not found: " + itemId));
        
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to user's cart");
        }
        
        cart.removeItem(item);
        cartItemRepository.deleteById(itemId);
        
        return buildCartResponse(cart);
    }
    
    @Transactional
    public void clearCart(Long userId) {
        log.info("Clearing cart for user {}", userId);
        
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));
        
        cart.getItems().clear();
        cartRepository.save(cart);
    }
    
    private CartResponse buildCartResponse(ShoppingCart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());
        
        BigDecimal totalAmount = cartCalculationService.calculateCartTotal(cart.getItems());
        int totalItems = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
        
        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }
    
    private CartItemResponse mapToCartItemResponse(CartItem item) {
        ProductResponse product = productService.getProductById(item.getProductId());
        BigDecimal unitPrice = "SUBSCRIPTION".equals(item.getPurchaseType()) 
                ? product.getSubscriptionPrice() 
                : product.getPrice();
        
        return CartItemResponse.builder()
                .itemId(item.getId())
                .productId(item.getProductId())
                .productName(product.getName())
                .quantity(item.getQuantity())
                .purchaseType(item.getPurchaseType())
                .unitPrice(unitPrice)
                .subtotal(cartCalculationService.calculateItemSubtotal(item))
                .build();
    }
}
```

### 6.3 InventoryValidationService

```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.exception.InsufficientStockException;
import com.ecommerce.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryValidationService {
    
    private final ProductService productService;
    
    public void validateInventory(Long productId, Integer requestedQuantity) {
        log.info("Validating inventory for product {} with quantity {}", productId, requestedQuantity);
        
        ProductResponse product = productService.getProductById(productId);
        
        if (product.getStockQuantity() < requestedQuantity) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock for product %s. Available: %d, Requested: %d",
                            product.getName(), product.getStockQuantity(), requestedQuantity)
            );
        }
        
        // Validate min/max quantity constraints
        if (product.getMinQuantity() != null && requestedQuantity < product.getMinQuantity()) {
            throw new IllegalArgumentException(
                    String.format("Quantity %d is below minimum required quantity %d for product %s",
                            requestedQuantity, product.getMinQuantity(), product.getName())
            );
        }
        
        if (product.getMaxQuantity() != null && requestedQuantity > product.getMaxQuantity()) {
            throw new IllegalArgumentException(
                    String.format("Quantity %d exceeds maximum allowed quantity %d for product %s",
                            requestedQuantity, product.getMaxQuantity(), product.getName())
            );
        }
        
        log.info("Inventory validation passed for product {}", productId);
    }
    
    public void validateCartInventory(List<CartItem> items) {
        log.info("Validating inventory for {} cart items", items.size());
        
        for (CartItem item : items) {
            validateInventory(item.getProductId(), item.getQuantity());
        }
        
        log.info("Cart inventory validation completed successfully");
    }
}
```

### 6.4 CartCalculationService

```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartCalculationService {
    
    private final ProductService productService;
    
    public BigDecimal calculateCartTotal(List<CartItem> items) {
        log.info("Calculating total for {} cart items", items.size());
        
        BigDecimal total = items.stream()
                .map(this::calculateItemSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        log.info("Cart total calculated: {}", total);
        return total;
    }
    
    public BigDecimal calculateItemSubtotal(CartItem item) {
        ProductResponse product = productService.getProductById(item.getProductId());
        
        BigDecimal unitPrice = "SUBSCRIPTION".equals(item.getPurchaseType())
                ? product.getSubscriptionPrice()
                : product.getPrice();
        
        return unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
    }
}
```
