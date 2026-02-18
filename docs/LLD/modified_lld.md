# Low Level Design Document

## E-commerce Product Management System

### Version: 1.1
### Date: 2024
### Technology: Spring Boot 3.x, Java 21

---

## 1. Project Overview

This document provides the low-level design for an E-commerce Product Management System built using Spring Boot and Java 21. The system manages product information, including CRUD operations, category-based filtering, and search functionality.

**Modules:**
- ProductManagement
- ShoppingCartManagement

---

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword) ResponseEntity~List~Product~~
    }

    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Optional~Product~
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }

    class ProductRepository {
        <<interface>>
        +findByCategory(String category) List~Product~
        +findByNameContainingOrDescriptionContaining(String name, String description) List~Product~
    }

    class Product {
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
    }

    class ShoppingCartController {
        -ShoppingCartService shoppingCartService
        +addProductToCart(Long userId, Long productId, Integer quantity) ResponseEntity~ShoppingCart~
        +getShoppingCart(Long userId) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ResponseEntity~ShoppingCart~
        +removeItemFromCart(Long userId, Long cartItemId) ResponseEntity~Void~
    }

    class ShoppingCartService {
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addProductToCart(Long userId, Long productId, Integer quantity) ShoppingCart
        +getShoppingCart(Long userId) Optional~ShoppingCart~
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ShoppingCart
        +removeItemFromCart(Long userId, Long cartItemId) void
        +calculateCartTotal(ShoppingCart cart) BigDecimal
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
    }

    class CartItemRepository {
        <<interface>>
        +findByShoppingCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
    }

    class ShoppingCart {
        -Long id
        -Long userId
        -List~CartItem~ cartItems
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
    }

    class CartItem {
        -Long id
        -Long shoppingCartId
        -Long productId
        -Integer quantity
        -BigDecimal price
        -LocalDateTime addedAt
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductRepository
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart "1" --> "*" CartItem
    CartItem "*" --> "1" Product
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        VARCHAR category
        INTEGER stock_quantity
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SHOPPING_CARTS {
        BIGINT id PK
        BIGINT user_id
        DECIMAL total_amount
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CART_ITEMS {
        BIGINT id PK
        BIGINT shopping_cart_id FK
        BIGINT product_id FK
        INTEGER quantity
        DECIMAL price
        TIMESTAMP added_at
    }

    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : "included in"
```

---

## 3. Sequence Diagrams

### 3.1 Get All Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products
    ProductController->>ProductService: getAllProducts()
    ProductService->>ProductRepository: findAll()
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.2 Get Product By ID

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
    
    alt Product Found
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: null
        ProductController-->>Client: 404 Not Found
    end
```

### 3.3 Create Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: POST /api/products (Product Data)
    ProductController->>ProductService: createProduct(product)
    ProductService->>ProductService: Set createdAt, updatedAt
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products VALUES (...)
    Database-->>ProductRepository: Generated ID
    ProductRepository-->>ProductService: Saved Product
    ProductService-->>ProductController: Product
    ProductController-->>Client: 201 Created (Product)
```

### 3.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: PUT /api/products/{id} (Updated Data)
    ProductController->>ProductService: updateProduct(id, product)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductService: Update fields, set updatedAt
        ProductService->>ProductRepository: save(updatedProduct)
        ProductRepository->>Database: UPDATE products SET ... WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: Updated Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: null
        ProductController-->>Client: 404 Not Found
    end
```

### 3.5 Delete Product

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
    ProductRepository->>Database: SELECT COUNT(*) FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Count = 1
        ProductRepository-->>ProductService: true
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product Not Found
        Database-->>ProductRepository: Count = 0
        ProductRepository-->>ProductService: false
        ProductService-->>ProductController: Exception
        ProductController-->>Client: 404 Not Found
    end
```

### 3.6 Get Products By Category

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/category/{category}
    ProductController->>ProductService: getProductsByCategory(category)
    ProductService->>ProductRepository: findByCategory(category)
    ProductRepository->>Database: SELECT * FROM products WHERE category = ?
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database

    Client->>ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>ProductService: searchProducts(keyword)
    ProductService->>ProductRepository: findByNameContainingOrDescriptionContaining(keyword, keyword)
    ProductRepository->>Database: SELECT * FROM products WHERE name LIKE ? OR description LIKE ?
    Database-->>ProductRepository: Product Records
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK (List<Product>)
```

### 3.8 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database

    Client->>ShoppingCartController: POST /api/cart/{userId}/items (productId, quantity)
    ShoppingCartController->>ShoppingCartService: addProductToCart(userId, productId, quantity)
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Exists
        Database-->>ProductRepository: Product Record
        ProductRepository-->>ShoppingCartService: Optional<Product>
        ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
        ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
        
        alt Cart Exists
            Database-->>ShoppingCartRepository: Cart Record
            ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        else Cart Not Exists
            Database-->>ShoppingCartRepository: Empty Result
            ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
            ShoppingCartService->>ShoppingCartService: Create new ShoppingCart
            ShoppingCartService->>ShoppingCartRepository: save(newCart)
            ShoppingCartRepository->>Database: INSERT INTO shopping_carts
        end
        
        ShoppingCartService->>CartItemRepository: findByShoppingCartIdAndProductId(cartId, productId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE shopping_cart_id = ? AND product_id = ?
        
        alt Item Exists
            Database-->>CartItemRepository: CartItem Record
            CartItemRepository-->>ShoppingCartService: Optional<CartItem>
            ShoppingCartService->>ShoppingCartService: Update quantity
        else Item Not Exists
            Database-->>CartItemRepository: Empty Result
            CartItemRepository-->>ShoppingCartService: Optional.empty()
            ShoppingCartService->>ShoppingCartService: Create new CartItem
        end
        
        ShoppingCartService->>CartItemRepository: save(cartItem)
        CartItemRepository->>Database: INSERT/UPDATE cart_items
        ShoppingCartService->>ShoppingCartService: calculateCartTotal(cart)
        ShoppingCartService->>ShoppingCartRepository: save(updatedCart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts SET total_amount = ?
        Database-->>ShoppingCartRepository: Success
        ShoppingCartRepository-->>ShoppingCartService: Updated ShoppingCart
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Product Not Found
        Database-->>ProductRepository: Empty Result
        ProductRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: Exception
        ShoppingCartController-->>Client: 404 Not Found
    end
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant Database

    Client->>ShoppingCartController: GET /api/cart/{userId}
    ShoppingCartController->>ShoppingCartService: getShoppingCart(userId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ? (with cart_items)
    
    alt Cart Found
        Database-->>ShoppingCartRepository: Cart with Items
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Cart Not Found
        Database-->>ShoppingCartRepository: Empty Result
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: null
        ShoppingCartController-->>Client: 404 Not Found
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: PUT /api/cart/{userId}/items/{cartItemId} (quantity)
    ShoppingCartController->>ShoppingCartService: updateCartItemQuantity(userId, cartItemId, quantity)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart Found
        Database-->>ShoppingCartRepository: Cart Record
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService->>CartItemRepository: findById(cartItemId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
        
        alt Item Found and Belongs to Cart
            Database-->>CartItemRepository: CartItem Record
            CartItemRepository-->>ShoppingCartService: Optional<CartItem>
            ShoppingCartService->>ShoppingCartService: Update quantity
            ShoppingCartService->>CartItemRepository: save(updatedCartItem)
            CartItemRepository->>Database: UPDATE cart_items SET quantity = ?
            ShoppingCartService->>ShoppingCartService: calculateCartTotal(cart)
            ShoppingCartService->>ShoppingCartRepository: save(updatedCart)
            ShoppingCartRepository->>Database: UPDATE shopping_carts SET total_amount = ?
            Database-->>ShoppingCartRepository: Success
            ShoppingCartRepository-->>ShoppingCartService: Updated ShoppingCart
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: 200 OK (ShoppingCart)
        else Item Not Found
            Database-->>CartItemRepository: Empty Result
            CartItemRepository-->>ShoppingCartService: Optional.empty()
            ShoppingCartService-->>ShoppingCartController: Exception
            ShoppingCartController-->>Client: 404 Not Found
        end
    else Cart Not Found
        Database-->>ShoppingCartRepository: Empty Result
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: Exception
        ShoppingCartController-->>Client: 404 Not Found
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: DELETE /api/cart/{userId}/items/{cartItemId}
    ShoppingCartController->>ShoppingCartService: removeItemFromCart(userId, cartItemId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart Found
        Database-->>ShoppingCartRepository: Cart Record
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService->>CartItemRepository: findById(cartItemId)
        CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
        
        alt Item Found and Belongs to Cart
            Database-->>CartItemRepository: CartItem Record
            CartItemRepository-->>ShoppingCartService: Optional<CartItem>
            ShoppingCartService->>CartItemRepository: deleteById(cartItemId)
            CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
            Database-->>CartItemRepository: Success
            ShoppingCartService->>ShoppingCartService: calculateCartTotal(cart)
            ShoppingCartService->>ShoppingCartRepository: save(updatedCart)
            ShoppingCartRepository->>Database: UPDATE shopping_carts SET total_amount = ?
            Database-->>ShoppingCartRepository: Success
            ShoppingCartRepository-->>ShoppingCartService: void
            ShoppingCartService-->>ShoppingCartController: void
            ShoppingCartController-->>Client: 204 No Content
        else Item Not Found
            Database-->>CartItemRepository: Empty Result
            CartItemRepository-->>ShoppingCartService: Optional.empty()
            ShoppingCartService-->>ShoppingCartController: Exception
            ShoppingCartController-->>Client: 404 Not Found
        end
    else Cart Not Found
        Database-->>ShoppingCartRepository: Empty Result
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: Exception
        ShoppingCartController-->>Client: 404 Not Found
    end
```

---

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/products | Get all products | None | List<Product> |
| GET | /api/products/{id} | Get product by ID | None | Product |
| POST | /api/products | Create new product | Product | Product |
| PUT | /api/products/{id} | Update product | Product | Product |
| DELETE | /api/products/{id} | Delete product | None | 204 No Content |
| GET | /api/products/category/{category} | Get products by category | None | List<Product> |
| GET | /api/products/search?keyword={keyword} | Search products | None | List<Product> |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/cart/{userId}/items | Add product to cart | {productId, quantity} | ShoppingCart |
| GET | /api/cart/{userId} | View shopping cart | None | ShoppingCart |
| PUT | /api/cart/{userId}/items/{cartItemId} | Update cart item quantity | {quantity} | ShoppingCart |
| DELETE | /api/cart/{userId}/items/{cartItemId} | Remove item from cart | None | 204 No Content |

---

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name)
);
```

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_user_id (user_id)
);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shopping_cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_cart_product (shopping_cart_id, product_id)
);
```

---

## 6. Technology Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: MySQL/PostgreSQL
- **ORM**: Spring Data JPA
- **Build Tool**: Maven/Gradle
- **API Documentation**: SpringDoc OpenAPI

---

## 7. Design Patterns Used

1. **Repository Pattern**: Data access abstraction through Spring Data JPA repositories
2. **Service Layer Pattern**: Business logic separation in service classes
3. **DTO Pattern**: Data transfer between layers (if implemented)
4. **RESTful API Pattern**: Resource-based API design
5. **Dependency Injection**: Spring's IoC container for loose coupling
6. **Aggregate Pattern**: ShoppingCart acts as an aggregate root managing CartItems lifecycle and ensuring consistency

---

## 8. Key Features

### Product Management
- Complete CRUD operations for products
- Category-based product filtering
- Product search functionality
- Stock quantity tracking
- Automatic timestamp management
- Input validation
- Error handling with appropriate HTTP status codes

### Shopping Cart Management
- Add products to shopping cart
- View cart contents with all items
- Update item quantities in cart
- Remove items from cart
- Automatic cart total calculation
- User-specific cart isolation
- Prevent duplicate products in cart (quantity updates instead)
- Cascade deletion of cart items when cart is deleted

---

## 9. Error Handling

- **404 Not Found**: When product/cart/item doesn't exist
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Unexpected server errors

---

## 10. Future Enhancements

- Pagination for product listings
- Advanced filtering options
- Product image management
- Product reviews and ratings
- Inventory management
- Price history tracking
- Cart expiration and cleanup
- Cart sharing functionality
- Save for later feature
- Apply discount codes/coupons

---

**Document End**