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

**Requirement Reference:** Epic: Shopping cart management, Story: Add products to cart, AC-1

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant InventoryService
    participant CartRepository
    participant ProductRepository
    participant Database
    
    Client->>+CartController: POST /api/cart/items {productId, quantity}
    CartController->>+CartService: addItemToCart(userId, productId, quantity)
    
    Note over CartService: Validate request parameters
    
    CartService->>+ProductRepository: findById(productId)
    ProductRepository->>+Database: SELECT * FROM products WHERE id = ?
    Database-->>-ProductRepository: Product
    ProductRepository-->>-CartService: Product
    
    alt Product Not Found
        CartService-->>CartController: throw ProductNotFoundException
        CartController-->>Client: ResponseEntity (404) "Product not found"
    end
    
    CartService->>+InventoryService: checkInventoryAvailability(productId, quantity)
    InventoryService-->>-CartService: boolean (available/unavailable)
    
    alt Insufficient Inventory
        CartService-->>CartController: throw InsufficientInventoryException
        CartController-->>Client: ResponseEntity (400) "Insufficient inventory"
    end
    
    Note over CartService: Validate minimum quantity threshold
    
    alt Below Minimum Threshold
        CartService-->>CartController: throw MinimumQuantityException
        CartController-->>Client: ResponseEntity (400) "Below minimum quantity"
    end
    
    CartService->>+CartRepository: findByUserId(userId)
    CartRepository->>+Database: SELECT * FROM carts WHERE user_id = ?
    Database-->>-CartRepository: Optional<Cart>
    CartRepository-->>-CartService: Optional<Cart>
    
    alt Cart Not Exists
        Note over CartService: Create new cart
        CartService->>+CartRepository: save(newCart)
        CartRepository->>+Database: INSERT INTO carts
        Database-->>-CartRepository: Cart
        CartRepository-->>-CartService: Cart
    end
    
    Note over CartService: Create CartItem with price snapshot
    Note over CartService: Add item to cart
    Note over CartService: Calculate cart totals
    
    CartService->>+CartRepository: save(updatedCart)
    CartRepository->>+Database: INSERT INTO cart_items / UPDATE carts
    Database-->>-CartRepository: Updated Cart
    CartRepository-->>-CartService: Updated Cart
    
    CartService-->>-CartController: CartItem
    CartController-->>-Client: ResponseEntity<CartItem> (201)
```

### 3.9 Update Cart Item Quantity

**Requirement Reference:** Story: Manage quantities, AC-3

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant InventoryService
    participant CartRepository
    participant Database
    
    Client->>+CartController: PUT /api/cart/items/{itemId} {quantity}
    CartController->>+CartService: updateItemQuantity(userId, itemId, quantity)
    
    CartService->>+CartRepository: findCartItemById(itemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE item_id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404) "Cart item not found"
    end
    
    Note over CartService: Validate quantity against min/max thresholds
    
    alt Invalid Quantity
        CartService-->>CartController: throw InvalidQuantityException
        CartController-->>Client: ResponseEntity (400) "Invalid quantity"
    end
    
    CartService->>+InventoryService: checkInventoryAvailability(productId, quantity)
    InventoryService-->>-CartService: boolean
    
    alt Insufficient Inventory
        CartService-->>CartController: throw InsufficientInventoryException
        CartController-->>Client: ResponseEntity (400) "Insufficient inventory"
    end
    
    Note over CartService: Update item quantity
    Note over CartService: Recalculate cart totals
    
    CartService->>+CartRepository: save(updatedCartItem)
    CartRepository->>+Database: UPDATE cart_items SET quantity = ?
    Database-->>-CartRepository: Updated CartItem
    CartRepository-->>-CartService: Updated CartItem
    
    CartService-->>-CartController: CartItem
    CartController-->>-Client: ResponseEntity<CartItem> (200)
```

### 3.10 Remove Item from Cart

