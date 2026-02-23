# Low-Level Design Document

## Project Overview

### Project Name
E-Commerce Platform

### Purpose
This document provides a comprehensive low-level design for an e-commerce platform that enables users to browse products, manage shopping carts, and complete purchases securely.

### Scope
The system includes:
- Product catalog management
- Shopping cart functionality
- User authentication and session management
- Order processing
- Payment integration
- Admin dashboard for product and order management

### Technology Stack
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Stripe API
- **Deployment**: Docker containers on AWS ECS

---

## System Architecture

### High-Level Architecture
```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     API Gateway / Load Balancer │
└──────────────┬──────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│   API       │  │   API       │
│  Server 1   │  │  Server 2   │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬────────┘
                ▼
       ┌────────────────┐
       │  Redis Cache   │
       └────────────────┘
                │
                ▼
       ┌────────────────┐
       │   PostgreSQL   │
       │    Database    │
       └────────────────┘
```

### Component Interaction Flow
1. Client sends HTTP requests to API Gateway
2. API Gateway routes requests to available API servers
3. API servers check Redis cache for frequently accessed data
4. If cache miss, API servers query PostgreSQL database
5. Response flows back through the chain to the client

---

## Detailed Component Design

### 1. Authentication Service

#### Module: `AuthController`
**File**: `src/controllers/authController.ts`

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  token: string;
  user: UserDTO;
}

class AuthController {
  async register(req: Request, res: Response): Promise<void>;
  async login(req: Request, res: Response): Promise<void>;
  async logout(req: Request, res: Response): Promise<void>;
  async refreshToken(req: Request, res: Response): Promise<void>;
}
```

**Methods**:

1. **register()**
   - **Input**: RegisterRequest
   - **Process**:
     - Validate email format and password strength
     - Check if email already exists
     - Hash password using bcrypt (salt rounds: 10)
     - Create user record in database
     - Generate JWT token
   - **Output**: AuthResponse with token and user data
   - **Error Handling**: 
     - 400: Invalid input
     - 409: Email already exists
     - 500: Server error

2. **login()**
   - **Input**: LoginRequest
   - **Process**:
     - Validate credentials
     - Compare hashed password
     - Generate JWT token (expiry: 24 hours)
     - Store session in Redis
   - **Output**: AuthResponse
   - **Error Handling**:
     - 401: Invalid credentials
     - 500: Server error

3. **logout()**
   - **Input**: JWT token from header
   - **Process**:
     - Invalidate token in Redis
     - Clear session data
   - **Output**: Success message

4. **refreshToken()**
   - **Input**: Refresh token
   - **Process**:
     - Validate refresh token
     - Generate new access token
   - **Output**: New JWT token

---

### 2. Product Service

#### Module: `ProductController`
**File**: `src/controllers/productController.ts`

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  page: number;
  limit: number;
}

class ProductController {
  async getProducts(filter: ProductFilter): Promise<PaginatedResponse<Product>>;
  async getProductById(id: string): Promise<Product>;
  async createProduct(product: CreateProductDTO): Promise<Product>;
  async updateProduct(id: string, updates: UpdateProductDTO): Promise<Product>;
  async deleteProduct(id: string): Promise<void>;
}
```

**Methods**:

1. **getProducts()**
   - **Input**: ProductFilter
   - **Process**:
     - Build SQL query with filters
     - Check Redis cache for results
     - If cache miss, query database
     - Cache results (TTL: 5 minutes)
     - Apply pagination
   - **Output**: Paginated list of products
   - **Caching Strategy**: Cache key format: `products:{category}:{minPrice}:{maxPrice}:{page}`

2. **getProductById()**
   - **Input**: Product ID
   - **Process**:
     - Check Redis cache
     - If miss, query database
     - Cache result (TTL: 10 minutes)
   - **Output**: Product details
   - **Error Handling**: 404 if product not found

3. **createProduct()**
   - **Input**: CreateProductDTO
   - **Process**:
     - Validate product data
     - Insert into database
     - Invalidate relevant cache entries
   - **Output**: Created product
   - **Authorization**: Admin only

