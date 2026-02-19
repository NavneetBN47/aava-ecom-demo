# Low-Level Design Document: E-Commerce Platform

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive low-level design for an e-commerce platform, detailing the architecture, components, data models, APIs, and implementation specifics.

### 1.2 Scope
The design covers:
- User management and authentication
- Product catalog management
- Shopping cart functionality
- Order processing
- Payment integration
- Inventory management
- Search and filtering capabilities

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **REST**: Representational State Transfer
- **SQL**: Structured Query Language

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Gateway│
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│   Auth   │ │Product │ │  Cart  │ │ Order  │ │Payment │
│ Service  │ │Service │ │Service │ │Service │ │Service │
└────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │           │           │           │           │
     └───────────┴───────────┴───────────┴───────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Database   │
                    └──────────────┘
```

### 2.2 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Search Engine**: Elasticsearch
- **File Storage**: AWS S3
- **Authentication**: JWT

---

## 3. Database Design

### 3.1 Entity Relationship Diagram
```
Users ──< Orders >── OrderItems >── Products
  │                                     │
  │                                     │
  └──< Carts >── CartItems >────────────┘
  │
  └──< Addresses
```

### 3.2 Table Schemas

#### 3.2.1 Users Table
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'customer'
);

CREATE INDEX idx_users_email ON users(email);
```

#### 3.2.2 Products Table
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
```

#### 3.2.3 Carts Table
```sql
CREATE TABLE carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
```

#### 3.2.4 Cart Items Table
```sql
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

#### 3.2.5 Orders Table
```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id INTEGER REFERENCES addresses(address_id),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
```

#### 3.2.6 Order Items Table
```sql
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

#### 3.2.7 Addresses Table
```sql
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

#### 3.2.8 Transactions Table
```sql
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    transaction_reference VARCHAR(255) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_type VARCHAR(50) DEFAULT 'payment',
    gateway_response TEXT,
    error_message TEXT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_reference ON transactions(transaction_reference);
CREATE INDEX idx_transactions_status ON transactions(status);
```

#### 3.2.9 Notifications Table
```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

#### 3.2.10 User Preferences Table
```sql
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT TRUE,
    fcm_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

---

## 4. API Design

### 4.1 Authentication APIs

#### 4.1.1 User Registration
```
POST /api/v1/auth/register
Content-Type: application/json

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
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user_id": 1,
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
}
```

#### 4.1.2 User Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request Body:
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}

