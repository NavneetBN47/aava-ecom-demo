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
- **Runtime**: Node.js 18.x LTS
- **Framework**: Express.js 4.18.x
- **Language**: TypeScript 5.x
- **API Documentation**: Swagger/OpenAPI 3.0

### 3.2 Database
- **Primary Database**: PostgreSQL 15.x
- **Caching Layer**: Redis 7.x
- **Search Engine**: Elasticsearch 8.x

### 3.3 Infrastructure
- **Container Runtime**: Docker 24.x
- **Orchestration**: Kubernetes 1.28.x
- **Cloud Provider**: AWS
- **CI/CD**: GitHub Actions

### 3.4 Monitoring and Logging
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger

---

## 4. Component Design

### 4.1 User Service

#### 4.1.1 Responsibilities
- User registration and authentication
- Profile management
- Password reset functionality
- Session management

#### 4.1.2 Class Diagram
```typescript
class UserService {
  private userRepository: UserRepository;
  private authService: AuthService;
  private emailService: EmailService;
  
  async registerUser(userData: UserRegistrationDTO): Promise<User>;
  async authenticateUser(credentials: LoginDTO): Promise<AuthToken>;
  async getUserProfile(userId: string): Promise<UserProfile>;
  async updateProfile(userId: string, updates: ProfileUpdateDTO): Promise<User>;
  async resetPassword(email: string): Promise<void>;
}

class UserRepository {
  async create(user: User): Promise<User>;
  async findById(id: string): Promise<User | null>;
  async findByEmail(email: string): Promise<User | null>;
  async update(id: string, updates: Partial<User>): Promise<User>;
  async delete(id: string): Promise<void>;
}
```

### 4.2 Product Service

#### 4.2.1 Responsibilities
- Product catalog management
- Inventory tracking
- Product search and filtering
- Category management

#### 4.2.2 Class Diagram
```typescript
class ProductService {
  private productRepository: ProductRepository;
  private inventoryService: InventoryService;
  private searchService: SearchService;
  
  async createProduct(productData: ProductDTO): Promise<Product>;
  async getProduct(productId: string): Promise<Product>;
  async searchProducts(criteria: SearchCriteria): Promise<Product[]>;
  async updateInventory(productId: string, quantity: number): Promise<void>;
}

class ProductRepository {
  async create(product: Product): Promise<Product>;
  async findById(id: string): Promise<Product | null>;
  async search(criteria: SearchCriteria): Promise<Product[]>;
  async update(id: string, updates: Partial<Product>): Promise<Product>;
}
```

### 4.3 Cart Service

#### 4.3.1 Responsibilities
- Shopping cart management
- Cart item operations
- Cart persistence
- Price calculations

#### 4.3.2 Class Diagram
```typescript
class CartService {
  private cartRepository: CartRepository;
  private productService: ProductService;
  private pricingService: PricingService;
  
  async getCart(userId: string): Promise<Cart>;
  async addItem(userId: string, item: CartItemDTO): Promise<Cart>;
  async updateItem(userId: string, itemId: string, quantity: number): Promise<Cart>;
  async removeItem(userId: string, itemId: string): Promise<Cart>;
  async clearCart(userId: string): Promise<void>;
  async calculateTotal(userId: string): Promise<CartTotal>;
}
```

### 4.4 Order Service

#### 4.4.1 Responsibilities
- Order creation and processing
- Order status management
- Payment integration
- Order history

#### 4.4.2 Class Diagram
```typescript
class OrderService {
  private orderRepository: OrderRepository;
  private paymentService: PaymentService;
  private inventoryService: InventoryService;
  private notificationService: NotificationService;
  
  async createOrder(userId: string, orderData: OrderDTO): Promise<Order>;
  async getOrder(orderId: string): Promise<Order>;
  async getUserOrders(userId: string): Promise<Order[]>;
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  async cancelOrder(orderId: string): Promise<void>;
}
```

---

## 5. API Specifications

### 5.1 User Management APIs

