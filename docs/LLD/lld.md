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
- **Container Platform**: Docker
- **Orchestration**: Kubernetes
- **Cloud Provider**: AWS
- **CI/CD**: Jenkins/GitHub Actions

### 3.4 Monitoring and Logging
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM**: New Relic

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
class UserController {
  - userService: UserService
  + register(req, res): Promise<Response>
  + login(req, res): Promise<Response>
  + getProfile(req, res): Promise<Response>
  + updateProfile(req, res): Promise<Response>
  + resetPassword(req, res): Promise<Response>
}

class UserService {
  - userRepository: UserRepository
  - authService: AuthService
  + createUser(userData): Promise<User>
  + authenticateUser(credentials): Promise<AuthToken>
  + getUserById(userId): Promise<User>
  + updateUser(userId, userData): Promise<User>
  + initiatePasswordReset(email): Promise<void>
}

class UserRepository {
  - db: DatabaseConnection
  + save(user): Promise<User>
  + findById(id): Promise<User>
  + findByEmail(email): Promise<User>
  + update(id, data): Promise<User>
  + delete(id): Promise<void>
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
class ProductController {
  - productService: ProductService
  + createProduct(req, res): Promise<Response>
  + getProduct(req, res): Promise<Response>
  + updateProduct(req, res): Promise<Response>
  + deleteProduct(req, res): Promise<Response>
  + searchProducts(req, res): Promise<Response>
}

class ProductService {
  - productRepository: ProductRepository
  - inventoryService: InventoryService
  - searchService: SearchService
  + addProduct(productData): Promise<Product>
  + getProductById(productId): Promise<Product>
  + updateProduct(productId, data): Promise<Product>
  + removeProduct(productId): Promise<void>
  + searchProducts(criteria): Promise<Product[]>
}

class ProductRepository {
  - db: DatabaseConnection
  + save(product): Promise<Product>
  + findById(id): Promise<Product>
  + findByCriteria(criteria): Promise<Product[]>
  + update(id, data): Promise<Product>
  + delete(id): Promise<void>
}
```

### 4.3 Cart Service

#### 4.3.1 Responsibilities
- Shopping cart management
- Cart item operations
- Cart persistence
- Cart validation

#### 4.3.2 Class Diagram
```typescript
class CartController {
  - cartService: CartService
  + getCart(req, res): Promise<Response>
  + addItem(req, res): Promise<Response>
  + updateItem(req, res): Promise<Response>
  + removeItem(req, res): Promise<Response>
  + clearCart(req, res): Promise<Response>
}

class CartService {
  - cartRepository: CartRepository
  - productService: ProductService
  + getCartByUserId(userId): Promise<Cart>
  + addItemToCart(userId, item): Promise<Cart>
  + updateCartItem(userId, itemId, quantity): Promise<Cart>
  + removeItemFromCart(userId, itemId): Promise<Cart>
  + clearUserCart(userId): Promise<void>
}

class CartRepository {
  - cache: RedisConnection
  - db: DatabaseConnection
  + findByUserId(userId): Promise<Cart>
  + save(cart): Promise<Cart>
  + update(userId, cart): Promise<Cart>
  + delete(userId): Promise<void>
}
```

### 4.4 Order Service

#### 4.4.1 Responsibilities
- Order creation and processing
- Order status management
- Order history
- Payment integration

#### 4.4.2 Class Diagram
```typescript
class OrderController {
  - orderService: OrderService
  + createOrder(req, res): Promise<Response>
  + getOrder(req, res): Promise<Response>
  + updateOrderStatus(req, res): Promise<Response>
  + getUserOrders(req, res): Promise<Response>
  + cancelOrder(req, res): Promise<Response>
}

class OrderService {
  - orderRepository: OrderRepository
  - paymentService: PaymentService
  - inventoryService: InventoryService
  + placeOrder(orderData): Promise<Order>
  + getOrderById(orderId): Promise<Order>
  + updateStatus(orderId, status): Promise<Order>
  + getOrdersByUserId(userId): Promise<Order[]>
  + cancelOrder(orderId): Promise<Order>
}

class OrderRepository {
  - db: DatabaseConnection
  + save(order): Promise<Order>
  + findById(id): Promise<Order>
  + findByUserId(userId): Promise<Order[]>
  + update(id, data): Promise<Order>
  + delete(id): Promise<void>
}
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
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
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

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

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
  },
  "message": "Login successful"
}
```

#### 5.1.3 Get User Profile
**Endpoint:** `GET /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 5.1.4 Update User Profile
**Endpoint:** `PUT /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90001",
    "country": "USA"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA"
    },
    "updatedAt": "2024-01-15T11:45:00Z"
  },
  "message": "Profile updated successfully"
}
```

