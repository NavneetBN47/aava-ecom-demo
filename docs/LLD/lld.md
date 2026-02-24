# Low Level Design Document
## E-Commerce Platform

### Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-15 | Engineering Team | Initial LLD |
| 1.1 | 2024-01-20 | Engineering Team | Cart API Updates |

### 1. Introduction

#### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-Commerce Platform. It describes the system architecture, component interactions, data models, and API specifications required for implementation.

#### 1.2 Scope
This document covers:
- Detailed component design
- Database schema design
- API specifications
- Security implementation
- Performance optimization strategies

#### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **CDN**: Content Delivery Network

### 2. System Architecture

#### 2.1 Architecture Overview
The system follows a microservices architecture pattern with the following key components:

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │   API   │      │   API   │      │   API   │
   │ Gateway │      │ Gateway │      │ Gateway │
   └────┬────┘      └────┬────┘      └────┬────┘
        │                │                 │
        └────────────────┼─────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │  User   │     │ Product │     │  Order  │
   │ Service │     │ Service │     │ Service │
   └────┬────┘     └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │Database │
                    │ Cluster │
                    └─────────┘
```

#### 2.2 Component Details

##### 2.2.1 API Gateway
- **Technology**: Node.js with Express
- **Responsibilities**:
  - Request routing
  - Authentication/Authorization
  - Rate limiting
  - Request/Response transformation
  - API versioning

##### 2.2.2 User Service
- **Technology**: Java Spring Boot
- **Responsibilities**:
  - User registration and authentication
  - Profile management
  - Password management
  - Session management

##### 2.2.3 Product Service
- **Technology**: Python FastAPI
- **Responsibilities**:
  - Product catalog management
  - Inventory management
  - Product search and filtering
  - Category management

##### 2.2.4 Order Service
- **Technology**: Java Spring Boot
- **Responsibilities**:
  - Order creation and management
  - Payment processing
  - Order status tracking
  - Invoice generation

### 3. Database Design

#### 3.1 Database Schema

##### 3.1.1 Users Table
```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    INDEX idx_email (email),
    INDEX idx_status (status)
);
```

##### 3.1.2 Products Table
```sql
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id BIGINT,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    INDEX idx_category (category_id),
    INDEX idx_sku (sku),
    INDEX idx_status (status),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

##### 3.1.3 Orders Table
```sql
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    shipping_address_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id)
);
```

##### 3.1.4 Order Items Table
```sql
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

### 4. API Specifications

#### 4.1 User Service APIs

##### 4.1.1 User Registration
```
POST /api/v1/users/register

Request Body:
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
}

Response (201 Created):
{
    "user_id": 12345,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Error Responses:
- 400 Bad Request: Invalid input data
- 409 Conflict: Email already exists
```

##### 4.1.2 User Login
```
POST /api/v1/users/login

Request Body:
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}

Response (200 OK):
{
    "user_id": 12345,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-16T10:30:00Z"
}

Error Responses:
- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Account suspended
```

#### 4.2 Product Service APIs

##### 4.2.1 Get Products
```
GET /api/v1/products?page=1&limit=20&category=electronics&sort=price_asc

Response (200 OK):
{
    "products": [
        {
            "product_id": 1001,
            "name": "Laptop",
            "description": "High-performance laptop",
            "price": 999.99,
            "category": "Electronics",
            "stock_quantity": 50,
            "sku": "LAP-001",
            "image_url": "https://cdn.example.com/laptop.jpg"
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 100,
        "items_per_page": 20
    }
}
```

##### 4.2.2 Get Product Details
```
GET /api/v1/products/{product_id}

Response (200 OK):
{
    "product_id": 1001,
    "name": "Laptop",
    "description": "High-performance laptop with 16GB RAM",
    "price": 999.99,
    "category": "Electronics",
    "stock_quantity": 50,
    "sku": "LAP-001",
    "specifications": {
        "processor": "Intel i7",
        "ram": "16GB",
        "storage": "512GB SSD"
    },
    "images": [
        "https://cdn.example.com/laptop-1.jpg",
        "https://cdn.example.com/laptop-2.jpg"
    ],
    "reviews_count": 45,
    "average_rating": 4.5
}

Error Responses:
- 404 Not Found: Product not found
```

#### 4.3 Order Service APIs

##### 4.3.1 Create Order
```
POST /api/v1/orders

Headers:
Authorization: Bearer {token}

Request Body:
{
    "items": [
        {
            "product_id": 1001,
            "quantity": 2
        },
        {
            "product_id": 1002,
            "quantity": 1
        }
    ],
    "shipping_address_id": 5001,
    "payment_method": "credit_card"
}

Response (201 Created):
{
    "order_id": 9001,
    "order_number": "ORD-2024-001",
    "total_amount": 2999.97,
    "status": "pending",
    "payment_status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "items": [
        {
            "product_id": 1001,
            "product_name": "Laptop",
            "quantity": 2,
            "unit_price": 999.99,
            "subtotal": 1999.98
        },
        {
            "product_id": 1002,
            "product_name": "Mouse",
            "quantity": 1,
            "unit_price": 999.99,
            "subtotal": 999.99
        }
    ]
}