#### 5.1.1 Register User
**Endpoint**: `POST /api/v1/users/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

**Error Responses**:
- 400 Bad Request: Invalid input data
- 409 Conflict: Email already exists
- 500 Internal Server Error: Server error

#### 5.1.2 Login User
**Endpoint**: `POST /api/v1/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "userId": "usr_1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### 5.1.3 Get User Profile
**Endpoint**: `GET /api/v1/users/profile`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "addresses": [
      {
        "addressId": "addr_001",
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "isDefault": true
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5.2 Product Catalog APIs

#### 5.2.1 Get All Products
**Endpoint**: `GET /api/v1/products`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (price, name, createdAt)
- `sortOrder` (optional): asc or desc

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "description": "High-quality wireless headphones",
        "price": 99.99,
        "currency": "USD",
        "category": "Electronics",
        "inventory": 50,
        "images": [
          "https://cdn.example.com/products/prod_001_1.jpg"
        ],
        "rating": 4.5,
        "reviewCount": 128
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

#### 5.2.2 Get Product Details
**Endpoint**: `GET /api/v1/products/{productId}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "longDescription": "Detailed product description...",
    "price": 99.99,
    "currency": "USD",
    "category": "Electronics",
    "subcategory": "Audio",
    "brand": "TechBrand",
    "sku": "WH-001",
    "inventory": 50,
    "images": [
      "https://cdn.example.com/products/prod_001_1.jpg",
      "https://cdn.example.com/products/prod_001_2.jpg"
    ],
    "specifications": {
      "color": "Black",
      "weight": "250g",
      "batteryLife": "30 hours"
    },
    "rating": 4.5,
    "reviewCount": 128,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### 5.3 Cart APIs

#### 5.3.1 Get Cart
**Endpoint**: `GET /api/v1/cart`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cartId": "cart_usr_1234567890",
    "userId": "usr_1234567890",
    "items": [
      {
        "itemId": "item_001",
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98,
        "image": "https://cdn.example.com/products/prod_001_1.jpg"
      }
    ],
    "summary": {
      "subtotal": 199.98,
      "tax": 15.99,
      "shipping": 10.00,
      "total": 225.97
    },
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

#### 5.3.2 Add Item to Cart
**Endpoint**: `POST /api/v1/cart/items`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "productId": "prod_001",
  "quantity": 2
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "cartId": "cart_usr_1234567890",
    "items": [
      {
        "itemId": "item_001",
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98
      }
    ],
    "summary": {
      "subtotal": 199.98,
      "tax": 15.99,
      "shipping": 10.00,
      "total": 225.97
    }
  },
  "message": "Item added to cart successfully"
}
```

#### 5.3.3 Update Cart Item
**Endpoint**: `PUT /api/v1/cart/items/{itemId}`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cartId": "cart_usr_1234567890",
    "items": [
      {
        "itemId": "item_001",
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "price": 99.99,
        "quantity": 3,
        "subtotal": 299.97
      }
    ],
    "summary": {
      "subtotal": 299.97,
      "tax": 23.99,
      "shipping": 10.00,
      "total": 333.96
    }
  },
  "message": "Cart item updated successfully"
}
```

#### 5.3.4 Remove Item from Cart
**Endpoint**: `DELETE /api/v1/cart/items/{itemId}`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cartId": "cart_usr_1234567890",
    "items": [],
    "summary": {
      "subtotal": 0.00,
      "tax": 0.00,
      "shipping": 0.00,
      "total": 0.00
    }
  },
  "message": "Item removed from cart successfully"
}
```

### 5.4 Order Management APIs

#### 5.4.1 Create Order
**Endpoint**: `POST /api/v1/orders`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
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
  },
  "paymentMethod": {
    "type": "credit_card",
    "token": "tok_visa_1234"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1234567890",
    "userId": "usr_1234567890",
    "status": "pending",
    "items": [
      {
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98
      }
    ],
    "summary": {
      "subtotal": 199.98,
      "tax": 15.99,
      "shipping": 10.00,
      "total": 225.97
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2024-01-15T15:00:00Z",
    "estimatedDelivery": "2024-01-20T15:00:00Z"
  },
  "message": "Order created successfully"
}
```

#### 5.4.2 Get Order Details
**Endpoint**: `GET /api/v1/orders/{orderId}`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1234567890",
    "userId": "usr_1234567890",
    "status": "shipped",
    "items": [
      {
        "productId": "prod_001",
        "name": "Wireless Headphones",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98
      }
    ],
    "summary": {
      "subtotal": 199.98,
      "tax": 15.99,
      "shipping": 10.00,
      "total": 225.97
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "tracking": {
      "carrier": "UPS",
      "trackingNumber": "1Z999AA10123456784",
      "url": "https://www.ups.com/track?tracknum=1Z999AA10123456784"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T15:00:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T15:30:00Z"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-16T10:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T15:00:00Z",
    "estimatedDelivery": "2024-01-20T15:00:00Z"
  }
}
```

