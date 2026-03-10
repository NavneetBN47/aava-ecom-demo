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

### 3.8 Add Item to Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/items (customerId, productId, quantity, purchaseType)
    ShoppingCartController->>+ShoppingCartService: addItemToCart(customerId, productId, quantity, purchaseType)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService-->>-ShoppingCartService: Product
    
    Note over ShoppingCartService: Check minimum procurement threshold
    alt Has Minimum Threshold
        Note over ShoppingCartService: Set quantity to threshold if below
    end
    
    ShoppingCartService->>+ProductService: validateInventoryAvailability(productId, quantity)
    ProductService-->>-ShoppingCartService: boolean
    
    alt Insufficient Inventory
        ShoppingCartService-->>ShoppingCartController: throw InsufficientInventoryException
        ShoppingCartController-->>Client: ResponseEntity (400) "Inventory validation error"
    else Inventory Available
        ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
        ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
        Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
        ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
        
        alt Cart Not Exists
            Note over ShoppingCartService: Create new cart
            ShoppingCartService->>+ShoppingCartRepository: save(newCart)
            ShoppingCartRepository->>+Database: INSERT INTO shopping_carts
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        end
        
        Note over ShoppingCartService: Calculate subtotal = unitPrice * quantity
        Note over ShoppingCartService: Create CartItem with product details
        
        ShoppingCartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>+Database: INSERT INTO cart_items
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-ShoppingCartService: CartItem
        
        Note over ShoppingCartService: Update cart total amount
        ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
        ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        
        ShoppingCartService-->>-ShoppingCartController: CartItem
        ShoppingCartController-->>-Client: ResponseEntity<CartItem> (201)
    end
```

### 3.9 Get Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart?customerId={customerId}
    ShoppingCartController->>+ShoppingCartService: getCartByCustomerId(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        Note over ShoppingCartService: Populate cart with items
        ShoppingCartService-->>ShoppingCartController: ShoppingCart with items
        ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
    else Cart Empty or Not Exists
        ShoppingCartService-->>ShoppingCartController: Empty cart or null
        ShoppingCartController-->>Client: ResponseEntity with "Your cart is empty" message (200)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/items/{itemId} (customerId, newQuantity)
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(customerId, itemId, newQuantity)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    else Item Found
        ShoppingCartService->>+ProductService: validateInventoryAvailability(productId, newQuantity)
        ProductService-->>-ShoppingCartService: boolean
        
        alt Insufficient Inventory
            ShoppingCartService-->>ShoppingCartController: throw InsufficientInventoryException
            ShoppingCartController-->>Client: ResponseEntity (400) "Quantity exceeds available stock"
        else Inventory Available
            Note over ShoppingCartService: Update quantity and recalculate subtotal
            ShoppingCartService->>+CartItemRepository: save(updatedItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            Note over ShoppingCartService: Recalculate cart total
            ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: CartItem
            ShoppingCartController-->>Client: ResponseEntity<CartItem> (200)
        end
    end
```

### 3.11 Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/items/{itemId}?customerId={customerId}
    ShoppingCartController->>+ShoppingCartService: removeCartItem(customerId, itemId)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Found
        ShoppingCartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
        
        Note over ShoppingCartService: Recalculate cart total
        ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
        ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        
        ShoppingCartService-->>ShoppingCartController: void
        ShoppingCartController-->>Client: ResponseEntity (204)
    else Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

## 4. API Endpoints Summary

### Product Management APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### Shopping Cart APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add item to cart | CartItemRequest (customerId, productId, quantity, purchaseType) | CartItem |
| GET | `/api/cart?customerId={customerId}` | Get shopping cart by customer | None | ShoppingCart |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | CartItemRequest (customerId, quantity) | CartItem |
| DELETE | `/api/cart/items/{itemId}?customerId={customerId}` | Remove item from cart | None | None |
| DELETE | `/api/cart?customerId={customerId}` | Clear entire cart | None | None |

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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_carts_customer ON shopping_carts(customer_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    purchase_type VARCHAR(50) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
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