Error Responses:
- 400 Bad Request: Invalid order data
- 401 Unauthorized: Invalid or missing token
- 422 Unprocessable Entity: Insufficient stock
```

##### 4.3.2 Get Order Details
```
GET /api/v1/orders/{order_id}

Headers:
Authorization: Bearer {token}

Response (200 OK):
{
    "order_id": 9001,
    "order_number": "ORD-2024-001",
    "user_id": 12345,
    "total_amount": 2999.97,
    "status": "confirmed",
    "payment_status": "completed",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "items": [...],
    "shipping_address": {...},
    "tracking_number": "TRK123456789"
}

Error Responses:
- 401 Unauthorized: Invalid or missing token
- 403 Forbidden: Not authorized to view this order
- 404 Not Found: Order not found
```

### 5. Security Implementation

#### 5.1 Authentication
- **Method**: JWT (JSON Web Tokens)
- **Token Expiration**: 24 hours
- **Refresh Token**: 30 days
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

#### 5.2 Authorization
- **RBAC Implementation**:
  - Admin: Full system access
  - Customer: Limited to own data
  - Guest: Read-only access to products

#### 5.3 Data Encryption
- **In Transit**: TLS 1.3
- **At Rest**: AES-256 encryption for sensitive data
- **Password Hashing**: bcrypt with salt rounds = 12

#### 5.4 API Security
- Rate limiting: 100 requests per minute per IP
- CORS configuration for allowed origins
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- XSS protection headers

### 6. Performance Optimization

#### 6.1 Caching Strategy
- **Redis Cache**:
  - Product catalog: 1 hour TTL
  - User sessions: 24 hours TTL
  - API responses: 5 minutes TTL

#### 6.2 Database Optimization
- Indexing on frequently queried columns
- Query optimization using EXPLAIN
- Connection pooling (min: 10, max: 50)
- Read replicas for read-heavy operations

#### 6.3 CDN Configuration
- Static assets served via CDN
- Image optimization and lazy loading
- Gzip compression enabled

### 7. Error Handling

#### 7.1 Error Response Format
```json
{
    "error": {
        "code": "PRODUCT_NOT_FOUND",
        "message": "The requested product does not exist",
        "details": {
            "product_id": 1001
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "request_id": "req-123456"
    }
}
```

#### 7.2 HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error
- 503: Service Unavailable

### 8. Logging and Monitoring

#### 8.1 Logging Strategy
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Log Format**: JSON structured logs
- **Log Storage**: Elasticsearch
- **Log Retention**: 90 days

#### 8.2 Monitoring Metrics
- API response times
- Error rates
- Database query performance
- Cache hit/miss ratios
- System resource utilization

### 9. Deployment Architecture

#### 9.1 Container Configuration
- **Docker Images**: Alpine-based for minimal size
- **Orchestration**: Kubernetes
- **Replicas**: Minimum 3 per service
- **Auto-scaling**: Based on CPU/Memory thresholds

#### 9.2 CI/CD Pipeline
- **Source Control**: Git
- **CI Tool**: Jenkins
- **Deployment Strategy**: Blue-Green deployment
- **Rollback**: Automated on health check failure

### 10. Testing Strategy

#### 10.1 Unit Testing
- Code coverage target: 80%
- Framework: JUnit (Java), pytest (Python)

#### 10.2 Integration Testing
- API contract testing
- Database integration tests
- External service mocking

#### 10.3 Performance Testing
- Load testing: 1000 concurrent users
- Stress testing: Up to system breaking point
- Endurance testing: 24-hour sustained load

### 11. Appendix

#### 11.1 Technology Stack Summary
- **Backend**: Java Spring Boot, Python FastAPI, Node.js
- **Database**: MySQL 8.0
- **Cache**: Redis 7.0
- **Message Queue**: RabbitMQ
- **Container**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack

#### 11.2 Third-Party Integrations
- Payment Gateway: Stripe
- Email Service: SendGrid
- SMS Service: Twilio
- Cloud Storage: AWS S3

---

**Document End**