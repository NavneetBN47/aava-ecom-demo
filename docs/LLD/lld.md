# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement  

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        <<@RestController>>
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
        <<@Service>>
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Product
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }
    
    class ProductRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingIgnoreCase(String keyword) List~Product~
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getCategory() String
        +setCategory(String category) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer stockQuantity) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
```

### 2.2 Shopping Cart Class Diagram

```mermaid
classDiagram
    class CartController {
        <<@RestController>>
        -CartService cartService
        +getCart(Long userId) ResponseEntity~CartResponse~
        +addToCart(Long userId, AddToCartRequest request) ResponseEntity~CartResponse~
        +updateCartItemQuantity(Long userId, Long itemId, Integer quantity) ResponseEntity~CartResponse~
        +removeFromCart(Long userId, Long itemId) ResponseEntity~CartResponse~
    }
    
    class CartService {
        <<@Service>>
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +getCartByUserId(Long userId) CartResponse
        +addProductToCart(Long userId, Long productId, Integer quantity) CartResponse
        +updateItemQuantity(Long userId, Long itemId, Integer quantity) CartResponse
        +removeItemFromCart(Long userId, Long itemId) CartResponse
        +calculateCartTotal(List~CartItem~ items) BigDecimal
        +calculateItemSubtotal(BigDecimal price, Integer quantity) BigDecimal
    }
    
    class CartRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) Optional~Cart~
        +save(Cart cart) Cart
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findByCartId(Long cartId) List~CartItem~
        +findByCartIdAndProductId(Long cartId, Long productId) Optional~CartItem~
        +save(CartItem cartItem) CartItem
        +deleteById(Long id) void
    }
    
    class Cart {
        <<@Entity>>
        -Long cartId
        -Long userId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getCartId() Long
        +setCartId(Long cartId) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long cartItemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal priceAtAdd
        -BigDecimal subtotal
        +getCartItemId() Long
        +setCartItemId(Long cartItemId) void
        +getCartId() Long
        +setCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getPriceAtAdd() BigDecimal
        +setPriceAtAdd(BigDecimal priceAtAdd) void
        +getSubtotal() BigDecimal
        +setSubtotal(BigDecimal subtotal) void
    }
    
    CartController --> CartService : depends on
    CartService --> CartRepository : depends on
    CartService --> CartItemRepository : depends on
    CartService --> ProductRepository : depends on
    CartRepository --> Cart : manages
    CartItemRepository --> CartItem : manages
    Cart --> CartItem : contains
    CartItem --> Product : references
```

### 2.3 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
```

### 2.4 Shopping Cart Entity Relationship Diagram

```mermaid
erDiagram
    CARTS {
        BIGINT cart_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id "NOT NULL, UNIQUE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT cart_item_id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL price_at_add "NOT NULL, PRECISION(10,2)"
        DECIMAL subtotal "NOT NULL, PRECISION(10,2)"
    }
    
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    CARTS ||--o{ CART_ITEMS : contains
    CART_ITEMS }o--|| PRODUCTS : references
```

## 3. Sequence Diagrams

### 3.1 Get All Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products
    ProductController->>+ProductService: getAllProducts()
    ProductService->>+ProductRepository: findAll()
    ProductRepository->>+Database: SELECT * FROM products
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.2 Get Product By ID

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products/{id}
    ProductController->>+ProductService: getProductById(id)
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Found
        ProductService-->>ProductController: Product
        ProductController-->>Client: ResponseEntity<Product> (200)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
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
    
    Client->>+ProductController: POST /api/products (Product data)
    ProductController->>+ProductService: createProduct(product)
    
    Note over ProductService: Validate product data
    Note over ProductService: Set createdAt timestamp
    
    ProductService->>+ProductRepository: save(product)
    ProductRepository->>+Database: INSERT INTO products (...) VALUES (...)
    Database-->>-ProductRepository: Product (with generated ID)
    ProductRepository-->>-ProductService: Product
    ProductService-->>-ProductController: Product
    ProductController-->>-Client: ResponseEntity<Product> (201)
