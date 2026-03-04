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

### 3.8 Shopping Cart Module - Add Item to Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: POST /api/cart/items (AddToCartRequest)
    ShoppingCartController->>+ShoppingCartService: addItemToCart(customerId, productId, quantity)
    
    ShoppingCartService->>+ProductService: getProductById(productId)
    ProductService-->>-ShoppingCartService: Product
    
    Note over ShoppingCartService: Validate product stock
    
    ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_cart WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Exists
        Note over ShoppingCartService: Create new cart
        ShoppingCartService->>+ShoppingCartRepository: save(newCart)
        ShoppingCartRepository->>+Database: INSERT INTO shopping_cart
        Database-->>-ShoppingCartRepository: ShoppingCart
        ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    end
    
    ShoppingCartService->>+CartItemRepository: findByCartIdAndProductId(cartId, productId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Exists
        Note over ShoppingCartService: Update quantity
    else Item Not Exists
        Note over ShoppingCartService: Create new cart item
    end
    
    Note over ShoppingCartService: Calculate subtotal
    ShoppingCartService->>+CartItemRepository: save(cartItem)
    CartItemRepository->>+Database: INSERT/UPDATE cart_items
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-ShoppingCartService: CartItem
    
    Note over ShoppingCartService: Recalculate cart total
    ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
    ShoppingCartRepository->>+Database: UPDATE shopping_cart SET total_amount = ?
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: CartResponse
    ShoppingCartController-->>-Client: ResponseEntity<CartResponse> (201)
```

### 3.9 Shopping Cart Module - Get Cart Details

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ShoppingCartRepository
    participant CartItemRepository
    participant Database
    
    Client->>+ShoppingCartController: GET /api/cart?customerId={customerId}
    ShoppingCartController->>+ShoppingCartService: getCartDetails(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_cart WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Exists
        ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
        CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
        Database-->>-CartItemRepository: List<CartItem>
        CartItemRepository-->>-ShoppingCartService: List<CartItem>
        
        alt Cart Has Items
            Note over ShoppingCartService: Build CartResponse with items
            ShoppingCartService-->>ShoppingCartController: CartResponse
            ShoppingCartController-->>Client: ResponseEntity<CartResponse> (200)
        else Cart Is Empty
            Note over ShoppingCartService: Return empty cart message
            ShoppingCartService-->>ShoppingCartController: EmptyCartResponse
            ShoppingCartController-->>Client: ResponseEntity<EmptyCartResponse> (200)
        end
    else Cart Not Found
        Note over ShoppingCartService: Return empty cart message
        ShoppingCartService-->>ShoppingCartController: EmptyCartResponse
        ShoppingCartController-->>Client: ResponseEntity<EmptyCartResponse> (200)
    end
```

### 3.10 Shopping Cart Module - Update Cart Item Quantity

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: PUT /api/cart/items/{itemId} (UpdateCartItemRequest)
    ShoppingCartController->>+ShoppingCartService: updateItemQuantity(itemId, quantity)
    
    ShoppingCartService->>+CartItemService: validateQuantity(quantity)
    CartItemService-->>-ShoppingCartService: boolean
    
    alt Invalid Quantity
        ShoppingCartService-->>ShoppingCartController: throw InvalidQuantityException
        ShoppingCartController-->>Client: ResponseEntity (400)
    end
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
    
    Note over ShoppingCartService: Update quantity
    Note over ShoppingCartService: Recalculate subtotal
    
    ShoppingCartService->>+CartItemRepository: save(updatedItem)
    CartItemRepository->>+Database: UPDATE cart_items SET quantity = ?, subtotal = ?
    Database-->>-CartItemRepository: CartItem
    CartItemRepository-->>-ShoppingCartService: CartItem
    
    Note over ShoppingCartService: Recalculate cart total
    ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
    ShoppingCartRepository->>+Database: UPDATE shopping_cart SET total_amount = ?, last_modified_date = ?
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: CartResponse
    ShoppingCartController-->>-Client: ResponseEntity<CartResponse> (200)
```

### 3.11 Shopping Cart Module - Remove Cart Item

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart/items/{itemId}
    ShoppingCartController->>+ShoppingCartService: removeItemFromCart(itemId)
    
    ShoppingCartService->>+CartItemRepository: findById(itemId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Optional<CartItem>
    CartItemRepository-->>-ShoppingCartService: Optional<CartItem>
    
    alt Item Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartItemNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
    
    ShoppingCartService->>+CartItemRepository: deleteById(itemId)
    CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
    Database-->>-CartItemRepository: Success
    CartItemRepository-->>-ShoppingCartService: void
    
    Note over ShoppingCartService: Recalculate cart total
    ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
    ShoppingCartRepository->>+Database: UPDATE shopping_cart SET total_amount = ?, last_modified_date = ?
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: CartResponse
    ShoppingCartController-->>-Client: ResponseEntity<CartResponse> (200)
```

### 3.12 Shopping Cart Module - Clear Cart

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant ShoppingCartRepository
    participant Database
    
    Client->>+ShoppingCartController: DELETE /api/cart?customerId={customerId}
    ShoppingCartController->>+ShoppingCartService: clearCart(customerId)
    
    ShoppingCartService->>+ShoppingCartRepository: findActiveCartByCustomerId(customerId)
    ShoppingCartRepository->>+Database: SELECT * FROM shopping_cart WHERE customer_id = ? AND status = 'ACTIVE'
    Database-->>-ShoppingCartRepository: Optional<ShoppingCart>
    ShoppingCartRepository-->>-ShoppingCartService: Optional<ShoppingCart>
    
    alt Cart Not Found
        ShoppingCartService-->>ShoppingCartController: throw CartNotFoundException
        ShoppingCartController-->>Client: ResponseEntity (404)
    end
    
    ShoppingCartService->>+CartItemRepository: findByCartId(cartId)
    CartItemRepository->>+Database: SELECT * FROM cart_items WHERE cart_id = ?
    Database-->>-CartItemRepository: List<CartItem>
    CartItemRepository-->>-ShoppingCartService: List<CartItem>
    
    loop For each cart item
        ShoppingCartService->>+CartItemRepository: deleteById(itemId)
        CartItemRepository->>+Database: DELETE FROM cart_items WHERE cart_item_id = ?
        Database-->>-CartItemRepository: Success
        CartItemRepository-->>-ShoppingCartService: void
    end
    
    Note over ShoppingCartService: Reset cart total to 0
    ShoppingCartService->>+ShoppingCartRepository: save(updatedCart)
    ShoppingCartRepository->>+Database: UPDATE shopping_cart SET total_amount = 0, last_modified_date = ?
    Database-->>-ShoppingCartRepository: ShoppingCart
    ShoppingCartRepository-->>-ShoppingCartService: ShoppingCart
    
    ShoppingCartService-->>-ShoppingCartController: EmptyCartResponse
    ShoppingCartController-->>-Client: ResponseEntity<EmptyCartResponse> (200)
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

### 4.1 Shopping Cart Module - API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add item to cart | AddToCartRequest | CartResponse |
| GET | `/api/cart?customerId={customerId}` | Get cart details | None | CartResponse / EmptyCartResponse |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | UpdateCartItemRequest | CartResponse |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | None | CartResponse |
| DELETE | `/api/cart?customerId={customerId}` | Clear entire cart | None | EmptyCartResponse |

### 4.2 Shopping Cart Module - DTO Definitions

**AddToCartRequest**
```json
{
  "customerId": 1,
  "productId": 101,
  "quantity": 2
}
```

**UpdateCartItemRequest**
```json
{
  "quantity": 5
}
```

**CartItemResponse**
```json
{
  "cartItemId": 1,
  "productId": 101,
  "productName": "Product Name",
  "quantity": 2,
  "unitPrice": 29.99,
  "subtotal": 59.98,
  "addedDate": "2024-01-15T10:30:00"
}
```

**CartResponse**
```json
{
  "cartId": 1,
  "customerId": 1,
  "items": [
    {
      "cartItemId": 1,
      "productId": 101,
      "productName": "Product Name",
      "quantity": 2,
      "unitPrice": 29.99,
      "subtotal": 59.98,
      "addedDate": "2024-01-15T10:30:00"
    }
  ],
  "totalAmount": 59.98,
  "itemCount": 1,
  "lastModifiedDate": "2024-01-15T10:30:00"
}
```

**EmptyCartResponse**
```json
{
  "message": "Your cart is empty",
  "continueShoppingLink": "/products"
}
```