### 5.2 Product Catalog APIs

#### 5.2.1 Get All Products
**Endpoint:** `GET /api/v1/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (price, name, createdAt)
- `sortOrder` (optional): asc or desc

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "description": "High-quality wireless headphones with noise cancellation",
        "price": 199.99,
        "currency": "USD",
        "category": "Electronics",
        "brand": "TechBrand",
        "imageUrl": "https://cdn.example.com/products/headphones.jpg",
        "inStock": true,
        "stockQuantity": 150,
        "rating": 4.5,
        "reviewCount": 230
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

#### 5.2.2 Get Product by ID
**Endpoint:** `GET /api/v1/products/{productId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "productId": "prd_1234567890",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation. Features include 30-hour battery life, premium sound quality, and comfortable design.",
    "price": 199.99,
    "currency": "USD",
    "category": "Electronics",
    "subcategory": "Audio",
    "brand": "TechBrand",
    "images": [
      "https://cdn.example.com/products/headphones-1.jpg",
      "https://cdn.example.com/products/headphones-2.jpg"
    ],
    "specifications": {
      "color": "Black",
      "weight": "250g",
      "batteryLife": "30 hours",
      "connectivity": "Bluetooth 5.0"
    },
    "inStock": true,
    "stockQuantity": 150,
    "rating": 4.5,
    "reviewCount": 230,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T09:30:00Z"
  }
}
```

#### 5.2.3 Search Products
**Endpoint:** `GET /api/v1/products/search`

**Query Parameters:**
- `q`: Search query (required)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "description": "High-quality wireless headphones...",
        "price": 199.99,
        "imageUrl": "https://cdn.example.com/products/headphones.jpg",
        "relevanceScore": 0.95
      }
    ],
    "totalResults": 45,
    "searchQuery": "wireless headphones"
  }
}
```

### 5.3 Cart APIs

#### 5.3.1 Get Cart
**Endpoint:** `GET /api/v1/cart`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cartId": "cart_1234567890",
    "userId": "usr_1234567890",
    "items": [
      {
        "itemId": "item_1234567890",
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "price": 199.99,
        "quantity": 2,
        "imageUrl": "https://cdn.example.com/products/headphones.jpg",
        "subtotal": 399.98
      }
    ],
    "subtotal": 399.98,
    "tax": 32.00,
    "shipping": 10.00,
    "total": 441.98,
    "currency": "USD",
    "itemCount": 2,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 5.3.2 Add Item to Cart
**Endpoint:** `POST /api/v1/cart/items`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "prd_1234567890",
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "cartId": "cart_1234567890",
    "items": [
      {
        "itemId": "item_1234567890",
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "price": 199.99,
        "quantity": 2,
        "subtotal": 399.98
      }
    ],
    "total": 441.98,
    "itemCount": 2
  },
  "message": "Item added to cart successfully"
}
```

#### 5.3.3 Update Cart Item
**Endpoint:** `PUT /api/v1/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cartId": "cart_1234567890",
    "items": [
      {
        "itemId": "item_1234567890",
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "price": 199.99,
        "quantity": 3,
        "subtotal": 599.97
      }
    ],
    "total": 651.97,
    "itemCount": 3
  },
  "message": "Cart item updated successfully"
}
```

#### 5.3.4 Remove Item from Cart
**Endpoint:** `DELETE /api/v1/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cartId": "cart_1234567890",
    "items": [],
    "total": 0.00,
    "itemCount": 0
  },
  "message": "Item removed from cart successfully"
}
```

#### 5.3.5 Clear Cart
**Endpoint:** `DELETE /api/v1/cart`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

### 5.4 Order Management APIs

#### 5.4.1 Create Order
**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
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
    "cardToken": "tok_1234567890"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1234567890",
    "userId": "usr_1234567890",
    "orderNumber": "ORD-2024-001234",
    "status": "pending",
    "items": [
      {
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "price": 199.99,
        "quantity": 2,
        "subtotal": 399.98
      }
    ],
    "subtotal": 399.98,
    "tax": 32.00,
    "shipping": 10.00,
    "total": 441.98,
    "currency": "USD",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedDelivery": "2024-01-20T10:30:00Z"
  },
  "message": "Order created successfully"
}
```

