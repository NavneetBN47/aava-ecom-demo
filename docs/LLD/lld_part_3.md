## 7. Controller Layer

### 7.1 ProductController

```java
package com.ecommerce.product.controller;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.dto.AvailabilityResponse;
import com.ecommerce.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Management", description = "APIs for managing products")
public class ProductController {
    
    private final ProductService productService;
    
    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(summary = "Get all products with pagination")
    public ResponseEntity<Page<ProductResponse>> getAllProducts(Pageable pageable) {
        Page<ProductResponse> response = productService.getAllProducts(pageable);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}/availability")
    @Operation(summary = "Check product availability")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        boolean available = productService.checkStockAvailability(id, quantity);
        ProductResponse product = productService.getProductById(id);
        
        AvailabilityResponse response = AvailabilityResponse.builder()
                .productId(id)
                .requestedQuantity(quantity)
                .available(available)
                .availableStock(product.getStockQuantity())
                .build();
        
        return ResponseEntity.ok(response);
    }
}
```

### 7.2 ShoppingCartController

```java
package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.CartResponse;
import com.ecommerce.cart.service.ShoppingCartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "APIs for managing shopping cart")
public class ShoppingCartController {
    
    private final ShoppingCartService shoppingCartService;
    
    @PostMapping("/{userId}/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<CartResponse> addToCart(
            @PathVariable Long userId,
            @Valid @RequestBody AddToCartRequest request) {
        CartResponse response = shoppingCartService.addToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/{userId}")
    @Operation(summary = "Get user's cart")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId) {
        CartResponse response = shoppingCartService.getCart(userId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{userId}/items/{itemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<CartResponse> updateCartItemQuantity(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        CartResponse response = shoppingCartService.updateCartItemQuantity(userId, itemId, quantity);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{userId}/items/{itemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<CartResponse> removeCartItem(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        CartResponse response = shoppingCartService.removeCartItem(userId, itemId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{userId}")
    @Operation(summary = "Clear cart")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        shoppingCartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
```

### 7.3 CheckoutController

```java
package com.ecommerce.checkout.controller;

import com.ecommerce.checkout.dto.CheckoutRequest;
import com.ecommerce.checkout.dto.CheckoutResponse;
import com.ecommerce.checkout.service.CheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@Tag(name = "Checkout", description = "APIs for checkout operations")
public class CheckoutController {
    
    private final CheckoutService checkoutService;
    
    @PostMapping("/{userId}")
    @Operation(summary = "Process checkout")
    public ResponseEntity<CheckoutResponse> checkout(
            @PathVariable Long userId,
            @Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.processCheckout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

## 8. DTO Layer

### 8.1 Product DTOs

#### ProductRequest
```java
package com.ecommerce.product.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal price;
    
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be non-negative")
    private Integer stockQuantity;
    
    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
    
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;
    
    private Boolean isSubscriptionEligible;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Subscription price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Subscription price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal subscriptionPrice;
    
    @Size(max = 50, message = "Subscription interval must not exceed 50 characters")
    private String subscriptionInterval;
    
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQuantity;
    
    @Min(value = 1, message = "Maximum quantity must be at least 1")
    private Integer maxQuantity;
}
```

#### ProductResponse
```java
package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String category;
    private String imageUrl;
    private Boolean isSubscriptionEligible;
    private BigDecimal subscriptionPrice;
    private String subscriptionInterval;
    private Integer minQuantity;
    private Integer maxQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### AvailabilityResponse
```java
package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    
    private Long productId;
    private Integer requestedQuantity;
    private Boolean available;
    private Integer availableStock;
}
```

### 8.2 Cart DTOs

#### AddToCartRequest
```java
package com.ecommerce.cart.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    @NotBlank(message = "Purchase type is required")
    @Pattern(regexp = "ONE_TIME|SUBSCRIPTION", message = "Purchase type must be ONE_TIME or SUBSCRIPTION")
    private String purchaseType;
}
```

#### CartResponse
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    
    private Long cartId;
    private Long userId;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private Integer totalItems;
}
```

#### CartItemResponse
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    
    private Long itemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private String purchaseType;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
```