```

### 3.4 Update Product

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: PUT /api/products/{id} (Product data)
    ProductController->>+ProductService: updateProduct(id, product)
    
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Exists
        Note over ProductService: Update product fields
        ProductService->>+ProductRepository: save(updatedProduct)
        ProductRepository->>+Database: UPDATE products SET ... WHERE id = ?
        Database-->>-ProductRepository: Updated Product
        ProductRepository-->>-ProductService: Updated Product
        ProductService-->>ProductController: Updated Product
        ProductController-->>Client: ResponseEntity<Product> (200)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
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
    
    Client->>+ProductController: DELETE /api/products/{id}
    ProductController->>+ProductService: deleteProduct(id)
    
    ProductService->>+ProductRepository: findById(id)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ProductService: Optional<Product>
    
    alt Product Exists
        ProductService->>+ProductRepository: deleteById(id)
        ProductRepository->>+Database: DELETE FROM products WHERE id = ?
        Database-->>-ProductRepository: Success
        ProductRepository-->>-ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: ResponseEntity (204)
    else Product Not Found
        ProductService-->>ProductController: throw ProductNotFoundException
        ProductController-->>Client: ResponseEntity (404)
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
    
    Client->>+ProductController: GET /api/products/category/{category}
    ProductController->>+ProductService: getProductsByCategory(category)
    ProductService->>+ProductRepository: findByCategory(category)
    ProductRepository->>+Database: SELECT * FROM products WHERE category = ?
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.7 Search Products

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>+ProductController: GET /api/products/search?keyword={keyword}
    ProductController->>+ProductService: searchProducts(keyword)
    ProductService->>+ProductRepository: findByNameContainingIgnoreCase(keyword)
    ProductRepository->>+Database: SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)
    Database-->>-ProductRepository: List<Product>
    ProductRepository-->>-ProductService: List<Product>
    ProductService-->>-ProductController: List<Product>
    ProductController-->>-Client: ResponseEntity<List<Product>>
```

### 3.8 Add Product to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (userId, productId, quantity)
    CartController->>+CartService: addProductToCart(userId, productId, quantity)
    
    CartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-CartService: Product
    
    alt Product Not Found
        CartService-->>CartController: throw ProductNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Product Found
        CartService->>+CartRepository: findByUserId(userId)
        CartRepository->>+Database: SELECT * FROM carts WHERE user_id = ?
        Database-->>-CartRepository: Optional<Cart>
        CartRepository-->>-CartService: Optional<Cart>
        
        alt Cart Not Exists
            Note over CartService: Create new cart for user
            CartService->>+CartRepository: save(newCart)
            CartRepository->>+Database: INSERT INTO carts (user_id, created_at, updated_at) VALUES (...)
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
        end
        
        CartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-CartService: Optional<CartItem>
        
        alt Item Already in Cart
            Note over CartService: Update quantity and recalculate subtotal
            CartService->>CartService: calculateItemSubtotal(price, newQuantity)
        else New Item
            Note over CartService: Create new cart item with quantity 1
            Note over CartService: Calculate subtotal = price * quantity
        end
        
        CartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>+Database: INSERT/UPDATE cart_items
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-CartService: CartItem
        
        Note over CartService: Calculate cart total
        CartService->>CartService: calculateCartTotal(allCartItems)
        
        CartService-->>CartController: CartResponse (with items and total)
        CartController-->>Client: ResponseEntity<CartResponse> (200/201)
    end
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: GET /api/cart (userId)
    CartController->>+CartService: getCartByUserId(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM carts WHERE user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Not Found
        Note over CartService: Return empty cart response
        CartService-->>CartController: CartResponse (empty=true, message="Your cart is empty")
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    else Cart Found
        CartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-CartService: List<CartItem>
        
        alt No Items in Cart
            Note over CartService: Return empty cart with message
            CartService-->>CartController: CartResponse (empty=true, message="Your cart is empty")
            CartController-->>Client: ResponseEntity<CartResponse> (200)
        else Items Found
            loop For each CartItem
                CartService->>+ProductRepository: findById(productId)
                ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
                Database-->>-ProductRepository: Product
                ProductRepository-->>-CartService: Product
                Note over CartService: Enrich cart item with product details
            end
            
            Note over CartService: Calculate cart total
            CartService->>CartService: calculateCartTotal(cartItems)
            
            CartService-->>CartController: CartResponse (items, total, empty=false)
            CartController-->>Client: ResponseEntity<CartResponse> (200)
        end
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} (userId, quantity)
    CartController->>+CartService: updateItemQuantity(userId, itemId, quantity)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Item Found
        Note over CartService: Validate quantity > 0
        Note over CartService: Recalculate subtotal = priceAtAdd * newQuantity
        CartService->>CartService: calculateItemSubtotal(priceAtAdd, quantity)
        
        CartService->>+CartItemRepository: save(updatedCartItem)
        CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE cart_item_id = ?
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-CartService: CartItem
        
        Note over CartService: Fetch all cart items and recalculate total
        CartService->>CartService: calculateCartTotal(allCartItems)
        
        CartService-->>CartController: CartResponse (updated items and total)
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    end
```

### 3.11 Remove Item from Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId} (userId)
    CartController->>+CartService: removeItemFromCart(userId, itemId)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    else Item Found
        CartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        Note over CartService: Fetch remaining cart items
        Note over CartService: Recalculate cart total
        CartService->>CartService: calculateCartTotal(remainingItems)
        
        CartService-->>CartController: CartResponse (updated items and total)
        CartController-->>Client: ResponseEntity<CartResponse> (200)
    end
```

