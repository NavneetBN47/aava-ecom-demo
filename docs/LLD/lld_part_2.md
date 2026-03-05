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
    
    Client->>+ShoppingCartController: POST /api/cart/{customerId}/items (productId, quantity=1)
    ShoppingCartController->>+ShoppingCartService: addItemToCart(customerId, productId, quantity)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService-->>-ShoppingCartService: Product
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        Note over ShoppingCartService: Use existing cart
    else Cart Not Found
        Note over ShoppingCartService: Create new cart for customer
    end
    
    ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Already in Cart
        Note over ShoppingCartService: Increment quantity
    else New Item
        Note over ShoppingCartService: Create new CartItem with quantity=1
        Note over ShoppingCartService: Set productName, productPrice from Product
    end
    
    Note over ShoppingCartService: Calculate item subtotal
    ShoppingCartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT/UPDATE cart_items
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-ShoppingCartService: CartItem
    
    Note over ShoppingCartService: Recalculate cart total
    ShoppingCartService->>+ShoppingCartRepository: save(cart)
    ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?, updated_at = ?
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: ShoppingCart
    ShoppingCartController-->>-Client: ResponseEntity<ShoppingCart> (200)
```

### 3.9 Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/{customerId}/items/{itemId} (quantity)
    ShoppingCartController->>+ShoppingCartService: updateItemQuantity(customerId, itemId, quantity)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    else Cart Found
        ShoppingCartService->>+CartItemRepository: findById(itemId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
        
        alt Item Not Found
            ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
            ShoppingCartController-->>Client: ResponseEntity (404)
        else Item Found
            Note over ShoppingCartService: Validate quantity > 0
            Note over ShoppingCartService: Update item quantity
            Note over ShoppingCartService: Recalculate item subtotal
            
            ShoppingCartService->>+CartItemRepository: save(cartItem)
            CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
            Database-->>-CartItemRepository: CartItem
            CartItemRepository-->>-ShoppingCartService: CartItem
            
            Note over ShoppingCartService: Recalculate cart total
            ShoppingCartService->>+ShoppingCartRepository: save(cart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?, updated_at = ?
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        end
    end
```

### 3.10 Remove Item from Shopping Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/{customerId}/items/{itemId}
    ShoppingCartController->>+ShoppingCartService: removeItem(customerId, itemId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    else Cart Found
        ShoppingCartService->>+CartItemRepository: findById(itemId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE id = ?
        Database-->>-CartItemRepository: Optional<CartItem>
        CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
        
        alt Item Not Found
            ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
            ShoppingCartController-->>Client: ResponseEntity (404)
        else Item Found
            ShoppingCartService->>+CartItemRepository: deleteById(itemId)
            CartItemRepository->>+Database: DELETE FROM cart_items WHERE id = ?
            Database-->>-CartItemRepository: Success
            CartItemRepository-->>-ShoppingCartService: void
            
            Note over ShoppingCartService: Remove item from cart.items list
            Note over ShoppingCartService: Recalculate cart total
            
            ShoppingCartService->>+ShoppingCartRepository: save(cart)
            ShoppingCartRepository->>+Database: UPDATE shopping_carts SET total_amount = ?, updated_at = ?
            Database-->>-ShoppingCartRepository: ShoppingCart
            ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
            
            ShoppingCartService-->>ShoppingCartController: ShoppingCart
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200)
        end
    end
```

### 3.11 Get Shopping Cart with Empty State Handling

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart/{customerId}
    ShoppingCartController->>+ShoppingCartService: getCartByCustomerId(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_carts WHERE customer_id = ?
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found
        Note over ShoppingCartService: Create empty cart
        ShoppingCartService-->>ShoppingCartController: Empty ShoppingCart
        ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200) with isEmpty=true
    else Cart Found
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        alt No Items in Cart
            Note over ShoppingCartService: Set cart.items = empty list
            ShoppingCartService-->>ShoppingCartController: ShoppingCart with isEmpty=true
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200) with isEmpty=true, message="Your cart is empty"
        else Items Present
            Note over ShoppingCartService: Populate cart with items
            Note over ShoppingCartService: Each item includes: name, price, quantity, subtotal
            ShoppingCartService-->>ShoppingCartController: ShoppingCart with items
            ShoppingCartController-->>Client: ResponseEntity<ShoppingCart> (200) with full cart details
        end
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

## 4.1 Shopping Cart API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/cart/{customerId}` | Get shopping cart for customer (handles empty state) | None | ShoppingCart |
| POST | `/api/cart/{customerId}/items` | Add item to cart (quantity defaults to 1) | CartItemRequest (productId, quantity) | ShoppingCart |
| PUT | `/api/cart/{customerId}/items/{itemId}` | Update item quantity with automatic recalculation | QuantityUpdateRequest (quantity) | ShoppingCart |
| DELETE | `/api/cart/{customerId}/items/{itemId}` | Remove item from cart with total recalculation | None | ShoppingCart |
| DELETE | `/api/cart/{customerId}` | Clear entire cart | None | None |

### 4.2 Shopping Cart Request/Response Models

**CartItemRequest:**
```json
{
  "productId": 1,
  "quantity": 1
}
```

**QuantityUpdateRequest:**
```json
{
  "quantity": 3
}
```

**ShoppingCart Response:**
```json
{
  "id": 1,
  "customerId": 123,
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Product Name",
      "productPrice": 29.99,
      "quantity": 2,
      "subtotal": 59.98
    }
  ],
  "totalAmount": 59.98,
  "updatedAt": "2024-01-15T10:30:00",
  "isEmpty": false
}
```

**Empty Cart Response:**
```json
{
  "id": null,
  "customerId": 123,
  "items": [],
  "totalAmount": 0.00,
  "updatedAt": null,
  "isEmpty": true,
  "message": "Your cart is empty"
}
```