4. **updateProduct()**
   - **Input**: Product ID and UpdateProductDTO
   - **Process**:
     - Validate updates
     - Update database record
     - Invalidate cache
   - **Output**: Updated product
   - **Authorization**: Admin only

5. **deleteProduct()**
   - **Input**: Product ID
   - **Process**:
     - Soft delete (set deleted flag)
     - Invalidate cache
   - **Output**: Success confirmation
   - **Authorization**: Admin only

---

### 3. Shopping Cart Service

#### Module: `CartController`
**File**: `src/controllers/cartController.ts`

```typescript
interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: Date;
}

class CartController {
  async getCart(userId: string): Promise<Cart>;
  async addItem(userId: string, item: CartItem): Promise<Cart>;
  async updateItem(userId: string, productId: string, quantity: number): Promise<Cart>;
  async removeItem(userId: string, productId: string): Promise<Cart>;
  async clearCart(userId: string): Promise<void>;
}
```

**Methods**:

1. **getCart()**
   - **Input**: User ID
   - **Process**:
     - Retrieve cart from Redis (primary storage)
     - If not in Redis, check database
     - Calculate total amount
   - **Output**: Cart object
   - **Storage**: Redis with key format: `cart:{userId}`

2. **addItem()**
   - **Input**: User ID and CartItem
   - **Process**:
     - Validate product exists and has sufficient stock
     - Check if item already in cart
     - If exists, increment quantity
     - If new, add to cart
     - Update Redis and database
     - Recalculate total
   - **Output**: Updated cart
   - **Error Handling**: 400 if insufficient stock

3. **updateItem()**
   - **Input**: User ID, Product ID, new quantity
   - **Process**:
     - Validate stock availability
     - Update quantity in cart
     - If quantity is 0, remove item
     - Update Redis and database
     - Recalculate total
   - **Output**: Updated cart

4. **removeItem()**
   - **Input**: User ID, Product ID
   - **Process**:
     - Remove item from cart
     - Update Redis and database
     - Recalculate total
   - **Output**: Updated cart

5. **clearCart()**
   - **Input**: User ID
   - **Process**:
     - Remove all items from cart
     - Update Redis and database
   - **Output**: Success confirmation

---

### 4. Order Service

#### Module: `OrderController`
**File**: `src/controllers/orderController.ts`

```typescript
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

class OrderController {
  async createOrder(userId: string, orderData: CreateOrderDTO): Promise<Order>;
  async getOrders(userId: string): Promise<Order[]>;
  async getOrderById(orderId: string): Promise<Order>;
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  async cancelOrder(orderId: string): Promise<Order>;
}
```

**Methods**:

1. **createOrder()**
   - **Input**: User ID and CreateOrderDTO
   - **Process**:
     - Validate cart items and stock
     - Create order record
     - Initiate payment processing
     - Reduce product stock
     - Clear user's cart
     - Send order confirmation email
   - **Output**: Created order
   - **Transaction**: Database transaction to ensure atomicity
   - **Error Handling**: Rollback on payment failure

2. **getOrders()**
   - **Input**: User ID
   - **Process**:
     - Query orders for user
     - Sort by creation date (descending)
   - **Output**: List of orders

3. **getOrderById()**
   - **Input**: Order ID
   - **Process**:
     - Retrieve order details
     - Verify user authorization
   - **Output**: Order details
   - **Error Handling**: 404 if not found, 403 if unauthorized

4. **updateOrderStatus()**
   - **Input**: Order ID and new status
   - **Process**:
     - Validate status transition
     - Update order status
     - Send notification to user
   - **Output**: Updated order
   - **Authorization**: Admin only

5. **cancelOrder()**
   - **Input**: Order ID
   - **Process**:
     - Check if order can be cancelled
     - Update status to CANCELLED
     - Restore product stock
     - Process refund if payment completed
   - **Output**: Cancelled order
   - **Business Rule**: Can only cancel if status is PENDING or CONFIRMED

---

### 5. Payment Service

#### Module: `PaymentController`
**File**: `src/controllers/paymentController.ts`

