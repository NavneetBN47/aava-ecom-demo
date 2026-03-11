## 3. API Endpoints

### 3.1 Product Management APIs

#### 3.1.1 Get All Products (Enhanced with Pagination and Filtering)
- **Endpoint:** `GET /api/products`
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `sortBy` (optional): Sort field (price, name, createdAt)
  - `page` (optional, default: 0): Page number
  - `size` (optional, default: 20): Page size
- **Response:** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 1299.99,
      "category": "Electronics",
      "availableStock": 45,
      "inStock": true,
      "sku": "LAP-001",
      "brand": "TechBrand"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 150,
  "totalPages": 8
}
```

#### 3.1.2 Get Product By ID (Enhanced with Real-time Availability)
- **Endpoint:** `GET /api/products/{id}`
- **Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 1299.99,
  "category": "Electronics",
  "availableStock": 45,
  "inStock": true,
  "minimumProcurementThreshold": 5,
  "isSubscriptionEligible": true,
  "imageUrls": ["https://example.com/image1.jpg"],
  "sku": "LAP-001",
  "brand": "TechBrand",
  "weight": 2.5,
  "dimensions": "15x10x1 inches",
  "taxCategory": "ELECTRONICS"
}
```

#### 3.1.3 Create Product
- **Endpoint:** `POST /api/products`
- **Request Body:**
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 1299.99,
  "category": "Electronics",
  "stockQuantity": 50,
  "minimumProcurementThreshold": 5,
  "weight": 2.5,
  "dimensions": "15x10x1 inches",
  "taxCategory": "ELECTRONICS",
  "isSubscriptionEligible": true,
  "imageUrls": ["https://example.com/image1.jpg"],
  "sku": "LAP-001",
  "brand": "TechBrand"
}
```
- **Response:** `201 Created`

#### 3.1.4 Update Product
- **Endpoint:** `PUT /api/products/{id}`
- **Request Body:** Same as Create Product
- **Response:** `200 OK`

#### 3.1.5 Soft Delete Product
- **Endpoint:** `DELETE /api/products/{id}`
- **Response:** `204 No Content`
- **Note:** Product is marked as deleted but not removed from database

#### 3.1.6 Search Products (Enhanced)
- **Endpoint:** `GET /api/products/search`
- **Query Parameters:**
  - `keyword` (required): Search keyword
  - `category` (optional): Filter by category
  - `minPrice` (optional): Minimum price filter
  - `maxPrice` (optional): Maximum price filter
  - `sortBy` (optional): Sort field
  - `page` (optional, default: 0): Page number
  - `size` (optional, default: 20): Page size
- **Response:** `200 OK` with paginated results

### 3.2 Shopping Cart APIs

#### 3.2.1 Add to Cart
- **Endpoint:** `POST /api/cart/add`
- **Request Body:**
```json
{
  "userId": 1,
  "productId": 1,
  "quantity": 3,
  "isSubscription": false
}
```
- **Response:** `200 OK`
```json
{
  "items": [
    {
      "itemId": 1,
      "productName": "Laptop",
      "unitPrice": 1299.99,
      "quantity": 5,
      "subtotal": 6499.95,
      "isSubscription": false,
      "availableStock": 45
    }
  ],
  "subtotal": 6499.95,
  "tax": 519.99,
  "shipping": 25.00,
  "grandTotal": 7044.94,
  "isEmpty": false
}
```
- **Note:** If quantity < minimumProcurementThreshold, quantity is automatically adjusted

#### 3.2.2 View Cart
- **Endpoint:** `GET /api/cart/{userId}`
- **Response:** `200 OK` with CartResponse

#### 3.2.3 Update Cart Item Quantity
- **Endpoint:** `PUT /api/cart/update-quantity`
- **Request Body:**
```json
{
  "userId": 1,
  "itemId": 1,
  "quantity": 7
}
```
- **Response:** `200 OK` with updated CartResponse

#### 3.2.4 Remove Cart Item
- **Endpoint:** `DELETE /api/cart/remove/{userId}/{itemId}`
- **Response:** `204 No Content`

#### 3.2.5 Clear Cart
- **Endpoint:** `DELETE /api/cart/clear/{userId}`
- **Response:** `204 No Content`

### 3.3 Order Management APIs

#### 3.3.1 Create Order
- **Endpoint:** `POST /api/orders/create`
- **Request Body:**
```json
{
  "userId": 1,
  "shippingAddressId": 1,
  "paymentMethod": "CREDIT_CARD",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryDate": "12/25",
    "cvv": "123"
  }
}
```
- **Response:** `201 Created`
```json
{
  "orderId": 1,
  "orderNumber": "ORD-2024-001",
  "status": "CONFIRMED",
  "items": [
    {
      "itemId": 1,
      "productName": "Laptop",
      "quantity": 5,
      "unitPrice": 1299.99,
      "subtotal": 6499.95,
      "isSubscription": false
    }
  ],
  "subtotal": 6499.95,
  "tax": 519.99,
  "shipping": 25.00,
  "grandTotal": 7044.94,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "createdAt": "2024-01-15T10:30:00"
}
```

#### 3.3.2 Get Order By ID
- **Endpoint:** `GET /api/orders/{orderId}`
- **Response:** `200 OK` with OrderResponse

#### 3.3.3 Get User Orders
- **Endpoint:** `GET /api/orders/user/{userId}`
- **Response:** `200 OK` with List<OrderResponse>

#### 3.3.4 Update Order Status
- **Endpoint:** `PUT /api/orders/{orderId}/status`
- **Request Body:**
```json
{
  "status": "SHIPPED"
}
```
- **Response:** `200 OK`

#### 3.3.5 Cancel Order
- **Endpoint:** `DELETE /api/orders/{orderId}/cancel`
- **Response:** `204 No Content`

### 3.4 Payment APIs

#### 3.4.1 Process Payment
- **Endpoint:** `POST /api/payments/process`
- **Request Body:**
```json
{
  "orderId": 1,
  "paymentMethod": "CREDIT_CARD",
  "amount": 7044.94,
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryDate": "12/25",
    "cvv": "123"
  }
}
```
- **Response:** `200 OK`
```json
{
  "paymentId": 1,
  "status": "SUCCESS",
  "transactionId": "TXN-2024-001",
  "amount": 7044.94,
  "processedAt": "2024-01-15T10:30:00"
}
```

#### 3.4.2 Get Payment Status
- **Endpoint:** `GET /api/payments/{paymentId}`
- **Response:** `200 OK` with PaymentResponse

#### 3.4.3 Refund Payment
- **Endpoint:** `POST /api/payments/{paymentId}/refund`
- **Response:** `200 OK`

### 3.5 User Management APIs

#### 3.5.1 Register User
- **Endpoint:** `POST /api/users/register`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "password": "securePassword123"
}
```
- **Response:** `201 Created`