#### 5.4.3 Get User Orders
**Endpoint**: `GET /api/v1/orders`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ord_1234567890",
        "status": "shipped",
        "total": 225.97,
        "itemCount": 2,
        "createdAt": "2024-01-15T15:00:00Z",
        "estimatedDelivery": "2024-01-20T15:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10
    }
  }
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
│ phone_number    │         │ inventory       │
│ created_at      │         │ created_at      │
│ updated_at      │         │ updated_at      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 1                         │
         │                           │
         │ N                         │ N
         │                           │
┌────────▼────────┐         ┌────────▼────────┐
│     Carts       │         │   Cart_Items    │
├─────────────────┤         ├─────────────────┤
│ cart_id (PK)    │    1    │ item_id (PK)    │
│ user_id (FK)    ├─────────┤ cart_id (FK)    │
│ created_at      │    N    │ product_id (FK) │
│ updated_at      │         │ quantity        │
└────────┬────────┘         │ price           │
         │                  │ created_at      │
         │                  └─────────────────┘
         │ 1
         │
         │ N
         │
┌────────▼────────┐         ┌─────────────────┐
│     Orders      │         │  Order_Items    │
├─────────────────┤         ├─────────────────┤
│ order_id (PK)   │    1    │ item_id (PK)    │
│ user_id (FK)    ├─────────┤ order_id (FK)   │
│ status          │    N    │ product_id (FK) │
│ total_amount    │         │ quantity        │
│ shipping_addr   │         │ price           │
│ billing_addr    │         │ subtotal        │
│ created_at      │         └─────────────────┘
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
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
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
    sku VARCHAR(100) UNIQUE,
    inventory INT DEFAULT 0,
    images JSON,
    specifications JSON,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (name, description)
);
```

#### 6.2.3 Carts Table
```sql
CREATE TABLE carts (
    cart_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

#### 6.2.4 Cart Items Table
```sql
CREATE TABLE cart_items (
    item_id VARCHAR(50) PRIMARY KEY,
    cart_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id),
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);
```

#### 6.2.5 Orders Table
```sql
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    payment_method JSON NOT NULL,
    tracking_info JSON,
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### 6.2.6 Order Items Table
```sql
CREATE TABLE order_items (
    item_id VARCHAR(50) PRIMARY KEY,
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

### 6.3 Indexes and Optimization

#### 6.3.1 Primary Indexes
- All tables have primary key indexes on their ID columns
- Foreign key columns are indexed for join optimization

#### 6.3.2 Secondary Indexes
- Email index on users table for login queries
- Category and price indexes on products for filtering
- Status index on orders for status-based queries
- Full-text search index on product name and description

#### 6.3.3 Composite Indexes
```sql
-- For cart item uniqueness
CREATE UNIQUE INDEX idx_cart_product ON cart_items(cart_id, product_id);

-- For order history queries
CREATE INDEX idx_user_status_date ON orders(user_id, status, created_at);

-- For product search and filtering
CREATE INDEX idx_category_price ON products(category, price);
```

---

## 7. Security Implementation

### 7.1 Authentication

#### 7.1.1 JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

#### 7.1.2 Token Generation
```typescript
function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256'
  });
}

function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256'
  });
}
```

### 7.2 Password Security

#### 7.2.1 Password Hashing
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

#### 7.2.2 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 7.3 API Security

#### 7.3.1 Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.'
});
```

#### 7.3.2 CORS Configuration
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

#### 7.3.3 Input Validation
```typescript
import { body, validationResult } from 'express-validator';

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
  body('phoneNumber').optional().isMobilePhone('any')
];
```

### 7.4 Data Encryption

#### 7.4.1 Encryption at Rest
- Database encryption using AES-256
- Encrypted backups
- Secure key management using AWS KMS

#### 7.4.2 Encryption in Transit
- TLS 1.3 for all API communications
- HTTPS only (HSTS enabled)
- Certificate pinning for mobile apps

---

## 8. Error Handling

### 8.1 Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 401 | Invalid token |
| AUTH_004 | 403 | Insufficient permissions |
| VAL_001 | 400 | Invalid input data |
| VAL_002 | 400 | Missing required field |
| RES_001 | 404 | Resource not found |
| RES_002 | 409 | Resource already exists |
| BUS_001 | 400 | Insufficient inventory |
| BUS_002 | 400 | Invalid cart operation |
| BUS_003 | 400 | Payment failed |
| SYS_001 | 500 | Internal server error |
| SYS_002 | 503 | Service unavailable |

### 8.3 Error Handling Middleware

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId
      }
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', {
    error: err,
    stack: err.stack,
    requestId,
    path: req.path
  });
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'SYS_001',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId
    }
  });
}
```

