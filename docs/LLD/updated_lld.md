# Low Level Design Document
## E-commerce Product Management System

### Document Information
- **Version**: 2.0
- **Last Updated**: 2024
- **Author**: Development Team
- **Status**: Updated with Shopping Cart Management (SCRUM-1140)

---

## 1. System Overview

### 1.1 Purpose
This document provides the low-level design for an E-commerce Product Management System built using Spring Boot 3.x, Java 21, and PostgreSQL. The system now includes comprehensive Shopping Cart Management functionality alongside the core product management features.

### 1.2 Technology Stack
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: PostgreSQL
- **Build Tool**: Maven/Gradle
- **ORM**: Spring Data JPA
- **API Documentation**: SpringDoc OpenAPI

### 1.3 Architecture Pattern
- Layered Architecture (Controller → Service → Repository → Entity)
- RESTful API Design
- Dependency Injection

---

## 2. Package Structure

```
com.ecommerce.productmanagement
├── controller
│   ├── ProductController.java
│   └── ShoppingCartController.java
├── service
│   ├── ProductService.java
│   ├── ProductServiceImpl.java
│   ├── ShoppingCartService.java
│   └── ShoppingCartServiceImpl.java
├── repository
│   ├── ProductRepository.java
│   ├── ShoppingCartRepository.java
│   └── CartItemRepository.java
├── entity
│   ├── Product.java
│   ├── ShoppingCart.java
│   └── CartItem.java
├── dto
│   ├── ProductDTO.java
│   ├── ProductRequestDTO.java
│   ├── ShoppingCartDTO.java
│   ├── CartItemDTO.java
│   └── AddToCartRequestDTO.java
├── exception
│   ├── ProductNotFoundException.java
│   ├── CartNotFoundException.java
│   ├── GlobalExceptionHandler.java
│   └── ErrorResponse.java
└── config
    ├── DatabaseConfig.java
    └── OpenAPIConfig.java
```

---

## 3. Database Design

### 3.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 3.2 Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
```

### 3.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

## 4. Entity Classes

### 4.1 Product Entity

```java
package com.ecommerce.productmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(length = 100)
    private String category;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 4.2 ShoppingCart Entity

```java
package com.ecommerce.productmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shopping_carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingCart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(length = 50)
    private String status = "ACTIVE";
    
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void calculateTotalAmount() {
        this.totalAmount = items.stream()
            .map(CartItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

### 4.3 CartItem Entity

```java
package com.ecommerce.productmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private ShoppingCart cart;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateSubtotal();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateSubtotal();
    }
    
    public void calculateSubtotal() {
        this.subtotal = this.price.multiply(BigDecimal.valueOf(this.quantity));
    }
}
```

---

## 5. Repository Layer

### 5.1 ProductRepository

```java
package com.ecommerce.productmanagement.repository;

import com.ecommerce.productmanagement.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByCategory(String category);
    
    List<Product> findByNameContainingIgnoreCase(String name);
    
    @Query("SELECT p FROM Product p WHERE p.quantity > 0")
    List<Product> findAvailableProducts();
    
    @Query("SELECT p FROM Product p WHERE p.price BETWEEN :minPrice AND :maxPrice")
    List<Product> findByPriceRange(Double minPrice, Double maxPrice);
}
```

### 5.2 ShoppingCartRepository

```java
package com.ecommerce.productmanagement.repository;

import com.ecommerce.productmanagement.entity.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    
    Optional<ShoppingCart> findByUserIdAndStatus(Long userId, String status);
    
    List<ShoppingCart> findByUserId(Long userId);
    
    @Query("SELECT c FROM ShoppingCart c LEFT JOIN FETCH c.items WHERE c.id = :cartId")
    Optional<ShoppingCart> findByIdWithItems(Long cartId);
    
    @Query("SELECT c FROM ShoppingCart c WHERE c.userId = :userId AND c.status = 'ACTIVE'")
    Optional<ShoppingCart> findActiveCartByUserId(Long userId);
}
```

### 5.3 CartItemRepository

```java
package com.ecommerce.productmanagement.repository;

