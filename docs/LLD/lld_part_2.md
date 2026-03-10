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
        Repository-->>-ProductService: void
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

### 3.8 Add Item to Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items (userId, productId, quantity)
    CartController->>+CartService: addItemToCart(userId, productId, quantity)
    
    CartService->>+ProductService: getProductById(productId)
    ProductService-->>-CartService: Product
    
    CartService->>+ProductService: getMinimumProcurementThreshold(productId)
    ProductService-->>-CartService: threshold
    
    Note over CartService: Set quantity to max(quantity, threshold)
    
    CartService->>+ProductService: validateInventoryForCart(productId, quantity)
    ProductService-->>-CartService: validation result
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM cart WHERE user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Exists
        Note over CartService: Use existing cart
    else Cart Not Found
        Note over CartService: Create new cart
        CartService->>+CartRepository: save(newCart)
        CartRepository->>+Database: INSERT INTO cart (...) VALUES (...)
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
    end
    
    Note over CartService: Create CartItem with calculated quantity
    CartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT INTO cart_items (...) VALUES (...)
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-CartService: CartItem
    
    CartService->>CartService: calculateCartTotal(cartId)
    
    CartService->>+CartRepository: save(updatedCart)
    CartRepository->>+Database: UPDATE cart SET total_amount = ?, updated_at = ? WHERE id = ?
    Database-->>-CartRepository: Cart
    CartRepository-->>-CartService: Cart
    
    CartService-->>-CartController: Cart
    CartController-->>-Client: ResponseEntity<Cart> (201)
```

### 3.9 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartItemRepository
    participant CartRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} (quantity)
    CartController->>+CartService: updateCartItemQuantity(itemId, quantity)
    
    CartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt CartItem Found
        CartService->>+ProductService: validateInventoryForCart(productId, quantity)
        ProductService-->>-CartService: validation result
        
        Note over CartService: Update quantity and subtotal
        CartService->>+CartItemRepository: save(updatedCartItem)
        CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ? WHERE id = ?
        Database-->>-CartItemRepository: CartItem
        CartItemRepository-->>-CartService: CartItem
        
        CartService->>CartService: calculateCartTotal(cartId)
        
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE cart SET total_amount = ?, updated_at = ? WHERE id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: Cart
        CartController-->>Client: ResponseEntity<Cart> (200)
    else CartItem Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.10 Remove Cart Item

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
    CartItemRepository-->>-CartService: Optional<CartItem>
    
    alt CartItem Found
        Note over CartService: Get cartId before deletion
        CartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-CartService: void
        
        CartService->>CartService: calculateCartTotal(cartId)
        
        CartService->>+CartRepository: save(updatedCart)
        CartRepository->>+Database: UPDATE cart SET total_amount = ?, updated_at = ? WHERE id = ?
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
        
        CartService-->>CartController: void
        CartController-->>Client: ResponseEntity (204)
    else CartItem Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Get Cart

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+CartController: GET /api/cart?userId={userId}
    CartController->>+CartService: getCartByUserId(userId)
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM cart WHERE user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Found
        CartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-CartService: List<CartItem>
        
        Note over CartService: Populate cart with items
        CartService-->>CartController: Cart
        CartController-->>Client: ResponseEntity<Cart> (200)
    else Cart Not Found
        Note over CartService: Return empty cart response
        CartService-->>CartController: Empty Cart
        CartController-->>Client: ResponseEntity<Cart> (200)
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
| POST | `/api/cart/items` | Add item to cart | CartItemRequest | Cart |
| GET | `/api/cart?userId={userId}` | Get user's cart | None | Cart |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | QuantityUpdateRequest | Cart |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | None | None |

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
    is_subscription_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Cart Table

```sql
CREATE TABLE cart (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_user_id ON cart(user_id);
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
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 6. Business Logic

### 6.1 Minimum Procurement Threshold Logic

When adding a product to the cart, the system applies the following business rules:

1. **Threshold Application:**
   - If a product has a `minimum_procurement_threshold` defined, the system automatically sets the cart item quantity to this threshold value when the user adds the product
   - If the user manually specifies a quantity greater than the threshold, the user-specified quantity is used
   - If the user specifies a quantity less than the threshold, the system overrides it with the threshold value

2. **Subscription vs One-Time Purchase:**
   - Products marked as `is_subscription_eligible = true` can be added as subscription items
   - Subscription items may have different minimum procurement thresholds
   - The `is_subscription` flag in `cart_items` tracks whether the item is for subscription or one-time purchase

3. **Implementation:**
```java
public Integer determineCartQuantity(Product product, Integer requestedQuantity) {
    Integer threshold = product.getMinimumProcurementThreshold();
    if (threshold == null) {
        return requestedQuantity != null ? requestedQuantity : 1;
    }
    return requestedQuantity != null ? Math.max(requestedQuantity, threshold) : threshold;
}
```

## 7. Validation Rules

### 7.1 Inventory Validation

The system enforces strict inventory validation to prevent overselling:

1. **Add to Cart Validation:**
   - Before adding an item to cart, verify that `product.stock_quantity >= requested_quantity`
   - If insufficient stock, throw `InsufficientStockException` with message: "Insufficient stock. Available: {available}, Requested: {requested}"

2. **Update Quantity Validation:**
   - When updating cart item quantity, validate against current stock
   - Check if `product.stock_quantity >= new_quantity`
   - If validation fails, return error response with current available stock

3. **Real-time Stock Check:**
   - Always fetch latest stock quantity from database before validation
   - Use database-level locking for concurrent cart operations to prevent race conditions

4. **Implementation:**
```java
public void validateInventoryForCart(Long productId, Integer quantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    if (product.getStockQuantity() < quantity) {
        throw new InsufficientStockException(
            String.format("Insufficient stock. Available: %d, Requested: %d",
                product.getStockQuantity(), quantity)
        );
    }
}
```
