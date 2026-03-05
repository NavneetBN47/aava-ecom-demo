# Low-Level Design Document: E-Commerce Platform

## 1. System Overview

This document provides a detailed low-level design for an e-commerce platform that enables users to browse products, manage shopping carts, and complete purchases. The system is built using a microservices architecture with RESTful APIs.

### 1.1 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL for relational data, Redis for caching
- **Authentication**: JWT-based authentication
- **Payment Processing**: Stripe API integration
- **Frontend**: React.js with Redux for state management

## 2. Data Models

### 2.1 Product Model

```javascript
class Product {
  constructor() {
    this.id = null;              // UUID
    this.name = '';              // String
    this.description = '';       // Text
    this.price = 0.00;          // Decimal(10,2)
    this.stock_quantity = 0;     // Integer
    this.category_id = null;     // UUID (Foreign Key)
    this.image_url = '';         // String
    this.created_at = null;      // Timestamp
    this.updated_at = null;      // Timestamp
    this.is_active = true;       // Boolean
  }
}
```

### 2.2 Cart Model

```javascript
class Cart {
  constructor() {
    this.id = null;              // UUID
    this.user_id = null;         // UUID (Foreign Key)
    this.created_at = null;      // Timestamp
    this.updated_at = null;      // Timestamp
    this.status = 'active';      // Enum: active, abandoned, converted
  }
}
```

### 2.3 CartItem Model

```javascript
class CartItem {
  constructor() {
    this.id = null;              // UUID
    this.cart_id = null;         // UUID (Foreign Key)
    this.product_id = null;      // UUID (Foreign Key)
    this.quantity = 1;           // Integer
    this.price_at_addition = 0.00; // Decimal(10,2)
    this.created_at = null;      // Timestamp
    this.updated_at = null;      // Timestamp
  }
}
```

### 2.4 Order Model

```javascript
class Order {
  constructor() {
    this.id = null;              // UUID
    this.user_id = null;         // UUID (Foreign Key)
    this.total_amount = 0.00;    // Decimal(10,2)
    this.status = 'pending';     // Enum: pending, processing, shipped, delivered, cancelled
    this.shipping_address = {};  // JSON
    this.payment_method = '';    // String
    this.payment_status = 'pending'; // Enum: pending, completed, failed, refunded
    this.created_at = null;      // Timestamp
    this.updated_at = null;      // Timestamp
  }
}
```

### 2.5 OrderItem Model

```javascript
class OrderItem {
  constructor() {
    this.id = null;              // UUID
    this.order_id = null;        // UUID (Foreign Key)
    this.product_id = null;      // UUID (Foreign Key)
    this.quantity = 1;           // Integer
    this.price = 0.00;          // Decimal(10,2)
    this.created_at = null;      // Timestamp
  }
}
```

## 3. Database Schema

### 3.1 Products Table

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT positive_stock CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
```

### 3.2 Carts Table

```sql
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('active', 'abandoned', 'converted'))
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_status ON carts(status);
```

### 3.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_addition DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

### 3.4 Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address JSONB NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_order_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### 3.5 Order Items Table

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

## 4. API Endpoints

### 4.1 Product Endpoints

#### GET /api/products
**Description**: Retrieve a paginated list of products

**Query Parameters**:
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `category_id` (UUID, optional)
- `search` (string, optional)
- `sort_by` (string, optional: price, name, created_at)
- `order` (string, optional: asc, desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "description": "Product description",
        "price": 29.99,
        "stock_quantity": 100,
        "category_id": "uuid",
        "image_url": "https://...",
        "is_active": true
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

#### GET /api/products/:id
**Description**: Retrieve a single product by ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 29.99,
    "stock_quantity": 100,
    "category_id": "uuid",
    "image_url": "https://...",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 4.2 Cart Endpoints

#### GET /api/cart
**Description**: Retrieve the current user's active cart
**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Product Name",
        "quantity": 2,
        "price_at_addition": 29.99,
        "current_price": 29.99,
        "subtotal": 59.98,
        "image_url": "https://..."
      }
    ],
    "total_items": 2,
    "total_amount": 59.98,
    "status": "active"
  }
}
```

#### POST /api/cart/items
**Description**: Add an item to the cart
**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "product_id": "uuid",
  "quantity": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_item_id": "uuid",
    "cart_id": "uuid",
    "product_id": "uuid",
    "quantity": 1,
    "price_at_addition": 29.99
  }
}
```

#### PUT /api/cart/items/:id
**Description**: Update cart item quantity
**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "id": "uuid",
    "quantity": 3,
    "subtotal": 89.97
  }
}
```

#### DELETE /api/cart/items/:id
**Description**: Remove an item from the cart
**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

### 4.3 Order Endpoints

#### POST /api/orders
**Description**: Create a new order from the current cart
**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA"
  },
  "payment_method": "credit_card",
  "payment_token": "stripe_token_here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "uuid",
    "total_amount": 59.98,
    "status": "pending",
    "payment_status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/orders
**Description**: Retrieve user's order history
**Authentication**: Required (JWT)

**Query Parameters**:
- `page` (integer, default: 1)
- `limit` (integer, default: 10)
- `status` (string, optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "total_amount": 59.98,
        "status": "delivered",
        "payment_status": "completed",
        "created_at": "2024-01-01T00:00:00Z",
        "items_count": 2
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 25
    }
  }
}
```

#### GET /api/orders/:id
**Description**: Retrieve detailed order information
**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "total_amount": 59.98,
    "status": "delivered",
    "payment_status": "completed",
    "shipping_address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "USA"
    },
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Product Name",
        "quantity": 2,
        "price": 29.99,
        "subtotal": 59.98
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-05T00:00:00Z"
  }
}
```
