## 8. Controller Layer Design

### 8.1 ProductController

```java
package com.ecommerce.productmanagement.controller;

import com.ecommerce.productmanagement.dto.response.ProductResponse;
import com.ecommerce.productmanagement.entity.Product;
import com.ecommerce.productmanagement.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Management", description = "APIs for managing products")
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    @Operation(summary = "Get all products", description = "Retrieve all active products with pagination")
    public ResponseEntity<Page<ProductResponse>> getAllProducts(Pageable pageable) {
        Page<Product> products = productService.getAllProducts(pageable);
        Page<ProductResponse> response = products.map(this::convertToResponse);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieve a specific product by its ID")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(convertToResponse(product));
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Get products by category", description = "Retrieve all products in a specific category")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = productService.getProductsByCategory(category);
        List<ProductResponse> response = products.stream()
                .map(this::convertToResponse)
                .toList();
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    @Operation(summary = "Create product", description = "Create a new product")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody Product product) {
        Product createdProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(createdProduct));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Update an existing product")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody Product product) {
        Product updatedProduct = productService.updateProduct(id, product);
        return ResponseEntity.ok(convertToResponse(updatedProduct));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Soft delete a product")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    private ProductResponse convertToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .category(product.getCategory())
                .available(product.isAvailable())
                .build();
    }
}
```

### 8.2 CartController

```java
package com.ecommerce.productmanagement.controller;

import com.ecommerce.productmanagement.dto.request.AddToCartRequest;
import com.ecommerce.productmanagement.dto.response.CartResponse;
import com.ecommerce.productmanagement.entity.Cart;
import com.ecommerce.productmanagement.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "APIs for managing shopping cart")
public class CartController {
    
    private final CartService cartService;
    
    @GetMapping
    @Operation(summary = "Get cart", description = "Retrieve current shopping cart")
    public ResponseEntity<CartResponse> getCart(HttpSession session) {
        String sessionId = session.getId();
        Cart cart = cartService.getCart(sessionId);
        return ResponseEntity.ok(convertToResponse(cart));
    }
    
    @PostMapping("/items")
    @Operation(summary = "Add to cart", description = "Add a product to the shopping cart")
    public ResponseEntity<CartResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            HttpSession session) {
        String sessionId = session.getId();
        Cart cart = cartService.addToCart(sessionId, request);
        return ResponseEntity.ok(convertToResponse(cart));
    }
    
    @PutMapping("/items/{productId}")
    @Operation(summary = "Update cart item", description = "Update quantity of a cart item")
    public ResponseEntity<CartResponse> updateCartItem(
            @PathVariable Long productId,
            @RequestParam int quantity,
            HttpSession session) {
        String sessionId = session.getId();
        Cart cart = cartService.updateCartItemQuantity(sessionId, productId, quantity);
        return ResponseEntity.ok(convertToResponse(cart));
    }
    
    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove from cart", description = "Remove a product from the cart")
    public ResponseEntity<CartResponse> removeFromCart(
            @PathVariable Long productId,
            HttpSession session) {
        String sessionId = session.getId();
        Cart cart = cartService.removeFromCart(sessionId, productId);
        return ResponseEntity.ok(convertToResponse(cart));
    }
    
    @DeleteMapping
    @Operation(summary = "Clear cart", description = "Remove all items from the cart")
    public ResponseEntity<Void> clearCart(HttpSession session) {
        String sessionId = session.getId();
        cartService.clearCart(sessionId);
        return ResponseEntity.noContent().build();
    }
    
    private CartResponse convertToResponse(Cart cart) {
        return CartResponse.builder()
                .id(cart.getId())
                .sessionId(cart.getSessionId())
                .items(cart.getItems())
                .itemCount(cart.getItems().size())
                .build();
    }
}
```

### 8.3 OrderController

```java
package com.ecommerce.productmanagement.controller;

import com.ecommerce.productmanagement.dto.response.OrderResponse;
import com.ecommerce.productmanagement.entity.Order;
import com.ecommerce.productmanagement.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "APIs for managing orders")
public class OrderController {
    
    private final OrderService orderService;
    
    @PostMapping
    @Operation(summary = "Create order", description = "Create an order from current cart")
    public ResponseEntity<OrderResponse> createOrder(HttpSession session) {
        String sessionId = session.getId();
        Order order = orderService.createOrder(sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(order));
    }
    
    private OrderResponse convertToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
```

## 9. Data Transfer Objects (DTOs)

### 9.1 Request DTOs

```java
package com.ecommerce.productmanagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddToCartRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
```

### 9.2 Response DTOs

```java
package com.ecommerce.productmanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String category;
    private Boolean available;
}
```

```java
package com.ecommerce.productmanagement.dto.response;

import com.ecommerce.productmanagement.entity.CartItem;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CartResponse {
    private Long id;
    private String sessionId;
    private List<CartItem> items;
    private Integer itemCount;
}
```

```java
package com.ecommerce.productmanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
}
```

```java
package com.ecommerce.productmanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ErrorResponse {
    private String message;
    private String errorCode;
    private int statusCode;
    private LocalDateTime timestamp;
    private String path;
    private Map<String, String> validationErrors;
    private String detailedMessage;
    private String suggestion;
}
```

## 10. Exception Handling

### 10.1 Custom Exceptions

```java
package com.ecommerce.productmanagement.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
```

```java
package com.ecommerce.productmanagement.exception;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
```

### 10.2 Global Exception Handler

```java
package com.ecommerce.productmanagement.exception;

import com.ecommerce.productmanagement.dto.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFoundException(
            ProductNotFoundException ex, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .message(ex.getMessage())
                .errorCode("PRODUCT_NOT_FOUND")
                .statusCode(HttpStatus.NOT_FOUND.value())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false))
                .detailedMessage("The requested product could not be found in the system")
                .suggestion("Please verify the product ID and try again")
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStockException(
            InsufficientStockException ex, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .message(ex.getMessage())
                .errorCode("INSUFFICIENT_STOCK")
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false))
                .detailedMessage("The requested quantity exceeds available stock")
                .suggestion("Please reduce the quantity or check back later when stock is replenished")
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.put(fieldName, errorMessage);
        });
        
        ErrorResponse error = ErrorResponse.builder()
                .message("Validation failed")
                .errorCode("VALIDATION_ERROR")
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false))
                .validationErrors(validationErrors)
                .detailedMessage("One or more fields contain invalid data")
                .suggestion("Please correct the highlighted fields and resubmit")
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .message("An unexpected error occurred")
                .errorCode("INTERNAL_SERVER_ERROR")
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false))
                .detailedMessage(ex.getMessage())
                .suggestion("Please contact support if the problem persists")
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```
