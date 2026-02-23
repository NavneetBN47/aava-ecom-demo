# Low Level Design Document

## Document Information
- **Project**: E-Commerce Platform
- **Version**: 1.0
- **Last Updated**: 2024-01-15
- **Author**: Development Team
- **Status**: Complete and Ready for Review

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Security Design](#security-design)
7. [Performance Considerations](#performance-considerations)
8. [Deployment Architecture](#deployment-architecture)

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-Commerce Platform. It describes the internal workings of each component, data structures, algorithms, and interfaces.

### 1.2 Scope
This document covers:
- Detailed component architecture
- Database schema and data models
- API endpoints and contracts
- Security implementation details
- Performance optimization strategies
- Deployment configurations

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **JWT**: JSON Web Token
- **ORM**: Object-Relational Mapping
- **CDN**: Content Delivery Network

## 2. System Architecture

### 2.1 Overall Architecture
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
   │  User   │     │ Product │     │ Order   │
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

### 2.2 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (Primary), Redis (Cache)
- **Message Queue**: RabbitMQ
- **API Gateway**: Kong
- **Container Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana

## 3. Component Design

### 3.1 User Service

#### 3.1.1 Responsibilities
- User registration and authentication
- Profile management
- Password reset and recovery
- Session management

#### 3.1.2 Class Diagram

```javascript
class UserController {
  constructor(userService, authService) {
    this.userService = userService;
    this.authService = authService;
  }

  async register(req, res) {
    // Registration logic
  }

  async login(req, res) {
    // Login logic
  }

  async getProfile(req, res) {
    // Profile retrieval logic
  }

  async updateProfile(req, res) {
    // Profile update logic
  }
}

class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async createUser(userData) {
    // User creation logic
  }

  async findUserByEmail(email) {
    // User lookup logic
  }

  async updateUser(userId, updateData) {
    // User update logic
  }
}

class AuthService {
  constructor(jwtService, passwordService) {
    this.jwtService = jwtService;
    this.passwordService = passwordService;
  }

  async generateToken(user) {
    // Token generation logic
  }

  async verifyToken(token) {
    // Token verification logic
  }

  async hashPassword(password) {
    // Password hashing logic
  }
}
```

#### 3.1.3 Sequence Diagram - User Registration

```
Client          Controller      Service         Repository      Database
  │                 │              │                │              │
  │──Register──────>│              │                │              │
  │                 │──Validate───>│                │              │
  │                 │              │──Check Email──>│              │
  │                 │              │                │──Query──────>│
  │                 │              │                │<─Result─────│
  │                 │              │<──User Exists──│              │
  │                 │              │──Hash Password─>│              │
  │                 │              │──Create User──>│              │
  │                 │              │                │──Insert─────>│
  │                 │              │                │<─Success────│
  │                 │              │<──User Created─│              │
  │                 │<─Success────│                │              │
  │<──Response─────│              │                │              │
```

### 3.2 Product Service

#### 3.2.1 Responsibilities
- Product catalog management
- Inventory tracking
- Product search and filtering
- Category management

#### 3.2.2 Class Structure

```javascript
class ProductController {
  constructor(productService, inventoryService) {
    this.productService = productService;
    this.inventoryService = inventoryService;
  }

  async createProduct(req, res) {
    // Product creation logic
  }

  async getProduct(req, res) {
    // Product retrieval logic
  }

  async updateProduct(req, res) {
    // Product update logic
  }

  async searchProducts(req, res) {
    // Product search logic
  }
}

class ProductService {
  constructor(productRepository, cacheService) {
    this.productRepository = productRepository;
    this.cacheService = cacheService;
  }

  async createProduct(productData) {
    // Product creation with cache invalidation
  }

  async getProductById(productId) {
    // Product retrieval with caching
  }

  async searchProducts(criteria) {
    // Product search with filtering
  }
}

class InventoryService {
  constructor(inventoryRepository, eventPublisher) {
    this.inventoryRepository = inventoryRepository;
    this.eventPublisher = eventPublisher;
  }

  async updateStock(productId, quantity) {
    // Stock update logic
  }

  async checkAvailability(productId, quantity) {
    // Availability check logic
  }
}
```

### 3.3 Order Service

#### 3.3.1 Responsibilities
- Order creation and management
- Order status tracking
- Payment processing integration
- Order history

#### 3.3.2 State Machine - Order Status

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
                    ┌────▼────────┐
              ┌────>│  CONFIRMED  │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  PROCESSING │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  SHIPPED    │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  DELIVERED  │
              │     └─────────────┘
              │
         ┌────┴────┐
         │CANCELLED│
         └─────────┘
```

#### 3.3.3 Class Structure

```javascript
class OrderController {
  constructor(orderService, paymentService) {
    this.orderService = orderService;
    this.paymentService = paymentService;
  }

  async createOrder(req, res) {
    // Order creation logic
  }

  async getOrder(req, res) {
    // Order retrieval logic
  }

  async updateOrderStatus(req, res) {
    // Order status update logic
  }
}

class OrderService {
  constructor(orderRepository, inventoryService, notificationService) {
    this.orderRepository = orderRepository;
    this.inventoryService = inventoryService;
    this.notificationService = notificationService;
  }

  async createOrder(orderData) {
    // Order creation with inventory check
  }

  async processOrder(orderId) {
    // Order processing logic
  }

  async cancelOrder(orderId) {
    // Order cancellation logic
  }
}
```

## 4. Data Models

### 4.1 User Model

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 4.2 Product Model

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    brand VARCHAR(100),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    warehouse_location VARCHAR(100),
    last_restocked TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_product ON inventory(product_id);
```

### 4.3 Order Model

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id UUID REFERENCES addresses(id),
    billing_address_id UUID REFERENCES addresses(id),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### 4.4 Address Model

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    address_type VARCHAR(50),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

## 5. API Specifications

### 5.1 User APIs

#### 5.1.1 Register User

**Endpoint**: `POST /api/v1/users/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "User registered successfully"
}
```

#### 5.1.2 Login

**Endpoint**: `POST /api/v1/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### 5.2 Product APIs

#### 5.2.1 Get Products

**Endpoint**: `GET /api/v1/products`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `search` (optional): Search term
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "sku": "PROD-001",
        "category": "Electronics",
        "imageUrl": "https://cdn.example.com/image.jpg",
        "inStock": true
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

**Endpoint**: `GET /api/v1/products/:productId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "sku": "PROD-001",
    "category": {
      "id": "cat-001",
      "name": "Electronics"
    },
    "brand": "Brand Name",
    "images": [
      "https://cdn.example.com/image1.jpg",
      "https://cdn.example.com/image2.jpg"
    ],
    "specifications": {
      "weight": "500g",
      "dimensions": "10x10x5 cm"
    },
    "inventory": {
      "inStock": true,
      "quantity": 50
    }
  }
}
```

### 5.3 Order APIs

#### 5.3.1 Create Order

**Endpoint**: `POST /api/v1/orders`

**Headers**:
- `Authorization`: Bearer {token}

**Request Body**:
```json
{
  "items": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174001",
      "quantity": 2
    }
  ],
  "shippingAddressId": "addr-001",
  "billingAddressId": "addr-001",
  "paymentMethod": "credit_card"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orderId": "123e4567-e89b-12d3-a456-426614174002",
    "orderNumber": "ORD-2024-001",
    "status": "PENDING",
    "totalAmount": 199.98,
    "items": [
      {
        "productId": "123e4567-e89b-12d3-a456-426614174001",
        "productName": "Product Name",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 5.3.2 Get Order Details

**Endpoint**: `GET /api/v1/orders/:orderId`

**Headers**:
- `Authorization`: Bearer {token}

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": "123e4567-e89b-12d3-a456-426614174002",
    "orderNumber": "ORD-2024-001",
    "status": "PROCESSING",
    "totalAmount": 199.98,
    "items": [
      {
        "productId": "123e4567-e89b-12d3-a456-426614174001",
        "productName": "Product Name",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "paymentStatus": "PAID",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

## 6. Security Design

### 6.1 Authentication

#### 6.1.1 JWT Token Structure

```javascript
// Token Payload
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1642248000,
  "exp": 1642334400
}

// Token Generation
class JWTService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
```

#### 6.1.2 Password Hashing

```javascript
class PasswordService {
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
}
```

### 6.2 Authorization

#### 6.2.1 Role-Based Access Control (RBAC)

```javascript
class AuthorizationMiddleware {
  checkRole(allowedRoles) {
    return (req, res, next) => {
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    };
  }

  checkOwnership(resourceType) {
    return async (req, res, next) => {
      const userId = req.user.userId;
      const resourceId = req.params.id;
      
      const resource = await this.getResource(resourceType, resourceId);
      
      if (resource.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    };
  }
}

// Usage
router.get(
  '/orders/:id',
  authenticate,
  authorizationMiddleware.checkOwnership('order'),
  orderController.getOrder
);

router.post(
  '/products',
  authenticate,
  authorizationMiddleware.checkRole(['admin', 'seller']),
  productController.createProduct
);
```

### 6.3 Data Encryption

#### 6.3.1 Sensitive Data Encryption

```javascript
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted, iv, authTag) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 6.4 API Security

#### 6.4.1 Rate Limiting

```javascript
class RateLimiter {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async checkLimit(identifier, maxRequests, windowSeconds) {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    if (current > maxRequests) {
      const ttl = await this.redis.ttl(key);
      throw new RateLimitError(`Rate limit exceeded. Try again in ${ttl} seconds`);
    }
    
    return {
      remaining: maxRequests - current,
      reset: Date.now() + (windowSeconds * 1000)
    };
  }
}

// Middleware
const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.userId || req.ip;
    const limit = await rateLimiter.checkLimit(identifier, 100, 60);
    
    res.set({
      'X-RateLimit-Remaining': limit.remaining,
      'X-RateLimit-Reset': limit.reset
    });
    
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
```

#### 6.4.2 Input Validation

```javascript
class ValidationService {
  validateUserRegistration(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    });
    
    return schema.validate(data);
  }

  validateProductCreation(data) {
    const schema = Joi.object({
      name: Joi.string().min(3).max(255).required(),
      description: Joi.string().max(2000).optional(),
      price: Joi.number().positive().precision(2).required(),
      sku: Joi.string().alphanum().required(),
      categoryId: Joi.string().uuid().required(),
      brand: Joi.string().max(100).optional()
    });
    
    return schema.validate(data);
  }

  sanitizeInput(input) {
    // Remove potentially dangerous characters
    return input.replace(/[<>"'&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    });
  }
}
```

## 7. Performance Considerations

### 7.1 Caching Strategy

#### 7.1.1 Redis Cache Implementation

```javascript
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in Product Service
class ProductService {
  async getProductById(productId) {
    const cacheKey = `product:${productId}`;
    
    // Try cache first
    let product = await this.cacheService.get(cacheKey);
    
    if (!product) {
      // Cache miss - fetch from database
      product = await this.productRepository.findById(productId);
      
      if (product) {
        // Store in cache
        await this.cacheService.set(cacheKey, product, 3600);
      }
    }
    
    return product;
  }

  async updateProduct(productId, updateData) {
    const product = await this.productRepository.update(productId, updateData);
    
    // Invalidate cache
    await this.cacheService.delete(`product:${productId}`);
    await this.cacheService.invalidatePattern('products:list:*');
    
    return product;
  }
}
```

#### 7.1.2 Cache Warming

```javascript
class CacheWarmer {
  constructor(cacheService, productService) {
    this.cacheService = cacheService;
    this.productService = productService;
  }

  async warmPopularProducts() {
    // Get top 100 popular products
    const popularProducts = await this.productService.getPopularProducts(100);
    
    for (const product of popularProducts) {
      const cacheKey = `product:${product.id}`;
      await this.cacheService.set(cacheKey, product, 7200); // 2 hours
    }
  }

  async warmCategories() {
    const categories = await this.categoryService.getAllCategories();
    await this.cacheService.set('categories:all', categories, 86400); // 24 hours
  }

  async scheduleWarming() {
    // Run every hour
    setInterval(async () => {
      await this.warmPopularProducts();
      await this.warmCategories();
    }, 3600000);
  }
}
```

### 7.2 Database Optimization

#### 7.2.1 Query Optimization

```javascript
class ProductRepository {
  async findProductsWithPagination(filters, page, limit) {
    const offset = (page - 1) * limit;
    
    // Optimized query with proper indexing
    const query = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.sku,
        c.name as category_name,
        i.quantity as stock_quantity
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = true
        AND ($1::uuid IS NULL OR p.category_id = $1)
        AND ($2::decimal IS NULL OR p.price >= $2)
        AND ($3::decimal IS NULL OR p.price <= $3)
        AND ($4::text IS NULL OR p.name ILIKE $4)
      ORDER BY p.created_at DESC
      LIMIT $5 OFFSET $6
    `;
    
    const searchPattern = filters.search ? `%${filters.search}%` : null;
    
    const result = await this.db.query(query, [
      filters.categoryId || null,
      filters.minPrice || null,
      filters.maxPrice || null,
      searchPattern,
      limit,
      offset
    ]);
    
    return result.rows;
  }

  async getProductWithDetails(productId) {
    // Single query with joins instead of multiple queries
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        i.quantity as stock_quantity,
        i.reserved_quantity,
        json_agg(
          json_build_object(
            'url', pi.image_url,
            'alt', pi.alt_text,
            'order', pi.display_order
          ) ORDER BY pi.display_order
        ) as images
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name, i.quantity, i.reserved_quantity
    `;
    
    const result = await this.db.query(query, [productId]);
    return result.rows[0];
  }
}
```

#### 7.2.2 Connection Pooling

```javascript
const { Pool } = require('pg');

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum number of clients
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn('Slow query detected', { text, duration });
    }
    
    return result;
  }

  async getClient() {
    return await this.pool.connect();
  }
}
```

### 7.3 Load Balancing

#### 7.3.1 Application Load Balancing

```javascript
// Nginx Configuration
const nginxConfig = `
upstream api_backend {
    least_conn;
    server api1.example.com:3000 weight=3;
    server api2.example.com:3000 weight=3;
    server api3.example.com:3000 weight=2;
    server api4.example.com:3000 backup;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
`;
```

### 7.4 Asynchronous Processing

#### 7.4.1 Message Queue Implementation

```javascript
class MessageQueueService {
  constructor(rabbitMQConnection) {
    this.connection = rabbitMQConnection;
    this.channel = null;
  }

  async initialize() {
    this.channel = await this.connection.createChannel();
    
    // Declare exchanges
    await this.channel.assertExchange('orders', 'topic', { durable: true });
    await this.channel.assertExchange('notifications', 'fanout', { durable: true });
    
    // Declare queues
    await this.channel.assertQueue('order.processing', { durable: true });
    await this.channel.assertQueue('email.notifications', { durable: true });
    await this.channel.assertQueue('inventory.updates', { durable: true });
  }

  async publishOrderEvent(orderData, routingKey) {
    const message = JSON.stringify(orderData);
    
    this.channel.publish(
      'orders',
      routingKey,
      Buffer.from(message),
      { persistent: true }
    );
  }

  async consumeOrderEvents(callback) {
    await this.channel.bindQueue('order.processing', 'orders', 'order.*');
    
    this.channel.consume('order.processing', async (msg) => {
      if (msg) {
        try {
          const orderData = JSON.parse(msg.content.toString());
          await callback(orderData);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing order event:', error);
          // Requeue or send to dead letter queue
          this.channel.nack(msg, false, false);
        }
      }
    });
  }
}

// Usage
class OrderProcessor {
  constructor(messageQueue, orderService) {
    this.messageQueue = messageQueue;
    this.orderService = orderService;
  }

  async start() {
    await this.messageQueue.consumeOrderEvents(async (orderData) => {
      await this.processOrder(orderData);
    });
  }

  async processOrder(orderData) {
    // Process order asynchronously
    await this.orderService.processPayment(orderData.orderId);
    await this.orderService.updateInventory(orderData.items);
    await this.orderService.sendConfirmationEmail(orderData.userId);
  }
}
```

## 8. Deployment Architecture

### 8.1 Kubernetes Deployment

#### 8.1.1 Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ecommerce/api-gateway:1.0.0
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
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
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
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: ecommerce
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### 8.1.2 Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 8.2 Monitoring and Logging

#### 8.2.1 Prometheus Metrics

```javascript
const prometheus = require('prom-client');

class MetricsService {
  constructor() {
    // Create a Registry
    this.register = new prometheus.Registry();
    
    // Add default metrics
    prometheus.collectDefaultMetrics({ register: this.register });
    
    // Custom metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });
    
    this.httpRequestTotal = new prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });
    
    this.activeConnections = new prometheus.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });
    
    this.orderProcessingDuration = new prometheus.Histogram({
      name: 'order_processing_duration_seconds',
      help: 'Duration of order processing',
      buckets: [1, 5, 10, 30, 60]
    });
    
    // Register metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.activeConnections);
    this.register.registerMetric(this.orderProcessingDuration);
  }

  getMetrics() {
    return this.register.metrics();
  }
}

