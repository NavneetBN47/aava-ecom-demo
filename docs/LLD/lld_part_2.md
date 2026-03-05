## 4. API Specifications

### 4.1 Product Management APIs

#### 4.1.1 Get All Products
```
GET /api/products
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category ID
- `search` (optional): Search term for product name/description
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (name, price, created_at)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": 1,
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "sku": "PROD-001",
        "category_id": 1,
        "category_name": "Electronics",
        "image_url": "https://example.com/image.jpg",
        "is_active": true,
        "stock_available": 50
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  }
}
```

#### 4.1.2 Get Product by ID
```
GET /api/products/{productId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "sku": "PROD-001",
    "category_id": 1,
    "category_name": "Electronics",
    "image_url": "https://example.com/image.jpg",
    "is_active": true,
    "stock_available": 50,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 4.1.3 Create Product
```
POST /api/products
```

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "sku": "PROD-002",
  "category_id": 1,
  "image_url": "https://example.com/image.jpg",
  "initial_stock": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product_id": 2,
    "name": "New Product",
    "sku": "PROD-002"
  }
}
```

#### 4.1.4 Update Product
```
PUT /api/products/{productId}
```

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 89.99,
  "is_active": true
}
```

#### 4.1.5 Delete Product
```
DELETE /api/products/{productId}
```

### 4.2 Cart Management APIs

#### 4.2.1 Add Item to Cart
```
POST /api/cart/add
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_id": 1,
    "cart_item_id": 5,
    "product_id": 1,
    "product_name": "Product Name",
    "quantity": 2,
    "unit_price": 99.99,
    "subtotal": 199.98,
    "cart_total": 299.97
  }
}
```

**Error Responses:**
- 400: Invalid product_id or quantity
- 404: Product not found
- 409: Insufficient stock available
- 401: User not authenticated

#### 4.2.2 Update Cart Item Quantity
```
PUT /api/cart/item/{itemId}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cart_item_id": 5,
    "product_id": 1,
    "product_name": "Product Name",
    "quantity": 3,
    "unit_price": 99.99,
    "subtotal": 299.97,
    "cart_total": 399.96
  }
}
```

**Error Responses:**
- 400: Invalid quantity (must be positive integer)
- 404: Cart item not found
- 409: Requested quantity exceeds available stock
- 403: User does not own this cart item

#### 4.2.3 Remove Item from Cart
```
DELETE /api/cart/item/{itemId}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart_id": 1,
    "removed_item_id": 5,
    "cart_total": 99.99,
    "items_count": 1
  }
}
```

**Error Responses:**
- 404: Cart item not found
- 403: User does not own this cart item

#### 4.2.4 Get Cart
```
GET /api/cart
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_id": 1,
    "user_id": 123,
    "items": [
      {
        "cart_item_id": 1,
        "product_id": 1,
        "product_name": "Product Name",
        "quantity": 2,
        "unit_price": 99.99,
        "subtotal": 199.98,
        "image_url": "https://example.com/image.jpg"
      }
    ],
    "total_items": 2,
    "total_amount": 199.98,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 4.2.5 Clear Cart
```
DELETE /api/cart
```

### 4.3 Order Management APIs

#### 4.3.1 Create Order
```
POST /api/orders
```

**Request Body:**
```json
{
  "shipping_address": {
    "address_line1": "123 Main St",
    "address_line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "payment_method": "credit_card",
  "payment_details": {
    "card_token": "tok_visa_4242"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 1001,
    "order_number": "ORD-2024-001001",
    "total_amount": 199.98,
    "status": "pending",
    "order_date": "2024-01-15T10:30:00Z"
  }
}
```

#### 4.3.2 Get Order Details
```
GET /api/orders/{orderId}
```

#### 4.3.3 Get User Orders
```
GET /api/orders
```

#### 4.3.4 Cancel Order
```
POST /api/orders/{orderId}/cancel
```

### 4.4 Payment APIs

#### 4.4.1 Process Payment
```
POST /api/payments
```

**Request Body:**
```json
{
  "order_id": 1001,
  "payment_method": "credit_card",
  "amount": 199.98,
  "payment_details": {
    "card_token": "tok_visa_4242"
  }
}
```

#### 4.4.2 Get Payment Status
```
GET /api/payments/{paymentId}
```

### 4.5 Inventory APIs

#### 4.5.1 Check Stock Availability
```
GET /api/inventory/{productId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "quantity_available": 50,
    "quantity_reserved": 10,
    "is_available": true,
    "reorder_level": 10,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

#### 4.5.2 Update Stock
```
PUT /api/inventory/{productId}
```

**Request Body:**
```json
{
  "quantity_change": 100,
  "operation": "add"
}
```