```typescript
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderId: string;
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

class PaymentController {
  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent>;
  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;
  async refundPayment(paymentIntentId: string): Promise<PaymentIntent>;
  async handleWebhook(event: StripeEvent): Promise<void>;
}
```

**Methods**:

1. **createPaymentIntent()**
   - **Input**: Order ID and amount
   - **Process**:
     - Create Stripe payment intent
     - Store payment record in database
   - **Output**: PaymentIntent with client secret
   - **Integration**: Stripe API

2. **confirmPayment()**
   - **Input**: Payment Intent ID
   - **Process**:
     - Confirm payment with Stripe
     - Update order status
     - Update payment status
   - **Output**: Confirmed PaymentIntent

3. **refundPayment()**
   - **Input**: Payment Intent ID
   - **Process**:
     - Create refund in Stripe
     - Update payment status
     - Update order status
   - **Output**: Refunded PaymentIntent

4. **handleWebhook()**
   - **Input**: Stripe webhook event
   - **Process**:
     - Verify webhook signature
     - Process event based on type
     - Update relevant records
   - **Output**: Acknowledgment
   - **Security**: Verify Stripe signature

---

## API Endpoints

### Authentication Endpoints

```
POST /api/auth/register
Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}

POST /api/auth/login
Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}

POST /api/auth/logout
Headers: Authorization: Bearer {token}
Response: 200 OK
{
  "message": "Logged out successfully"
}

POST /api/auth/refresh
Request Body:
{
  "refreshToken": "refresh_token_here"
}
Response: 200 OK
{
  "token": "new_access_token"
}
```

### Product Endpoints

```
GET /api/products
Query Parameters:
  - category (optional)
  - minPrice (optional)
  - maxPrice (optional)
  - searchTerm (optional)
  - page (default: 1)
  - limit (default: 20)
Response: 200 OK
{
  "products": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}

GET /api/products/:id
Response: 200 OK
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "category": "Electronics",
  "stock": 50,
  "images": ["url1", "url2"]
}

POST /api/products
Headers: Authorization: Bearer {admin_token}
Request Body:
{
  "name": "New Product",
  "description": "Description",
  "price": 49.99,
  "category": "Electronics",
  "stock": 100,
  "images": ["url1"]
}
Response: 201 Created

PUT /api/products/:id
Headers: Authorization: Bearer {admin_token}
Request Body: (partial update allowed)
Response: 200 OK

DELETE /api/products/:id
Headers: Authorization: Bearer {admin_token}
Response: 204 No Content
```

### Cart Endpoints

```
GET /api/cart
Headers: Authorization: Bearer {token}
Response: 200 OK
{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 29.99,
      "product": {...}
    }
  ],
  "totalAmount": 59.98
}

POST /api/cart/items
Headers: Authorization: Bearer {token}
Request Body:
{
  "productId": "uuid",
  "quantity": 1
}
Response: 200 OK

PUT /api/cart/items/:productId
Headers: Authorization: Bearer {token}
Request Body:
{
  "quantity": 3
}
Response: 200 OK

DELETE /api/cart/items/:productId
Headers: Authorization: Bearer {token}
Response: 200 OK

DELETE /api/cart
Headers: Authorization: Bearer {token}
Response: 204 No Content
```

### Order Endpoints

```
POST /api/orders
Headers: Authorization: Bearer {token}
Request Body:
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "card"
}
Response: 201 Created

GET /api/orders
Headers: Authorization: Bearer {token}
Response: 200 OK
{
  "orders": [...]
}

GET /api/orders/:id
Headers: Authorization: Bearer {token}
Response: 200 OK

PUT /api/orders/:id/status
Headers: Authorization: Bearer {admin_token}
Request Body:
{
  "status": "SHIPPED"
}
Response: 200 OK

POST /api/orders/:id/cancel
Headers: Authorization: Bearer {token}
Response: 200 OK
```

### Payment Endpoints

```
POST /api/payments/intent
Headers: Authorization: Bearer {token}
Request Body:
{
  "orderId": "uuid",
  "amount": 59.98
}
Response: 200 OK
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}

POST /api/payments/confirm
Headers: Authorization: Bearer {token}
Request Body:
{
  "paymentIntentId": "pi_xxx"
}
Response: 200 OK

POST /api/payments/webhook
Headers: Stripe-Signature: {signature}
Request Body: (Stripe event)
Response: 200 OK
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  images JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
```

