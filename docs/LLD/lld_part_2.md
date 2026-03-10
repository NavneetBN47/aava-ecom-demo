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
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/items (productId, quantity, isSubscription)
    ShoppingCartController->>+ShoppingCartService: addToCart(customerId, productId, quantity, isSubscription)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService-->>-ShoppingCartService: Product
    
    Note over ShoppingCartService: Determine quantity:<br/>If minimumProcurementThreshold exists, use it<br/>Otherwise default to 1<br/>Apply subscription logic if needed
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        Note over ShoppingCartService: Use existing cart
    else Cart Not Found
        Note over ShoppingCartService: Create new cart
        ShoppingCartService->>+ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>+Database: INSERT INTO shopping_carts
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    end
    
    Note over ShoppingCartService: Create CartItem with:<br/>- Calculated quantity<br/>- Product unit price<br/>- Calculated subtotal<br/>- isSubscription flag
    
    ShoppingCartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT INTO cart_items
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-ShoppingCartService: CartItem
    
    Note over ShoppingCartService: Calculate cart total
    
    ShoppingCartService-->>-ShoppingCartController: Updated ShoppingCart
    ShoppingCartController-->>-Client: ResponseEntity<ShoppingCart> (201)
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
    
    Client->>+ShoppingCartController: GET /api/cart
    ShoppingCartController->>+ShoppingCartService: getCart(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Found
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        alt Cart Has Items
            Note over ShoppingCartService: Calculate cart total
            ShoppingCartService-->>ShoppingCartController: ShoppingCart with items
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        else Cart Empty
            Note over ShoppingCartController: Return empty cart response<br/>with message 'Your cart is empty'<br/>and catalog redirect flag
            ShoppingCartController-->>Client: ResponseEntity with empty cart message (200)
        end
    else Cart Not Found
        Note over ShoppingCartController: Return empty cart response<br/>with message 'Your cart is empty'<br/>and catalog redirect flag
        ShoppingCartController-->>Client: ResponseEntity with empty cart message (200)
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
    
    Client->>+ShoppingCartController: PUT /api/cart/items/{cartItemId} (quantity)
    ShoppingCartController->>+ShoppingCartService: updateCartItemQuantity(cartItemId, quantity)
    
    ShoppingCartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt CartItem Found
        ShoppingCartService->>+ProductService: validateStockAvailability(productId, quantity)
        ProductService->>Database: SELECT stock_quantity FROM products WHERE id = ?
        Database-->>ProductService: stockQuantity
        
        alt Stock Available
            Note over ProductService: quantity <= stockQuantity
            ProductService-->>-ShoppingCartService: true
            
            Note over ShoppingCartService: Update quantity<br/>Recalculate subtotal = quantity * unitPrice
            
            ShoppingCartService->>+CartItemRepository: save(updatedCartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>-CartItemRepository: Updated CartItem
            CartItemRepository-->>-ShoppingCartService: Updated CartItem
            
            ShoppingCartService->>+ShoppingCartRepository: findById(cartId)
            ShoppingCartRepository->>Database: SELECT * FROM shopping_carts WHERE id = ?
            Database-->>ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            Note over ShoppingCartService: Recalculate cart total
            
            ShoppingCartService-->>ShoppingCartController: Updated ShoppingCart
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        else Stock Insufficient
            Note over ProductService: quantity > stockQuantity
            ProductService-->>ShoppingCartService: throw InventoryValidationException
            ShoppingCartService-->>ShoppingCartController: InventoryValidationException
            ShoppingCartController-->>Client: ResponseEntity with error message (400)
        end
    else CartItem Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
```

### 3.11 Remove Product from Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/items/{cartItemId}
    ShoppingCartController->>+ShoppingCartService: removeFromCart(cartItemId)
    
    ShoppingCartService->>+CartItemRepository: findById(cartItemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt CartItem Found
        Note over ShoppingCartService: Get cartId before deletion
        
        ShoppingCartService->>+CartItemRepository: deleteById(cartItemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
        
        ShoppingCartService->>+ShoppingCartRepository: findById(cartId)
        ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE id = ?
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
        
        Note over ShoppingCartService: Recalculate cart total<br/>with remaining items
        
        ShoppingCartService-->>ShoppingCartController: Updated ShoppingCart
        ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
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
| POST | `/api/cart/items` | Add product to cart | {productId, quantity, isSubscription} | ShoppingCart |
| GET | `/api/cart` | Get shopping cart | None | ShoppingCart |
| PUT | `/api/cart/items/{cartItemId}` | Update cart item quantity | {quantity} | ShoppingCart |
| DELETE | `/api/cart/items/{cartItemId}` | Remove product from cart | None | ShoppingCart |

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
    customer_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_carts_customer_id ON shopping_carts(customer_id);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    minimum_procurement_threshold INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 6. Business Logic

### 6.1 Automatic Quantity Setting (AC-1)

When adding a product to cart in `ShoppingCartService.addToCart()`:

1. Retrieve the product by productId
2. Check if product has `minimumProcurementThreshold`:
   - If threshold exists and is not null: Set quantity = minimumProcurementThreshold
   - If threshold is null: Set quantity = 1 (default)
3. Apply subscription-based logic:
   - If `isSubscription` is true: Apply any additional subscription quantity rules
   - If `isSubscription` is false: Use standard one-time purchase quantity
4. Calculate initial subtotal = quantity × product.price
5. Create and save CartItem with calculated values

### 6.2 Real-time Cart Calculation (AC-3)

When quantity changes in `ShoppingCartService.updateCartItemQuantity()`:

1. Validate inventory availability (see section 7.1)
2. Update CartItem quantity
3. Recalculate line item subtotal:
   ```
   subtotal = quantity × unitPrice
   ```
4. Save updated CartItem
5. Recalculate overall cart total:
   ```
   cartTotal = SUM(all cart_items.subtotal)
   ```
6. Return updated ShoppingCart with new totals immediately (no page refresh required)

The same calculation logic applies when removing items from cart.

## 7. Validation Rules

### 7.1 Inventory Validation (AC-6)

Implemented in `ShoppingCartService.updateCartItemQuantity()`:

1. Before updating quantity, call `ProductService.validateStockAvailability(productId, requestedQuantity)`
2. Retrieve product's current `stockQuantity` from database
3. Validation logic:
   ```java
   if (requestedQuantity > product.getStockQuantity()) {
       throw new InventoryValidationException(
           "Requested quantity (" + requestedQuantity + 
           ") exceeds available stock (" + product.getStockQuantity() + ")"
       );
   }
   ```
4. If validation passes, proceed with quantity update
5. If validation fails, throw exception and return HTTP 400 error to client

### 7.2 Cart Item Quantity Constraints

- Quantity must be greater than 0
- Database constraint: `CHECK (quantity > 0)`
- Application-level validation in service layer before save operations