// Middleware
const metricsMiddleware = (metricsService) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      metricsService.httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .observe(duration);
      
      metricsService.httpRequestTotal
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .inc();
    });
    
    next();
  };
};
```

#### 8.2.2 Structured Logging

```javascript
const winston = require('winston');

class LoggerService {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'ecommerce-api',
        environment: process.env.NODE_ENV
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, error, meta = {}) {
    this.logger.error(message, {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

// Usage
const logger = new LoggerService();

class OrderService {
  async createOrder(orderData) {
    logger.info('Creating new order', {
      userId: orderData.userId,
      itemCount: orderData.items.length
    });
    
    try {
      const order = await this.orderRepository.create(orderData);
      
      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber
      });
      
      return order;
    } catch (error) {
      logger.error('Failed to create order', error, {
        userId: orderData.userId
      });
      throw error;
    }
  }
}
```

### 8.3 CI/CD Pipeline

#### 8.3.1 GitHub Actions Workflow

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
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/api-gateway \
          api-gateway=ghcr.io/${{ github.repository }}:${{ github.sha }} \
          -n ecommerce
        kubectl rollout status deployment/api-gateway -n ecommerce
```

## Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the E-Commerce Platform. It covers all critical aspects including:

- Detailed component architecture and interactions
- Complete data models and database schemas
- API specifications with request/response formats
- Security implementation with authentication and authorization
- Performance optimization strategies
- Deployment and monitoring configurations

The design follows industry best practices and is scalable, maintainable, and secure.

**Status**: Complete and Ready for Review