**Requirement Reference:** Story: Cart operations, AC-4

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant CartRepository
    participant Database
    
    Client->>+CartController: DELETE /api/cart/items/{itemId}
    CartController->>+CartService: removeItemFromCart(userId, itemId)
    
    CartService->>+CartRepository: findCartItemById(itemId)
    CartRepository->>+Database: SELECT * FROM cart_items WHERE item_id = ?
    Database-->>-CartRepository: Optional<CartItem>
    CartRepository-->>-CartService: Optional<CartItem>
    
    alt Item Not Found
        CartService-->>CartController: throw CartItemNotFoundException
        CartController-->>Client: ResponseEntity (404) "Cart item not found"
    end
    
    Note over CartService: Verify item belongs to user's cart
    
    alt Unauthorized Access
        CartService-->>CartController: throw UnauthorizedAccessException
        CartController-->>Client: ResponseEntity (403) "Unauthorized"
    end
    
    CartService->>+CartRepository: deleteById(itemId)
    CartRepository->>+Database: DELETE FROM cart_items WHERE item_id = ?
    Database-->>-CartRepository: Success
    CartRepository-->>-CartService: void
    
    Note over CartService: Recalculate cart totals
    Note over CartService: Check if cart is empty
    
    alt Cart Empty
        Note over CartService: Update cart status to EMPTY
    end
    
    CartService->>+CartRepository: save(updatedCart)
    CartRepository->>+Database: UPDATE carts
    Database-->>-CartRepository: Updated Cart
    CartRepository-->>-CartService: Updated Cart
    
    CartService-->>-CartController: void
    CartController-->>-Client: ResponseEntity (204) No Content
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

**Requirement Reference:** Epic: Shopping cart management, Story: Add products to cart, AC-1; Story: Manage quantities, AC-3; Story: Cart operations, AC-4

| Method | Endpoint | Description | Request Body | Response | Status Codes |
|--------|----------|-------------|--------------|----------|--------------||
| POST | `/api/cart/items` | Add product to cart | `{"productId": Long, "quantity": Integer}` | CartItem | 201 Created, 400 Bad Request, 404 Not Found |
| PUT | `/api/cart/items/{itemId}` | Update item quantity | `{"quantity": Integer}` | CartItem | 200 OK, 400 Bad Request, 404 Not Found |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | None | None | 204 No Content, 404 Not Found, 403 Forbidden |
| GET | `/api/cart` | Get user's cart | None | ShoppingCart | 200 OK, 404 Not Found |
| DELETE | `/api/cart` | Clear entire cart | None | None | 204 No Content |

#### 4.1.1 POST /api/cart/items - Add Product to Cart

**Request Schema:**
```json
{
  "productId": 123,
  "quantity": 5
}
```

**Validation Rules:**
- `productId`: Required, must be valid existing product ID
- `quantity`: Required, must be positive integer, must meet minimum threshold, must not exceed maximum limit, must not exceed available inventory

**Response Schema (201 Created):**
```json
{
  "itemId": 456,
  "cartId": 789,
  "productId": 123,
  "productName": "Product Name",
  "quantity": 5,
  "priceSnapshot": 29.99,
  "minQuantity": 1,
  "maxQuantity": 100,
  "addedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity, below minimum threshold, exceeds maximum limit, insufficient inventory
- `404 Not Found`: Product not found

#### 4.1.2 PUT /api/cart/items/{itemId} - Update Item Quantity

**Request Schema:**
```json
{
  "quantity": 10
}
```

**Validation Rules:**
- `quantity`: Required, must be positive integer, must meet minimum threshold, must not exceed maximum limit, must not exceed available inventory

**Response Schema (200 OK):**
```json
{
  "itemId": 456,
  "cartId": 789,
  "productId": 123,
  "productName": "Product Name",
  "quantity": 10,
  "priceSnapshot": 29.99,
  "minQuantity": 1,
  "maxQuantity": 100,
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity, below minimum threshold, exceeds maximum limit, insufficient inventory
- `404 Not Found`: Cart item not found

#### 4.1.3 DELETE /api/cart/items/{itemId} - Remove Item from Cart

**Response:** 204 No Content

**Error Responses:**
- `404 Not Found`: Cart item not found
- `403 Forbidden`: Unauthorized access to cart item

**Reason for Addition:** Missing API contracts for cart operations as specified in acceptance criteria