#### 5.4.2 Get Order by ID
**Endpoint:** `GET /api/v1/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1234567890",
    "orderNumber": "ORD-2024-001234",
    "status": "shipped",
    "items": [
      {
        "productId": "prd_1234567890",
        "name": "Wireless Headphones",
        "price": 199.99,
        "quantity": 2,
        "subtotal": 399.98
      }
    ],
    "subtotal": 399.98,
    "tax": 32.00,
    "shipping": 10.00,
    "total": 441.98,
    "currency": "USD",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "trackingNumber": "TRK1234567890",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "status": "processing",
        "timestamp": "2024-01-15T11:00:00Z"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-16T09:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

#### 5.4.3 Get User Orders
**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by order status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ord_1234567890",
        "orderNumber": "ORD-2024-001234",
        "status": "delivered",
        "total": 441.98,
        "currency": "USD",
        "itemCount": 2,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    }
  }
}
```

#### 5.4.4 Cancel Order
**Endpoint:** `POST /api/v1/orders/{orderId}/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "reason": "Changed mind"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1234567890",
    "status": "cancelled",
    "cancelledAt": "2024-01-15T12:00:00Z",
    "refundStatus": "pending",
    "refundAmount": 441.98
  },
  "message": "Order cancelled successfully"
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
│ phone_number    │         │ brand           │
│ created_at      │         │ stock_quantity  │
│ updated_at      │         │ image_url       │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │                           │
         │    ┌─────────────────┐   │
         │    │   Cart_Items    │   │
         └───▶├─────────────────┤◀──┘
              │ cart_item_id(PK)│
              │ user_id (FK)    │
              │ product_id (FK) │
              │ quantity        │
              │ added_at        │
              └────────┬────────┘
                       │
         ┌─────────────┴────────────┐
         │                          │
┌────────▼────────┐        ┌───────▼────────┐
│     Orders      │        │  Order_Items   │
├─────────────────┤        ├────────────────┤
│ order_id (PK)   │◀───────│ order_item_id  │
│ user_id (FK)    │        │ order_id (FK)  │
│ order_number    │        │ product_id(FK) │
│ status          │        │ quantity       │
│ subtotal        │        │ price          │
│ tax             │        │ subtotal       │
│ shipping        │        └────────────────┘
│ total           │
│ shipping_address│
│ billing_address │
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
    phone_number VARCHAR(20),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_zip_code VARCHAR(20),
    address_country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
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
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    image_url VARCHAR(500),
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_name_description (name, description)
);
```

#### 6.2.3 Cart_Items Table
```sql
CREATE TABLE cart_items (
    cart_item_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
);
```

#### 6.2.4 Orders Table
```sql
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address_street VARCHAR(255),
    shipping_address_city VARCHAR(100),
    shipping_address_state VARCHAR(100),
    shipping_address_zip_code VARCHAR(20),
    shipping_address_country VARCHAR(100),
    billing_address_street VARCHAR(255),
    billing_address_city VARCHAR(100),
    billing_address_state VARCHAR(100),
    billing_address_zip_code VARCHAR(20),
    billing_address_country VARCHAR(100),
    tracking_number VARCHAR(100),
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### 6.2.5 Order_Items Table
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

### 6.3 Indexes and Optimization

#### 6.3.1 Primary Indexes
- All tables have primary key indexes on their ID columns
- Composite unique indexes on cart_items (user_id, product_id)

#### 6.3.2 Secondary Indexes
- Users: email, created_at
- Products: category, price, created_at
- Orders: user_id, order_number, status, created_at
- Cart_Items: user_id, product_id
- Order_Items: order_id, product_id

#### 6.3.3 Full-Text Indexes
- Products: name and description for search functionality

---

## 7. Security Implementation

### 7.1 Authentication

#### 7.1.1 JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "usr_1234567890",
    "email": "user@example.com",
    "role": "customer",
    "iat": 1642248000,
    "exp": 1642251600
  }
}
```

