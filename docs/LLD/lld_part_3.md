## 7. Error Handling

### 7.1 Error Response Format

All API errors follow a consistent format:

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

### 7.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required or failed |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| INSUFFICIENT_STOCK | 409 | Product out of stock |
| PAYMENT_FAILED | 402 | Payment processing failed |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### 7.3 Error Handling Middleware

```javascript
class ErrorHandler {
  static handle(error, req, res, next) {
    console.error('Error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error.message,
          details: error.details
        }
      });
    }

    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error instanceof InsufficientStockError) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: error.message,
          details: {
            product_id: error.productId,
            available: error.available,
            requested: error.requested
          }
        }
      });
    }

    // Default to internal server error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}
```

## 8. Security Considerations

### 8.1 Authentication

- JWT tokens with 24-hour expiration
- Refresh token mechanism for extended sessions
- Secure token storage (httpOnly cookies)
- Token blacklisting for logout

### 8.2 Authorization

```javascript
class AuthorizationMiddleware {
  static requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  static requireOwnership(req, res, next) {
    // Verify that the user owns the resource they're accessing
    const resourceUserId = req.params.userId || req.body.user_id;
    
    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    next();
  }
}
```

### 8.3 Input Validation

```javascript
const { body, param, query, validationResult } = require('express-validator');

class ValidationRules {
  static addToCart() {
    return [
      body('product_id').isUUID().withMessage('Invalid product ID'),
      body('quantity')
        .isInt({ min: 1, max: 100 })
        .withMessage('Quantity must be between 1 and 100')
    ];
  }

  static createOrder() {
    return [
      body('shipping_address.street').notEmpty().trim(),
      body('shipping_address.city').notEmpty().trim(),
      body('shipping_address.state').notEmpty().trim(),
      body('shipping_address.zip_code').matches(/^\d{5}$/),
      body('shipping_address.country').notEmpty().trim(),
      body('payment_method').isIn(['credit_card', 'debit_card', 'paypal']),
      body('payment_token').notEmpty()
    ];
  }

  static validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    next();
  }
}
```

### 8.4 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later'
});
```

### 8.5 SQL Injection Prevention

- Use parameterized queries exclusively
- Never concatenate user input into SQL strings
- Use ORM/query builder with built-in escaping

```javascript
// Good - Parameterized query
const product = await db.query(
  'SELECT * FROM products WHERE id = $1',
  [productId]
);

// Bad - String concatenation (vulnerable to SQL injection)
// const product = await db.query(
//   `SELECT * FROM products WHERE id = '${productId}'`
// );
```

## 9. Performance Optimization

### 9.1 Caching Strategy

```javascript
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key) {
    return await this.redis.get(key);
  }

  async set(key, value, ttl = 3600) {
    return await this.redis.setex(key, ttl, value);
  }

  async delete(key) {
    return await this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      return await this.redis.del(...keys);
    }
  }
}

// Cache invalidation on product update
class ProductRepository {
  async update(productId, data) {
    const result = await db.query(
      'UPDATE products SET ... WHERE id = $1',
      [productId]
    );

    // Invalidate related caches
    await cacheService.delete(`product:${productId}`);
    await cacheService.invalidatePattern('products:*');

    return result;
  }
}
```

### 9.2 Database Indexing

Key indexes for optimal query performance:

```sql
-- Product searches
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);

-- Cart operations
CREATE INDEX idx_carts_user_status ON carts(user_id, status);
CREATE UNIQUE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);

-- Order queries
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
```

### 9.3 Query Optimization

```javascript
// Efficient cart retrieval with items
class CartRepository {
  async getCartWithItems(cartId) {
    // Single query with JOIN instead of N+1 queries
    const query = `
      SELECT 
        c.*,
        ci.id as item_id,
        ci.quantity,
        ci.price_at_addition,
        p.id as product_id,
        p.name as product_name,
        p.price as current_price,
        p.image_url
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [cartId]);
    return this.mapCartWithItems(result.rows);
  }
}
```

### 9.4 Connection Pooling

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
describe('CartService', () => {
  let cartService;
  let mockCartRepository;
  let mockProductService;

  beforeEach(() => {
    mockCartRepository = {
      findActiveByUserId: jest.fn(),
      create: jest.fn()
    };
    mockProductService = {
      getProductById: jest.fn(),
      checkStockAvailability: jest.fn()
    };
    cartService = new CartService(
      mockCartRepository,
      mockCartItemRepository,
      mockProductService
    );
  });

  describe('addItem', () => {
    it('should add item to cart when stock is available', async () => {
      const userId = 'user-123';
      const productId = 'product-456';
      const quantity = 2;

      mockProductService.getProductById.mockResolvedValue({
        id: productId,
        name: 'Test Product',
        price: 29.99,
        stock_quantity: 10
      });

      mockProductService.checkStockAvailability.mockResolvedValue(true);

      mockCartRepository.findActiveByUserId.mockResolvedValue({
        id: 'cart-789',
        user_id: userId
      });

      const result = await cartService.addItem(userId, productId, quantity);

      expect(result).toBeDefined();
      expect(mockProductService.checkStockAvailability).toHaveBeenCalledWith(
        productId,
        quantity
      );
    });

    it('should throw error when stock is insufficient', async () => {
      mockProductService.getProductById.mockResolvedValue({
        id: 'product-456',
        stock_quantity: 1
      });

      mockProductService.checkStockAvailability.mockResolvedValue(false);

      await expect(
        cartService.addItem('user-123', 'product-456', 5)
      ).rejects.toThrow('Insufficient stock available');
    });
  });
});
```

### 10.2 Integration Tests

```javascript
describe('Cart API Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.data.token;
    testUserId = response.body.data.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/cart/items', () => {
    it('should add item to cart', async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: product.id,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({
          product_id: 'some-id',
          quantity: 1
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### 10.3 Load Testing

```javascript
// Using Artillery for load testing
// artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Browse and add to cart"
    flow:
      - get:
          url: "/api/products"
      - think: 2
      - post:
          url: "/api/cart/items"
          json:
            product_id: "{{ $randomUUID }}"
            quantity: 1
          headers:
            Authorization: "Bearer {{ authToken }}"
```