### 8.4 Validation Error Handling

```typescript
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.headers['x-request-id'] || uuidv4()
      }
    });
  }
  
  next();
}
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

#### 9.1.1 Redis Cache Implementation
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

#### 9.1.2 Cache Keys and TTL

| Resource | Cache Key Pattern | TTL |
|----------|------------------|-----|
| Product Details | `product:{productId}` | 1 hour |
| Product List | `products:page:{page}:limit:{limit}` | 15 minutes |
| User Profile | `user:{userId}:profile` | 30 minutes |
| Cart | `cart:{userId}` | 1 hour |
| Categories | `categories:all` | 24 hours |

### 9.2 Database Optimization

#### 9.2.1 Connection Pooling
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 9.2.2 Query Optimization
- Use prepared statements to prevent SQL injection and improve performance
- Implement pagination for large result sets
- Use appropriate indexes for frequently queried columns
- Avoid N+1 query problems using joins or batch loading

### 9.3 API Response Optimization

#### 9.3.1 Response Compression
```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));
```

#### 9.3.2 Pagination
```typescript
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function paginate<T>(items: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data: items,
    pagination: {
      currentPage: params.page,
      totalPages,
      totalItems: total,
      itemsPerPage: params.limit,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1
    }
  };
}
```

### 9.4 Load Balancing

#### 9.4.1 Nginx Configuration
```nginx
upstream api_backend {
    least_conn;
    server api1.example.com:3000 weight=3;
    server api2.example.com:3000 weight=3;
    server api3.example.com:3000 weight=2;
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 10. Deployment Architecture

### 10.1 Kubernetes Deployment

#### 10.1.1 Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
  namespace: production
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
        image: ecommerce-api:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
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
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 10.1.2 Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api-service
  namespace: production
spec:
  selector:
    app: ecommerce-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 10.2 CI/CD Pipeline

#### 10.2.1 GitHub Actions Workflow
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
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Run linter
      run: npm run lint

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
        kubectl set image deployment/ecommerce-api api=ecommerce-api:${{ github.sha }} -n production
        kubectl rollout status deployment/ecommerce-api -n production
```

### 10.3 Monitoring and Logging

#### 10.3.1 Prometheus Metrics
```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware to track metrics
function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, req.route?.path || req.path, res.statusCode.toString()).inc();
  });
  
  next();
}
```

#### 10.3.2 Structured Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 10.4 Backup and Disaster Recovery

#### 10.4.1 Database Backup Strategy
- Automated daily backups at 2 AM UTC
- Retention policy: 30 days for daily backups, 12 months for monthly backups
- Backup stored in multiple geographic regions
- Regular restore testing (monthly)

#### 10.4.2 Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Failover Procedure**:
   - Automatic failover to standby database
   - DNS update to point to backup region
   - Service health verification
   - Incident notification to stakeholders

---

## Appendix A: Glossary

- **API Gateway**: Entry point for all client requests
- **Microservice**: Independent, deployable service component
- **JWT**: JSON Web Token for authentication
- **Redis**: In-memory data structure store used for caching
- **PostgreSQL**: Relational database management system
- **Kubernetes**: Container orchestration platform
- **Load Balancer**: Distributes incoming traffic across multiple servers

---

## Appendix B: References

1. REST API Design Best Practices
2. PostgreSQL Performance Tuning Guide
3. Kubernetes Documentation
4. Node.js Security Best Practices
5. OAuth 2.0 Specification

---

## Document Control

**Document Owner:** Engineering Team  
**Last Updated:** 2024-01-20  
**Next Review Date:** 2024-02-20