Response (200 OK):
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "user_id": 1,
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "customer"
        }
    }
}
```

### 4.2 Product APIs

#### 4.2.1 Get All Products
```
GET /api/v1/products?page=1&limit=20&category=electronics&sort=price_asc
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "products": [
            {
                "product_id": 1,
                "name": "Laptop",
                "description": "High-performance laptop",
                "price": 999.99,
                "category": "electronics",
                "brand": "TechBrand",
                "sku": "TECH-LAP-001",
                "stock_quantity": 50,
                "image_url": "https://example.com/images/laptop.jpg"
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

#### 4.2.2 Get Product by ID
```
GET /api/v1/products/{product_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "product_id": 1,
        "name": "Laptop",
        "description": "High-performance laptop with 16GB RAM",
        "price": 999.99,
        "category": "electronics",
        "brand": "TechBrand",
        "sku": "TECH-LAP-001",
        "stock_quantity": 50,
        "image_url": "https://example.com/images/laptop.jpg",
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-15T14:30:00Z"
    }
}
```

#### 4.2.3 Create Product (Admin)
```
POST /api/v1/products
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 29.99,
    "category": "electronics",
    "brand": "TechBrand",
    "sku": "TECH-MOU-001",
    "stock_quantity": 100,
    "image_url": "https://example.com/images/mouse.jpg"
}

Response (201 Created):
{
    "success": true,
    "message": "Product created successfully",
    "data": {
        "product_id": 2,
        "name": "Wireless Mouse",
        "sku": "TECH-MOU-001"
    }
}
```

### 4.3 Cart APIs

#### 4.3.1 Get User Cart
```
GET /api/v1/cart
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "cart_id": 1,
        "user_id": 1,
        "items": [
            {
                "cart_item_id": 1,
                "product_id": 1,
                "product_name": "Laptop",
                "price": 999.99,
                "quantity": 1,
                "subtotal": 999.99,
                "image_url": "https://example.com/images/laptop.jpg"
            }
        ],
        "total_items": 1,
        "total_amount": 999.99
    }
}
```

#### 4.3.2 Add Item to Cart
```
POST /api/v1/cart/items
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "product_id": 1,
    "quantity": 2
}

Response (201 Created):
{
    "success": true,
    "message": "Item added to cart",
    "data": {
        "cart_item_id": 1,
        "product_id": 1,
        "quantity": 2
    }
}
```

#### 4.3.3 Update Cart Item
```
PUT /api/v1/cart/items/{cart_item_id}
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "quantity": 3
}

Response (200 OK):
{
    "success": true,
    "message": "Cart item updated",
    "data": {
        "cart_item_id": 1,
        "quantity": 3
    }
}
```

#### 4.3.4 Remove Item from Cart
```
DELETE /api/v1/cart/items/{cart_item_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "message": "Item removed from cart"
}
```

### 4.4 Order APIs

#### 4.4.1 Create Order
```
POST /api/v1/orders
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "shipping_address_id": 1,
    "payment_method": "credit_card"
}

Response (201 Created):
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "order_id": 1,
        "order_number": "ORD-2024-0001",
        "status": "pending",
        "total_amount": 999.99,
        "items": [
            {
                "product_id": 1,
                "product_name": "Laptop",
                "quantity": 1,
                "price": 999.99,
                "subtotal": 999.99
            }
        ]
    }
}
```

#### 4.4.2 Get User Orders
```
GET /api/v1/orders?page=1&limit=10
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "orders": [
            {
                "order_id": 1,
                "order_number": "ORD-2024-0001",
                "status": "delivered",
                "total_amount": 999.99,
                "created_at": "2024-01-01T10:00:00Z",
                "items_count": 1
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

#### 4.4.3 Get Order Details
```
GET /api/v1/orders/{order_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "order_id": 1,
        "order_number": "ORD-2024-0001",
        "status": "delivered",
        "total_amount": 999.99,
        "payment_method": "credit_card",
        "payment_status": "completed",
        "shipping_address": {
            "address_line1": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "USA"
        },
        "items": [
            {
                "product_id": 1,
                "product_name": "Laptop",
                "quantity": 1,
                "price": 999.99,
                "subtotal": 999.99
            }
        ],
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-05T15:30:00Z"
    }
}
```

### 4.5 Payment APIs

#### 4.5.1 Process Payment
```
POST /api/v1/payments/process
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "order_id": 1,
    "payment_method": "credit_card",
    "payment_details": {
        "payment_method_id": "pm_1234567890"
    }
}

Response (200 OK):
{
    "success": true,
    "message": "Payment processed successfully",
    "data": {
        "transaction_id": "pi_1234567890",
        "status": "completed",
        "amount": 999.99
    }
}
```

#### 4.5.2 Request Refund
```
POST /api/v1/payments/refund
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "order_id": 1,
    "amount": 999.99,
    "reason": "Product defective"
}

Response (200 OK):
{
    "success": true,
    "message": "Refund processed successfully",
    "data": {
        "refund_id": "re_1234567890",
        "status": "succeeded",
        "amount": 999.99
    }
}
```

### 4.6 Notification APIs

#### 4.6.1 Get User Notifications
```
GET /api/v1/notifications?page=1&limit=20&unread_only=true
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "data": {
        "notifications": [
            {
                "notification_id": 1,
                "type": "order_confirmation",
                "title": "Order Confirmed",
                "message": "Your order ORD-2024-0001 has been confirmed",
                "is_read": false,
                "created_at": "2024-01-15T10:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 2,
            "total_items": 25,
            "unread_count": 5
        }
    }
}
```

#### 4.6.2 Mark Notification as Read
```
PUT /api/v1/notifications/{notification_id}/read
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "message": "Notification marked as read"
}
```

#### 4.6.3 Update Notification Preferences
```
PUT /api/v1/users/preferences/notifications
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true,
    "promotional_emails": false
}

