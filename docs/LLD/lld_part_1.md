# Low-Level Design (LLD) - E-commerce Product Management and Shopping Cart Management System

## 1. Project Overview

**Framework:** Spring Boot  
**Language:** Java 21  
**Database:** PostgreSQL  
**Module:** ProductManagement and ShoppingCartManagement  

## 2. System Architecture

### 2.1 Class Diagram

```mermaid
classDiagram
    class ProductController {
        <<@RestController>>
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String keyword) ResponseEntity~List~Product~~
    }
    
    class ProductService {
        <<@Service>>
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Product
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String keyword) List~Product~
    }
    
    class ProductRepository {
        <<@Repository>>
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingIgnoreCase(String keyword) List~Product~
    }
    
    class Product {
        <<@Entity>>
        -Long id
        -String name
        -String description
        -BigDecimal price
        -String category
        -Integer stockQuantity
        -Integer minimumProcurementThreshold
        -LocalDateTime createdAt
        +getId() Long
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() BigDecimal
        +setPrice(BigDecimal price) void
        +getCategory() String
        +setCategory(String category) void
        +getStockQuantity() Integer
        +setStockQuantity(Integer stockQuantity) void
        +getMinimumProcurementThreshold() Integer
        +setMinimumProcurementThreshold(Integer threshold) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
    }
    
    class ShoppingCartController {
        <<@RestController>>
        -ShoppingCartService shoppingCartService
        +addItemToCart(Long productId, Integer quantity) ResponseEntity~CartItem~
        +getCart(Long userId) ResponseEntity~ShoppingCart~
        +updateCartItemQuantity(Long itemId, Integer quantity) ResponseEntity~CartItem~
        +removeItemFromCart(Long itemId) ResponseEntity~Void~
    }
    
    class ShoppingCartService {
        <<@Service>>
        -ShoppingCartRepository shoppingCartRepository
        -CartItemRepository cartItemRepository
        -ProductRepository productRepository
        +addItemToCart(Long userId, Long productId, Integer quantity) CartItem
        +getCart(Long userId) ShoppingCart
        +updateCartItemQuantity(Long itemId, Integer quantity) CartItem
        +removeItemFromCart(Long itemId) void
        +validateInventory(Long productId, Integer quantity) boolean
        +calculateCartTotal(Long userId) BigDecimal
    }
    
    class ShoppingCartRepository {
        <<@Repository>>
        <<interface>>
        +findByUserId(Long userId) Optional~ShoppingCart~
        +save(ShoppingCart cart) ShoppingCart
    }
    
    class CartItemRepository {
        <<@Repository>>
        <<interface>>
        +findById(Long id) Optional~CartItem~
        +save(CartItem item) CartItem
        +deleteById(Long id) void
        +findByShoppingCartId(Long cartId) List~CartItem~
    }
    
    class ShoppingCart {
        <<@Entity>>
        -Long id
        -Long userId
        -List~CartItem~ items
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getId() Long
        +setId(Long id) void
        +getUserId() Long
        +setUserId(Long userId) void
        +getItems() List~CartItem~
        +setItems(List~CartItem~ items) void
        +getCreatedAt() LocalDateTime
        +setCreatedAt(LocalDateTime createdAt) void
        +getUpdatedAt() LocalDateTime
        +setUpdatedAt(LocalDateTime updatedAt) void
    }
    
    class CartItem {
        <<@Entity>>
        -Long id
        -Long shoppingCartId
        -Long productId
        -Integer quantity
        -BigDecimal priceAtAddition
        -LocalDateTime addedAt
        +getId() Long
        +setId(Long id) void
        +getShoppingCartId() Long
        +setShoppingCartId(Long cartId) void
        +getProductId() Long
        +setProductId(Long productId) void
        +getQuantity() Integer
        +setQuantity(Integer quantity) void
        +getPriceAtAddition() BigDecimal
        +setPriceAtAddition(BigDecimal price) void
        +getAddedAt() LocalDateTime
        +setAddedAt(LocalDateTime addedAt) void
    }
    
    ProductController --> ProductService : depends on
    ProductService --> ProductRepository : depends on
    ProductRepository --> Product : manages
    ProductService --> Product : operates on
    ShoppingCartController --> ShoppingCartService : depends on
    ShoppingCartService --> ShoppingCartRepository : depends on
    ShoppingCartService --> CartItemRepository : depends on
    ShoppingCartService --> ProductRepository : depends on
    ShoppingCartRepository --> ShoppingCart : manages
    CartItemRepository --> CartItem : manages
    ShoppingCart --> CartItem : contains
```

