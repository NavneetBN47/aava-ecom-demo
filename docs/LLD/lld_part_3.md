## 3. Database Design

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS ||--o{ CART_ITEMS : contains
    CART ||--o{ CART_ITEMS : has
    
    PRODUCTS {
        bigint id PK
        varchar name
        text description
        varchar sku UK
        decimal price
        varchar category
        timestamp created_at
        timestamp updated_at
    }
    
    CART {
        bigint id PK
        bigint user_id UK
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }
    
    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
        decimal price
        timestamp created_at
        timestamp updated_at
    }
```

### 3.2 Table Schemas

#### 3.2.1 products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_category ON products(category);
```

#### 3.2.2 cart Table

```sql
CREATE TABLE cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_user ON cart(user_id);
```

#### 3.2.3 cart_items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_item_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_item_product ON cart_items(product_id);
```

## 4. API Specifications

### 4.1 Product Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/products` | Create a new product | ProductRequest | ProductResponse (201) |
| GET | `/api/v1/products/{id}` | Get product by ID | - | ProductResponse (200) |
| GET | `/api/v1/products` | Get all products (paginated) | - | Page<ProductResponse> (200) |
| PUT | `/api/v1/products/{id}` | Update product | ProductRequest | ProductResponse (200) |
| DELETE | `/api/v1/products/{id}` | Delete product | - | 204 No Content |
| GET | `/api/v1/products/search` | Search products | keyword (query param) | Page<ProductResponse> (200) |

### 4.2 Shopping Cart Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/cart/items` | Add item to cart | AddCartItemRequest | CartResponse (201) |
| GET | `/api/v1/cart/{userId}` | Get user's cart | - | CartResponse (200) |
| PUT | `/api/v1/cart/items/{itemId}` | Update cart item quantity | UpdateCartItemRequest | CartResponse (200) |
| DELETE | `/api/v1/cart/items/{itemId}` | Remove item from cart | - | 204 No Content |
| DELETE | `/api/v1/cart/{userId}` | Clear entire cart | - | 204 No Content |

## 5. Sequence Diagrams

### 5.1 Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant Repository
    participant InventoryClient
    participant Database
    
    Client->>Controller: POST /api/v1/products
    Controller->>Service: createProduct(request)
    Service->>Service: validateProductRequest()
    Service->>InventoryClient: createInventoryRecord(sku, stock)
    InventoryClient-->>Service: Success
    Service->>Repository: save(product)
    Repository->>Database: INSERT INTO products
    Database-->>Repository: Product saved
    Repository-->>Service: Product entity
    Service-->>Controller: ProductResponse
    Controller-->>Client: 201 Created
```

### 5.2 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant CartController
    participant CartService
    participant ProductService
    participant CartRepository
    participant Database
    
    Client->>CartController: POST /api/v1/cart/items
    CartController->>CartService: addItemToCart(request)
    CartService->>ProductService: validateProductAvailability(productId, quantity)
    ProductService-->>CartService: Validation success
    CartService->>CartRepository: findByUserId(userId)
    CartRepository->>Database: SELECT cart
    Database-->>CartRepository: Cart or null
    CartRepository-->>CartService: Optional<Cart>
    
    alt Cart exists
        CartService->>CartService: Check if item exists
        alt Item exists
            CartService->>CartService: Update quantity
        else Item doesn't exist
            CartService->>CartService: Add new CartItem
        end
    else Cart doesn't exist
        CartService->>CartService: createNewCart(userId)
        CartService->>CartService: Add new CartItem
    end
    
    CartService->>CartService: recalculateCartTotal()
    CartService->>CartRepository: save(cart)
    CartRepository->>Database: INSERT/UPDATE cart and cart_items
    Database-->>CartRepository: Saved cart
    CartRepository-->>CartService: Cart entity
    CartService-->>CartController: CartResponse
    CartController-->>Client: 201 Created
```

### 5.3 Update Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant Repository
    participant Database
    
    Client->>Controller: PUT /api/v1/products/{id}
    Controller->>Service: updateProduct(id, request)
    Service->>Repository: findById(id)
    Repository->>Database: SELECT FROM products
    Database-->>Repository: Product or null
    Repository-->>Service: Optional<Product>
    
    alt Product exists
        Service->>Service: validateProductRequest()
        Service->>Service: Update product fields
        Service->>Repository: save(product)
        Repository->>Database: UPDATE products
        Database-->>Repository: Updated product
        Repository-->>Service: Product entity
        Service-->>Controller: ProductResponse
        Controller-->>Client: 200 OK
    else Product not found
        Service-->>Controller: ProductNotFoundException
        Controller-->>Client: 404 Not Found
    end
```

## 6. Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +createProduct(ProductRequest) ResponseEntity~ProductResponse~
        +getProduct(Long) ResponseEntity~ProductResponse~
        +getAllProducts(int, int, String) ResponseEntity~Page~
        +updateProduct(Long, ProductRequest) ResponseEntity~ProductResponse~
        +deleteProduct(Long) ResponseEntity~Void~
        +searchProducts(String, int, int) ResponseEntity~Page~
    }
    
    class ShoppingCartController {
        -CartService cartService
        +addItemToCart(AddCartItemRequest) ResponseEntity~CartResponse~
        +getCart(Long) ResponseEntity~CartResponse~
        +updateCartItem(Long, UpdateCartItemRequest) ResponseEntity~CartResponse~
        +removeCartItem(Long) ResponseEntity~Void~
        +clearCart(Long) ResponseEntity~Void~
    }
    
    class ProductService {
        -ProductRepository productRepository
        -ProductMapper productMapper
        -InventoryClient inventoryClient
        -PricingClient pricingClient
        +createProduct(ProductRequest) ProductResponse
        +getProductById(Long) ProductResponse
        +getAllProducts(Pageable) Page~ProductResponse~
        +updateProduct(Long, ProductRequest) ProductResponse
        +deleteProduct(Long) void
        +searchProducts(String, Pageable) Page~ProductResponse~
        +validateProductAvailability(Long, Integer) void
        +getProductPrice(Long) BigDecimal
        +reserveStock(Long, Integer) void
        +releaseStock(Long, Integer) void
        -validateProductRequest(ProductRequest) void
    }
    
    class CartService {
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        -CartMapper cartMapper
        +addItemToCart(AddCartItemRequest) CartResponse
        +getCartByUserId(Long) CartResponse
        +updateCartItem(Long, UpdateCartItemRequest) CartResponse
        +removeCartItem(Long) void
        +clearCart(Long) void
        -createNewCart(Long) Cart
        -recalculateCartTotal(Cart) void
        -validateCartOperation(Cart) void
    }
    
    class ProductRepository {
        <<interface>>
        +searchByNameOrDescription(String, Pageable) Page~Product~
        +findByCategory(String) List~Product~
        +findBySku(String) Optional~Product~
        +existsBySku(String) boolean
        +findByPriceRange(BigDecimal, BigDecimal, Pageable) Page~Product~
    }
    
    class CartRepository {
        <<interface>>
        +findByUserId(Long) Optional~Cart~
        +findByUserIdWithItems(Long) Optional~Cart~
        +deleteByUserId(Long) void
        +existsByUserId(Long) boolean
    }
    
    class CartItemRepository {
        <<interface>>
        +findByCartId(Long) List~CartItem~
        +findByCartIdAndProductId(Long, Long) Optional~CartItem~
        +deleteByCartId(Long) void
        +findByProductId(Long) List~CartItem~
    }
    
    class Product {
        -Long id
        -String name
        -String description
        -String sku
        -BigDecimal price
        -String category
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -List~CartItem~ cartItems
        +isAvailableForCart(Integer) boolean
        +addToCartItem(CartItem) void
        +removeFromCartItem(CartItem) void
    }
    
    class Cart {
        -Long id
        -Long userId
        -List~CartItem~ items
        -BigDecimal totalAmount
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +addItem(CartItem) void
        +removeItem(CartItem) void
        +getTotalItems() int
    }
    
    class CartItem {
        -Long id
        -Cart cart
        -Product product
        -Integer quantity
        -BigDecimal price
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getSubtotal() BigDecimal
    }
    
    ProductController --> ProductService
    ShoppingCartController --> CartService
    ProductService --> ProductRepository
    ProductService --> InventoryClient
    ProductService --> PricingClient
    CartService --> CartRepository
    CartService --> CartItemRepository
    CartService --> ProductService
    ProductRepository --> Product
    CartRepository --> Cart
    CartItemRepository --> CartItem
    Product "1" --> "*" CartItem
    Cart "1" --> "*" CartItem
```

## 7. Configuration

### 7.1 Application Properties

```yaml
spring:
  application:
    name: ecommerce-product-service
  
  datasource:
    url: jdbc:postgresql://localhost:5432/ecommerce_db
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        use_sql_comments: true
  
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

server:
  port: 8080
  servlet:
    context-path: /

logging:
  level:
    root: INFO
    com.ecommerce: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
```

### 7.2 Maven Dependencies

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- OpenAPI Documentation -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.2.0</version>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <scope>test</scope>
    </dependency>
    
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