Response (200 OK):
{
    "success": true,
    "message": "Notification preferences updated",
    "data": {
        "email_notifications": true,
        "sms_notifications": false,
        "push_notifications": true,
        "promotional_emails": false
    }
}
```

---

## 5. Component Design

### 5.1 Authentication Service

#### 5.1.1 Class Diagram
```
┌─────────────────────┐
│  AuthService        │
├─────────────────────┤
│ - userRepository    │
│ - jwtService        │
│ - bcryptService     │
├─────────────────────┤
│ + register()        │
│ + login()           │
│ + validateToken()   │
│ + refreshToken()    │
│ + logout()          │
└─────────────────────┘
```

#### 5.1.2 Implementation Details

**File: `services/authService.js`**
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/userRepository');

class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
        this.saltRounds = 10;
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiry = '24h';
    }

    async register(userData) {
        // Validate input
        this.validateRegistrationData(userData);

        // Check if user exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

        // Create user
        const user = await this.userRepository.create({
            ...userData,
            password_hash: passwordHash
        });

        return {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        };
    }

    async login(email, password) {
        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            this.jwtSecret,
            { expiresIn: this.jwtExpiry }
        );

        return {
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        };
    }

    validateToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    validateRegistrationData(data) {
        if (!data.email || !data.password) {
            throw new Error('Email and password are required');
        }
        // Add more validation as needed
    }
}

module.exports = AuthService;
```

### 5.2 Product Service

#### 5.2.1 Class Diagram
```
┌─────────────────────┐
│  ProductService     │
├─────────────────────┤
│ - productRepository │
│ - cacheService      │
│ - searchService     │
├─────────────────────┤
│ + getAll()          │
│ + getById()         │
│ + create()          │
│ + update()          │
│ + delete()          │
│ + search()          │
└─────────────────────┘
```

#### 5.2.2 Implementation Details

**File: `services/productService.js`**
```javascript
const ProductRepository = require('../repositories/productRepository');
const CacheService = require('./cacheService');
const SearchService = require('./searchService');

class ProductService {
    constructor() {
        this.productRepository = new ProductRepository();
        this.cacheService = new CacheService();
        this.searchService = new SearchService();
        this.cacheExpiry = 3600; // 1 hour
    }

    async getAll(filters, pagination) {
        const cacheKey = `products:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        
        // Check cache
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // Fetch from database
        const products = await this.productRepository.findAll(filters, pagination);
        const totalCount = await this.productRepository.count(filters);

        const result = {
            products,
            pagination: {
                current_page: pagination.page,
                total_pages: Math.ceil(totalCount / pagination.limit),
                total_items: totalCount,
                items_per_page: pagination.limit
            }
        };

        // Cache result
        await this.cacheService.set(cacheKey, JSON.stringify(result), this.cacheExpiry);

        return result;
    }

    async getById(productId) {
        const cacheKey = `product:${productId}`;
        
        // Check cache
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // Fetch from database
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // Cache result
        await this.cacheService.set(cacheKey, JSON.stringify(product), this.cacheExpiry);

        return product;
    }

    async create(productData) {
        // Validate SKU uniqueness
        const existingProduct = await this.productRepository.findBySku(productData.sku);
        if (existingProduct) {
            throw new Error('SKU already exists');
        }

        // Create product
        const product = await this.productRepository.create(productData);

        // Index in search engine
        await this.searchService.indexProduct(product);

        // Invalidate cache
        await this.cacheService.deletePattern('products:*');

        return product;
    }

    async update(productId, productData) {
        const product = await this.productRepository.update(productId, productData);
        if (!product) {
            throw new Error('Product not found');
        }

        // Update search index
        await this.searchService.updateProduct(product);

        // Invalidate cache
        await this.cacheService.delete(`product:${productId}`);
        await this.cacheService.deletePattern('products:*');

        return product;
    }

    async delete(productId) {
        const result = await this.productRepository.delete(productId);
        
        // Remove from search index
        await this.searchService.deleteProduct(productId);

        // Invalidate cache
        await this.cacheService.delete(`product:${productId}`);
        await this.cacheService.deletePattern('products:*');

        return result;
    }

    async search(query, filters) {
        return await this.searchService.searchProducts(query, filters);
    }
}

module.exports = ProductService;
```

### 5.3 Cart Service

#### 5.3.1 Class Diagram
```
┌─────────────────────┐
│  CartService        │
├─────────────────────┤
│ - cartRepository    │
│ - productRepository │
├─────────────────────┤
│ + getCart()         │
│ + addItem()         │
│ + updateItem()      │
│ + removeItem()      │
│ + clearCart()       │
│ + calculateTotal()  │
└─────────────────────┘
```

#### 5.3.2 Implementation Details

**File: `services/cartService.js`**
```javascript
const CartRepository = require('../repositories/cartRepository');
const ProductRepository = require('../repositories/productRepository');

class CartService {
    constructor() {
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
    }