## 4. API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### 4.1 Shopping Cart API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/cart` | View shopping cart for user | Query: userId | CartResponse |
| POST | `/api/cart/items` | Add product to cart | {"userId": Long, "productId": Long, "quantity": Integer} | CartResponse |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | {"userId": Long, "quantity": Integer} | CartResponse |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | Query: userId | CartResponse |

**CartResponse Structure:**
```json
{
  "cartId": "Long",
  "userId": "Long",
  "items": [
    {
      "cartItemId": "Long",
      "productId": "Long",
      "productName": "String",
      "price": "BigDecimal",
      "quantity": "Integer",
      "subtotal": "BigDecimal"
    }
  ],
  "total": "BigDecimal",
  "isEmpty": "Boolean",
  "message": "String (optional, e.g., 'Your cart is empty')",
  "continueShoppingLink": "String (optional, e.g., '/products')"
}
```

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.1 Shopping Cart Database Schema

```sql
CREATE TABLE carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_carts_user_id (user_id)
);

CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id),
    INDEX idx_cart_items_cart_id (cart_id),
    INDEX idx_cart_items_product_id (product_id)
);
```

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

## 9. Shopping Cart Business Logic

### 9.1 Cart Calculation Methods

**calculateItemSubtotal(price, quantity):**
- Input: Product price (BigDecimal), quantity (Integer)
- Logic: subtotal = price × quantity
- Output: BigDecimal subtotal
- Validation: Ensure quantity > 0 and price >= 0

**calculateCartTotal(cartItems):**
- Input: List of CartItem entities
- Logic: total = Σ(subtotal for each cart item)
- Output: BigDecimal total
- Handles empty cart: returns 0.00

### 9.2 Empty Cart State Handling

**Empty Cart Detection:**
- Check if cart exists for user
- Check if cart has zero items
- Return CartResponse with:
  - `isEmpty = true`
  - `message = "Your cart is empty"`
  - `continueShoppingLink = "/products"`
  - `items = []`
  - `total = 0.00`

### 9.3 Cart-Product Integration

**Product Availability Context:**
- When retrieving product details, include cart context:
  - `inCart`: Boolean indicating if product is in user's cart
  - `cartQuantity`: Current quantity in cart (if applicable)
  - `availableStock`: Remaining stock quantity

**Stock Validation on Add to Cart:**
- Verify product.stockQuantity >= requested quantity
- Throw InsufficientStockException if validation fails
- Update cart only if stock is available

