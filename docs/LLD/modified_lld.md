# Low Level Design Document

## E-commerce Product Management System

### Version: 1.1
### Date: 2024
### Story: SCRUM-1140 - Shopping Cart Management

---

## 1. Project Overview

This document provides the Low Level Design (LLD) for an E-commerce system built using Spring Boot and Java 21. The system includes the following modules:

- **ProductManagement**: Handles product-related operations
- **ShoppingCartManagement**: Manages shopping cart and cart items

---

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity
        +getProductById(Long id) ResponseEntity
        +createProduct(ProductDTO) ResponseEntity
        +updateProduct(Long id, ProductDTO) ResponseEntity
        +deleteProduct(Long id) ResponseEntity
        +getProductsByCategory(String category) ResponseEntity
        +searchProducts(String keyword) ResponseEntity
    }

    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Optional~Product~
        +createProduct(ProductDTO) Product
        +updateProduct(Long id, ProductDTO) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }

    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingOrDescriptionContaining(String, String) List~Product~
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

    class ProductDTO {
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
    }

    class ShoppingCartController {
        -ShoppingCartService shoppingCartService
        +addProductToCart(Long userId, Long productId, Integer quantity) ResponseEntity
        +getCart(Long userId) ResponseEntity
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ResponseEntity
        +removeCartItem(Long userId, Long cartItemId) ResponseEntity
        +clearCart(Long userId) ResponseEntity
    }

    class ShoppingCartService {
        -ShoppingCartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        +addProductToCart(Long userId, Long productId, Integer quantity) ShoppingCart
        +getCartByUserId(Long userId) Optional~ShoppingCart~
        +updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) ShoppingCart
        +removeCartItem(Long userId, Long cartItemId) ShoppingCart
        +clearCart(Long userId) void
        +calculateCartTotal(ShoppingCart cart) BigDecimal
    }

    class ShoppingCartRepository {
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
        +save(ShoppingCart) ShoppingCart
        +deleteByUserId(Long userId) void
    }

    class CartItemRepository {
        <<interface>>
        +findById(Long id) Optional~CartItem~
        +save(CartItem) CartItem
        +delete(CartItem) void
    }

    class ShoppingCart {
        -Long id
        -Long userId
        -List~CartItem~ items
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +addItem(CartItem item) void
        +removeItem(CartItem item) void
        +updateItemQuantity(Long itemId, Integer quantity) void
        +getTotalAmount() BigDecimal
    }

    class CartItem {
        -Long id
        -Long productId
        -String productName
        -BigDecimal productPrice
        -Integer quantity
        -BigDecimal subtotal
    }

    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
    ProductController ..> ProductDTO
    ProductService ..> ProductDTO
    
    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> ShoppingCartRepository
    ShoppingCartService --> CartItemRepository
    ShoppingCartService --> ProductService
    ShoppingCartRepository --> ShoppingCart
    CartItemRepository --> CartItem
    ShoppingCart "1" *-- "many" CartItem
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
        INT stock_quantity
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SHOPPING_CARTS {
        BIGINT id PK
        BIGINT user_id UK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CART_ITEMS {
        BIGINT id PK
        BIGINT cart_id FK
        BIGINT product_id FK
        VARCHAR product_name
        DECIMAL product_price
        INT quantity
        DECIMAL subtotal
    }

    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
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
    Database-->>ProductRepository: List<Product>
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
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService-->>ProductController: Optional<Product>
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: Optional.empty()
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

    Client->>ProductController: POST /api/products (ProductDTO)
    ProductController->>ProductService: createProduct(productDTO)
    ProductService->>ProductService: Convert DTO to Entity
    ProductService->>ProductService: Set timestamps
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: Product (with ID)
    ProductRepository-->>ProductService: Product
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

    Client->>ProductController: PUT /api/products/{id} (ProductDTO)
    ProductController->>ProductService: updateProduct(id, productDTO)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Found
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductService: Update product fields
        ProductService->>ProductService: Set updated timestamp
        ProductService->>ProductRepository: save(product)
        ProductRepository->>Database: UPDATE products SET ...
        Database-->>ProductRepository: Updated Product
        ProductRepository-->>ProductService: Product
        ProductService-->>ProductController: Product
        ProductController-->>Client: 200 OK (Product)
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
        ProductService-->>ProductController: Exception
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
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    
    alt Product Found
        Database-->>ProductRepository: Product
        ProductRepository-->>ProductService: Optional<Product>
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: 204 No Content
    else Product Not Found
        Database-->>ProductRepository: null
        ProductRepository-->>ProductService: Optional.empty()
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
    Database-->>ProductRepository: List<Product>
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
    Database-->>ProductRepository: List<Product>
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
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database

    Client->>ShoppingCartController: POST /api/cart/{userId}/items
    ShoppingCartController->>ShoppingCartService: addProductToCart(userId, productId, quantity)
    ShoppingCartService->>ProductService: getProductById(productId)
    ProductService-->>ShoppingCartService: Product
    
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart Exists
        Database-->>ShoppingCartRepository: ShoppingCart
    else Cart Not Found
        ShoppingCartService->>ShoppingCartService: Create new ShoppingCart
        ShoppingCartService->>ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>Database: INSERT INTO shopping_carts
        Database-->>ShoppingCartRepository: ShoppingCart
    end
    
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService->>ShoppingCartService: Create CartItem
    ShoppingCartService->>CartItemRepository: save(cartItem)
    CartItemRepository->>Database: INSERT INTO cart_items
    Database-->>CartItemRepository: CartItem
    CartItemRepository-->>ShoppingCartService: CartItem
    ShoppingCartService->>ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>Database: UPDATE shopping_carts
    Database-->>ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
    ShoppingCartService-->>ShoppingCartController: ShoppingCart
    ShoppingCartController-->>Client: 200 OK (ShoppingCart)
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
    ShoppingCartController->>ShoppingCartService: getCartByUserId(userId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    
    alt Cart Found
        Database-->>ShoppingCartRepository: ShoppingCart with CartItems
        ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
        ShoppingCartService->>ShoppingCartService: calculateCartTotal(cart)
        ShoppingCartService-->>ShoppingCartController: Optional<ShoppingCart>
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Cart Not Found
        Database-->>ShoppingCartRepository: null
        ShoppingCartRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: Optional.empty()
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

    Client->>ShoppingCartController: PUT /api/cart/{userId}/items/{cartItemId}
    ShoppingCartController->>ShoppingCartService: updateCartItemQuantity(userId, cartItemId, quantity)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
    
    ShoppingCartService->>CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    
    alt Item Found
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: Optional<CartItem>
        ShoppingCartService->>ShoppingCartService: Update quantity and subtotal
        ShoppingCartService->>CartItemRepository: save(cartItem)
        CartItemRepository->>Database: UPDATE cart_items SET quantity = ?, subtotal = ?
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: CartItem
        ShoppingCartService->>ShoppingCartRepository: save(cart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Item Not Found
        Database-->>CartItemRepository: null
        CartItemRepository-->>ShoppingCartService: Optional.empty()
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
    ShoppingCartController->>ShoppingCartService: removeCartItem(userId, cartItemId)
    ShoppingCartService->>ShoppingCartRepository: findByUserId(userId)
    ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>ShoppingCartService: Optional<ShoppingCart>
    
    ShoppingCartService->>CartItemRepository: findById(cartItemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    
    alt Item Found
        Database-->>CartItemRepository: CartItem
        CartItemRepository-->>ShoppingCartService: Optional<CartItem>
        ShoppingCartService->>ShoppingCartService: Remove item from cart
        ShoppingCartService->>CartItemRepository: delete(cartItem)
        CartItemRepository->>Database: DELETE FROM cart_items WHERE id = ?
        Database-->>CartItemRepository: Success
        CartItemRepository-->>ShoppingCartService: void
        ShoppingCartService->>ShoppingCartRepository: save(cart)
        ShoppingCartRepository->>Database: UPDATE shopping_carts
        Database-->>ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>ShoppingCartService: ShoppingCart
        ShoppingCartService-->>ShoppingCartController: ShoppingCart
        ShoppingCartController-->>Client: 200 OK (ShoppingCart)
    else Item Not Found
        Database-->>CartItemRepository: null
        CartItemRepository-->>ShoppingCartService: Optional.empty()
        ShoppingCartService-->>ShoppingCartController: Exception
        ShoppingCartController-->>Client: 404 Not Found
    end
```

---

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List of Products |
| GET | `/api/products/{id}` | Get product by ID | None | Product or 404 |
| POST | `/api/products` | Create new product | ProductDTO | Created Product |
| PUT | `/api/products/{id}` | Update product | ProductDTO | Updated Product |
| DELETE | `/api/products/{id}` | Delete product | None | 204 No Content |
| GET | `/api/products/category/{category}` | Get products by category | None | List of Products |
| GET | `/api/products/search?keyword={keyword}` | Search products | None | List of Products |

### Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/{userId}/items` | Add product to cart | {"productId": Long, "quantity": Integer} | ShoppingCart |
| GET | `/api/cart/{userId}` | Get user's shopping cart | None | ShoppingCart or 404 |
| PUT | `/api/cart/{userId}/items/{cartItemId}` | Update cart item quantity | {"quantity": Integer} | ShoppingCart |
| DELETE | `/api/cart/{userId}/items/{cartItemId}` | Remove item from cart | None | ShoppingCart |
| DELETE | `/api/cart/{userId}` | Clear entire cart | None | 204 No Content |

---

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
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
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);
```

---

## 6. Technology Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: MySQL/PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **Build Tool**: Maven/Gradle
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Validation**: Jakarta Bean Validation
- **Logging**: SLF4J with Logback

---

## 7. Design Patterns Used

### 7.1 Repository Pattern
- Abstracts data access logic
- Provides a collection-like interface for accessing domain objects
- Implemented through Spring Data JPA repositories

### 7.2 Service Layer Pattern
- Encapsulates business logic
- Provides transaction management
- Acts as a facade between controllers and repositories

### 7.3 DTO Pattern
- Separates internal domain models from API contracts
- Reduces coupling between layers
- Provides data validation at API boundary

### 7.4 RESTful API Pattern
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Stateless communication
- Proper HTTP status codes

### 7.5 Aggregate Pattern
- ShoppingCart acts as an aggregate root
- CartItems are managed through the ShoppingCart aggregate
- Ensures consistency of cart operations
- Encapsulates business rules for cart management

---

## 8. Key Features

### Product Management
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Category Filtering**: Filter products by category
- **Search Functionality**: Search products by name or description
- **Stock Management**: Track product inventory
- **Timestamp Tracking**: Automatic creation and update timestamps
- **Data Validation**: Input validation using Bean Validation
- **Error Handling**: Proper exception handling with meaningful error messages

### Shopping Cart Management
- **Cart Creation**: Automatic cart creation for new users
- **Add to Cart**: Add products with specified quantities
- **View Cart**: Retrieve complete cart with all items and total
- **Update Quantity**: Modify item quantities in cart
- **Remove Items**: Delete specific items from cart
- **Clear Cart**: Remove all items from cart
- **Total Calculation**: Automatic calculation of cart total
- **Product Integration**: Real-time product information synchronization
- **Cascade Operations**: Automatic cleanup of cart items when cart is deleted

---

## 9. Error Handling

- **404 Not Found**: When product or cart is not found
- **400 Bad Request**: For invalid input data
- **500 Internal Server Error**: For unexpected server errors
- Custom exception classes for domain-specific errors

---

## 10. Future Enhancements

- Add pagination for product listings
- Implement caching for frequently accessed products
- Add product images support
- Implement product reviews and ratings
- Add inventory management with low stock alerts
- Implement user authentication and authorization
- Add cart expiration and cleanup mechanisms
- Implement wishlist functionality
- Add promotional codes and discounts
- Implement order creation from cart

---

**Document Version Control**
- Version 1.0: Initial Product Management LLD
- Version 1.1: Added Shopping Cart Management (Story SCRUM-1140)

**Prepared by**: Development Team  
**Reviewed by**: Technical Lead  
**Approved by**: Project Manager