    async getCart(userId) {
        let cart = await this.cartRepository.findByUserId(userId);
        
        if (!cart) {
            cart = await this.cartRepository.create({ user_id: userId });
        }

        const items = await this.cartRepository.getCartItems(cart.cart_id);
        const total = this.calculateTotal(items);

        return {
            cart_id: cart.cart_id,
            user_id: userId,
            items,
            total_items: items.length,
            total_amount: total
        };
    }

    async addItem(userId, productId, quantity) {
        // Validate product
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // Check stock
        if (product.stock_quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        // Get or create cart
        let cart = await this.cartRepository.findByUserId(userId);
        if (!cart) {
            cart = await this.cartRepository.create({ user_id: userId });
        }

        // Check if item already exists
        const existingItem = await this.cartRepository.findCartItem(cart.cart_id, productId);
        
        if (existingItem) {
            // Update quantity
            return await this.cartRepository.updateCartItem(
                existingItem.cart_item_id,
                { quantity: existingItem.quantity + quantity }
            );
        } else {
            // Add new item
            return await this.cartRepository.addCartItem({
                cart_id: cart.cart_id,
                product_id: productId,
                quantity
            });
        }
    }

    async updateItem(userId, cartItemId, quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }

        const item = await this.cartRepository.getCartItemById(cartItemId);
        if (!item) {
            throw new Error('Cart item not found');
        }

        // Verify ownership
        const cart = await this.cartRepository.findById(item.cart_id);
        if (cart.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        // Check stock
        const product = await this.productRepository.findById(item.product_id);
        if (product.stock_quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        return await this.cartRepository.updateCartItem(cartItemId, { quantity });
    }

    async removeItem(userId, cartItemId) {
        const item = await this.cartRepository.getCartItemById(cartItemId);
        if (!item) {
            throw new Error('Cart item not found');
        }

        // Verify ownership
        const cart = await this.cartRepository.findById(item.cart_id);
        if (cart.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        return await this.cartRepository.removeCartItem(cartItemId);
    }

    async clearCart(userId) {
        const cart = await this.cartRepository.findByUserId(userId);
        if (!cart) {
            throw new Error('Cart not found');
        }

        return await this.cartRepository.clearCart(cart.cart_id);
    }

    calculateTotal(items) {
        return items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
}

module.exports = CartService;
```

### 5.4 Order Service

#### 5.4.1 Class Diagram
```
┌─────────────────────┐
│  OrderService       │
├─────────────────────┤
│ - orderRepository   │
│ - cartService       │
│ - productRepository │
│ - paymentService    │
├─────────────────────┤
│ + createOrder()     │
│ + getOrders()       │
│ + getOrderById()    │
│ + updateStatus()    │
│ + cancelOrder()     │
└─────────────────────┘
```

#### 5.4.2 Implementation Details

**File: `services/orderService.js`**
```javascript
const OrderRepository = require('../repositories/orderRepository');
const CartService = require('./cartService');
const ProductRepository = require('../repositories/productRepository');
const PaymentService = require('./paymentService');

class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository();
        this.cartService = new CartService();
        this.productRepository = new ProductRepository();
        this.paymentService = new PaymentService();
    }

    async createOrder(userId, orderData) {
        // Get cart
        const cart = await this.cartService.getCart(userId);
        if (cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Validate stock for all items
        for (const item of cart.items) {
            const product = await this.productRepository.findById(item.product_id);
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
        }

        // Generate order number
        const orderNumber = await this.generateOrderNumber();

        // Create order
        const order = await this.orderRepository.create({
            user_id: userId,
            order_number: orderNumber,
            total_amount: cart.total_amount,
            shipping_address_id: orderData.shipping_address_id,
            payment_method: orderData.payment_method,
            status: 'pending',
            payment_status: 'pending'
        });

        // Create order items
        for (const item of cart.items) {
            await this.orderRepository.addOrderItem({
                order_id: order.order_id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            });

            // Update stock
            await this.productRepository.decrementStock(item.product_id, item.quantity);
        }

        // Clear cart
        await this.cartService.clearCart(userId);

        // Process payment
        await this.paymentService.processPayment(order.order_id, orderData.payment_method);

        // Fetch complete order details
        return await this.getOrderById(userId, order.order_id);
    }

    async getOrders(userId, pagination) {
        const orders = await this.orderRepository.findByUserId(userId, pagination);
        const totalCount = await this.orderRepository.countByUserId(userId);

        return {
            orders,
            pagination: {
                current_page: pagination.page,
                total_pages: Math.ceil(totalCount / pagination.limit),
                total_items: totalCount
            }
        };
    }

    async getOrderById(userId, orderId) {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Verify ownership
        if (order.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        const items = await this.orderRepository.getOrderItems(orderId);
        const address = await this.orderRepository.getShippingAddress(order.shipping_address_id);

        return {
            ...order,
            items,
            shipping_address: address
        };
    }

    async updateStatus(orderId, status) {
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        return await this.orderRepository.updateStatus(orderId, status);
    }

    async cancelOrder(userId, orderId) {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Verify ownership
        if (order.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            throw new Error('Order cannot be cancelled');
        }

        // Restore stock
        const items = await this.orderRepository.getOrderItems(orderId);
        for (const item of items) {
            await this.productRepository.incrementStock(item.product_id, item.quantity);
        }

        // Update order status
        return await this.orderRepository.updateStatus(orderId, 'cancelled');
    }

    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const count = await this.orderRepository.countByYear(year);
        return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}

module.exports = OrderService;
```

### 5.5 Payment Service

#### 5.5.1 Class Diagram
```
┌─────────────────────────┐
│  PaymentService         │
├─────────────────────────┤
│ - paymentGateway        │
│ - orderRepository       │
│ - transactionRepository │
├─────────────────────────┤
│ + processPayment()      │
│ + refundPayment()       │
│ + getTransactionStatus()│
│ + validatePayment()     │
└─────────────────────────┘
```

#### 5.5.2 Implementation Details

**File: `services/paymentService.js`**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OrderRepository = require('../repositories/orderRepository');
const TransactionRepository = require('../repositories/transactionRepository');

class PaymentService {
    constructor() {
        this.orderRepository = new OrderRepository();
        this.transactionRepository = new TransactionRepository();
    }

    async processPayment(orderId, paymentMethod, paymentDetails) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            let paymentResult;
            
            switch(paymentMethod) {
                case 'credit_card':
                    paymentResult = await this.processCreditCardPayment(order, paymentDetails);
                    break;
                case 'paypal':
                    paymentResult = await this.processPayPalPayment(order, paymentDetails);
                    break;
                case 'bank_transfer':
                    paymentResult = await this.processBankTransfer(order, paymentDetails);
                    break;
                default:
                    throw new Error('Unsupported payment method');
            }

            // Create transaction record
            await this.transactionRepository.create({
                order_id: orderId,
                transaction_id: paymentResult.transaction_id,
                payment_method: paymentMethod,
                amount: order.total_amount,
                status: paymentResult.status,
                gateway_response: JSON.stringify(paymentResult.raw_response)
            });

            // Update order payment status
            await this.orderRepository.updatePaymentStatus(orderId, paymentResult.status);

            return paymentResult;
        } catch (error) {
            // Log error and create failed transaction record
            await this.transactionRepository.create({
                order_id: orderId,
                payment_method: paymentMethod,
                status: 'failed',
                error_message: error.message
            });

            throw error;
        }
    }

    async processCreditCardPayment(order, paymentDetails) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total_amount * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentDetails.payment_method_id,
            confirm: true,
            metadata: {
                order_id: order.order_id,
                order_number: order.order_number
            }
        });

        return {
            transaction_id: paymentIntent.id,
            status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
            raw_response: paymentIntent
        };
    }

    async processPayPalPayment(order, paymentDetails) {
        // PayPal integration logic
        // This is a placeholder - actual implementation would use PayPal SDK
        return {
            transaction_id: `PP-${Date.now()}`,
            status: 'completed',
            raw_response: {}
        };
    }

    async processBankTransfer(order, paymentDetails) {
        // Bank transfer logic - typically requires manual verification
        return {
            transaction_id: `BT-${Date.now()}`,
            status: 'pending_verification',
            raw_response: {}
        };
    }

    async refundPayment(orderId, amount, reason) {
        const transactions = await this.transactionRepository.findByOrderId(orderId);
        const successfulTransaction = transactions.find(t => t.status === 'completed');

        if (!successfulTransaction) {
            throw new Error('No successful transaction found for this order');
        }

        let refundResult;

        switch(successfulTransaction.payment_method) {
            case 'credit_card':
                const refund = await stripe.refunds.create({
                    payment_intent: successfulTransaction.transaction_id,
                    amount: Math.round(amount * 100)
                });
                refundResult = {
                    refund_id: refund.id,
                    status: refund.status,
                    amount: amount
                };
                break;
            default:
                throw new Error('Refund not supported for this payment method');
        }

        // Create refund transaction record
        await this.transactionRepository.create({
            order_id: orderId,
            transaction_id: refundResult.refund_id,
            payment_method: successfulTransaction.payment_method,
            amount: -amount, // Negative amount for refund
            status: refundResult.status,
            transaction_type: 'refund',
            reason: reason
        });

        return refundResult;
    }

    async getTransactionStatus(transactionId) {
        return await this.transactionRepository.findByTransactionId(transactionId);
    }

    async validatePayment(paymentDetails) {
        // Validate payment details before processing
        if (!paymentDetails.payment_method_id && !paymentDetails.token) {
            throw new Error('Payment method or token is required');
        }

        // Additional validation logic
        return true;
    }
}

module.exports = PaymentService;
```

### 5.6 Notification Service

#### 5.6.1 Class Diagram
```
┌─────────────────────────┐
│  NotificationService    │
├─────────────────────────┤
│ - emailService          │
│ - smsService            │
│ - pushService           │
│ - templateEngine        │
├─────────────────────────┤
│ + sendOrderConfirmation()│
│ + sendShippingUpdate()  │
│ + sendPaymentReceipt()  │
│ + sendPromotional()     │
└─────────────────────────┘
```

#### 5.6.2 Implementation Details

**File: `services/notificationService.js`**
```javascript
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');

class NotificationService {
    constructor() {
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Initialize Firebase for push notifications
        admin.initializeApp({
            credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT)
        });
    }

    async sendOrderConfirmation(order, user) {
        const emailTemplate = this.generateOrderConfirmationEmail(order, user);
        
        await this.emailTransporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: `Order Confirmation - ${order.order_number}`,
            html: emailTemplate
        });

        // Send SMS notification
        if (user.phone) {
            await this.twilioClient.messages.create({
                body: `Your order ${order.order_number} has been confirmed. Total: $${order.total_amount}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phone
            });
        }

