# Low Level Design Document
## E-Commerce Platform

### Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-15 | Engineering Team | Initial LLD |
| 1.1 | 2024-01-20 | Engineering Team | Cart API Updates |
| 1.2 | 2024-01-21 | Engineering Team | Added empty cart handling, default quantity behavior, and price snapshot documentation |

### 1. System Overview

#### 1.1 Purpose
This document provides the low-level design for an e-commerce platform that enables users to browse products, manage shopping carts, and complete purchases.

#### 1.2 Scope
The system includes:
- Product catalog management
- Shopping cart functionality
- Order processing
- User authentication and authorization
- Payment integration

### 2. Architecture

#### 2.1 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **API Style**: RESTful

#### 2.2 System Components

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Auth │  │ Cart │
│Service│  │Service│
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │Database │
    └─────────┘
```

### 3. Database Design

#### 3.1 Schema

**Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Products Table**
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cart Table**
```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cart Items Table**
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_snapshot DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Orders Table**
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. API Specifications

#### 4.1 Authentication APIs

**POST /api/auth/register**
- Description: Register a new user
- Request Body:
```json
{
    "email": "user@example.com",
    "password": "securePassword123",
    "first_name": "John",
    "last_name": "Doe"
}
```
- Response (201):
```json
{
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "token": "jwt_token_here"
}
```

**POST /api/auth/login**
- Description: Authenticate user
- Request Body:
```json
{
    "email": "user@example.com",
    "password": "securePassword123"
}
```
- Response (200):
```json
{
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
}
```

#### 4.2 Product APIs

**GET /api/products**
- Description: Get all products with pagination
- Query Parameters:
  - page (default: 1)
  - limit (default: 20)
  - category (optional)
- Response (200):
```json
{
    "products": [
        {
            "id": 1,
            "name": "Product Name",
            "description": "Product description",
            "price": 29.99,
            "stock_quantity": 100,
            "category_id": 1
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 100
    }
}
```

**GET /api/products/:id**
- Description: Get product details
- Response (200):
```json
{
    "id": 1,
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 29.99,
    "stock_quantity": 100,
    "category_id": 1,
    "images": ["url1", "url2"]
}
```

#### 4.3 Cart APIs

**GET /api/cart**
- Description: Get current user's cart
- Headers: Authorization: Bearer {token}
- Response (200) - Cart with items:
```json
{
    "id": 1,
    "user_id": 1,
    "items": [
        {
            "id": 1,
            "product_id": 1,
            "product_name": "Product Name",
            "quantity": 2,
            "price_snapshot": 29.99,
            "subtotal": 59.98
        }
    ],
    "total": 59.98
}
```
- Response (200) - Empty cart:
```json
{
    "id": 1,
    "user_id": 1,
    "items": [],
    "total": 0
}
```

**POST /api/cart/items**
- Description: Add item to cart
- Headers: Authorization: Bearer {token}
- Request Body:
```json
{
    "product_id": 1,
    "quantity": 2
}
```
- Behavior:
  - If quantity is not provided, defaults to 1
  - Captures current product price as price_snapshot
  - If item already exists in cart, updates quantity
- Response (201):
```json
{
    "id": 1,
    "cart_id": 1,
    "product_id": 1,
    "quantity": 2,
    "price_snapshot": 29.99,
    "subtotal": 59.98
}
```

**PUT /api/cart/items/:id**
- Description: Update cart item quantity
- Headers: Authorization: Bearer {token}
- Request Body:
```json
{
    "quantity": 3
}
```
- Response (200):
```json
{
    "id": 1,
    "cart_id": 1,
    "product_id": 1,
    "quantity": 3,
    "price_snapshot": 29.99,
    "subtotal": 89.97
}
```

**DELETE /api/cart/items/:id**
- Description: Remove item from cart
- Headers: Authorization: Bearer {token}
- Response (204): No content

#### 4.4 Order APIs

**POST /api/orders**
- Description: Create order from cart
- Headers: Authorization: Bearer {token}
- Request Body:
```json
{
    "shipping_address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001"
    },
    "payment_method": "credit_card"
}
```
- Response (201):
```json
{
    "id": 1,
    "user_id": 1,
    "total_amount": 59.98,
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
}
```

**GET /api/orders/:id**
- Description: Get order details
- Headers: Authorization: Bearer {token}
- Response (200):
```json
{
    "id": 1,
    "user_id": 1,
    "total_amount": 59.98,
    "status": "completed",
    "items": [
        {
            "product_id": 1,
            "product_name": "Product Name",
            "quantity": 2,
            "price": 29.99
        }
    ],
    "created_at": "2024-01-15T10:30:00Z"
}
```

### 5. Business Logic

#### 5.1 Cart Management

**Add to Cart Flow**
1. Validate user authentication
2. Check if product exists and has sufficient stock
3. Get or create cart for user
4. Check if product already in cart
   - If yes: Update quantity
   - If no: Create new cart item with quantity (default: 1)
5. Capture current product price as price_snapshot
6. Update cart timestamp
7. Return updated cart item

**Cart Item Price Snapshot**
- When an item is added to cart, the current product price is captured in the `price_snapshot` field
- This ensures that price changes don't affect items already in the cart
- The snapshot price is used for calculating subtotals and order totals

**Empty Cart Handling**
- When a cart has no items, the API returns an empty items array
- Total is calculated as 0
- Cart structure is maintained for consistency

**Checkout Flow**
1. Validate cart has items
2. Verify stock availability for all items
3. Calculate total amount
4. Create order record
5. Create order items from cart items
6. Process payment
7. Update product stock
8. Clear cart
9. Send confirmation email

#### 5.2 Stock Management

**Stock Validation**
- Check stock before adding to cart
- Reserve stock during checkout
- Release stock if payment fails
- Update stock after successful order

### 6. Security

#### 6.1 Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token mechanism

#### 6.2 Authorization
- Role-based access control (RBAC)
- User can only access their own cart and orders
- Admin role for product management

#### 6.3 Data Protection
- Password hashing using bcrypt
- HTTPS for all API communications
- Input validation and sanitization
- SQL injection prevention using parameterized queries

### 7. Error Handling

#### 7.1 Error Response Format
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {}
    }
}
```

#### 7.2 Common Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `CART_001`: Product not found
- `CART_002`: Insufficient stock
- `ORDER_001`: Invalid order status
- `PAYMENT_001`: Payment processing failed

### 8. Performance Considerations

#### 8.1 Caching Strategy
- Product catalog cached in Redis (TTL: 1 hour)
- User session cached (TTL: 24 hours)
- Cart data cached (TTL: 30 minutes)

#### 8.2 Database Optimization
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

### 9. Monitoring and Logging

#### 9.1 Logging
- Request/response logging
- Error logging with stack traces
- Performance metrics logging

#### 9.2 Monitoring
- API response time monitoring
- Database query performance
- Error rate tracking
- System resource utilization

### 10. Deployment

#### 10.1 Environment Configuration
- Development
- Staging
- Production

#### 10.2 CI/CD Pipeline
- Automated testing
- Code quality checks
- Automated deployment

---

**Document Status**: Approved
**Last Updated**: 2024-01-21
**Next Review**: 2024-02-21