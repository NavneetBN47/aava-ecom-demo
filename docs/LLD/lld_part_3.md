## 5. Class Diagrams

### 5.1 Product Service Classes

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +getAllProducts(filters) ResponseEntity
        +getProductById(productId) ResponseEntity
        +createProduct(productDTO) ResponseEntity
        +updateProduct(productId, productDTO) ResponseEntity
        +deleteProduct(productId) ResponseEntity
    }
    
    class ProductService {
        -ProductRepository productRepository
        -InventoryService inventoryService
        -CacheService cacheService
        +findAllProducts(filters) List~Product~
        +findProductById(productId) Product
        +createProduct(productDTO) Product
        +updateProduct(productId, productDTO) Product
        +deleteProduct(productId) void
        +searchProducts(searchTerm) List~Product~
    }
    
    class ProductRepository {
        <<interface>>
        +findAll(pageable) Page~Product~
        +findById(productId) Optional~Product~
        +save(product) Product
        +deleteById(productId) void
        +findByCategoryId(categoryId) List~Product~
        +findBySkuContaining(sku) List~Product~
    }
    
    class Product {
        -Long productId
        -String name
        -String description
        -BigDecimal price
        -String sku
        -Long categoryId
        -String imageUrl
        -Boolean isActive
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +getters()
        +setters()
    }
    
    class ProductDTO {
        -Long productId
        -String name
        -String description
        -BigDecimal price
        -String sku
        -Long categoryId
        -String imageUrl
        -Integer stockAvailable
        +toEntity() Product
        +fromEntity(product) ProductDTO
    }
    
    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductService --> Product
    ProductController --> ProductDTO
    ProductDTO --> Product
```

### 5.2 Cart Service Classes

```mermaid
classDiagram
    class CartController {
        -CartService cartService
        +getCart(userId) ResponseEntity
        +addItemToCart(userId, cartItemDTO) ResponseEntity
        +updateCartItem(userId, itemId, quantity) ResponseEntity
        +removeCartItem(userId, itemId) ResponseEntity
        +clearCart(userId) ResponseEntity
    }
    
    class CartService {
        -CartRepository cartRepository
        -CartItemRepository cartItemRepository
        -ProductService productService
        -InventoryService inventoryService
        +getOrCreateCart(userId) Cart
        +addItem(userId, productId, quantity) CartItem
        +updateItemQuantity(userId, itemId, quantity) CartItem
        +removeItem(userId, itemId) void
        +clearCart(userId) void
        +calculateCartTotal(cartId) BigDecimal
    }
    
    class CartRepository {
        <<interface>>
        +findByUserId(userId) Optional~Cart~
        +save(cart) Cart
        +deleteById(cartId) void
    }
    
    class CartItemRepository {
        <<interface>>
        +findByCartId(cartId) List~CartItem~
        +findByCartIdAndProductId(cartId, productId) Optional~CartItem~
        +save(cartItem) CartItem
        +deleteById(itemId) void
    }
    
    class Cart {
        -Long cartId
        -Long userId
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        -List~CartItem~ items
        +addItem(cartItem) void
        +removeItem(itemId) void
        +calculateTotal() BigDecimal
    }
    
    class CartItem {
        -Long cartItemId
        -Long cartId
        -Long productId
        -Integer quantity
        -BigDecimal priceAtAddition
        -LocalDateTime addedAt
        +calculateSubtotal() BigDecimal
    }
    
    CartController --> CartService
    CartService --> CartRepository
    CartService --> CartItemRepository
    CartService --> Cart
    Cart --> CartItem
```

### 5.3 Order Service Classes

```mermaid
classDiagram
    class OrderController {
        -OrderService orderService
        +createOrder(userId, orderDTO) ResponseEntity
        +getOrderById(orderId) ResponseEntity
        +getUserOrders(userId) ResponseEntity
        +cancelOrder(orderId) ResponseEntity
        +updateOrderStatus(orderId, status) ResponseEntity
    }
    
    class OrderService {
        -OrderRepository orderRepository
        -OrderItemRepository orderItemRepository
        -CartService cartService
        -PaymentService paymentService
        -InventoryService inventoryService
        -NotificationService notificationService
        +createOrder(userId, orderDTO) Order
        +getOrderById(orderId) Order
        +getUserOrders(userId) List~Order~
        +cancelOrder(orderId) void
        +updateOrderStatus(orderId, status) Order
    }
    
    class Order {
        -Long orderId
        -Long userId
        -String orderNumber
        -BigDecimal totalAmount
        -OrderStatus status
        -LocalDateTime orderDate
        -List~OrderItem~ items
        -Payment payment
        -Shipping shipping
        +calculateTotal() BigDecimal
        +canBeCancelled() boolean
    }
    
    class OrderItem {
        -Long orderItemId
        -Long orderId
        -Long productId
        -Integer quantity
        -BigDecimal unitPrice
        -BigDecimal subtotal
        +calculateSubtotal() BigDecimal
    }
    
    class OrderStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        PROCESSING
        SHIPPED
        DELIVERED
        CANCELLED
    }
    
    OrderController --> OrderService
    OrderService --> Order
    Order --> OrderItem
    Order --> OrderStatus