        // Send push notification
        if (user.fcm_token) {
            await admin.messaging().send({
                token: user.fcm_token,
                notification: {
                    title: 'Order Confirmed',
                    body: `Your order ${order.order_number} has been confirmed`
                },
                data: {
                    order_id: order.order_id.toString(),
                    type: 'order_confirmation'
                }
            });
        }
    }

    async sendShippingUpdate(order, user, trackingInfo) {
        const emailTemplate = this.generateShippingUpdateEmail(order, user, trackingInfo);
        
        await this.emailTransporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: `Shipping Update - ${order.order_number}`,
            html: emailTemplate
        });

        // Send SMS with tracking number
        if (user.phone) {
            await this.twilioClient.messages.create({
                body: `Your order ${order.order_number} has been shipped. Tracking: ${trackingInfo.tracking_number}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phone
            });
        }
    }

    async sendPaymentReceipt(transaction, order, user) {
        const emailTemplate = this.generatePaymentReceiptEmail(transaction, order, user);
        
        await this.emailTransporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: `Payment Receipt - ${order.order_number}`,
            html: emailTemplate,
            attachments: [
                {
                    filename: `receipt-${order.order_number}.pdf`,
                    content: await this.generatePDFReceipt(transaction, order)
                }
            ]
        });
    }

    async sendPromotional(users, campaign) {
        const emailPromises = users.map(user => {
            const emailTemplate = this.generatePromotionalEmail(user, campaign);
            
            return this.emailTransporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: user.email,
                subject: campaign.subject,
                html: emailTemplate
            });
        });

        await Promise.all(emailPromises);
    }

    generateOrderConfirmationEmail(order, user) {
        return `
            <html>
                <body>
                    <h1>Order Confirmation</h1>
                    <p>Dear ${user.first_name},</p>
                    <p>Thank you for your order!</p>
                    <h2>Order Details</h2>
                    <p>Order Number: ${order.order_number}</p>
                    <p>Total Amount: $${order.total_amount}</p>
                    <p>Status: ${order.status}</p>
                    <!-- Add more order details -->
                </body>
            </html>
        `;
    }

    generateShippingUpdateEmail(order, user, trackingInfo) {
        return `
            <html>
                <body>
                    <h1>Your Order Has Been Shipped</h1>
                    <p>Dear ${user.first_name},</p>
                    <p>Your order ${order.order_number} has been shipped.</p>
                    <p>Tracking Number: ${trackingInfo.tracking_number}</p>
                    <p>Carrier: ${trackingInfo.carrier}</p>
                    <p>Estimated Delivery: ${trackingInfo.estimated_delivery}</p>
                </body>
            </html>
        `;
    }

    generatePaymentReceiptEmail(transaction, order, user) {
        return `
            <html>
                <body>
                    <h1>Payment Receipt</h1>
                    <p>Dear ${user.first_name},</p>
                    <p>This is to confirm your payment for order ${order.order_number}.</p>
                    <p>Transaction ID: ${transaction.transaction_id}</p>
                    <p>Amount Paid: $${transaction.amount}</p>
                    <p>Payment Method: ${transaction.payment_method}</p>
                    <p>Date: ${transaction.created_at}</p>
                </body>
            </html>
        `;
    }

    generatePromotionalEmail(user, campaign) {
        return `
            <html>
                <body>
                    <h1>${campaign.title}</h1>
                    <p>Dear ${user.first_name},</p>
                    <div>${campaign.content}</div>
                    <a href="${campaign.cta_link}">${campaign.cta_text}</a>
                </body>
            </html>
        `;
    }

    async generatePDFReceipt(transaction, order) {
        // PDF generation logic using libraries like pdfkit
        // This is a placeholder
        return Buffer.from('PDF content');
    }
}

module.exports = NotificationService;
```

---

## 6. Security Considerations

### 6.1 Authentication & Authorization
- JWT-based authentication with secure token generation
- Password hashing using bcrypt with salt rounds
- Role-based access control (RBAC)
- Token expiration and refresh mechanism

### 6.2 Data Protection
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- XSS protection through output encoding
- CSRF protection using tokens

### 6.3 API Security
- Rate limiting to prevent abuse
- HTTPS enforcement
- CORS configuration
- API key validation for third-party integrations

### 6.4 Implementation Example

**File: `middleware/authMiddleware.js`**
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
```

### 6.5 Payment Security
- PCI DSS compliance for credit card processing
- Tokenization of sensitive payment data
- 3D Secure authentication for card payments
- Fraud detection and prevention mechanisms

### 6.6 Payment Security Implementation

**File: `middleware/paymentSecurityMiddleware.js`**
```javascript
const crypto = require('crypto');

class PaymentSecurityMiddleware {
    static validatePaymentRequest(req, res, next) {
        const { payment_method, payment_details } = req.body;

        // Validate payment method
        const allowedMethods = ['credit_card', 'paypal', 'bank_transfer'];
        if (!allowedMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAYMENT_METHOD',
                    message: 'Invalid payment method'
                }
            });
        }

        // Validate payment details structure
        if (!payment_details || typeof payment_details !== 'object') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAYMENT_DETAILS',
                    message: 'Invalid payment details'
                }
            });
        }

        next();
    }

    static generatePaymentSignature(paymentData) {
        const dataString = JSON.stringify(paymentData);
        return crypto
            .createHmac('sha256', process.env.PAYMENT_SECRET_KEY)
            .update(dataString)
            .digest('hex');
    }

    static verifyPaymentSignature(paymentData, signature) {
        const expectedSignature = this.generatePaymentSignature(paymentData);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

module.exports = PaymentSecurityMiddleware;
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy
- Redis caching for frequently accessed data
- Cache invalidation on data updates
- Cache warming for popular products

### 7.2 Database Optimization
- Proper indexing on frequently queried columns
- Query optimization and explain plan analysis
- Connection pooling
- Read replicas for scaling reads

### 7.3 Implementation Example

**File: `services/cacheService.js`**
```javascript
const redis = require('redis');

class CacheService {
    constructor() {
        this.client = redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });
        
        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }

    async set(key, value, expiry) {
        return new Promise((resolve, reject) => {
            this.client.setex(key, expiry, value, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    async delete(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    async deletePattern(pattern) {
        return new Promise((resolve, reject) => {
            this.client.keys(pattern, (err, keys) => {
                if (err) reject(err);
                if (keys.length > 0) {
                    this.client.del(keys, (err) => {
                        if (err) reject(err);
                        resolve(true);
                    });
                } else {
                    resolve(true);
                }
            });
        });
    }
}

module.exports = CacheService;
```

### 7.4 Database Query Optimization for Payments
```sql
-- Index for faster transaction lookups
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_order ON transactions(order_id, status);

-- Composite index for notification queries
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
```

### 7.5 Caching Strategy for Notifications
```javascript
// Cache user notification count
const cacheKey = `user:${userId}:notification:unread_count`;
await cacheService.set(cacheKey, unreadCount, 300); // Cache for 5 minutes

// Invalidate cache on new notification
await cacheService.delete(`user:${userId}:notification:unread_count`);
```

---

## 8. Error Handling

### 8.1 Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": {}
    }
}
```

### 8.2 Implementation Example

**File: `middleware/errorHandler.js`**
```javascript
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400, 'DUPLICATE_FIELD');
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new AppError(message, 400, 'VALIDATION_ERROR');
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.errorCode || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

