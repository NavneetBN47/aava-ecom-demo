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
        ProductService-->>ProductController: Product (with inventory, thresholds, cart metadata)
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
    participant InventoryValidationService
    participant ProductService
    participant CartItemService
    participant CartRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (productId, quantity)
    CartController->>+CartService: addItemToCart(cartId, productId, quantity)
    
    CartService->>+ProductService: getProductById(productId)
    ProductService-->>-CartService: Product
    
    Note over CartService: Determine default quantity<br/>(1 or Minimum Procurement Threshold)
    Note over CartService: Check subscription vs one-time buy logic
    
    CartService->>+InventoryValidationService: validateInventoryAvailability(productId, quantity)
    InventoryValidationService->>+ProductService: checkStockLevel(productId)
    ProductService-->>-InventoryValidationService: stockQuantity
    
    alt Stock Sufficient
        InventoryValidationService-->>-CartService: Validation Success
        CartService->>+CartItemService: createCartItem(cartId, productId, quantity)
        CartItemService->>Database: INSERT INTO cart_items
        Database-->>CartItemService: CartItem
        CartItemService-->>-CartService: CartItem
        
        Note over CartService: Calculate cart total
        CartService->>+CartRepository: save(cart)
        CartRepository-->>-CartService: Updated Cart
        CartService-->>CartController: Cart with items
        CartController-->>Client: ResponseEntity<Cart> (201)
    else Insufficient Stock
        InventoryValidationService-->>CartService: throw InsufficientStockException
        CartService-->>CartController: InsufficientStockException
        CartController-->>Client: ResponseEntity (400) with error message
    end
```

### 3.9 Get Cart with All Items

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant ProductService
    participant Database
    
    Client->>+CartController: GET /api/cart/{cartId}
    CartController->>+CartService: getCartById(cartId)
    CartService->>+CartRepository: findById(cartId)
    CartRepository->>+Database: SELECT * FROM carts WHERE cart_id = ?
    Database-->>-CartRepository: Cart
    CartRepository-->>-CartService: Cart
    
    CartService->>+CartItemRepository: findByCartId(cartId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
    Database-->>-CartItemRepository: List<CartItem>
    CartItemRepository-->>-CartService: List<CartItem>
    
    loop For each cart item
        CartService->>+ProductService: getProductById(productId)
        ProductService-->>-CartService: Product (name, price)
    end
    
    Note over CartService: Calculate subtotals and cart total
    CartService-->>CartController: Cart with complete details
    CartController-->>Client: ResponseEntity<Cart> (200)
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemService
    participant InventoryValidationService
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId}/quantity (newQuantity)
    CartController->>+CartService: updateItemQuantity(itemId, newQuantity)
    
    CartService->>+CartItemService: validateQuantity(newQuantity)
    CartItemService-->>-CartService: Validation Success
    
    CartService->>+InventoryValidationService: validateInventoryAvailability(productId, newQuantity)
    
    alt Stock Available
        InventoryValidationService-->>-CartService: Validation Success
        CartService->>+CartItemService: updateQuantity(itemId, newQuantity)
        CartItemService->>+CartItemRepository: findById(itemId)
        CartItemRepository-->>-CartItemService: CartItem
        
        Note over CartItemService: Update quantity<br/>Calculate new subtotal
        CartItemService->>+CartItemRepository: save(updatedCartItem)
        CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE cart_item_id = ?
        Database-->>-CartItemRepository: Updated CartItem
        CartItemRepository-->>-CartItemService: CartItem
        CartItemService-->>-CartService: CartItem
        
        Note over CartService: Recalculate cart total in real-time
        CartService-->>CartController: Updated Cart with new totals
        CartController-->>Client: ResponseEntity<Cart> (200)
    else Insufficient Stock
        InventoryValidationService-->>CartService: throw InsufficientStockException
        CartService-->>CartController: InsufficientStockException
        CartController-->>Client: ResponseEntity (400) with inventory error
    end
```

### 3.11 Remove Product from Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemService
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId}
    CartController->>+CartService: removeItem(itemId)
    CartService->>+CartItemService: deleteCartItem(itemId)
    CartItemService->>+CartItemRepository: deleteById(itemId)
    CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Success
    CartItemRepository-->>-CartItemService: void
    CartItemService-->>-CartService: void
    
    Note over CartService: Recalculate cart total after removal
    CartService-->>CartController: void
    CartController-->>Client: ResponseEntity (204)
```

### 3.12 Handle Empty Cart State

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: GET /api/cart/{cartId}/empty-state
    CartController->>+CartService: isCartEmpty(cartId)
    CartService->>+CartRepository: findById(cartId)
    CartRepository->>+Database: SELECT * FROM carts WHERE cart_id = ?
    Database-->>-CartRepository: Cart
    CartRepository-->>-CartService: Cart
    
    alt Cart is Empty
        Note over CartService: Check if cart has no items
        CartService-->>CartController: true
        CartController-->>Client: ResponseEntity with "Your cart is empty" message and return to catalog button (200)
    else Cart has Items
        CartService-->>CartController: false
        CartController-->>Client: ResponseEntity with cart items (200)
    end
```

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID with inventory and cart metadata | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart with default quantity logic (1 or Minimum Procurement Threshold) | CartItemRequest (productId, quantity, subscriptionType) | Cart |
| GET | `/api/cart/{cartId}` | Retrieve cart with all items, product names, prices, quantities, subtotals, and cart total | None | Cart with complete details |
| PUT | `/api/cart/items/{itemId}/quantity` | Update item quantity with real-time subtotal and cart total calculation, includes inventory validation | QuantityUpdateRequest (quantity) | Cart with updated totals |
| DELETE | `/api/cart/items/{itemId}` | Remove product from cart and recalculate totals | None | None |
| GET | `/api/cart/{cartId}/empty-state` | Handle empty cart state with appropriate messaging | None | EmptyCartResponse |

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
    minimum_procurement_threshold INTEGER,
    subscription_eligible BOOLEAN DEFAULT FALSE,
    inventory_tracking_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Carts Table

```sql
CREATE TABLE carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT chk_cart_identifier CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_carts_status ON carts(status);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
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
2. **Repository Pattern:** Data access abstraction through ProductRepository, CartRepository, CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors
6. **Service Layer Pattern:** Business logic encapsulation in service classes
7. **Strategy Pattern:** Different quantity calculation strategies for subscription vs one-time purchases

## 8. Key Features

### Product Management Features
- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- Real-time inventory checking and validation
- Cart-integration support with procurement thresholds

### Cart Management Features
- Add products to cart with intelligent default quantity logic
- Support for Minimum Procurement Threshold
- Subscription vs one-time purchase handling
- Real-time price calculations for subtotals and cart totals
- Instant updates on quantity changes
- Inventory validation before adding/updating items
- Remove products with automatic total recalculation
- Empty cart state handling with user-friendly messaging
- Session-based and user-based cart support
- Cart persistence across sessions
