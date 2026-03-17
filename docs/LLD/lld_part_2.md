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
    
    Client->>+CartController: POST /api/cart/items (customerId, productId, isSubscription)
    CartController->>+CartService: addToCart(customerId, productId, quantity, isSubscription)
    
    CartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Product
    ProductRepository-->>-CartService: Product
    
    Note over CartService: Apply Minimum Procurement Threshold logic
    Note over CartService: Set quantity based on subscription type
    
    CartService->>+CartService: validateInventory(productId, quantity)
    
    alt Inventory Available
        CartService->>+CartRepository: findByCustomerId(customerId)
        CartRepository->>+Database: SELECT * FROM carts WHERE customer_id = ?
        Database-->>-CartRepository: Optional<Cart>
        CartRepository-->>-CartService: Optional<Cart>
        
        alt Cart Exists
            Note over CartService: Use existing cart
        else Cart Not Found
            Note over CartService: Create new cart
            CartService->>+CartRepository: save(newCart)
            CartRepository->>+Database: INSERT INTO carts (...) VALUES (...)
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
        end
        
        CartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-CartService: Optional<CartItem>
        
        alt Item Exists
            Note over CartService: Update quantity
        else Item Not Found
            Note over CartService: Create new cart item
        end
        
        Note over CartService: Calculate subtotal = quantity * unitPrice
        
        CartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>+Database: INSERT/UPDATE cart_items
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-CartService: CartItem
        
        CartService->>+CartService: calculateTotals(cart)
        
        CartService->>+CartRepository: save(cart)
        CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: Cart
        CartController-->>Client: ResponseEntity<Cart> (201)
    else Insufficient Inventory
        CartService-->>CartController: throw InsufficientInventoryException
        CartController-->>Client: ResponseEntity (400) "Insufficient inventory"
    end
```

### 3.9 Get Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: GET /api/cart?customerId={customerId}
    CartController->>+CartService: getCart(customerId)
    
    CartService->>+CartRepository: findByCustomerId(customerId)
    CartRepository->>+Database: SELECT c.*, ci.*, p.* FROM carts c LEFT JOIN cart_items ci ON c.id = ci.cart_id LEFT JOIN products p ON ci.product_id = p.id WHERE c.customer_id = ?
    Database-->>-CartRepository: Optional<Cart with items and products>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Found
        alt Cart Has Items
            CartService-->>CartController: Cart with items
            CartController-->>Client: ResponseEntity<Cart> (200)
        else Cart Empty
            Note over CartService: Return empty cart with message
            CartService-->>CartController: Empty Cart
            CartController-->>Client: ResponseEntity<Cart> (200) "Your cart is empty"
        end
    else Cart Not Found
        Note over CartService: Create new empty cart
        CartService-->>CartController: New Empty Cart
        CartController-->>Client: ResponseEntity<Cart> (200) "Your cart is empty"
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant ProductRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} (quantity)
    CartController->>+CartService: updateQuantity(itemId, quantity)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Found
        CartService->>+ProductRepository: findById(productId)
        ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
        Database-->>-ProductRepository: Product
        ProductRepository-->>-CartService: Product
        
        CartService->>+CartService: validateInventory(productId, quantity)
        
        alt Inventory Available
            Note over CartService: Update quantity
            Note over CartService: Recalculate subtotal = quantity * unitPrice
            
            CartService->>+CartItemRepository: save(cartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-CartService: CartItem
            
            CartService->>+CartRepository: findById(cartId)
            CartRepository->>+Database: SELECT * FROM carts WHERE id = ?
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
            
            CartService->>+CartService: calculateTotals(cart)
            
            CartService->>+CartRepository: save(cart)
            CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ?
            Database-->>-CartRepository: Cart
            CartRepository-->>-CartService: Cart
            
            CartService-->>CartController: Cart
            CartController-->>Client: ResponseEntity<Cart> (200)
        else Insufficient Inventory
            CartService-->>CartController: throw InsufficientInventoryException
            CartController-->>Client: ResponseEntity (400) "Requested quantity exceeds available stock"
        end
    else Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Product from Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId}
    CartController->>+CartService: removeFromCart(itemId)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt Item Found
        Note over CartService: Get cartId before deletion
        
        CartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        CartService->>+CartRepository: findById(cartId)
        CartRepository->>+Database: SELECT * FROM carts WHERE id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService->>+CartService: calculateTotals(cart)
        
        CartService->>+CartRepository: save(cart)
        CartRepository->>+Database: UPDATE carts SET total_amount = ?, updated_at = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: Cart
        CartController-->>Client: ResponseEntity<Cart> (200)
    else Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
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
| GET | `/api/cart` | Get shopping cart by customer ID | Query: customerId | Cart |
| POST | `/api/cart/items` | Add product to cart | CartItemRequest (customerId, productId, isSubscription) | Cart |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | UpdateQuantityRequest (quantity) | Cart |
| DELETE | `/api/cart/items/{itemId}` | Remove product from cart | None | Cart |

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

### Carts Table

```sql
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_customer_cart (customer_id)
);

CREATE INDEX idx_carts_customer ON carts(customer_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_product (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
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