module.exports = { AppError, errorHandler };
```

---

## 9. Testing Strategy

### 9.1 Unit Testing
- Test individual functions and methods
- Mock external dependencies
- Use Jest or Mocha framework

### 9.2 Integration Testing
- Test API endpoints
- Test database interactions
- Use Supertest for HTTP testing

### 9.3 Example Test

**File: `tests/services/productService.test.js`**
```javascript
const ProductService = require('../../services/productService');
const ProductRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('ProductService', () => {
    let productService;
    let mockProductRepository;

    beforeEach(() => {
        mockProductRepository = new ProductRepository();
        productService = new ProductService();
        productService.productRepository = mockProductRepository;
    });

    describe('getById', () => {
        it('should return product when found', async () => {
            const mockProduct = {
                product_id: 1,
                name: 'Test Product',
                price: 99.99
            };

            mockProductRepository.findById.mockResolvedValue(mockProduct);

            const result = await productService.getById(1);

            expect(result).toEqual(mockProduct);
            expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should throw error when product not found', async () => {
            mockProductRepository.findById.mockResolvedValue(null);

            await expect(productService.getById(999))
                .rejects
                .toThrow('Product not found');
        });
    });
});
```

---

## 10. Deployment

### 10.1 Environment Configuration
```
# .env.example
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=dbuser
DB_PASSWORD=dbpassword

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Payment Gateway
PAYMENT_API_KEY=your-payment-api-key
```

### 10.2 Docker Configuration

**File: `Dockerfile`**
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  app:
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
    image: postgres:14
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=dbuser
      - POSTGRES_PASSWORD=dbpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 11. Monitoring and Logging

### 11.1 Logging Strategy
- Structured logging using Winston
- Log levels: error, warn, info, debug
- Centralized log aggregation

### 11.2 Implementation Example

**File: `utils/logger.js`**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

### 11.3 Payment Monitoring
- Track payment success/failure rates
- Monitor payment processing times
- Alert on unusual payment patterns
- Track refund rates

### 11.4 Notification Monitoring
- Track email delivery rates
- Monitor SMS delivery success
- Track push notification engagement
- Alert on notification service failures

### 11.5 Payment Monitoring Implementation

**File: `monitoring/paymentMonitoring.js`**
```javascript
const logger = require('../utils/logger');