#### 3.5.2 Get User Profile
- **Endpoint:** `GET /api/users/{userId}`
- **Response:** `200 OK`

#### 3.5.3 Update User Profile
- **Endpoint:** `PUT /api/users/{userId}`
- **Request Body:** User update fields
- **Response:** `200 OK`

#### 3.5.4 Get User Addresses
- **Endpoint:** `GET /api/users/{userId}/addresses`
- **Response:** `200 OK` with List<Address>

#### 3.5.5 Add Address
- **Endpoint:** `POST /api/users/{userId}/addresses`
- **Request Body:**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "isDefault": true
}
```
- **Response:** `201 Created`

### 3.6 Subscription Management APIs

#### 3.6.1 Create Subscription
- **Endpoint:** `POST /api/subscriptions/create`
- **Request Body:**
```json
{
  "userId": 1,
  "productId": 1,
  "quantity": 5,
  "frequency": "MONTHLY"
}
```
- **Response:** `201 Created`

#### 3.6.2 Get User Subscriptions
- **Endpoint:** `GET /api/subscriptions/user/{userId}`
- **Response:** `200 OK` with List<SubscriptionResponse>

#### 3.6.3 Update Subscription
- **Endpoint:** `PUT /api/subscriptions/{subscriptionId}`
- **Request Body:**
```json
{
  "quantity": 10,
  "frequency": "WEEKLY"
}
```
- **Response:** `200 OK`

#### 3.6.4 Cancel Subscription
- **Endpoint:** `DELETE /api/subscriptions/{subscriptionId}/cancel`
- **Response:** `204 No Content`
