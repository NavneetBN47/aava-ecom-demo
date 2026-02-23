# Low Level Design Document
## E-Commerce Platform

### Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-15 | Engineering Team | Initial LLD |
| 1.1 | 2024-01-20 | Engineering Team | Cart API Updates |

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Component Design](#4-component-design)
5. [API Specifications](#5-api-specifications)
   - 5.1 [User Management APIs](#51-user-management-apis)
   - 5.2 [Product Catalog APIs](#52-product-catalog-apis)
   - 5.3 [Cart APIs](#53-cart-apis)
   - 5.4 [Order Management APIs](#54-order-management-apis)
6. [Database Design](#6-database-design)
7. [Security Implementation](#7-security-implementation)
8. [Error Handling](#8-error-handling)
9. [Performance Considerations](#9-performance-considerations)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Introduction

### 1.1 Purpose
This Low Level Design document provides detailed technical specifications for the E-Commerce Platform. It describes the system architecture, component interactions, API specifications, database schema, and implementation details.

### 1.2 Scope
This document covers:
- Detailed component design
- API endpoint specifications
- Database schema and relationships
- Security implementation
- Error handling strategies
- Performance optimization techniques

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **JWT**: JSON Web Token
- **CRUD**: Create, Read, Update, Delete
- **LLD**: Low Level Design
- **HLD**: High Level Design

---

## 2. System Architecture

### 2.1 Architecture Overview
The system follows a microservices architecture pattern with the following key components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │  API    │   │  API    │   │  API    │
   │ Gateway │   │ Gateway │   │ Gateway │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────────────┐
        │              │              │       │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐ ┌▼────────┐
   │  User   │   │ Product │   │  Cart   │ │ Order   │
   │ Service │   │ Service │   │ Service │ │ Service │
   └────┬────┘   └────┬────┘   └────┬────┘ └─┬───────┘
        │              │              │        │
        └──────────────┼──────────────┼────────┘
                       │              │
                  ┌────▼──────────────▼────┐
                  │   Database Cluster     │
                  │   (PostgreSQL)         │
                  └────────────────────────┘
```

### 2.2 Component Interaction Flow
1. Client requests hit the Load Balancer
2. Load Balancer distributes traffic to API Gateway instances
3. API Gateway authenticates and routes requests to appropriate microservices
4. Microservices process requests and interact with the database
5. Responses flow back through the same path

---

## 3. Technology Stack

### 3.1 Backend Technologies
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7.0+
- **Message Queue**: RabbitMQ 3.12+

### 3.2 Infrastructure
- **Container**: Docker 24+
- **Orchestration**: Kubernetes 1.28+
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### 3.3 Security
- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: RBAC (Role-Based Access Control)
- **Encryption**: TLS 1.3, AES-256
- **API Security**: OAuth 2.0, Rate Limiting

---

## 4. Component Design

### 4.1 User Service
**Responsibilities:**
- User registration and authentication
- Profile management
- Session management
- Password reset functionality

**Key Classes:**
```python
class UserService:
    def __init__(self, db_session, cache_client):
        self.db = db_session
        self.cache = cache_client
    
    async def register_user(self, user_data: UserRegistrationDTO) -> User:
        # Validate user data
        # Hash password
        # Create user record
        # Send verification email
        pass
    
    async def authenticate(self, credentials: LoginDTO) -> TokenPair:
        # Verify credentials
        # Generate JWT tokens
        # Cache session
        pass
    
    async def get_user_profile(self, user_id: str) -> UserProfile:
        # Check cache first
        # Fetch from database if not cached
        pass
```

### 4.2 Product Service
**Responsibilities:**
- Product catalog management
- Inventory tracking
- Product search and filtering
- Category management

**Key Classes:**
```python
class ProductService:
    def __init__(self, db_session, search_engine):
        self.db = db_session
        self.search = search_engine
    
    async def create_product(self, product_data: ProductDTO) -> Product:
        # Validate product data
        # Create product record
        # Index in search engine
        pass
    
    async def search_products(self, query: SearchQuery) -> List[Product]:
        # Execute search query
        # Apply filters
        # Return paginated results
        pass
    
    async def update_inventory(self, product_id: str, quantity: int) -> bool:
        # Update stock quantity
        # Trigger low stock alerts if needed
        pass
```

### 4.3 Cart Service
**Responsibilities:**
- Shopping cart management
- Cart item operations (add, update, remove)
- Cart persistence and synchronization
- Price calculation

**Key Classes:**
```python
class CartService:
    def __init__(self, db_session, cache_client, product_service):
        self.db = db_session
        self.cache = cache_client
        self.product_service = product_service
    
    async def add_to_cart(self, user_id: str, cart_item: CartItemDTO) -> Cart:
        # Validate product availability
        # Check quantity constraints
        # Add item to cart
        # Update cart total
        pass
    
    async def update_cart_item(self, user_id: str, item_id: str, quantity: int) -> Cart:
        # Validate quantity
        # Update item quantity
        # Recalculate cart total
        pass
    
    async def remove_from_cart(self, user_id: str, item_id: str) -> Cart:
        # Remove item from cart
        # Update cart total
        pass
    
    async def get_cart(self, user_id: str) -> Cart:
        # Fetch cart from cache or database
        # Validate product availability
        # Return cart with current prices
        pass
```

### 4.4 Order Service
**Responsibilities:**
- Order creation and processing
- Payment integration
- Order status tracking
- Order history management

**Key Classes:**
```python
class OrderService:
    def __init__(self, db_session, payment_gateway, notification_service):
        self.db = db_session
        self.payment = payment_gateway
        self.notifications = notification_service
    
    async def create_order(self, user_id: str, order_data: OrderDTO) -> Order:
        # Validate cart items
        # Reserve inventory
        # Process payment
        # Create order record
        # Send confirmation
        pass
    
    async def update_order_status(self, order_id: str, status: OrderStatus) -> Order:
        # Update order status
        # Trigger status-specific actions
        # Send notifications
        pass
    
    async def get_order_history(self, user_id: str, filters: OrderFilters) -> List[Order]:
        # Fetch user orders
        # Apply filters
        # Return paginated results
        pass
```

---

## 5. API Specifications

### 5.1 User Management APIs

#### 5.1.1 User Registration
**Endpoint:** `POST /api/v1/users/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user_id": "usr_1234567890",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "verification_required": true
}
```

**Validation Rules:**
- Email must be valid format and unique
- Password minimum 8 characters, must contain uppercase, lowercase, number, special character
- Phone number must be valid E.164 format

#### 5.1.2 User Login
**Endpoint:** `POST /api/v1/users/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "usr_1234567890",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### 5.1.3 Get User Profile
**Endpoint:** `GET /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "user_id": "usr_1234567890",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "email_verified": true
}
```

#### 5.1.4 Update User Profile
**Endpoint:** `PUT /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890"
}
```

**Response (200 OK):**
```json
{
  "user_id": "usr_1234567890",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "updated_at": "2024-01-15T11:30:00Z"
}
```

---

### 5.2 Product Catalog APIs

#### 5.2.1 List Products
**Endpoint:** `GET /api/v1/products`

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `category` (string, optional)
- `search` (string, optional)
- `min_price` (decimal, optional)
- `max_price` (decimal, optional)
- `sort_by` (string, options: price_asc, price_desc, name, rating)

**Response (200 OK):**
```json
{
  "products": [
    {
      "product_id": "prd_1234567890",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 99.99,
      "currency": "USD",
      "category": "Electronics",
      "stock_quantity": 150,
      "images": [
        "https://cdn.example.com/products/prd_1234567890_1.jpg"
      ],
      "rating": 4.5,
      "reviews_count": 234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 500,
    "total_pages": 25
  }
}
```

#### 5.2.2 Get Product Details
**Endpoint:** `GET /api/v1/products/{product_id}`

**Response (200 OK):**
```json
{
  "product_id": "prd_1234567890",
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "long_description": "Detailed product description...",
  "price": 99.99,
  "currency": "USD",
  "category": "Electronics",
  "subcategory": "Audio",
  "brand": "TechBrand",
  "stock_quantity": 150,
  "images": [
    "https://cdn.example.com/products/prd_1234567890_1.jpg",
    "https://cdn.example.com/products/prd_1234567890_2.jpg"
  ],
  "specifications": {
    "color": "Black",
    "weight": "250g",
    "battery_life": "30 hours"
  },
  "rating": 4.5,
  "reviews_count": 234,
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-15T09:00:00Z"
}
```

#### 5.2.3 Search Products
**Endpoint:** `GET /api/v1/products/search`

**Query Parameters:**
- `q` (string, required): Search query
- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response (200 OK):**
```json
{
  "query": "wireless headphones",
  "results": [
    {
      "product_id": "prd_1234567890",
      "name": "Wireless Headphones",
      "price": 99.99,
      "image": "https://cdn.example.com/products/prd_1234567890_1.jpg",
      "rating": 4.5,
      "relevance_score": 0.95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

---

### 5.3 Cart APIs

#### 5.3.1 Add Item to Cart
**Endpoint:** `POST /api/v1/cart/add`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "product_id": "prd_1234567890",
  "quantity": 2,
  "price": 99.99
}
```

**Validation Rules:**
- `product_id` must be a valid existing product
- `quantity` must be a positive integer (minimum: 1, maximum: 99)
- `price` must match current product price
- Product must be in stock with sufficient quantity

**Response (200 OK):**
```json
{
  "cart_id": "cart_9876543210",
  "user_id": "usr_1234567890",
  "items": [
    {
      "cart_item_id": "item_1111111111",
      "product_id": "prd_1234567890",
      "product_name": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98,
      "image": "https://cdn.example.com/products/prd_1234567890_1.jpg"
    }
  ],
  "subtotal": 199.98,
  "tax": 15.99,
  "total": 215.97,
  "currency": "USD",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity or product_id
- `404 Not Found`: Product not found
- `409 Conflict`: Insufficient stock

#### 5.3.2 Get Cart
**Endpoint:** `GET /api/v1/cart`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "cart_id": "cart_9876543210",
  "user_id": "usr_1234567890",
  "items": [
    {
      "cart_item_id": "item_1111111111",
      "product_id": "prd_1234567890",
      "product_name": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98,
      "image": "https://cdn.example.com/products/prd_1234567890_1.jpg",
      "in_stock": true
    }
  ],
  "subtotal": 199.98,
  "tax": 15.99,
  "total": 215.97,
  "currency": "USD",
  "item_count": 2,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

#### 5.3.3 Update Cart Item
**Endpoint:** `PUT /api/v1/cart/update`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "cart_item_id": "item_1111111111",
  "quantity": 3
}
```

**Validation Rules:**
- `cart_item_id` must exist in user's cart
- `quantity` must be a positive integer (minimum: 1, maximum: 99)
- Product must have sufficient stock for the requested quantity
- If quantity is 0, the item will be removed from cart

**Response (200 OK):**
```json
{
  "cart_id": "cart_9876543210",
  "user_id": "usr_1234567890",
  "items": [
    {
      "cart_item_id": "item_1111111111",
      "product_id": "prd_1234567890",
      "product_name": "Wireless Headphones",
      "quantity": 3,
      "price": 99.99,
      "subtotal": 299.97,
      "image": "https://cdn.example.com/products/prd_1234567890_1.jpg"
    }
  ],
  "subtotal": 299.97,
  "tax": 23.99,
  "total": 323.96,
  "currency": "USD",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity (must be positive integer, max 99)
- `404 Not Found`: Cart item not found
- `409 Conflict`: Insufficient stock for requested quantity

#### 5.3.4 Remove Item from Cart
**Endpoint:** `DELETE /api/v1/cart/items/{cart_item_id}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "cart_id": "cart_9876543210",
  "user_id": "usr_1234567890",
  "items": [],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "USD",
  "item_count": 0,
  "updated_at": "2024-01-15T13:00:00Z"
}
```

#### 5.3.5 Clear Cart
**Endpoint:** `DELETE /api/v1/cart`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

---

### 5.4 Order Management APIs

#### 5.4.1 Create Order
**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "payment_method": {
    "type": "credit_card",
    "token": "tok_1234567890"
  }
}
```

**Response (201 Created):**
```json
{
  "order_id": "ord_1234567890",
  "user_id": "usr_1234567890",
  "status": "pending",
  "items": [
    {
      "product_id": "prd_1234567890",
      "product_name": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98
    }
  ],
  "subtotal": 199.98,
  "tax": 15.99,
  "shipping_cost": 10.00,
  "total": 225.97,
  "currency": "USD",
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "created_at": "2024-01-15T14:00:00Z",
  "estimated_delivery": "2024-01-20T14:00:00Z"
}
```

#### 5.4.2 Get Order Details
**Endpoint:** `GET /api/v1/orders/{order_id}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "order_id": "ord_1234567890",
  "user_id": "usr_1234567890",
  "status": "shipped",
  "items": [
    {
      "product_id": "prd_1234567890",
      "product_name": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98,
      "image": "https://cdn.example.com/products/prd_1234567890_1.jpg"
    }
  ],
  "subtotal": 199.98,
  "tax": 15.99,
  "shipping_cost": 10.00,
  "total": 225.97,
  "currency": "USD",
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "tracking_number": "TRK123456789",
  "created_at": "2024-01-15T14:00:00Z",
  "updated_at": "2024-01-16T10:00:00Z",
  "estimated_delivery": "2024-01-20T14:00:00Z"
}
```

#### 5.4.3 List Orders
**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `status` (string, optional): pending, processing, shipped, delivered, cancelled

**Response (200 OK):**
```json
{
  "orders": [
    {
      "order_id": "ord_1234567890",
      "status": "shipped",
      "total": 225.97,
      "currency": "USD",
      "item_count": 2,
      "created_at": "2024-01-15T14:00:00Z",
      "estimated_delivery": "2024-01-20T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 15,
    "total_pages": 1
  }
}
```

#### 5.4.4 Cancel Order
**Endpoint:** `POST /api/v1/orders/{order_id}/cancel`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response (200 OK):**
```json
{
  "order_id": "ord_1234567890",
  "status": "cancelled",
  "cancelled_at": "2024-01-15T15:00:00Z",
  "refund_status": "pending",
  "refund_amount": 225.97
}
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     Users       │         │    Products     │
├─────────────────┤         ├─────────────────┤
│ user_id (PK)    │         │ product_id (PK) │
│ email           │         │ name            │
│ password_hash   │         │ description     │
│ first_name      │         │ price           │
│ last_name       │         │ category        │
│ phone           │         │ stock_quantity  │
│ created_at      │         │ created_at      │
│ updated_at      │         │ updated_at      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │                           │
         │    ┌─────────────────┐   │
         │    │   CartItems     │   │
         └───►├─────────────────┤◄──┘
              │ cart_item_id(PK)│
              │ user_id (FK)    │
              │ product_id (FK) │
              │ quantity        │
              │ price           │
              │ created_at      │
              │ updated_at      │
              └────────┬────────┘
                       │
         ┌─────────────┴────────────┐
         │                          │
┌────────▼────────┐        ┌────────▼────────┐
│     Orders      │        │   OrderItems    │
├─────────────────┤        ├─────────────────┤
│ order_id (PK)   │        │ order_item_id   │
│ user_id (FK)    │◄───────│ order_id (FK)   │
│ status          │        │ product_id (FK) │
│ subtotal        │        │ quantity        │
│ tax             │        │ price           │
│ shipping_cost   │        │ subtotal        │
│ total           │        └─────────────────┘
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 6.2 Table Schemas

#### 6.2.1 Users Table
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
```

#### 6.2.2 Products Table
```sql
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    stock_quantity INT NOT NULL DEFAULT 0,
    images JSON,
    specifications JSON,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (name, description)
);
```

#### 6.2.3 CartItems Table
```sql
CREATE TABLE cart_items (
    cart_item_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
);
```

**Model Definition:**
```python
class CartItem:
    """
    Represents an item in a user's shopping cart.
    
    Attributes:
        cart_item_id (str): Unique identifier for the cart item
        user_id (str): Foreign key reference to the user
        product_id (str): Foreign key reference to the product
        quantity (int): Number of items (1-99)
        price (Decimal): Price per unit at time of adding to cart
        created_at (datetime): Timestamp when item was added
        updated_at (datetime): Timestamp of last update
    
    Constraints:
        - quantity must be between 1 and 99 (inclusive)
        - Each user can have only one cart item per product
        - price must be positive
    """
    pass
```

#### 6.2.4 Orders Table
```sql
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    payment_method JSON NOT NULL,
    tracking_number VARCHAR(100),
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### 6.2.5 OrderItems Table
```sql
CREATE TABLE order_items (
    order_item_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);
```

### 6.3 Indexes and Performance

**Primary Indexes:**
- All primary keys have clustered indexes
- Foreign keys have non-clustered indexes

**Composite Indexes:**
```sql
-- For cart queries
CREATE INDEX idx_cart_user_updated ON cart_items(user_id, updated_at DESC);

-- For order history
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- For product search
CREATE INDEX idx_products_category_price ON products(category, price);
```

**Full-Text Search:**
```sql
-- For product search functionality
CREATE FULLTEXT INDEX idx_product_search ON products(name, description, long_description);
```

---

## 7. Security Implementation

### 7.1 Authentication

**JWT Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "usr_1234567890",
    "email": "user@example.com",
    "role": "customer",
    "iat": 1705315200,
    "exp": 1705318800
  }
}
```

**Token Management:**
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Tokens are signed with HS256 algorithm
- Token blacklisting for logout functionality

### 7.2 Authorization

**Role-Based Access Control (RBAC):**
```python
class Roles:
    CUSTOMER = "customer"
    ADMIN = "admin"
    VENDOR = "vendor"

class Permissions:
    # User permissions
    VIEW_OWN_PROFILE = "view:own_profile"
    EDIT_OWN_PROFILE = "edit:own_profile"
    
    # Cart permissions
    MANAGE_OWN_CART = "manage:own_cart"
    
    # Order permissions
    CREATE_ORDER = "create:order"
    VIEW_OWN_ORDERS = "view:own_orders"
    
    # Admin permissions
    MANAGE_PRODUCTS = "manage:products"
    VIEW_ALL_ORDERS = "view:all_orders"
    MANAGE_USERS = "manage:users"

ROLE_PERMISSIONS = {
    Roles.CUSTOMER: [
        Permissions.VIEW_OWN_PROFILE,
        Permissions.EDIT_OWN_PROFILE,
        Permissions.MANAGE_OWN_CART,
        Permissions.CREATE_ORDER,
        Permissions.VIEW_OWN_ORDERS
    ],
    Roles.ADMIN: [
        # All customer permissions plus:
        Permissions.MANAGE_PRODUCTS,
        Permissions.VIEW_ALL_ORDERS,
        Permissions.MANAGE_USERS
    ]
}
```

### 7.3 Data Protection

**Encryption:**
- Passwords: bcrypt with salt rounds = 12
- Sensitive data at rest: AES-256-GCM
- Data in transit: TLS 1.3

**Password Policy:**
```python
PASSWORD_REQUIREMENTS = {
    "min_length": 8,
    "max_length": 128,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digit": True,
    "require_special_char": True,
    "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?"
}
```

### 7.4 API Security

**Rate Limiting:**
```python
RATE_LIMITS = {
    "authentication": "5 per minute",
    "api_general": "100 per minute",
    "api_search": "30 per minute",
    "api_checkout": "10 per minute"
}
```

**CORS Configuration:**
```python
CORS_CONFIG = {
    "allow_origins": ["https://example.com"],
    "allow_methods": ["GET", "POST", "PUT", "DELETE"],
    "allow_headers": ["Authorization", "Content-Type"],
    "max_age": 3600
}
```

**Input Validation:**
- All inputs sanitized against SQL injection
- XSS protection on all text inputs
- CSRF tokens for state-changing operations
- Request size limits enforced

---

## 8. Error Handling

### 8.1 Error Response Format

**Standard Error Response:**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The provided input is invalid",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ],
    "request_id": "req_1234567890",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 8.2 HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | Service temporarily unavailable |

### 8.3 Error Codes

```python
class ErrorCodes:
    # Authentication errors (1000-1099)
    INVALID_CREDENTIALS = "AUTH_1001"
    TOKEN_EXPIRED = "AUTH_1002"
    TOKEN_INVALID = "AUTH_1003"
    UNAUTHORIZED = "AUTH_1004"
    
    # Validation errors (2000-2099)
    INVALID_INPUT = "VAL_2001"
    MISSING_REQUIRED_FIELD = "VAL_2002"
    INVALID_FORMAT = "VAL_2003"
    
    # Resource errors (3000-3099)
    RESOURCE_NOT_FOUND = "RES_3001"
    RESOURCE_ALREADY_EXISTS = "RES_3002"
    RESOURCE_CONFLICT = "RES_3003"
    
    # Business logic errors (4000-4099)
    INSUFFICIENT_STOCK = "BIZ_4001"
    INVALID_QUANTITY = "BIZ_4002"
    CART_EMPTY = "BIZ_4003"
    PAYMENT_FAILED = "BIZ_4004"
    
    # System errors (5000-5099)
    INTERNAL_ERROR = "SYS_5001"
    DATABASE_ERROR = "SYS_5002"
    EXTERNAL_SERVICE_ERROR = "SYS_5003"
```

### 8.4 Exception Handling

```python
class APIException(Exception):
    def __init__(self, code, message, status_code=400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []

@app.exception_handler(APIException)
async def api_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request.state.request_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

**Redis Cache Layers:**
```python
CACHE_KEYS = {
    "user_profile": "user:{user_id}:profile",
    "user_cart": "user:{user_id}:cart",
    "product_details": "product:{product_id}",
    "product_list": "products:list:{category}:{page}",
    "user_session": "session:{session_id}"
}

CACHE_TTL = {
    "user_profile": 3600,  # 1 hour
    "user_cart": 1800,     # 30 minutes
    "product_details": 7200,  # 2 hours
    "product_list": 600,   # 10 minutes
    "user_session": 86400  # 24 hours
}
```

**Cache Invalidation:**
- Write-through caching for user profiles
- Cache-aside pattern for product data
- Automatic invalidation on updates
- TTL-based expiration for all cached data

### 9.2 Database Optimization

**Query Optimization:**
```python
# Use connection pooling
DATABASE_POOL_CONFIG = {
    "pool_size": 20,
    "max_overflow": 10,
    "pool_timeout": 30,
    "pool_recycle": 3600
}

# Implement query result caching
@cache_query(ttl=300)
def get_popular_products(limit=10):
    return db.query(Product)\
        .order_by(Product.rating.desc())\
        .limit(limit)\
        .all()

# Use eager loading to prevent N+1 queries
def get_order_with_items(order_id):
    return db.query(Order)\
        .options(joinedload(Order.items))\
        .filter(Order.order_id == order_id)\
        .first()
```

**Read Replicas:**
- Master database for writes
- Read replicas for read operations
- Automatic failover configuration

### 9.3 API Performance

**Response Compression:**
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Pagination:**
- Default page size: 20 items
- Maximum page size: 100 items
- Cursor-based pagination for large datasets

**Async Operations:**
```python
# Use async/await for I/O operations
async def get_product_details(product_id: str):
    # Check cache first
    cached = await cache.get(f"product:{product_id}")
    if cached:
        return cached
    
    # Fetch from database
    product = await db.query(Product)\
        .filter(Product.product_id == product_id)\
        .first()
    
    # Cache result
    await cache.set(f"product:{product_id}", product, ttl=7200)
    return product
```

### 9.4 Monitoring and Metrics

**Key Performance Indicators:**
```python
METRICS = {
    "api_response_time": "histogram",
    "api_request_count": "counter",
    "database_query_time": "histogram",
    "cache_hit_rate": "gauge",
    "active_users": "gauge",
    "error_rate": "counter"
}
```

**Alerting Thresholds:**
- API response time > 500ms
- Error rate > 1%
- Cache hit rate < 80%
- Database connection pool > 80% utilized

---

## 10. Deployment Architecture

### 10.1 Container Configuration

**Dockerfile Example:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ecommerce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 10.2 Kubernetes Deployment

**Deployment Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
    spec:
      containers:
      - name: api
        image: ecommerce-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service Configuration:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api-service
spec:
  selector:
    app: ecommerce-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

### 10.3 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.11
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    - name: Run tests
      run: pytest --cov=. --cov-report=xml
    - name: Upload coverage
      uses: codecov/codecov-action@v2
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build Docker image
      run: docker build -t ecommerce-api:${{ github.sha }} .
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ecommerce-api:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/ecommerce-api api=ecommerce-api:${{ github.sha }}
        kubectl rollout status deployment/ecommerce-api
```

### 10.4 Environment Configuration

**Environment Variables:**
```python
class Settings:
    # Application
    APP_NAME: str = "E-Commerce API"
    APP_VERSION: str = "1.1.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    
    # Redis
    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int = 50
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list = ["https://example.com"]
    
    # External Services
    PAYMENT_GATEWAY_URL: str
    PAYMENT_GATEWAY_API_KEY: str
    EMAIL_SERVICE_URL: str
    EMAIL_SERVICE_API_KEY: str
```

---

## Appendix

### A. Glossary
- **API Gateway**: Entry point for all client requests
- **Microservice**: Independent, deployable service component
- **JWT**: JSON Web Token for authentication
- **RBAC**: Role-Based Access Control
- **ORM**: Object-Relational Mapping
- **TTL**: Time To Live (cache expiration)

### B. References
- FastAPI Documentation: https://fastapi.tiangolo.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Redis Documentation: https://redis.io/documentation
- JWT Specification: https://jwt.io/
- REST API Best Practices: https://restfulapi.net/

### C. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial LLD document | Engineering Team |
| 2024-01-20 | 1.1 | Updated Cart API section with new endpoint, validation rules, and model definition. Removed deprecated cart merge endpoint. | Engineering Team |

---

**Document Status:** Approved  
**Last Updated:** 2024-01-20  
**Next Review Date:** 2024-02-20