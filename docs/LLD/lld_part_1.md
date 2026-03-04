# Low Level Design Document: E-commerce Product Management and Shopping Cart System

## 1. Project Overview

This document provides a comprehensive Low Level Design (LLD) for an E-commerce Product Management and Shopping Cart System built using Spring Boot, Java 21, and PostgreSQL. The system enables users to manage products and shopping carts with full CRUD operations, business logic for cart calculations, and robust validation.

### 1.1 System Purpose
- Manage product catalog with CRUD operations
- Handle shopping cart functionality for users
- Calculate cart totals with business rules
- Ensure data integrity and validation

### 1.2 Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Programming Language**: Java 21
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven/Gradle
- **API Style**: RESTful

---

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +createProduct(ProductDTO) ResponseEntity
        +getProductById(Long) ResponseEntity
        +getAllProducts() ResponseEntity
        +updateProduct(Long, ProductDTO) ResponseEntity
        +deleteProduct(Long) ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        +createProduct(ProductDTO) Product
        +getProductById(Long) Product
        +getAllProducts() List~Product~
        +updateProduct(Long, ProductDTO) Product
        +deleteProduct(Long) void
        +validateProductAvailability(Long, Integer) boolean
        +checkStockAvailability(Long, Integer) boolean
    }

    class ProductRepository {
        <<interface>>
        +findById(Long) Optional~Product~
        +findAll() List~Product~
        +save(Product) Product
        +deleteById(Long) void
        +existsById(Long) boolean
    }

    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -Integer stockQuantity
        -String category
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
    }

    class CartController {
        -CartService cartService
        +addItemToCart(AddToCartRequest) ResponseEntity
        +getCartByUserId(Long) ResponseEntity
        +updateCartItemQuantity(Long, UpdateQuantityRequest) ResponseEntity
        +removeCartItem(Long) ResponseEntity
    }

    class CartService {
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +addItemToCart(Long, Long, Integer) Cart
        +getCartByUserId(Long) Cart
        +updateCartItemQuantity(Long, Integer) CartItem
        +removeCartItem(Long) void
        +calculateCartTotal(Cart) BigDecimal
    }

    class CartRepository {
        <<interface>>
        +findByUserId(Long) Optional~Cart~
        +save(Cart) Cart
        +delete(Cart) void
    }

    class CartItemRepository {
        <<interface>>
        +findByCartId(Long) List~CartItem~
        +findByCartIdAndProductId(Long, Long) Optional~CartItem~
        +save(CartItem) CartItem
        +delete(CartItem) void
    }

    class Cart {
        -Long id
        -Long userId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
    }

    class CartItem {
        -Long id
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal priceAtAddition
        -BigDecimal subtotal
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
    CartController --> CartService
    CartService --> CartRepository
    CartService --> CartItemRepository
    CartService --> ProductService
    CartRepository --> Cart
    CartItemRepository --> CartItem
    Cart "1" --> "*" CartItem
    CartItem --> Product
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS ||--o{ CART_ITEMS : "referenced by"
    CARTS ||--o{ CART_ITEMS : contains
    
    PRODUCTS {
        bigint id PK
        varchar name
        text description
        decimal price
        integer stock_quantity
        varchar category
        timestamp created_at
        timestamp updated_at
    }
    
    CARTS {
        bigint id PK
        bigint user_id
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }
    
    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
        decimal price_at_addition
        decimal subtotal
    }
```

---

## 3. Sequence Diagrams

### 3.1 Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: POST /api/products
    ProductController->>ProductController: Validate ProductDTO
    ProductController->>ProductService: createProduct(productDTO)
    ProductService->>ProductService: Map DTO to Entity
    ProductService->>ProductService: Set timestamps
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: Product saved
    ProductRepository-->>ProductService: Product entity
    ProductService-->>ProductController: Product entity
    ProductController-->>Client: 201 Created + Product
```

### 3.2 Get Product by ID Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/{id}
    ProductController->>ProductService: getProductById(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    ProductService->>ProductService: Check if present
    alt Product exists
        ProductService-->>ProductController: Product entity
        ProductController-->>Client: 200 OK + Product
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.3 Update Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id}
    ProductController->>ProductController: Validate ProductDTO
    ProductController->>ProductService: updateProduct(id, productDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product data
    ProductRepository-->>ProductService: Optional<Product>
    alt Product exists
        ProductService->>ProductService: Update entity fields
        ProductService->>ProductService: Set updatedAt timestamp
        ProductService->>ProductRepository: save(product)
        ProductRepository->>Database: UPDATE products SET ...
        Database-->>ProductRepository: Updated product
        ProductRepository-->>ProductService: Product entity
        ProductService-->>ProductController: Product entity
        ProductController-->>Client: 200 OK + Product
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.4 Delete Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: existsById(id)
    ProductRepository->>Database: SELECT EXISTS(SELECT 1 FROM products WHERE id = ?)
    Database-->>ProductRepository: boolean result
    ProductRepository-->>ProductService: boolean
    alt Product exists
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Deletion confirmed
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product not found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

### 3.5 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant CartItemRepository
    participant Database

    Client->>CartController: POST /api/cart/add
    CartController->>CartService: addItemToCart(userId, productId, quantity)
    CartService->>ProductService: validateProductAvailability(productId, quantity)
    ProductService->>Database: Check product stock
    Database-->>ProductService: Product available
    ProductService-->>CartService: true
    CartService->>CartRepository: findByUserId(userId)
    CartRepository->>Database: SELECT * FROM carts WHERE user_id = ?
    Database-->>CartRepository: Cart data or empty
    alt Cart exists
        CartRepository-->>CartService: Optional<Cart>
    else Cart doesn't exist
        CartService->>CartService: Create new Cart
        CartService->>CartRepository: save(cart)
        CartRepository->>Database: INSERT INTO carts
        Database-->>CartRepository: Cart saved
        CartRepository-->>CartService: Cart entity
    end
    CartService->>CartItemRepository: findByCartIdAndProductId(cartId, productId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
    Database-->>CartItemRepository: CartItem or empty
    alt Item exists in cart
        CartService->>CartService: Update quantity
    else New item
        CartService->>CartService: Create new CartItem
    end
    CartService->>CartService: Calculate subtotal
    CartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: INSERT/UPDATE cart_items
    Database-->>CartItemRepository: CartItem saved
    CartService->>CartService: calculateCartTotal(cart)
    CartService->>CartRepository: save(cart)
    CartRepository->>Database: UPDATE carts SET total_amount = ?
    Database-->>CartRepository: Cart updated
    CartRepository-->>CartService: Cart entity
    CartService-->>CartController: Cart entity
    CartController-->>Client: 200 OK + Cart
```

### 3.6 Get Cart by User ID Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant Database

    Client->>CartController: GET /api/cart/{userId}
    CartController->>CartService: getCartByUserId(userId)
    CartService->>CartRepository: findByUserId(userId)
    CartRepository->>Database: SELECT * FROM carts WHERE user_id = ?
    Database-->>CartRepository: Cart data
    CartRepository-->>CartService: Optional<Cart>
    alt Cart exists
        CartService->>CartItemRepository: findByCartId(cartId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>CartItemRepository: List of CartItems
        CartItemRepository-->>CartService: List<CartItem>
        CartService->>CartService: Set items to cart
        CartService-->>CartController: Cart entity
        CartController-->>Client: 200 OK + Cart with items
    else Cart not found
        CartService-->>CartController: throw CartNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

### 3.7 Update Cart Item Quantity Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant ProductService
    participant CartRepository
    participant Database

    Client->>CartController: PUT /api/cart/item/{cartItemId}
    CartController->>CartService: updateCartItemQuantity(cartItemId, newQuantity)
    CartService->>CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem data
    CartItemRepository-->>CartService: Optional<CartItem>
    alt CartItem exists
        CartService->>ProductService: validateProductAvailability(productId, newQuantity)
        ProductService->>Database: Check product stock
        Database-->>ProductService: Stock available
        ProductService-->>CartService: true
        CartService->>CartService: Update quantity and subtotal
        CartService->>CartItemRepository: save(cartItem)
        CartItemRepository->>Database: UPDATE cart_items SET quantity = ?, subtotal = ?
        Database-->>CartItemRepository: CartItem updated
        CartItemRepository-->>CartService: CartItem entity
        CartService->>CartRepository: findById(cartId)
        CartRepository->>Database: SELECT * FROM carts WHERE id = ?
        Database-->>CartRepository: Cart data
        CartService->>CartService: calculateCartTotal(cart)
        CartService->>CartRepository: save(cart)
        CartRepository->>Database: UPDATE carts SET total_amount = ?
        Database-->>CartRepository: Cart updated
        CartService-->>CartController: CartItem entity
        CartController-->>Client: 200 OK + CartItem
    else CartItem not found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

### 3.8 Remove Cart Item Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant CartRepository
    participant Database

    Client->>CartController: DELETE /api/cart/item/{cartItemId}
    CartController->>CartService: removeCartItem(cartItemId)
    CartService->>CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem data
    CartItemRepository-->>CartService: Optional<CartItem>
    alt CartItem exists
        CartService->>CartService: Get cartId from cartItem
        CartService->>CartItemRepository: delete(cartItem)
        CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
        Database-->>CartItemRepository: Deletion confirmed
        CartService->>CartRepository: findById(cartId)
        CartRepository->>Database: SELECT * FROM carts WHERE id = ?
        Database-->>CartRepository: Cart data
        CartService->>CartService: calculateCartTotal(cart)
        CartService->>CartRepository: save(cart)
        CartRepository->>Database: UPDATE carts SET total_amount = ?
        Database-->>CartRepository: Cart updated
        CartService-->>CartController: void
        CartController-->>Client: 204 No Content
    else CartItem not found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: 404 Not Found
    end
```

---

## 4. API Endpoints Summary

### 4.1 Product Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/products` | Create a new product | ProductDTO | 201 Created + Product |
| GET | `/api/products/{id}` | Get product by ID | - | 200 OK + Product |
| GET | `/api/products` | Get all products | - | 200 OK + List<Product> |
| PUT | `/api/products/{id}` | Update product | ProductDTO | 200 OK + Product |
| DELETE | `/api/products/{id}` | Delete product | - | 204 No Content |

### 4.2 Cart Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/add` | Add item to cart | AddToCartRequest (userId, productId, quantity) | 200 OK + Cart |
| GET | `/api/cart/{userId}` | Get cart by user ID | - | 200 OK + Cart with items |
| PUT | `/api/cart/item/{cartItemId}` | Update cart item quantity | UpdateQuantityRequest (quantity) | 200 OK + CartItem |
| DELETE | `/api/cart/item/{cartItemId}` | Remove item from cart | - | 204 No Content |

---
