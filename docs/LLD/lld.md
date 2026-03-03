# Low Level Design Document

## 1. Introduction

### 1.1 Purpose
This document provides the low-level design for the E-commerce Shopping Cart System. It details the technical implementation, data structures, APIs, and component interactions.

### 1.2 Scope
This LLD covers:
- Cart management functionality
- Product catalog integration
- User authentication and authorization
- Database schema design
- API specifications
- Component architecture

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **REST**: Representational State Transfer
- **UUID**: Universally Unique Identifier

## 2. System Architecture

### 2.1 Component Overview
```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  (Web Browser / Mobile App)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS/REST
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Gateway                            │
│  (Authentication, Rate Limiting, Routing)              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────────┐ ┌▼──────────────┐
│   Cart       │ │  Product   │ │    User       │
│   Service    │ │  Service   │ │   Service     │
└───────┬──────┘ └──┬─────────┘ └┬──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │    Database Layer       │
        │  (PostgreSQL/MySQL)     │
        └─────────────────────────┘
```

### 2.2 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **API Style**: RESTful
- **Caching**: Redis (optional)

## 3. Functional Requirements

### 3.1 Cart Operations
- Users can add items to their cart
- Users can update item quantities
- Users can remove items from cart
- Users can view their cart contents
- Cart persists across sessions for logged-in users

### 3.2 Product Integration
- Real-time product availability checking
- Price synchronization with product catalog
- Product details retrieval

### 3.3 User Management
- User authentication required for cart operations
- Each user has a unique cart
- Cart data is user-specific and secure

## 4. Data Design

### 4.1 Database Schema

#### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Carts Table
```sql
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

#### Cart_Items Table
```sql
CREATE TABLE cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_addition DECIMAL(10, 2) NOT NULL,
    UNIQUE(cart_id, product_id)
);
```

### 4.2 Entity Relationships

```
Users (1) ──────── (1) Carts
                      │
                      │
                      │ (1)
                      │
                      │
                   (Many)
                      │
                 Cart_Items
                      │
                      │ (Many)
                      │
                      │
                   (1)
                      │
                  Products
```

### 4.3 Data Models (TypeScript/JavaScript)

```typescript
interface User {
  user_id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

interface Product {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Cart {
  cart_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  items?: CartItem[];
}

interface CartItem {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_at_addition: number;
  product?: Product;
}

interface CartSummary {
  cart_id: string;
  user_id: string;
  items: CartItemDetail[];
  total_items: number;
  subtotal: number;
}

interface CartItemDetail extends CartItem {
  product_name: string;
  product_image_url?: string;
  current_price: number;
  line_total: number;
}
```

## 5. API Specifications

### 5.1 Authentication
All cart endpoints require JWT authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <jwt_token>
```

### 5.2 Cart Endpoints

#### 5.2.1 Get User Cart
```
GET /api/v1/cart
```

**Description**: Retrieves the current user's cart with all items

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "items": [
      {
        "cart_item_id": "123e4567-e89b-12d3-a456-426614174002",
        "product_id": "123e4567-e89b-12d3-a456-426614174003",
        "product_name": "Laptop",
        "quantity": 2,
        "price_at_addition": 999.99,
        "current_price": 999.99,
        "line_total": 1999.98,
        "product_image_url": "https://example.com/laptop.jpg"
      }
    ],
    "total_items": 2,
    "subtotal": 1999.98
  }
}
```

#### 5.2.2 Add Item to Cart
```
POST /api/v1/cart/items
```

**Description**: Adds a product to the user's cart or updates quantity if already exists

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174003",
  "quantity": 2
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_item_id": "123e4567-e89b-12d3-a456-426614174002",
    "cart_id": "123e4567-e89b-12d3-a456-426614174000",
    "product_id": "123e4567-e89b-12d3-a456-426614174003",
    "quantity": 2,
    "price_at_addition": 999.99
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Insufficient stock available"
}
```

#### 5.2.3 Update Cart Item Quantity
```
PUT /api/v1/cart/items/:cart_item_id
```