### 9.4 Automatic Recalculation Triggers

**Quantity Update:**
- Recalculate item subtotal immediately
- Recalculate cart total
- Update cart.updatedAt timestamp

**Item Removal:**
- Remove item from cart_items table
- Recalculate cart total from remaining items
- Update cart.updatedAt timestamp

**Price Changes:**
- Use `price_at_add` field to preserve price at time of adding
- Cart displays price at which item was added
- Optionally show current price for comparison

## 10. Exception Handling

### 10.1 Product Exceptions
- **ProductNotFoundException:** Thrown when product ID not found (HTTP 404)
- **InvalidProductDataException:** Thrown for validation failures (HTTP 400)

### 10.2 Shopping Cart Exceptions
- **CartNotFoundException:** Thrown when cart not found for user (HTTP 404)
- **CartItemNotFoundException:** Thrown when cart item ID not found (HTTP 404)
- **InsufficientStockException:** Thrown when requested quantity exceeds available stock (HTTP 400)
- **InvalidQuantityException:** Thrown when quantity <= 0 (HTTP 400)
- **EmptyCartException:** Informational exception for empty cart state (HTTP 200 with message)

## 11. Traceability Matrix

### 11.1 Epic to Story to LLD Mapping

**Epic:** E-commerce Customer-Facing Capabilities  
**Story:** Shopping Cart Management

| Story AC | LLD Section | Implementation Details |
|----------|-------------|------------------------|
| AC1: Add to Cart with quantity 1 | Section 3.8, 4.1, 9.1 | POST /api/cart/items endpoint, addProductToCart service method |
| AC2: View cart with product details | Section 3.9, 4.1, 9.2 | GET /api/cart endpoint, getCartByUserId service method, CartResponse DTO |
| AC3: Update quantity with recalculation | Section 3.10, 4.1, 9.1, 9.4 | PUT /api/cart/items/{itemId} endpoint, calculateItemSubtotal and calculateCartTotal methods |
| AC4: Remove item with total update | Section 3.11, 4.1, 9.4 | DELETE /api/cart/items/{itemId} endpoint, removeItemFromCart service method |
| AC5: Empty cart message | Section 9.2, 3.9 | Empty cart state detection in getCartByUserId, CartResponse with message and link |

### 11.2 Gap Coverage Summary

| Gap ID | Category | Status | LLD Section |
|--------|----------|--------|-------------|
| ADD-001 | API Endpoint | ✅ Added | Section 4.1, 3.8 |
| ADD-002 | API Endpoint | ✅ Added | Section 4.1, 3.9 |
| ADD-003 | API Endpoint | ✅ Added | Section 4.1, 3.10 |
| ADD-004 | API Endpoint | ✅ Added | Section 4.1, 3.11 |
| ADD-005 | Business Logic | ✅ Added | Section 9.2, 3.9 |
| ADD-006 | Data Model | ✅ Added | Section 2.2, 2.4, 5.1 |
| MODIFY-001 | API Enhancement | ✅ Addressed | Section 9.3 |
| MODIFY-002 | Business Logic | ✅ Addressed | Section 9.1, 9.4 |

## 12. Implementation Notes

### 12.1 Transaction Management
- All cart operations (add, update, remove) should be wrapped in `@Transactional` annotations
- Ensure atomicity when updating multiple cart items
- Use optimistic locking for concurrent cart updates

### 12.2 Performance Considerations
- Index cart_id and product_id in cart_items table for fast lookups
- Consider caching cart totals for frequently accessed carts
- Implement pagination for carts with large number of items

### 12.3 Security Considerations
- Validate userId matches authenticated user before cart operations
- Implement rate limiting on cart API endpoints
- Sanitize all user inputs to prevent SQL injection
- Use HTTPS for all cart-related API calls

### 12.4 Future Enhancements
- Cart expiration policy (e.g., clear carts after 30 days of inactivity)
- Save for later functionality
- Cart sharing capabilities
- Promotional code application at cart level
- Inventory reservation during checkout process