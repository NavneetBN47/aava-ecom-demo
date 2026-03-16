## 5. API Specifications

### 5.1 Product APIs

#### 5.1.1 Get All Products
```
GET /api/v1/products
Query Parameters:
  - page: int (default: 0)
  - size: int (default: 20)
  - category: string (optional)
  - subscriptionEligible: boolean (optional)

Response: 200 OK
{
  "content": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stockQuantity": 100,
      "category": "Electronics",
      "sku": "PROD-001",
      "isActive": true,
      "isSubscriptionEligible": true,
      "subscriptionPrice": 89.99,
      "subscriptionInterval": "MONTHLY",
      "minQuantity": 1,
      "maxQuantity": 10
    }
  ],
  "pageable": {...},
  "totalElements": 50,
  "totalPages": 3
}
```

#### 5.1.2 Get Product by ID
```
GET /api/v1/products/{id}

Response: 200 OK
{
  "id": 1,
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stockQuantity": 100,
  "category": "Electronics",
  "sku": "PROD-001",
  "isActive": true,
  "isSubscriptionEligible": true,
  "subscriptionPrice": 89.99,
  "subscriptionInterval": "MONTHLY",
  "minQuantity": 1,
  "maxQuantity": 10,
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-15T14:30:00"
}
```

#### 5.1.3 Check Product Availability
```
GET /api/v1/products/{id}/availability
Query Parameters:
  - quantity: int (required)

Response: 200 OK
{
  "productId": 1,
  "available": true,
  "requestedQuantity": 5,
  "availableQuantity": 100,
  "message": "Product is available"
}
```

#### 5.1.4 Create Product
```
POST /api/v1/products
Authorization: Required (ADMIN role)

Request Body:
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "stockQuantity": 100,
  "category": "Electronics",
  "sku": "PROD-002",
  "isSubscriptionEligible": true,
  "subscriptionPrice": 89.99,
  "subscriptionInterval": "MONTHLY",
  "minQuantity": 1,
  "maxQuantity": 10
}

Response: 201 Created
{
  "id": 2,
  "name": "New Product",
  ...
}
```

### 5.2 Shopping Cart APIs

#### 5.2.1 Add to Cart
```
POST /api/v1/cart/items
Headers:
  - X-User-Id: long (optional, for authenticated users)
  - X-Session-Id: string (optional, for guest users)

Request Body:
{
  "productId": 1,
  "quantity": 2,
  "purchaseType": "ONE_TIME"
}

Response: 200 OK
{
  "cartId": 1,
  "userId": 123,
  "sessionId": null,
  "status": "ACTIVE",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Product Name",
      "quantity": 2,
      "purchaseType": "ONE_TIME",
      "unitPrice": 99.99,
      "subtotal": 199.98
    }
  ],
  "subtotal": 199.98,
  "tax": 19.99,
  "total": 219.97,
  "itemCount": 1
}
```

#### 5.2.2 Get Cart
```
GET /api/v1/cart
Headers:
  - X-User-Id: long (optional)
  - X-Session-Id: string (optional)

Response: 200 OK
{
  "cartId": 1,
  "userId": 123,
  "items": [...],
  "subtotal": 199.98,
  "tax": 19.99,
  "total": 219.97,
  "itemCount": 1
}
```

#### 5.2.3 Update Cart Item Quantity
```
PUT /api/v1/cart/items/{cartItemId}
Query Parameters:
  - quantity: int (required)
Headers:
  - X-User-Id: long (optional)
  - X-Session-Id: string (optional)

Response: 200 OK
{
  "cartId": 1,
  "items": [...],
  "subtotal": 299.97,
  "tax": 29.99,
  "total": 329.96
}
```

#### 5.2.4 Remove from Cart
```
DELETE /api/v1/cart/items/{cartItemId}
Headers:
  - X-User-Id: long (optional)
  - X-Session-Id: string (optional)

Response: 200 OK
{
  "cartId": 1,
  "items": [],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "itemCount": 0
}
```

#### 5.2.5 Clear Cart
```
DELETE /api/v1/cart
Headers:
  - X-User-Id: long (optional)
  - X-Session-Id: string (optional)

Response: 204 No Content
```

### 5.3 Checkout APIs

#### 5.3.1 Initiate Checkout
```
POST /api/v1/checkout/initiate
Headers:
  - X-User-Id: long (required)

Request Body:
{
  "cartId": 1,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}

Response: 200 OK
{
  "sessionId": "checkout_session_123",
  "cartId": 1,
  "items": [...],
  "subtotal": 199.98,
  "tax": 19.99,
  "total": 219.97,
  "expiresAt": "2024-01-15T15:00:00"
}
```

## 6. DTOs (Data Transfer Objects)

### 6.1 Request DTOs

#### 6.1.1 AddToCartRequest
```java
@Data
@Validated
public class AddToCartRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    @NotNull(message = "Purchase type is required")
    private PurchaseType purchaseType;
}
```

#### 6.1.2 CreateProductRequest
```java
@Data
@Validated
public class CreateProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;
    
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;
    
    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
    
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;
    
    private Boolean isSubscriptionEligible = false;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Subscription price must be greater than 0")
    private BigDecimal subscriptionPrice;
    
    private String subscriptionInterval;
    
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQuantity;
    
    @Min(value = 1, message = "Maximum quantity must be at least 1")
    private Integer maxQuantity;
}
```

### 6.2 Response DTOs

#### 6.2.1 CartResponse
```java
@Data
@Builder
public class CartResponse {
    
    private Long cartId;
    private Long userId;
    private String sessionId;
    private CartStatus status;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
}
```

#### 6.2.2 CartItemResponse
```java
@Data
@Builder
public class CartItemResponse {
    
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private Integer quantity;
    private PurchaseType purchaseType;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private LocalDateTime addedAt;
    private Integer availableStock;
}
```

#### 6.2.3 ProductResponse
```java
@Data
@Builder
public class ProductResponse {
    
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String category;
    private String sku;
    private Boolean isActive;
    private Boolean isSubscriptionEligible;
    private BigDecimal subscriptionPrice;
    private String subscriptionInterval;
    private Integer minQuantity;
    private Integer maxQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```