import com.ecommerce.productmanagement.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartId(Long cartId);
    
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.id = :cartId AND ci.product.id = :productId")
    Optional<CartItem> findCartItemByCartAndProduct(Long cartId, Long productId);
    
    void deleteByCartIdAndProductId(Long cartId, Long productId);
}
```

---

## 6. Service Layer

### 6.1 ProductService Interface

```java
package com.ecommerce.productmanagement.service;

import com.ecommerce.productmanagement.dto.ProductDTO;
import com.ecommerce.productmanagement.dto.ProductRequestDTO;
import java.util.List;

public interface ProductService {
    
    ProductDTO createProduct(ProductRequestDTO requestDTO);
    
    ProductDTO getProductById(Long id);
    
    List<ProductDTO> getAllProducts();
    
    ProductDTO updateProduct(Long id, ProductRequestDTO requestDTO);
    
    void deleteProduct(Long id);
    
    List<ProductDTO> getProductsByCategory(String category);
    
    List<ProductDTO> searchProductsByName(String name);
    
    List<ProductDTO> getAvailableProducts();
    
    List<ProductDTO> getProductsByPriceRange(Double minPrice, Double maxPrice);
}
```

### 6.2 ProductServiceImpl

```java
package com.ecommerce.productmanagement.service;

import com.ecommerce.productmanagement.dto.ProductDTO;
import com.ecommerce.productmanagement.dto.ProductRequestDTO;
import com.ecommerce.productmanagement.entity.Product;
import com.ecommerce.productmanagement.exception.ProductNotFoundException;
import com.ecommerce.productmanagement.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    
    @Override
    @Transactional
    public ProductDTO createProduct(ProductRequestDTO requestDTO) {
        Product product = new Product();
        product.setName(requestDTO.getName());
        product.setDescription(requestDTO.getDescription());
        product.setPrice(requestDTO.getPrice());
        product.setQuantity(requestDTO.getQuantity());
        product.setCategory(requestDTO.getCategory());
        
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public ProductDTO updateProduct(Long id, ProductRequestDTO requestDTO) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        
        product.setName(requestDTO.getName());
        product.setDescription(requestDTO.getDescription());
        product.setPrice(requestDTO.getPrice());
        product.setQuantity(requestDTO.getQuantity());
        product.setCategory(requestDTO.getCategory());
        
        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }
    
    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> searchProductsByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAvailableProducts() {
        return productRepository.findAvailableProducts().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByPriceRange(Double minPrice, Double maxPrice) {
        return productRepository.findByPriceRange(minPrice, maxPrice).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setQuantity(product.getQuantity());
        dto.setCategory(product.getCategory());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        return dto;
    }
}
```

### 6.3 ShoppingCartService Interface

```java
package com.ecommerce.productmanagement.service;

import com.ecommerce.productmanagement.dto.AddToCartRequestDTO;
import com.ecommerce.productmanagement.dto.ShoppingCartDTO;

public interface ShoppingCartService {
    
    ShoppingCartDTO getOrCreateCart(Long userId);
    
    ShoppingCartDTO getCartById(Long cartId);
    
    ShoppingCartDTO addItemToCart(Long userId, AddToCartRequestDTO requestDTO);
    
    ShoppingCartDTO updateCartItemQuantity(Long cartId, Long productId, Integer quantity);
    
    ShoppingCartDTO removeItemFromCart(Long cartId, Long productId);
    
    void clearCart(Long cartId);
    
    ShoppingCartDTO getActiveCartByUserId(Long userId);
}
```

### 6.4 ShoppingCartServiceImpl

```java
package com.ecommerce.productmanagement.service;