### Carts Table
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_carts_user_id ON carts(user_id);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  shipping_address JSONB NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);
```

### Sessions Table (for Redis backup)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## Presentation Layer Components

### React Component Structure

#### 1. Authentication Components

**LoginForm Component**
```typescript
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
```

**RegisterForm Component**
```typescript
// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, loading } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      onSuccess?.();
    } catch (err) {
      setErrors({ general: 'Registration failed. Please try again.' });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          disabled={loading}
        />
        {errors.firstName && <span className="error">{errors.firstName}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          disabled={loading}
        />
        {errors.lastName && <span className="error">{errors.lastName}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={loading}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          disabled={loading}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          disabled={loading}
        />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
      </div>
      
      {errors.general && <div className="error-message">{errors.general}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
```

#### 2. Product Components

**ProductList Component**
```typescript
// src/components/products/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from './ProductCard';
import Pagination from '../common/Pagination';
import ProductFilter from './ProductFilter';

interface ProductListProps {
  category?: string;
}

const ProductList: React.FC<ProductListProps> = ({ category }) => {
  const [filters, setFilters] = useState({
    category: category || '',
    minPrice: undefined,
    maxPrice: undefined,
    searchTerm: '',
    page: 1,
    limit: 20
  });
  
  const { products, pagination, loading, error, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error loading products: {error}</div>;

  return (
    <div className="product-list-container">
      <ProductFilter 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="no-products">No products found</div>
      )}
      
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default ProductList;
```

**ProductCard Component**
```typescript
// src/components/products/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, loading } = useCart();
  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = async () => {
    try {
      await addItem(product.id, quantity);
      // Show success notification
    } catch (error) {
      // Show error notification
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="product-image"
        />
      </Link>
      
      <div className="product-info">
        <Link to={`/products/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        
        <p className="product-price">${product.price.toFixed(2)}</p>
        
        <div className="product-actions">
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="quantity-input"
          />
          
          <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className="add-to-cart-btn"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
```

**ProductDetail Component**
```typescript
// src/components/products/ProductDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error, fetchProductById } = useProducts();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (product) {
      await addItem(product.id, quantity);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-images">
        <img 
          src={product.images[selectedImage]} 
          alt={product.name}
          className="main-image"
        />
        <div className="image-thumbnails">
          {product.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${product.name} ${index + 1}`}
              className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            />
          ))}
        </div>
      </div>
      
      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="category">{product.category}</p>
        <p className="price">${product.price.toFixed(2)}</p>
        <p className="description">{product.description}</p>
        
        <div className="stock-info">
          {product.stock > 0 ? (
            <span className="in-stock">In Stock: {product.stock} available</span>
          ) : (
            <span className="out-of-stock">Out of Stock</span>
          )}
        </div>
        
        <div className="purchase-section">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="add-to-cart-btn"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
```

#### 3. Shopping Cart Components

**Cart Component**
```typescript
// src/components/cart/Cart.tsx
import React, { useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import CartItem from './CartItem';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  const { cart, loading, error, fetchCart, clearCart } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  if (loading) return <div className="loading">Loading cart...</div>;
  if (error) return <div className="error">{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <Link to="/products" className="continue-shopping-btn">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      
      <div className="cart-items">
        {cart.items.map(item => (
          <CartItem key={item.productId} item={item} />
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${cart.totalAmount.toFixed(2)}</span>
        </div>
        
        <div className="cart-actions">
          <button onClick={handleClearCart} className="clear-cart-btn">
            Clear Cart
          </button>
          
          <Link to="/checkout" className="checkout-btn">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
```

**CartItem Component**
```typescript
// src/components/cart/CartItem.tsx
import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { CartItem as CartItemType } from '../../types';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateItem, removeItem, loading } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    await updateItem(item.productId, newQuantity);
  };

  const handleRemove = async () => {
    await removeItem(item.productId);
  };

  return (
    <div className="cart-item">
      <img 
        src={item.product.images[0]} 
        alt={item.product.name}
        className="item-image"
      />
      
      <div className="item-details">
        <h3>{item.product.name}</h3>
        <p className="item-price">${item.price.toFixed(2)}</p>
      </div>
      
      <div className="item-quantity">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={loading || quantity <= 1}
        >
          -
        </button>
        
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
          min="1"
          max={item.product.stock}
          disabled={loading}
        />
        
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={loading || quantity >= item.product.stock}
        >
          +
        </button>
      </div>
      
      <div className="item-total">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      
      <button
        onClick={handleRemove}
        disabled={loading}
        className="remove-btn"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;
```

#### 4. Checkout Component

**Checkout Component**
```typescript
// src/components/checkout/Checkout.tsx
import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useOrder } from '../../hooks/useOrder';
import { useNavigate } from 'react-router-dom';
import AddressForm from './AddressForm';
import PaymentForm from './PaymentForm';

const Checkout: React.FC = () => {
  const { cart } = useCart();
  const { createOrder, loading } = useOrder();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleAddressSubmit = (address: any) => {
    setShippingAddress(address);
    setStep(2);
  };

  const handlePaymentSubmit = async (paymentDetails: any) => {
    try {
      const order = await createOrder({
        shippingAddress,
        paymentMethod,
        paymentDetails
      });
      
      navigate(`/orders/${order.id}`);
    } catch (error) {
      // Handle error
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Shipping</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Payment</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Review</div>
      </div>
      
      {step === 1 && (
        <AddressForm onSubmit={handleAddressSubmit} />
      )}
      
      {step === 2 && (
        <PaymentForm 
          amount={cart.totalAmount}
          onSubmit={handlePaymentSubmit}
          loading={loading}
        />
      )}
      
      <div className="order-summary">
        <h3>Order Summary</h3>
        {cart.items.map(item => (
          <div key={item.productId} className="summary-item">
            <span>{item.product.name} x {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-total">
          <strong>Total:</strong>
          <strong>${cart.totalAmount.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
```

---

## Session Management and Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

### Token Generation
```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
```

### Authentication Middleware
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { redisClient } from '../config/redis';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    const payload = verifyToken(token);
    
    // Check if session exists in Redis
    const session = await redisClient.get(`session:${payload.userId}`);
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

### Session Management in Redis
```typescript
// src/services/sessionService.ts
import { redisClient } from '../config/redis';

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

export class SessionService {
  async createSession(userId: string, token: string): Promise<void> {
    const sessionData = {
      userId,
      token,
      createdAt: new Date().toISOString()
    };
    
    await redisClient.setex(
      `session:${userId}`,
      SESSION_TTL,
      JSON.stringify(sessionData)
    );
  }
  
  async getSession(userId: string): Promise<any> {
    const session = await redisClient.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  }
  
  async deleteSession(userId: string): Promise<void> {
    await redisClient.del(`session:${userId}`);
  }
  
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await redisClient.setex(
      `blacklist:${token}`,
      expiresIn,
      'true'
    );
  }
  
  async extendSession(userId: string): Promise<void> {
    await redisClient.expire(`session:${userId}`, SESSION_TTL);
  }
}
```

### React Authentication Hook
```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const register = async (data: RegisterData) => {
    const response = await axios.post('/api/auth/register', data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Error Handling

### Global Error Handler Middleware
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Validation Error Handler
```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};
```

### Frontend Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Design Patterns

### 1. Repository Pattern
```typescript
// src/repositories/productRepository.ts
import { Pool } from 'pg';
import { Product } from '../types';

export class ProductRepository {
  constructor(private db: Pool) {}

  async findAll(filters: any): Promise<Product[]> {
    const query = this.buildQuery(filters);
    const result = await this.db.query(query.text, query.values);
    return result.rows;
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const result = await this.db.query(
      `INSERT INTO products (name, description, price, category, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product.name, product.description, product.price, product.category, product.stock, JSON.stringify(product.images)]
    );
    return result.rows[0];
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await this.db.query(
      `UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query(
      'UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private buildQuery(filters: any) {
    // Query building logic
  }
}
```

### 2. Service Layer Pattern
```typescript
// src/services/productService.ts
import { ProductRepository } from '../repositories/productRepository';
import { CacheService } from './cacheService';
import { AppError } from '../middleware/errorHandler';

export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private cache: CacheService
  ) {}

  async getProducts(filters: any) {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const products = await this.productRepo.findAll(filters);
    
    // Cache results
    await this.cache.set(cacheKey, JSON.stringify(products), 300);
    
    return products;
  }

  async getProductById(id: string) {
    const cacheKey = `product:${id}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    await this.cache.set(cacheKey, JSON.stringify(product), 600);
    
    return product;
  }

  async createProduct(data: any) {
    const product = await this.productRepo.create(data);
    await this.cache.invalidatePattern('products:*');
    return product;
  }
}
```

### 3. Factory Pattern
```typescript
// src/factories/notificationFactory.ts
interface Notification {
  send(recipient: string, message: string): Promise<void>;
}

class EmailNotification implements Notification {
  async send(recipient: string, message: string) {
    // Send email
  }
}

class SMSNotification implements Notification {
  async send(recipient: string, message: string) {
    // Send SMS
  }
}

export class NotificationFactory {
  static create(type: 'email' | 'sms'): Notification {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SMSNotification();
      default:
        throw new Error('Invalid notification type');
    }
  }
}
```

---

## Security Considerations

### 1. Input Validation
```typescript
// src/validators/productValidator.ts
import { body } from 'express-validator';

export const createProductValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Name must be between 3 and 255 characters'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
];
```

### 2. SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL strings
- Use ORM/query builders when possible

### 3. XSS Prevention
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });
};
```

### 4. CSRF Protection
```typescript
// src/middleware/csrf.ts
import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});
```

### 5. Rate Limiting
```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  message: 'Too many login attempts'
});
```

### 6. Helmet Security Headers
```typescript
// src/app.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Performance Considerations

### 1. Database Indexing Strategy
```sql
-- Frequently queried fields
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_products_category_price ON products(category, price);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
```

### 2. Caching Strategy
```typescript
// src/services/cacheService.ts
import { redisClient } from '../config/redis';

export class CacheService {
  async get(key: string): Promise<string | null> {
    return await redisClient.get(key);
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    await redisClient.setex(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}
```

### 3. Database Connection Pooling
```typescript
// src/config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 4. Lazy Loading Images
```typescript
// src/components/common/LazyImage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, placeholder }) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imageRef && imageSrc !== src) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.01 }
      );
      
      observer.observe(imageRef);
    }
    
    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src]);

  return <img ref={setImageRef} src={imageSrc} alt={alt} />;
};

export default LazyImage;
```

### 5. Pagination Implementation
```typescript
// src/utils/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
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

export const paginate = <T>(
  items: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(totalCount / params.limit);
  
  return {
    data: items,
    pagination: {
      currentPage: params.page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: params.limit,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1
    }
  };
};
```

---

## Testing Strategy

### 1. Unit Tests
```typescript
// tests/unit/services/productService.test.ts
import { ProductService } from '../../../src/services/productService';
import { ProductRepository } from '../../../src/repositories/productRepository';
import { CacheService } from '../../../src/services/cacheService';

jest.mock('../../../src/repositories/productRepository');
jest.mock('../../../src/services/cacheService');

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepo: jest.Mocked<ProductRepository>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockProductRepo = new ProductRepository(null as any) as jest.Mocked<ProductRepository>;
    mockCache = new CacheService() as jest.Mocked<CacheService>;
    productService = new ProductService(mockProductRepo, mockCache);
  });

  describe('getProductById', () => {
    it('should return cached product if available', async () => {
      const mockProduct = { id: '1', name: 'Test Product', price: 10 };
      mockCache.get.mockResolvedValue(JSON.stringify(mockProduct));

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(mockCache.get).toHaveBeenCalledWith('product:1');
      expect(mockProductRepo.findById).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      const mockProduct = { id: '1', name: 'Test Product', price: 10 };
      mockCache.get.mockResolvedValue(null);
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepo.findById).toHaveBeenCalledWith('1');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should throw error if product not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(productService.getProductById('1')).rejects.toThrow('Product not found');
    });
  });
});
```

### 2. Integration Tests
```typescript
// tests/integration/api/products.test.ts
import request from 'supertest';
import { app } from '../../../src/app';
import { pool } from '../../../src/config/database';

describe('Product API', () => {
  beforeAll(async () => {
    // Setup test database
    await pool.query('BEGIN');
  });

  afterAll(async () => {
    await pool.query('ROLLBACK');
    await pool.end();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Electronics' });

      expect(response.status).toBe(200);
      response.body.products.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin token', async () => {
      const adminToken = 'valid_admin_token';
      const newProduct = {
        name: 'New Product',
        description: 'Test description',
        price: 29.99,
        category: 'Electronics',
        stock: 100
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newProduct.name);
    });

    it('should reject creation without admin token', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });
});
```

### 3. E2E Tests
```typescript
// tests/e2e/checkout.test.ts
import { chromium, Browser, Page } from 'playwright';

describe('Checkout Flow', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('should complete full checkout process', async () => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Add product to cart
    await page.goto('http://localhost:3000/products');
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForSelector('.cart-notification');

    // Go to cart
    await page.click('.cart-icon');
    await page.waitForSelector('.cart-container');

    // Proceed to checkout
    await page.click('.checkout-btn');
    await page.waitForSelector('.checkout-container');

    // Fill shipping address
    await page.fill('#street', '123 Main St');
    await page.fill('#city', 'New York');
    await page.fill('#state', 'NY');
    await page.fill('#zipCode', '10001');
    await page.click('button[type="submit"]');

    // Fill payment details
    await page.waitForSelector('.payment-form');
    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#expiry', '12/25');
    await page.fill('#cvc', '123');
    await page.click('.submit-payment-btn');

    // Verify order confirmation
    await page.waitForSelector('.order-confirmation');
    const confirmationText = await page.textContent('.order-confirmation h1');
    expect(confirmationText).toContain('Order Confirmed');
  });
});
```

### 4. Performance Tests
```typescript
// tests/performance/load.test.ts
import autocannon from 'autocannon';

describe('Load Tests', () => {
  it('should handle 100 concurrent requests to product listing', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/products',
      connections: 100,
      duration: 10,
      pipelining: 1
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.requests.average).toBeGreaterThan(100);
  });
});
```

---

## Deployment Considerations

### 1. Docker Configuration

**Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**docker-compose.yml**
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
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 2. Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=admin
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 3. CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: myapp:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS ECS
        run: |
          aws ecs update-service \
            --cluster production \
            --service api \
            --force-new-deployment
```

### 4. Monitoring and Logging
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
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

## Future Enhancements

1. **Wishlist Feature**
   - Allow users to save products for later
   - Share wishlists with others

2. **Product Reviews and Ratings**
   - User-generated reviews
   - Star ratings
   - Verified purchase badges

3. **Advanced Search**
   - Elasticsearch integration
   - Faceted search
   - Auto-suggestions

4. **Recommendation Engine**
   - Collaborative filtering
   - Content-based recommendations
   - Personalized product suggestions

5. **Multi-currency Support**
   - Currency conversion
   - Localized pricing

6. **Inventory Management**
   - Low stock alerts
   - Automatic reordering
   - Supplier integration

7. **Analytics Dashboard**
   - Sales metrics
   - User behavior tracking
   - Conversion funnel analysis

8. **Mobile App**
   - React Native implementation
   - Push notifications
   - Offline support

---

## Appendix

### A. API Response Formats

**Success Response**
```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

**Error Response**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### B. Database Migration Scripts

```sql
-- migrations/001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables as defined in Database Schema section

-- migrations/002_add_indexes.sql
-- Create indexes as defined in Performance Considerations section
```

### C. Environment Setup Guide

1. Install Node.js 18+
2. Install PostgreSQL 15+
3. Install Redis 7+
4. Clone repository
5. Run `npm install`
6. Copy `.env.example` to `.env`
7. Run migrations: `npm run migrate`
8. Start development server: `npm run dev`

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Approved