#### 7.1.2 Token Management
- **Access Token Expiry**: 1 hour
- **Refresh Token Expiry**: 7 days
- **Token Storage**: HTTP-only cookies for web, secure storage for mobile
- **Token Refresh Endpoint**: `POST /api/v1/auth/refresh`

### 7.2 Password Security

#### 7.2.1 Password Requirements
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot contain common passwords
- Cannot contain user's email or name

#### 7.2.2 Password Hashing
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

### 7.3 API Security

#### 7.3.1 Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 login requests per windowMs
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

const validateUserRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phoneNumber').optional().isMobilePhone('any')
];
```

### 7.4 Data Encryption

#### 7.4.1 In-Transit Encryption
- TLS 1.3 for all API communications
- HTTPS enforced for all endpoints
- Certificate pinning for mobile apps

#### 7.4.2 At-Rest Encryption
- Database encryption using AES-256
- Encrypted backups
- Secure key management using AWS KMS

---

## 8. Error Handling

### 8.1 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/users/register",
    "requestId": "req_1234567890"
  }
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| AUTHENTICATION_ERROR | 401 | Authentication failed |
| AUTHORIZATION_ERROR | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### 8.3 Error Handling Middleware

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any[]
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.id
      }
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id
    }
  });
};
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

#### 9.1.1 Redis Caching
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache product data
async function getCachedProduct(productId: string) {
  const cached = await redis.get(`product:${productId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const product = await productRepository.findById(productId);
  await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
  return product;
}
```

#### 9.1.2 Cache Invalidation
- Product updates: Invalidate product cache
- Cart updates: Invalidate user cart cache
- Order creation: Invalidate cart and inventory cache

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
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

#### 9.2.2 Query Optimization
- Use prepared statements
- Implement pagination for large result sets
- Use appropriate indexes
- Avoid N+1 queries
- Use database views for complex queries

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

function paginate(query: any, { page = 1, limit = 20 }: PaginationParams) {
  const offset = (page - 1) * limit;
  return query.limit(limit).offset(offset);
}
```

---

## 10. Deployment Architecture

### 10.1 Container Configuration

#### 10.1.1 Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

#### 10.1.2 Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
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

#### 10.2.1 Deployment Configuration
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
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
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

### 10.3 CI/CD Pipeline

#### 10.3.1 GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
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
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ecommerce-api api=ecommerce-api:${{ github.sha }}
          kubectl rollout status deployment/ecommerce-api
```

### 10.4 Monitoring and Logging

#### 10.4.1 Prometheus Metrics
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
```

#### 10.4.2 Structured Logging
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

---

## Appendix

### A. Glossary
- **Microservices**: Architectural style structuring an application as a collection of loosely coupled services
- **JWT**: JSON Web Token, a compact URL-safe means of representing claims
- **Redis**: In-memory data structure store used as a database, cache, and message broker
- **PostgreSQL**: Open-source relational database management system
- **Kubernetes**: Container orchestration platform

### B. References
- REST API Design Best Practices
- PostgreSQL Documentation
- Node.js Best Practices
- Docker Documentation
- Kubernetes Documentation

### C. Change Log
| Date | Version | Author | Description |
|------|---------|--------|-------------|
| 2024-01-15 | 1.0 | Engineering Team | Initial LLD document |
| 2024-01-20 | 1.1 | Engineering Team | Updated Cart API specifications |

---

**Document Status:** Approved  
**Last Review Date:** 2024-01-20  
**Next Review Date:** 2024-02-20