import com.ecommerce.productmanagement.dto.AddToCartRequestDTO;
import com.ecommerce.productmanagement.dto.CartItemDTO;
import com.ecommerce.productmanagement.dto.ShoppingCartDTO;
import com.ecommerce.productmanagement.entity.CartItem;
import com.ecommerce.productmanagement.entity.Product;
import com.ecommerce.productmanagement.entity.ShoppingCart;
import com.ecommerce.productmanagement.exception.CartNotFoundException;
import com.ecommerce.productmanagement.exception.ProductNotFoundException;
import com.ecommerce.productmanagement.repository.CartItemRepository;
import com.ecommerce.productmanagement.repository.ProductRepository;
import com.ecommerce.productmanagement.repository.ShoppingCartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShoppingCartServiceImpl implements ShoppingCartService {
    
    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    
    @Override
    @Transactional
    public ShoppingCartDTO getOrCreateCart(Long userId) {
        ShoppingCart cart = cartRepository.findActiveCartByUserId(userId)
            .orElseGet(() -> {
                ShoppingCart newCart = new ShoppingCart();
                newCart.setUserId(userId);
                newCart.setStatus("ACTIVE");
                return cartRepository.save(newCart);
            });
        return convertToDTO(cart);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ShoppingCartDTO getCartById(Long cartId) {
        ShoppingCart cart = cartRepository.findByIdWithItems(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found with id: " + cartId));
        return convertToDTO(cart);
    }
    
    @Override
    @Transactional
    public ShoppingCartDTO addItemToCart(Long userId, AddToCartRequestDTO requestDTO) {
        ShoppingCart cart = cartRepository.findActiveCartByUserId(userId)
            .orElseGet(() -> {
                ShoppingCart newCart = new ShoppingCart();
                newCart.setUserId(userId);
                newCart.setStatus("ACTIVE");
                return cartRepository.save(newCart);
            });
        
        Product product = productRepository.findById(requestDTO.getProductId())
            .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + requestDTO.getProductId()));
        
        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
            .orElseGet(() -> {
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setPrice(product.getPrice());
                newItem.setQuantity(0);
                return newItem;
            });
        
        cartItem.setQuantity(cartItem.getQuantity() + requestDTO.getQuantity());
        cartItem.calculateSubtotal();
        cartItemRepository.save(cartItem);
        
        cart.calculateTotalAmount();
        cartRepository.save(cart);
        
        return convertToDTO(cart);
    }
    
    @Override
    @Transactional
    public ShoppingCartDTO updateCartItemQuantity(Long cartId, Long productId, Integer quantity) {
        ShoppingCart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found with id: " + cartId));
        
        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cartId, productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found in cart"));
        
        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            cartItem.setQuantity(quantity);
            cartItem.calculateSubtotal();
            cartItemRepository.save(cartItem);
        }
        
        cart.calculateTotalAmount();
        cartRepository.save(cart);
        
        return convertToDTO(cart);
    }
    
    @Override
    @Transactional
    public ShoppingCartDTO removeItemFromCart(Long cartId, Long productId) {
        ShoppingCart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found with id: " + cartId));
        
        cartItemRepository.deleteByCartIdAndProductId(cartId, productId);
        
        cart.calculateTotalAmount();
        cartRepository.save(cart);
        
        return convertToDTO(cart);
    }
    
    @Override
    @Transactional
    public void clearCart(Long cartId) {
        ShoppingCart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new CartNotFoundException("Cart not found with id: " + cartId));
        
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cart.setTotalAmount(BigDecimal.ZERO);
        cartRepository.save(cart);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ShoppingCartDTO getActiveCartByUserId(Long userId) {
        ShoppingCart cart = cartRepository.findActiveCartByUserId(userId)
            .orElseThrow(() -> new CartNotFoundException("No active cart found for user: " + userId));
        return convertToDTO(cart);
    }
    
    private ShoppingCartDTO convertToDTO(ShoppingCart cart) {
        ShoppingCartDTO dto = new ShoppingCartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUserId());
        dto.setStatus(cart.getStatus());
        dto.setTotalAmount(cart.getTotalAmount());
        dto.setItems(cart.getItems().stream()
            .map(this::convertCartItemToDTO)
            .collect(Collectors.toList()));
        dto.setCreatedAt(cart.getCreatedAt());
        dto.setUpdatedAt(cart.getUpdatedAt());
        return dto;
    }
    
    private CartItemDTO convertCartItemToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setSubtotal(item.getSubtotal());
        return dto;
    }
}
```

---

## 7. Controller Layer

### 7.1 ProductController

```java
package com.ecommerce.productmanagement.controller;