**Description**: Updates the quantity of a specific cart item

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
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
  "message": "Cart item updated successfully",
  "data": {
    "cart_item_id": "123e4567-e89b-12d3-a456-426614174002",
    "quantity": 3
  }
}
```

#### 5.2.4 Remove Item from Cart
```
DELETE /api/v1/cart/items/:cart_item_id
```

**Description**: Removes a specific item from the cart

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

#### 5.2.5 Clear Cart
```
DELETE /api/v1/cart
```

**Description**: Removes all items from the user's cart

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

## 6. Component Design

### 6.1 Cart Service

#### 6.1.1 CartController
```typescript
class CartController {
  async getCart(req: Request, res: Response): Promise<void>;
  async addItem(req: Request, res: Response): Promise<void>;
  async updateItem(req: Request, res: Response): Promise<void>;
  async removeItem(req: Request, res: Response): Promise<void>;
  async clearCart(req: Request, res: Response): Promise<void>;
}
```

#### 6.1.2 CartService
```typescript
class CartService {
  async getUserCart(userId: string): Promise<CartSummary>;
  async addItemToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<CartItem>;
  async removeCartItem(userId: string, cartItemId: string): Promise<void>;
  async clearUserCart(userId: string): Promise<void>;
  async getOrCreateCart(userId: string): Promise<Cart>;
  private async validateStock(productId: string, quantity: number): Promise<boolean>;
  private async calculateCartSummary(cart: Cart): Promise<CartSummary>;
}
```

#### 6.1.3 CartRepository
```typescript
class CartRepository {
  async findCartByUserId(userId: string): Promise<Cart | null>;
  async createCart(userId: string): Promise<Cart>;
  async findCartItems(cartId: string): Promise<CartItem[]>;
  async addCartItem(cartItem: Partial<CartItem>): Promise<CartItem>;
  async updateCartItem(cartItemId: string, updates: Partial<CartItem>): Promise<CartItem>;
  async deleteCartItem(cartItemId: string): Promise<void>;
  async deleteAllCartItems(cartId: string): Promise<void>;
  async findCartItemByProductId(cartId: string, productId: string): Promise<CartItem | null>;
}
```

### 6.2 Product Service Integration

```typescript
class ProductServiceClient {
  async getProduct(productId: string): Promise<Product>;
  async checkStock(productId: string, quantity: number): Promise<boolean>;
  async getProducts(productIds: string[]): Promise<Product[]>;
}
```

### 6.3 Authentication Middleware

```typescript
const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
```

## 7. Business Logic

### 7.1 Add Item to Cart Flow

```typescript
async addItemToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
  // 1. Validate input
  if (quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  
  // 2. Get or create cart
  const cart = await this.getOrCreateCart(userId);
  
  // 3. Validate product exists and get details
  const product = await this.productService.getProduct(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  // 4. Check stock availability
  const hasStock = await this.validateStock(productId, quantity);
  if (!hasStock) {
    throw new ValidationError('Insufficient stock available');
  }
  
  // 5. Check if item already exists in cart
  const existingItem = await this.cartRepository.findCartItemByProductId(cart.cart_id, productId);
  
  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    const hasStockForUpdate = await this.validateStock(productId, newQuantity);
    
    if (!hasStockForUpdate) {
      throw new ValidationError('Insufficient stock for requested quantity');
    }
    
    return await this.cartRepository.updateCartItem(existingItem.cart_item_id, {
      quantity: newQuantity
    });
  } else {
    // Add new item
    return await this.cartRepository.addCartItem({
      cart_id: cart.cart_id,
      product_id: productId,
      quantity: quantity,
      price_at_addition: product.price
    });
  }
}
```

### 7.2 Calculate Cart Summary

```typescript
private async calculateCartSummary(cart: Cart): Promise<CartSummary> {
  const items = await this.cartRepository.findCartItems(cart.cart_id);
  
  if (items.length === 0) {
    return {
      cart_id: cart.cart_id,
      user_id: cart.user_id,
      items: [],
      total_items: 0,
      subtotal: 0
    };
  }
  
  // Get current product details
  const productIds = items.map(item => item.product_id);
  const products = await this.productService.getProducts(productIds);
  const productMap = new Map(products.map(p => [p.product_id, p]));
  
  // Build detailed items
  const detailedItems: CartItemDetail[] = items.map(item => {
    const product = productMap.get(item.product_id)!;
    return {
      ...item,
      product_name: product.name,
      product_image_url: product.image_url,
      current_price: product.price,
      line_total: item.quantity * product.price
    };
  });
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = detailedItems.reduce((sum, item) => sum + item.line_total, 0);
  
  return {
    cart_id: cart.cart_id,
    user_id: cart.user_id,
    items: detailedItems,
    total_items: totalItems,
    subtotal: subtotal
  };
}
```

## 8. Error Handling

### 8.1 Error Types

```typescript
class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class InternalServerError extends Error {
  statusCode = 500;
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}
```

### 8.2 Global Error Handler

```typescript
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);
  
  if (err instanceof ValidationError || 
      err instanceof NotFoundError || 
      err instanceof UnauthorizedError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

## 9. Security Considerations

### 9.1 Authentication & Authorization
- All cart operations require valid JWT token
- Users can only access their own cart
- Token expiration and refresh mechanism

### 9.2 Input Validation
- Validate all user inputs
- Sanitize product IDs and quantities
- Prevent SQL injection through parameterized queries

### 9.3 Data Protection
- Passwords hashed using bcrypt
- Sensitive data encrypted at rest
- HTTPS for all API communications

### 9.4 Rate Limiting
```typescript
const rateLimit = require('express-rate-limit');

const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/v1/cart', cartLimiter);
```

## 10. Performance Optimization

### 10.1 Database Indexing
```sql
-- Index on user_id for fast cart lookup
CREATE INDEX idx_carts_user_id ON carts(user_id);

-- Index on cart_id for fast item lookup
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Index on product_id for fast product lookup
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Composite index for unique constraint
CREATE UNIQUE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
```

### 10.2 Caching Strategy (Optional)
```typescript
class CachedCartService extends CartService {
  private cache: Redis;
  
  async getUserCart(userId: string): Promise<CartSummary> {
    const cacheKey = `cart:${userId}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const cart = await super.getUserCart(userId);
    await this.cache.setex(cacheKey, 300, JSON.stringify(cart)); // 5 min TTL
    
    return cart;
  }
  
  async addItemToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const result = await super.addItemToCart(userId, productId, quantity);
    await this.cache.del(`cart:${userId}`); // Invalidate cache
    return result;
  }
}
```

## 11. Testing Strategy

### 11.1 Unit Tests
```typescript
describe('CartService', () => {
  describe('addItemToCart', () => {
    it('should add new item to cart', async () => {
      // Test implementation
    });
    
    it('should update quantity if item exists', async () => {
      // Test implementation
    });
    
    it('should throw error if insufficient stock', async () => {
      // Test implementation
    });
  });
});
```

### 11.2 Integration Tests
```typescript
describe('Cart API', () => {
  it('POST /api/v1/cart/items should add item to cart', async () => {
    const response = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: 'test-id', quantity: 2 });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## 12. Deployment Considerations

### 12.1 Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=production
REDIS_URL=redis://localhost:6379
```

### 12.2 Database Migration
```typescript
// migrations/001_create_cart_tables.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('carts', (table) => {
    table.uuid('cart_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id']);
  });
  
  await knex.schema.createTable('cart_items', (table) => {
    table.uuid('cart_item_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cart_id').notNullable().references('cart_id').inTable('carts').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('product_id').inTable('products');
    table.integer('quantity').notNullable().checkPositive();
    table.decimal('price_at_addition', 10, 2).notNullable();
    table.unique(['cart_id', 'product_id']);
  });
}
```

## 13. Monitoring and Logging

### 13.1 Logging Strategy
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log cart operations
logger.info('Item added to cart', {
  userId: userId,
  productId: productId,
  quantity: quantity,
  timestamp: new Date().toISOString()
});
```

### 13.2 Metrics to Monitor
- Cart creation rate
- Items added per session
- Cart abandonment rate
- API response times
- Error rates by endpoint
- Database query performance

## 14. Appendix

### 14.1 Sample Request/Response Flows

#### Complete Add to Cart Flow
```
1. Client sends POST /api/v1/cart/items
   Headers: Authorization: Bearer <token>
   Body: { "product_id": "abc-123", "quantity": 2 }

2. API Gateway validates token

3. Cart Service:
   a. Validates user authentication
   b. Checks product exists
   c. Validates stock availability
   d. Gets or creates user cart
   e. Adds item or updates quantity
   f. Returns cart item details

4. Response sent to client with cart item data
```

### 14.2 Database Constraints
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate cart items
- Check constraints ensure positive quantities
- Cascade deletes maintain data consistency

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Approved