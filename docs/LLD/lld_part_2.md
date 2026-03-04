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
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/items (customerId, productId)
    ShoppingCartController->>+ShoppingCartService: addItemToCart(customerId, productId, quantity=1)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found
        Note over ShoppingCartService: Create new cart for customer
        ShoppingCartService->>+ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>+Database: INSERT INTO shopping_carts (...) VALUES (...)
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    end
    
    ShoppingCartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-ShoppingCartService: Optional<Product>
    
    alt Product Found
        Note over ShoppingCartService: Create CartItem with quantity=1
        Note over ShoppingCartService: Calculate subtotal = price * quantity
        ShoppingCartService->>+CartItemRepository: save(cartItem)
        CartItemRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-ShoppingCartService: CartItem
        ShoppingCartService-->>ShoppingCartController: CartItem
        ShoppingCartController-->>Client: ResponseEntity<CartItem> (201)
    else Product Not Found
        ShoppingCartService-->>ShoppingCartController: throw ProductNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

### 3.9 View Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart?customerId={customerId}
    ShoppingCartController->>+ShoppingCartService: getCartByCustomerId(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Found
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        loop For each CartItem
            ShoppingCartService->>+ProductRepository: findById(productId)
            ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
            Database-->>-ProductRepository: Product
            ProductRepository-->>-ShoppingCartService: Product
            Note over ShoppingCartService: Enrich CartItem with product details
        end
        
        Note over ShoppingCartService: Calculate total = sum of all subtotals
        ShoppingCartService-->>ShoppingCartController: CartResponse (items, total)
        ShoppingCartController-->>Client: ResponseEntity<CartResponse> (200)
    else Cart Empty or Not Found
        ShoppingCartService-->>ShoppingCartController: Empty cart response
        ShoppingCartController-->>Client: ResponseEntity with "Your cart is empty" message (200)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/items/{itemId} (quantity)
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(itemId, quantity)
    
    Note over ShoppingCartService: Validate quantity > 0
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt CartItem Found
        Note over ShoppingCartService: Update quantity
        Note over ShoppingCartService: Recalculate subtotal = price * new quantity
        ShoppingCartService->>+CartItemRepository: save(updatedCartItem)
        CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE id = ?
        Database-->>-CartItemRepository: Updated CartItem
        CartItemRepository-->>-ShoppingCartService: Updated CartItem
        
        Note over ShoppingCartService: Recalculate cart total
        ShoppingCartService-->>ShoppingCartController: Updated CartItem with new total
        ShoppingCartController-->>Client: ResponseEntity<CartItem> (200)
    else CartItem Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/items/{itemId}
    ShoppingCartController->>+ShoppingCartService: removeCartItem(itemId)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt CartItem Found
        ShoppingCartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
        
        Note over ShoppingCartService: Recalculate cart total
        ShoppingCartService-->>ShoppingCartController: void with updated total
        ShoppingCartController-->>Client: ResponseEntity (204)
    else CartItem Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
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
| POST | `/api/cart/items` | Add product to cart with default quantity 1 | {customerId, productId} | CartItem |
| GET | `/api/cart?customerId={customerId}` | View all items in customer's cart with totals | None | CartResponse |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity with automatic recalculation | {quantity} | CartItem |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart with total recalculation | None | None |

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

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    UNIQUE KEY uk_customer_active_cart (customer_id, status)
);

CREATE INDEX idx_shopping_carts_customer ON shopping_carts(customer_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
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

## 9. Business Logic

### 9.1 Shopping Cart Management

#### Automatic Calculation Logic
- **Subtotal Calculation:** For each cart item, subtotal = price × quantity
- **Cart Total Calculation:** Cart total = sum of all cart item subtotals
- **Automatic Recalculation:** Whenever quantity is updated or item is removed, subtotal and total are automatically recalculated

#### Empty Cart Handling
- When a customer's cart has no items, the system displays: "Your cart is empty"
- A link to continue shopping is provided to redirect users back to the product catalog
- Empty cart state is handled gracefully without errors

## 10. Validation Rules

### Shopping Cart Validation
- **Quantity Validation:** Quantity must be a positive integer (> 0)
- **Product Existence:** Product must exist in the products table before adding to cart
- **Cart Item Ownership:** Cart item must belong to the requesting customer
- **Duplicate Prevention:** Same product cannot be added twice to the same cart (quantity is updated instead)
- **Stock Validation:** Requested quantity should not exceed available stock (optional enhancement)

## 11. Error Handling

### Product Management Errors
- **ProductNotFoundException:** Thrown when product ID does not exist (HTTP 404)
- **InvalidProductDataException:** Thrown when product data validation fails (HTTP 400)

### Shopping Cart Errors
- **CartNotFoundException:** Thrown when cart ID does not exist (HTTP 404)
- **CartItemNotFoundException:** Thrown when cart item ID does not exist (HTTP 404)
- **InvalidQuantityException:** Thrown when quantity is zero or negative (HTTP 400)
- **ProductNotAvailableException:** Thrown when product is out of stock (HTTP 400)
- **UnauthorizedCartAccessException:** Thrown when user tries to access another customer's cart (HTTP 403)