```

## 6. Sequence Diagrams

### 6.1 Add Product to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Cart Service
    participant Product Service
    participant Inventory Service
    participant Database
    participant Cache
    
    Client->>API Gateway: POST /api/cart/add
    API Gateway->>Auth Service: Validate JWT Token
    Auth Service-->>API Gateway: Token Valid (userId)
    
    API Gateway->>Cart Service: addItemToCart(userId, productId, quantity)
    Cart Service->>Product Service: getProduct(productId)
    Product Service->>Cache: Check Cache
    
    alt Product in Cache
        Cache-->>Product Service: Return Product
    else Product not in Cache
        Product Service->>Database: Query Product
        Database-->>Product Service: Product Data
        Product Service->>Cache: Store in Cache
    end
    
    Product Service-->>Cart Service: Product Details
    
    Cart Service->>Inventory Service: checkAvailability(productId, quantity)
    Inventory Service->>Database: Query Inventory
    Database-->>Inventory Service: Stock Data
    Inventory Service-->>Cart Service: Stock Available
    
    alt Sufficient Stock
        Cart Service->>Database: Get or Create Cart
        Database-->>Cart Service: Cart Data
        Cart Service->>Database: Add/Update Cart Item
        Database-->>Cart Service: Cart Item Saved
        Cart Service->>Cart Service: Calculate Cart Total
        Cart Service-->>API Gateway: Success Response
        API Gateway-->>Client: 200 OK (Cart Data)
    else Insufficient Stock
        Cart Service-->>API Gateway: Error Response
        API Gateway-->>Client: 409 Conflict (Out of Stock)
    end
```

### 6.2 Checkout and Order Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Order Service
    participant Cart Service
    participant Payment Service
    participant Inventory Service
    participant Notification Service
    participant Database
    participant Message Queue
    
    Client->>API Gateway: POST /api/orders
    API Gateway->>Order Service: createOrder(userId, orderDTO)
    
    Order Service->>Cart Service: getCart(userId)
    Cart Service->>Database: Query Cart Items
    Database-->>Cart Service: Cart Data
    Cart Service-->>Order Service: Cart Items
    
    Order Service->>Inventory Service: reserveStock(cartItems)
    Inventory Service->>Database: Update Inventory (Reserve)
    Database-->>Inventory Service: Stock Reserved
    Inventory Service-->>Order Service: Reservation Confirmed
    
    Order Service->>Database: Create Order
    Database-->>Order Service: Order Created
    
    Order Service->>Payment Service: processPayment(orderId, paymentDetails)
    Payment Service->>Payment Service: Validate Payment Details
    Payment Service->>External Gateway: Process Payment
    External Gateway-->>Payment Service: Payment Success
    Payment Service->>Database: Save Payment Record
    Payment Service-->>Order Service: Payment Confirmed
    
    Order Service->>Database: Update Order Status (CONFIRMED)
    Order Service->>Cart Service: clearCart(userId)
    Cart Service->>Database: Delete Cart Items
    
    Order Service->>Message Queue: Publish Order Confirmed Event
    Message Queue->>Notification Service: Order Confirmed Event
    Notification Service->>Client: Send Order Confirmation Email
    
    Order Service-->>API Gateway: Order Created Successfully
    API Gateway-->>Client: 201 Created (Order Details)
```

### 6.3 Product Search and Filter Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Product Service
    participant Cache
    participant Database
    participant Search Engine
    
    Client->>API Gateway: GET /api/products?search=laptop&category=1
    API Gateway->>Product Service: searchProducts(filters)
    
    Product Service->>Cache: Check Cache Key
    
    alt Cache Hit
        Cache-->>Product Service: Cached Results
        Product Service-->>API Gateway: Product List
    else Cache Miss
        Product Service->>Search Engine: Full-Text Search
        Search Engine->>Database: Query with Filters
        Database-->>Search Engine: Matching Products
        Search Engine-->>Product Service: Search Results
        
        Product Service->>Product Service: Apply Business Logic
        Product Service->>Cache: Store Results
        Product Service-->>API Gateway: Product List
    end
    
    API Gateway-->>Client: 200 OK (Products with Pagination)
```

## 7. UI Components

### 7.1 Quantity Management Component

**Component Name:** QuantitySelector

**Purpose:** Allows users to adjust item quantities in the shopping cart with increment/decrement controls

**Props:**
- `currentQuantity`: number - Current quantity value
- `minQuantity`: number - Minimum allowed quantity (default: 1)
- `maxQuantity`: number - Maximum allowed quantity (based on stock)
- `onQuantityChange`: function - Callback when quantity changes
- `disabled`: boolean - Disable controls when processing

**Features:**
- Increment (+) and decrement (-) buttons
- Direct numeric input field
- Real-time validation against min/max constraints
- Visual feedback for stock limitations
- Debounced API calls to prevent excessive requests
- Loading state during updates
- Error handling and display

**Example Usage:**
```jsx
<QuantitySelector
  currentQuantity={2}
  minQuantity={1}
  maxQuantity={10}
  onQuantityChange={(newQuantity) => updateCartItem(itemId, newQuantity)}
  disabled={isUpdating}
/>
```

### 7.2 Remove Item Component

**Component Name:** RemoveItemButton

**Purpose:** Provides a user-friendly interface to remove items from the shopping cart

**Props:**
- `itemId`: number - Cart item identifier
- `productName`: string - Product name for confirmation
- `onRemove`: function - Callback when item is removed
- `showConfirmation`: boolean - Whether to show confirmation dialog (default: true)

**Features:**
- Icon-based remove button
- Optional confirmation dialog
- Loading state during removal
- Success/error notifications
- Undo functionality (optional)
- Accessibility support (ARIA labels)

**Example Usage:**
```jsx
<RemoveItemButton
  itemId={5}
  productName="Wireless Mouse"
  onRemove={(itemId) => removeFromCart(itemId)}
  showConfirmation={true}
/>
```

### 7.3 Cart Summary Component

**Component Name:** CartSummary

**Purpose:** Displays cart totals, item count, and checkout actions

**Features:**
- Real-time cart total calculation
- Item count display
- Subtotal, tax, and shipping breakdown
- Discount/coupon code application
- Checkout button with validation
- Empty cart state handling
