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
    participant ProductRepository
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (productId, userId)
    CartController->>+CartService: addToCart(productId, userId)
    
    CartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Optional<Product>
    ProductRepository-->>-CartService: Product
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>-CartRepository: Optional<ShoppingCart>
    CartRepository-->>-CartService: ShoppingCart or create new
    
    Note over CartService: Set quantity = 1 (default)
    Note over CartService: Calculate subtotal = price * 1
    
    CartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
    Database-->>-CartItemRepository: CartItem (with generated ID)
    CartItemRepository-->>-CartService: CartItem
    
    CartService-->>-CartController: CartItem
    CartController-->>-Client: ResponseEntity<CartItem> (201)
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
    CartController->>+CartService: viewCart(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM shopping_carts WHERE user_id = ?
    Database-->>-CartRepository: Optional<ShoppingCart>
    CartRepository-->>-CartService: ShoppingCart
    
    alt Cart Exists and Not Empty
        CartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-CartService: List<CartItem>
        
        loop For each CartItem
            CartService->>+ProductRepository: findById(productId)
            ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
            Database-->>-ProductRepository: Product
            ProductRepository-->>-CartService: Product (name, price)
        end
        
        Note over CartService: Calculate total from all subtotals
        CartService-->>CartController: ShoppingCart with items and total
        CartController-->>Client: ResponseEntity<ShoppingCart> (200)
    else Cart Empty
        CartService-->>CartController: Empty cart message
        CartController-->>Client: ResponseEntity with "Your cart is empty" (200)
    end
```

### 3.10 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} (quantity)
    CartController->>+CartService: updateCartItemQuantity(itemId, quantity)
    
    Note over CartService: Validate quantity > 0
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: CartItem
    
    alt Item Exists
        Note over CartService: Update quantity
        Note over CartService: Recalculate subtotal = price * quantity
        
        CartService->>+CartItemRepository: save(updatedCartItem)
        CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE id = ?
        Database-->>-CartItemRepository: Updated CartItem
        CartItemRepository-->>-CartService: Updated CartItem
        
        Note over CartService: Recalculate cart total
        
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE shopping_carts SET updated_at = ? WHERE id = ?
        Database-->>-CartRepository: Success
        CartRepository-->>-CartService: void
        
        CartService-->>CartController: Updated CartItem
        CartController-->>Client: ResponseEntity<CartItem> (200)
    else Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId}
    CartController->>+CartService: removeCartItem(itemId)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: CartItem
    
    alt Item Exists
        CartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        Note over CartService: Recalculate cart total
        
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE shopping_carts SET updated_at = ? WHERE id = ?
        Database-->>-CartRepository: Success
        CartRepository-->>-CartService: void
        
        CartService-->>CartController: void
        CartController-->>Client: ResponseEntity (204)
    else Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### Shopping Cart Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart with quantity 1 | {"productId": Long, "userId": Long} | CartItem |
| GET | `/api/cart` | View cart with all items, names, prices, quantities, subtotals | Query param: userId | ShoppingCart |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity with automatic recalculation | {"quantity": Integer} | CartItem |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart and update totals | None | None |

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
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
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
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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

## 9. Business Logic Rules

### Product Management
- Product prices must be positive decimal values
- Stock quantity cannot be negative
- Product names are required and must be unique within a category
- Category is mandatory for all products

### Shopping Cart Management

#### Add to Cart
- When adding a product to cart, default quantity is set to 1
- Product must exist in the products table before adding to cart
- If cart doesn't exist for user, create new cart automatically
- Cart item price is captured from product price at time of addition

#### View Cart
- Display all cart items with product name, price, quantity, and subtotal
- Calculate and display cart total (sum of all subtotals)
- If cart is empty, return message: "Your cart is empty" with link to continue shopping
- Include product details by joining with products table

#### Update Quantity
- Quantity must be a positive integer (> 0)
- Automatically recalculate subtotal when quantity changes: subtotal = price × quantity
- Automatically recalculate cart total after quantity update
- Update cart's updated_at timestamp
- Validate that cart item exists before updating

#### Remove Item
- Validate that cart item exists before deletion
- Automatically recalculate cart total after item removal
- Update cart's updated_at timestamp
- If last item is removed, cart remains but becomes empty

#### Calculation Rules
- Subtotal = Item Price × Quantity
- Cart Total = Sum of all item subtotals in the cart
- All monetary calculations use DECIMAL(10,2) precision
- Recalculation is triggered automatically on any quantity change or item removal

## 10. Validation Rules

### Product Validation
- Name: Required, max length 255 characters
- Price: Required, must be positive, max 2 decimal places
- Category: Required, max length 100 characters
- Stock Quantity: Required, must be non-negative integer

### Cart Validation
- User ID: Required for all cart operations
- Product ID: Must reference existing product
- Quantity: Must be positive integer (≥ 1)
- When adding product to cart, default quantity must be set to 1
- Quantity updates must trigger automatic recalculation of subtotal and total
- Cart item must exist before update or delete operations