### 2.2 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        VARCHAR name "NOT NULL, MAX_LENGTH(255)"
        TEXT description "NULLABLE"
        DECIMAL price "NOT NULL, PRECISION(10,2)"
        VARCHAR category "NOT NULL, MAX_LENGTH(100)"
        INTEGER stock_quantity "NOT NULL, DEFAULT 0"
        INTEGER minimum_procurement_threshold "NOT NULL, DEFAULT 10"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CART {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT user_id "NOT NULL, UNIQUE"
        TIMESTAMP created_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
    
    CART_ITEMS {
        BIGINT id PK "AUTO_INCREMENT, NOT NULL"
        BIGINT shopping_cart_id FK "NOT NULL"
        BIGINT product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL, DEFAULT 1"
        DECIMAL price_at_addition "NOT NULL, PRECISION(10,2)"
        TIMESTAMP added_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
    }
    
    SHOPPING_CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_by
```

## 3. Key Features

### 3.1 Product Management Features
- Create, Read, Update, Delete (CRUD) operations for products
- Search products by name (case-insensitive)
- Filter products by category
- Retrieve all products with pagination support
- Manage product inventory and stock quantities
- Track product creation timestamps

### 3.2 Shopping Cart Features
- Add products to shopping cart with quantity validation
- View cart contents with real-time pricing
- Update item quantities in cart
- Remove items from cart
- Real-time inventory validation
- Automatic cart total calculation
- Minimum procurement threshold enforcement

## 4. API Endpoints

### 4.1 Product Management Endpoints

#### 4.1.1 Get All Products
**Endpoint:** `GET /api/products`  
**Description:** Retrieves all products from the database  
**Response:** `200 OK` with list of products

#### 4.1.2 Get Product by ID
**Endpoint:** `GET /api/products/{id}`  
**Description:** Retrieves a specific product by its ID  
**Path Parameter:** `id` (Long) - Product ID  
**Response:** `200 OK` with product details or `404 Not Found`

#### 4.1.3 Create Product
**Endpoint:** `POST /api/products`  
**Description:** Creates a new product  
**Request Body:** Product object (JSON)  
**Response:** `201 Created` with created product

#### 4.1.4 Update Product
**Endpoint:** `PUT /api/products/{id}`  
**Description:** Updates an existing product  
**Path Parameter:** `id` (Long) - Product ID  
**Request Body:** Product object (JSON)  
**Response:** `200 OK` with updated product or `404 Not Found`

#### 4.1.5 Delete Product
**Endpoint:** `DELETE /api/products/{id}`  
**Description:** Deletes a product by ID  
**Path Parameter:** `id` (Long) - Product ID  
**Response:** `204 No Content` or `404 Not Found`

#### 4.1.6 Get Products by Category
**Endpoint:** `GET /api/products/category/{category}`  
**Description:** Retrieves all products in a specific category  
**Path Parameter:** `category` (String) - Category name  
**Response:** `200 OK` with list of products

#### 4.1.7 Search Products
**Endpoint:** `GET /api/products/search?keyword={keyword}`  
**Description:** Searches products by name (case-insensitive)  
**Query Parameter:** `keyword` (String) - Search term  
**Response:** `200 OK` with list of matching products

### 4.2 Shopping Cart Endpoints

#### 4.2.1 Add Item to Cart
**Endpoint:** `POST /api/cart/items`  
**Description:** Adds a product to the shopping cart with inventory validation  
**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```
**Response:** `201 Created` with cart item details or `400 Bad Request` if validation fails

#### 4.2.2 Get Shopping Cart
**Endpoint:** `GET /api/cart`  
**Description:** Retrieves the current user's shopping cart with all items  
**Response:** `200 OK` with shopping cart details including items and total

#### 4.2.3 Update Cart Item Quantity
**Endpoint:** `PUT /api/cart/items/{itemId}`  
**Description:** Updates the quantity of an item in the cart with inventory validation  
**Path Parameter:** `itemId` (Long) - Cart item ID  
**Request Body:**
```json
{
  "quantity": 5
}
```
**Response:** `200 OK` with updated cart item or `400 Bad Request` if validation fails

#### 4.2.4 Remove Item from Cart
**Endpoint:** `DELETE /api/cart/items/{itemId}`  
**Description:** Removes an item from the shopping cart  
**Path Parameter:** `itemId` (Long) - Cart item ID  
**Response:** `204 No Content` or `404 Not Found`

## 5. Sequence Diagrams

### 5.1 Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: POST /api/products
    ProductController->>ProductService: createProduct(product)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products
    Database-->>ProductRepository: Product saved
    ProductRepository-->>ProductService: Product entity
    ProductService-->>ProductController: Product entity
    ProductController-->>Client: 201 Created + Product
```

### 5.2 Search Products Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/search?keyword=laptop
    ProductController->>ProductService: searchProducts("laptop")
    ProductService->>ProductRepository: findByNameContainingIgnoreCase("laptop")
    ProductRepository->>Database: SELECT * FROM products WHERE name ILIKE '%laptop%'
    Database-->>ProductRepository: List of products
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: 200 OK + List<Product>
```

### 5.3 Add Product to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant ProductRepository
    participant CartItemRepository
    participant Database
    
    Client->>ShoppingCartController: POST /api/cart/items {productId, quantity}
    ShoppingCartController->>ShoppingCartService: addItemToCart(userId, productId, quantity)
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product
    ProductRepository-->>ShoppingCartService: Product
    ShoppingCartService->>ShoppingCartService: validateInventory(product, quantity)
    alt Inventory Valid
        ShoppingCartService->>CartItemRepository: save(cartItem)
        CartItemRepository->>Database: INSERT INTO cart_items
        Database-->>CartItemRepository: CartItem saved
        CartItemRepository-->>ShoppingCartService: CartItem
        ShoppingCartService-->>ShoppingCartController: CartItem
        ShoppingCartController-->>Client: 201 Created + CartItem
    else Inventory Invalid
        ShoppingCartService-->>ShoppingCartController: InventoryValidationException
        ShoppingCartController-->>Client: 400 Bad Request + Error Message
    end
```

### 5.4 Update Cart Item Quantity Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShoppingCartController
    participant ShoppingCartService
    participant CartItemRepository
    participant ProductRepository
    participant Database
    
    Client->>ShoppingCartController: PUT /api/cart/items/{itemId} {quantity}
    ShoppingCartController->>ShoppingCartService: updateCartItemQuantity(itemId, quantity)
    ShoppingCartService->>CartItemRepository: findById(itemId)
    CartItemRepository->>Database: SELECT * FROM cart_items WHERE id = ?
    Database-->>CartItemRepository: CartItem
    CartItemRepository-->>ShoppingCartService: CartItem
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product
    ProductRepository-->>ShoppingCartService: Product
    ShoppingCartService->>ShoppingCartService: validateInventory(product, quantity)
    alt Inventory Valid
        ShoppingCartService->>CartItemRepository: save(updatedCartItem)
        CartItemRepository->>Database: UPDATE cart_items SET quantity = ?
        Database-->>CartItemRepository: CartItem updated
        CartItemRepository-->>ShoppingCartService: CartItem
        ShoppingCartService-->>ShoppingCartController: CartItem
        ShoppingCartController-->>Client: 200 OK + CartItem
    else Inventory Invalid
        ShoppingCartService-->>ShoppingCartController: InventoryValidationException
        ShoppingCartController-->>Client: 400 Bad Request + Error Message
    end
```

### 5.5 Inventory Validation Flow

```mermaid
sequenceDiagram
    participant ShoppingCartService
    participant ProductRepository
    participant Database
    
    ShoppingCartService->>ProductRepository: findById(productId)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Product
    ProductRepository-->>ShoppingCartService: Product
    ShoppingCartService->>ShoppingCartService: Check stock_quantity >= requested_quantity
    ShoppingCartService->>ShoppingCartService: Check (stock_quantity - requested_quantity) >= minimum_procurement_threshold
    alt Validation Passed
        ShoppingCartService-->>ShoppingCartService: Return true
    else Validation Failed
        ShoppingCartService-->>ShoppingCartService: Throw InventoryValidationException
    end
```

## 6. Business Logic

### 6.1 Minimum Procurement Threshold

The system enforces a minimum procurement threshold for each product to ensure adequate inventory levels are maintained:

**Rule:** When adding or updating items in the shopping cart, the system validates that:
```
(current_stock_quantity - requested_quantity) >= minimum_procurement_threshold
```

**Example:**
- Product: Laptop
- Current Stock: 50 units
- Minimum Procurement Threshold: 10 units
- Customer Request: 45 units
- Validation: (50 - 45) = 5 < 10 → **REJECTED**
- Maximum Allowed: 40 units (50 - 10)

**Purpose:**
- Prevents complete stock depletion
- Ensures buffer stock for procurement lead time
- Maintains service level for other customers
- Triggers reorder processes before stockout

### 6.2 Real-time Cart Total Calculation

The shopping cart total is calculated dynamically based on:
- Current item quantities in cart
- Price at the time of addition (stored in cart_items.price_at_addition)
- Ensures price consistency even if product prices change after items are added

**Calculation Formula:**
```
Cart Total = Σ (cart_item.quantity × cart_item.price_at_addition)
```