import com.ecommerce.productmanagement.dto.ProductDTO;
import com.ecommerce.productmanagement.dto.ProductRequestDTO;
import com.ecommerce.productmanagement.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Management", description = "APIs for managing products")
public class ProductController {
    
    private final ProductService productService;
    
    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductRequestDTO requestDTO) {
        ProductDTO createdProduct = productService.createProduct(requestDTO);
        return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
    
    @GetMapping
    @Operation(summary = "Get all products")
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update product")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequestDTO requestDTO) {
        ProductDTO updatedProduct = productService.updateProduct(id, requestDTO);
        return ResponseEntity.ok(updatedProduct);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Get products by category")
    public ResponseEntity<List<ProductDTO>> getProductsByCategory(@PathVariable String category) {
        List<ProductDTO> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search products by name")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String name) {
        List<ProductDTO> products = productService.searchProductsByName(name);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/available")
    @Operation(summary = "Get available products")
    public ResponseEntity<List<ProductDTO>> getAvailableProducts() {
        List<ProductDTO> products = productService.getAvailableProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/price-range")
    @Operation(summary = "Get products by price range")
    public ResponseEntity<List<ProductDTO>> getProductsByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice) {
        List<ProductDTO> products = productService.getProductsByPriceRange(minPrice, maxPrice);
        return ResponseEntity.ok(products);
    }
}
```

### 7.2 ShoppingCartController

```java
package com.ecommerce.productmanagement.controller;

import com.ecommerce.productmanagement.dto.AddToCartRequestDTO;
import com.ecommerce.productmanagement.dto.ShoppingCartDTO;
import com.ecommerce.productmanagement.service.ShoppingCartService;
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
@Tag(name = "Shopping Cart Management", description = "APIs for managing shopping cart")
public class ShoppingCartController {
    
    private final ShoppingCartService cartService;
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get or create cart for user")
    public ResponseEntity<ShoppingCartDTO> getOrCreateCart(@PathVariable Long userId) {
        ShoppingCartDTO cart = cartService.getOrCreateCart(userId);
        return ResponseEntity.ok(cart);
    }
    
    @GetMapping("/{cartId}")
    @Operation(summary = "Get cart by ID")
    public ResponseEntity<ShoppingCartDTO> getCartById(@PathVariable Long cartId) {
        ShoppingCartDTO cart = cartService.getCartById(cartId);
        return ResponseEntity.ok(cart);
    }
    
    @PostMapping("/user/{userId}/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ShoppingCartDTO> addItemToCart(
            @PathVariable Long userId,
            @Valid @RequestBody AddToCartRequestDTO requestDTO) {
        ShoppingCartDTO cart = cartService.addItemToCart(userId, requestDTO);
        return new ResponseEntity<>(cart, HttpStatus.CREATED);
    }
    
    @PutMapping("/{cartId}/items/{productId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ShoppingCartDTO> updateCartItemQuantity(
            @PathVariable Long cartId,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        ShoppingCartDTO cart = cartService.updateCartItemQuantity(cartId, productId, quantity);
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/{cartId}/items/{productId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ShoppingCartDTO> removeItemFromCart(
            @PathVariable Long cartId,
            @PathVariable Long productId) {
        ShoppingCartDTO cart = cartService.removeItemFromCart(cartId, productId);
        return ResponseEntity.ok(cart);
    }
    
    @DeleteMapping("/{cartId}/clear")
    @Operation(summary = "Clear all items from cart")
    public ResponseEntity<Void> clearCart(@PathVariable Long cartId) {
        cartService.clearCart(cartId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/active/user/{userId}")
    @Operation(summary = "Get active cart by user ID")
    public ResponseEntity<ShoppingCartDTO> getActiveCartByUserId(@PathVariable Long userId) {
        ShoppingCartDTO cart = cartService.getActiveCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }
}
```

---

## 8. DTO Classes

### 8.1 ProductDTO

```java
package com.ecommerce.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 8.2 ProductRequestDTO

```java
package com.ecommerce.productmanagement.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDTO {
    
    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255, message = "Product name must be between 3 and 255 characters")
    private String name;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
    
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;
}
```

### 8.3 ShoppingCartDTO

```java
package com.ecommerce.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingCartDTO {
    private Long id;
    private Long userId;
    private String status;
    private BigDecimal totalAmount;
    private List<CartItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 8.4 CartItemDTO

```java
package com.ecommerce.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
}
```

### 8.5 AddToCartRequestDTO

```java
package com.ecommerce.productmanagement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequestDTO {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
```

---

## 9. Exception Handling

### 9.1 ProductNotFoundException

```java
package com.ecommerce.productmanagement.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
```

### 9.2 CartNotFoundException

```java
package com.ecommerce.productmanagement.exception;

public class CartNotFoundException extends RuntimeException {
    public CartNotFoundException(String message) {
        super(message);
    }
}
```

### 9.3 ErrorResponse

```java
package com.ecommerce.productmanagement.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
}
```

### 9.4 GlobalExceptionHandler

```java
package com.ecommerce.productmanagement.exception;

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
        ErrorResponse errorResponse = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(CartNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartNotFoundException(
            CartNotFoundException ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 10. Configuration

### 10.1 application.properties

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/ecommerce_db
spring.datasource.username=postgres
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Logging
logging.level.org.springframework=INFO
logging.level.com.ecommerce.productmanagement=DEBUG
logging.level.org.hibernate.SQL=DEBUG

# OpenAPI Configuration
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
```

### 10.2 OpenAPIConfig

```java
package com.ecommerce.productmanagement.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("E-commerce Product Management API")
                .version("2.0")
                .description("REST API for E-commerce Product Management System with Shopping Cart")
                .contact(new Contact()
                    .name("Development Team")
                    .email("dev@ecommerce.com")));
    }
}
```

---

## 11. API Endpoints

### 11.1 Product Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products | Create a new product |
| GET | /api/products/{id} | Get product by ID |
| GET | /api/products | Get all products |
| PUT | /api/products/{id} | Update product |
| DELETE | /api/products/{id} | Delete product |
| GET | /api/products/category/{category} | Get products by category |
| GET | /api/products/search?name={name} | Search products by name |
| GET | /api/products/available | Get available products |
| GET | /api/products/price-range?minPrice={min}&maxPrice={max} | Get products by price range |

### 11.2 Shopping Cart Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart/user/{userId} | Get or create cart for user |
| GET | /api/cart/{cartId} | Get cart by ID |
| POST | /api/cart/user/{userId}/items | Add item to cart |
| PUT | /api/cart/{cartId}/items/{productId}?quantity={qty} | Update cart item quantity |
| DELETE | /api/cart/{cartId}/items/{productId} | Remove item from cart |
| DELETE | /api/cart/{cartId}/clear | Clear all items from cart |
| GET | /api/cart/active/user/{userId} | Get active cart by user ID |

---

## 12. Sequence Diagrams

### 12.1 Create Product Flow

```
Client -> ProductController: POST /api/products
ProductController -> ProductService: createProduct(requestDTO)
ProductService -> ProductRepository: save(product)
ProductRepository -> Database: INSERT INTO products
Database -> ProductRepository: Product entity
ProductRepository -> ProductService: Product entity
ProductService -> ProductController: ProductDTO
ProductController -> Client: 201 Created + ProductDTO
```

### 12.2 Get Product by ID Flow

```
Client -> ProductController: GET /api/products/{id}
ProductController -> ProductService: getProductById(id)
ProductService -> ProductRepository: findById(id)
ProductRepository -> Database: SELECT * FROM products WHERE id = ?
Database -> ProductRepository: Product entity
ProductRepository -> ProductService: Optional<Product>
ProductService -> ProductController: ProductDTO
ProductController -> Client: 200 OK + ProductDTO
```

### 12.3 Add Item to Cart Flow

```
Client -> ShoppingCartController: POST /api/cart/user/{userId}/items
ShoppingCartController -> ShoppingCartService: addItemToCart(userId, requestDTO)
ShoppingCartService -> ShoppingCartRepository: findActiveCartByUserId(userId)
ShoppingCartRepository -> Database: SELECT * FROM shopping_carts WHERE user_id = ? AND status = 'ACTIVE'
Database -> ShoppingCartRepository: ShoppingCart entity (or empty)
ShoppingCartRepository -> ShoppingCartService: Optional<ShoppingCart>
ShoppingCartService -> ProductRepository: findById(productId)
ProductRepository -> Database: SELECT * FROM products WHERE id = ?
Database -> ProductRepository: Product entity
ProductRepository -> ShoppingCartService: Optional<Product>
ShoppingCartService -> CartItemRepository: findByCartIdAndProductId(cartId, productId)
CartItemRepository -> Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
Database -> CartItemRepository: CartItem entity (or empty)
CartItemRepository -> ShoppingCartService: Optional<CartItem>
ShoppingCartService -> CartItemRepository: save(cartItem)
CartItemRepository -> Database: INSERT/UPDATE cart_items
Database -> CartItemRepository: CartItem entity
CartItemRepository -> ShoppingCartService: CartItem entity
ShoppingCartService -> ShoppingCartRepository: save(cart)
ShoppingCartRepository -> Database: UPDATE shopping_carts SET total_amount = ?
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: ShoppingCart entity
ShoppingCartService -> ShoppingCartController: ShoppingCartDTO
ShoppingCartController -> Client: 201 Created + ShoppingCartDTO
```

### 12.4 Update Cart Item Quantity Flow

```
Client -> ShoppingCartController: PUT /api/cart/{cartId}/items/{productId}?quantity={qty}
ShoppingCartController -> ShoppingCartService: updateCartItemQuantity(cartId, productId, quantity)
ShoppingCartService -> ShoppingCartRepository: findById(cartId)
ShoppingCartRepository -> Database: SELECT * FROM shopping_carts WHERE id = ?
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: Optional<ShoppingCart>
ShoppingCartService -> CartItemRepository: findByCartIdAndProductId(cartId, productId)
CartItemRepository -> Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
Database -> CartItemRepository: CartItem entity
CartItemRepository -> ShoppingCartService: Optional<CartItem>
ShoppingCartService -> CartItemRepository: save(cartItem) or delete(cartItem)
CartItemRepository -> Database: UPDATE/DELETE cart_items
Database -> CartItemRepository: CartItem entity (or void)
CartItemRepository -> ShoppingCartService: CartItem entity (or void)
ShoppingCartService -> ShoppingCartRepository: save(cart)
ShoppingCartRepository -> Database: UPDATE shopping_carts SET total_amount = ?
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: ShoppingCart entity
ShoppingCartService -> ShoppingCartController: ShoppingCartDTO
ShoppingCartController -> Client: 200 OK + ShoppingCartDTO
```

### 12.5 Remove Item from Cart Flow

```
Client -> ShoppingCartController: DELETE /api/cart/{cartId}/items/{productId}
ShoppingCartController -> ShoppingCartService: removeItemFromCart(cartId, productId)
ShoppingCartService -> ShoppingCartRepository: findById(cartId)
ShoppingCartRepository -> Database: SELECT * FROM shopping_carts WHERE id = ?
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: Optional<ShoppingCart>
ShoppingCartService -> CartItemRepository: deleteByCartIdAndProductId(cartId, productId)
CartItemRepository -> Database: DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?
Database -> CartItemRepository: void
CartItemRepository -> ShoppingCartService: void
ShoppingCartService -> ShoppingCartRepository: save(cart)
ShoppingCartRepository -> Database: UPDATE shopping_carts SET total_amount = ?
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: ShoppingCart entity
ShoppingCartService -> ShoppingCartController: ShoppingCartDTO
ShoppingCartController -> Client: 200 OK + ShoppingCartDTO
```

### 12.6 Get Active Cart by User ID Flow

```
Client -> ShoppingCartController: GET /api/cart/active/user/{userId}
ShoppingCartController -> ShoppingCartService: getActiveCartByUserId(userId)
ShoppingCartService -> ShoppingCartRepository: findActiveCartByUserId(userId)
ShoppingCartRepository -> Database: SELECT * FROM shopping_carts WHERE user_id = ? AND status = 'ACTIVE'
Database -> ShoppingCartRepository: ShoppingCart entity
ShoppingCartRepository -> ShoppingCartService: Optional<ShoppingCart>
ShoppingCartService -> ShoppingCartController: ShoppingCartDTO
ShoppingCartController -> Client: 200 OK + ShoppingCartDTO
```

---

## 13. Testing Strategy

### 13.1 Unit Testing
- Test service layer methods with mocked repositories
- Test controller endpoints with MockMvc
- Test entity validation
- Test DTO conversions
- Test exception handling

### 13.2 Integration Testing
- Test complete API flows
- Test database operations
- Test transaction management
- Test cart calculations and updates

### 13.3 Test Coverage Goals
- Service Layer: 90%+
- Controller Layer: 85%+
- Repository Layer: 80%+
- Overall: 85%+

---

## 14. Security Considerations

### 14.1 Input Validation
- Use Jakarta Validation annotations
- Validate all request DTOs
- Sanitize user inputs
- Implement proper error messages

### 14.2 Database Security
- Use parameterized queries (JPA handles this)
- Implement proper access controls
- Use connection pooling
- Encrypt sensitive data

### 14.3 API Security (Future Enhancement)
- Implement JWT authentication
- Add role-based access control
- Implement rate limiting
- Add CORS configuration
- Use HTTPS in production

---

## 15. Performance Optimization

### 15.1 Database Optimization
- Create appropriate indexes
- Use pagination for large result sets
- Implement caching where appropriate
- Optimize queries with JOIN FETCH
- Use lazy loading strategically

### 15.2 Application Optimization
- Use connection pooling
- Implement caching (Redis/Caffeine)
- Optimize DTO conversions
- Use async processing where appropriate
- Monitor and optimize slow queries

---

## 16. Deployment Considerations

### 16.1 Environment Configuration
- Use environment-specific properties files
- Externalize configuration
- Use secrets management
- Configure logging levels per environment

### 16.2 Monitoring and Logging
- Implement structured logging
- Add health check endpoints
- Monitor application metrics
- Set up alerts for errors
- Track cart operations and conversions

---

## 17. Future Enhancements

### 17.1 Planned Features
- User authentication and authorization
- Order management system
- Payment integration
- Inventory management
- Product reviews and ratings
- Wishlist functionality
- Cart persistence across sessions
- Cart expiration policies
- Promotional codes and discounts

### 17.2 Technical Improvements
- Implement event-driven architecture
- Add message queuing (RabbitMQ/Kafka)
- Implement microservices architecture
- Add API versioning
- Implement GraphQL support
- Add real-time notifications

---

## 18. Appendix

### 18.1 Dependencies (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- SpringDoc OpenAPI -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.2.0</version>
    </dependency>
    
    <!-- Spring Boot Starter Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 18.2 Build Configuration

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024 | Development Team | Initial LLD for Product Management |
| 2.0 | 2024 | Development Team | Added Shopping Cart Management (SCRUM-1140) |

---

**End of Document**