class PaymentMonitoring {
    static logPaymentAttempt(orderId, paymentMethod, amount) {
        logger.info('Payment attempt', {
            order_id: orderId,
            payment_method: paymentMethod,
            amount: amount,
            timestamp: new Date().toISOString()
        });
    }

    static logPaymentSuccess(orderId, transactionId, amount) {
        logger.info('Payment successful', {
            order_id: orderId,
            transaction_id: transactionId,
            amount: amount,
            timestamp: new Date().toISOString()
        });
    }

    static logPaymentFailure(orderId, error, amount) {
        logger.error('Payment failed', {
            order_id: orderId,
            error: error.message,
            amount: amount,
            timestamp: new Date().toISOString()
        });
    }

    static async checkPaymentHealth() {
        // Check payment gateway connectivity
        // Check recent payment success rates
        // Alert if issues detected
    }
}

module.exports = PaymentMonitoring;
```

---

## 12. Conclusion

This Low-Level Design document provides a comprehensive blueprint for implementing an e-commerce platform. It covers all major components including authentication, product management, cart functionality, order processing, and payment integration. The design emphasizes security, performance, scalability, and maintainability.

### 12.1 Next Steps
1. Review and approve the design
2. Set up development environment
3. Implement core services
4. Write comprehensive tests
5. Deploy to staging environment
6. Conduct security audit
7. Performance testing
8. Production deployment

---

## 13. Appendix

### 13.1 Glossary
- **API Gateway**: Entry point for all client requests
- **JWT**: Secure token for authentication
- **Repository Pattern**: Data access abstraction layer
- **Service Layer**: Business logic implementation

### 13.2 References
- REST API Best Practices
- PostgreSQL Documentation
- Node.js Best Practices
- Security Guidelines (OWASP)

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Author**: Development Team