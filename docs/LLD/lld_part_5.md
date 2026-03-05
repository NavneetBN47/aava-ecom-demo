## 11. Error Handling

### 11.1 Error Categories

**1. Client Errors (4xx):**

- **400 Bad Request:**
  - Invalid input format
  - Missing required fields
  - Invalid data types
  - Validation failures

- **401 Unauthorized:**
  - Missing authentication token
  - Invalid or expired token
  - Token signature verification failed

- **403 Forbidden:**
  - User does not own the resource
  - Insufficient permissions
  - Account suspended

- **404 Not Found:**
  - Product not found
  - Cart not found
  - Cart item not found
  - Order not found

- **409 Conflict:**
  - Insufficient stock
  - Product no longer available
  - Concurrent modification conflict
  - Duplicate cart item

- **422 Unprocessable Entity:**
  - Business rule violation
  - Price changed significantly
  - Product discontinued
  - Quantity exceeds limit

**2. Server Errors (5xx):**

- **500 Internal Server Error:**
  - Unexpected application error
  - Database connection failure
  - Unhandled exceptions

- **502 Bad Gateway:**
  - Downstream service unavailable
  - Payment gateway timeout
  - Inventory service error

- **503 Service Unavailable:**
  - System maintenance
  - Rate limit exceeded
  - Circuit breaker open

- **504 Gateway Timeout:**
  - Request timeout
  - Long-running operation

### 11.2 Error Response Format

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "The requested quantity is not available",
    "details": {
      "product_id": 123,
      "requested_quantity": 10,
      "available_quantity": 5
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/cart/add",
    "trace_id": "abc123xyz"
  }
}
```

### 11.3 Error Handling Strategies

**1. Retry Logic:**
```javascript
async function addToCartWithRetry(productId, quantity, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await addToCart(productId, quantity);
        } catch (error) {
            if (error.code === 'CONFLICT' && attempt < maxRetries) {
                await sleep(1000 * attempt); // Exponential backoff
                continue;
            }
            throw error;
        }
    }
}
```

**2. Circuit Breaker:**
```javascript
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }
    
    async execute(operation) {
        if (this.state === 'OPEN') {
            throw new Error('Circuit breaker is OPEN');
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            setTimeout(() => {
                this.state = 'HALF_OPEN';
                this.failureCount = 0;
            }, this.timeout);
        }
    }
}
```

**3. Graceful Degradation:**
- Use cached data when services are unavailable
- Provide limited functionality during outages
- Queue operations for later processing
- Display appropriate user messages

**4. Logging and Monitoring:**
```javascript
function logError(error, context) {
    logger.error({
        message: error.message,
        stack: error.stack,
        code: error.code,
        context: context,
        timestamp: new Date().toISOString(),
        severity: determineSeverity(error)
    });
    
    // Send to monitoring service
    monitoring.trackError(error, context);
}
```

### 11.4 User-Facing Error Messages

**Cart-Specific Errors:**

1. **Out of Stock:**
   - Message: "Sorry, this item is currently out of stock. We'll notify you when it's available again."
   - Action: Remove from cart or add to wishlist

2. **Insufficient Stock:**
   - Message: "Only {available} items available. Your cart has been updated."
   - Action: Auto-adjust quantity

3. **Price Changed:**
   - Message: "The price of {product_name} has changed from ${old_price} to ${new_price}."
   - Action: Require user confirmation

4. **Product Discontinued:**
   - Message: "This product is no longer available and has been removed from your cart."
   - Action: Auto-remove and suggest alternatives

5. **Session Expired:**
   - Message: "Your session has expired. Please log in again to continue."
   - Action: Redirect to login, preserve cart

## 12. Security Requirements

### 12.1 Cart Security

**Authentication & Authorization:**

1. **User Authentication:**
   - JWT-based authentication required for all cart operations
   - Token must be validated on every request
   - Token expiration: 24 hours
   - Refresh token mechanism for extended sessions

2. **Authorization Rules:**
   - Users can only access their own carts
   - Admin users can view any cart (for support purposes)
   - Cart operations require active user account
   - Implement role-based access control (RBAC)

3. **Session Management:**
   - Associate cart with user session
   - Support guest carts with session ID
   - Merge guest cart with user cart on login
   - Expire inactive carts after 30 days

**Data Protection:**

1. **Sensitive Data Handling:**
   - Never store payment card details in cart
   - Use tokenization for payment methods
   - Encrypt sensitive user data at rest
   - Use HTTPS for all API communications

2. **Input Validation:**
   - Validate all inputs against whitelist
   - Sanitize user-provided data
   - Implement rate limiting per user
   - Prevent SQL injection and XSS attacks

3. **Cart Tampering Prevention:**
   - Validate cart totals server-side
   - Never trust client-side calculations
   - Use checksums to detect tampering
   - Log suspicious activities

**API Security:**

1. **Rate Limiting:**
   - 100 requests per minute per user
   - 10 cart modifications per minute
   - Exponential backoff for repeated failures
   - IP-based rate limiting for anonymous users

2. **CORS Configuration:**
   - Whitelist allowed origins
   - Restrict HTTP methods
   - Validate Origin header
   - Implement CSRF protection

3. **Request Validation:**
   - Validate Content-Type headers
   - Check request size limits
   - Verify API version compatibility
   - Implement request signing for critical operations

**Audit & Compliance:**

1. **Audit Logging:**
   - Log all cart modifications
   - Track user actions with timestamps
   - Record IP addresses and user agents
   - Maintain audit trail for compliance

2. **Privacy Compliance:**
   - GDPR compliance for EU users
   - CCPA compliance for California users
   - Implement right to deletion
   - Provide data export functionality

3. **Security Monitoring:**
   - Monitor for unusual cart activities
   - Detect and prevent cart abandonment fraud
   - Alert on suspicious patterns
   - Implement anomaly detection

**Example Security Implementation:**
```javascript
// JWT Validation Middleware
async function validateCartAccess(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        // Verify cart ownership
        const cart = await getCart(req.params.cartId);
        if (cart.user_id !== userId && !decoded.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Rate Limiting
const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Input Sanitization
function sanitizeCartInput(input) {
    return {
        product_id: parseInt(input.product_id),
        quantity: Math.min(Math.max(parseInt(input.quantity), 1), 99)
    };
}
```

## 13. Performance Requirements

### 13.1 Scalability Requirements

**Horizontal Scaling:**

1. **Stateless Services:**
   - All services must be stateless
   - Session data stored in Redis
   - Support for multiple service instances
   - Load balancing across instances

2. **Database Scaling:**
   - Read replicas for query distribution
   - Write operations to primary database
   - Connection pooling (min: 10, max: 100)
   - Query optimization and indexing

3. **Caching Strategy:**
   - Redis for session and cart data
   - Cache frequently accessed products
   - Cache invalidation on updates
   - TTL: 15 minutes for cart data, 1 hour for product data

4. **Auto-Scaling:**
   - Scale based on CPU utilization (>70%)
   - Scale based on request rate (>1000 req/min)
   - Minimum instances: 2
   - Maximum instances: 20

**Performance Targets:**

1. **Response Times:**
   - GET /api/cart: < 100ms (p95)
   - POST /api/cart/add: < 200ms (p95)
   - PUT /api/cart/item/{itemId}: < 150ms (p95)
   - DELETE /api/cart/item/{itemId}: < 100ms (p95)
   - POST /api/orders: < 500ms (p95)

2. **Throughput:**
   - Support 10,000 concurrent users
   - Handle 5,000 requests per second
   - Process 1,000 orders per minute
   - 99.9% uptime SLA

3. **Database Performance:**
   - Query execution: < 50ms (p95)
   - Transaction commit: < 100ms
   - Index usage: > 95% of queries
   - Connection pool utilization: < 80%

**Optimization Techniques:**

1. **Query Optimization:**
```sql
-- Optimized cart retrieval with items
SELECT 
    c.cart_id, c.user_id, c.created_at, c.updated_at,
    ci.cart_item_id, ci.product_id, ci.quantity, ci.price_at_addition,
    p.name, p.image_url, p.sku
FROM shopping_carts c
LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.product_id
WHERE c.user_id = ? AND c.is_active = TRUE;

-- Index for performance
CREATE INDEX idx_cart_user_active ON shopping_carts(user_id, is_active);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
```

2. **Caching Implementation:**
```javascript
async function getCartWithCache(userId) {
    const cacheKey = `cart:${userId}`;
    
    // Try cache first
    let cart = await redis.get(cacheKey);
    if (cart) {
        return JSON.parse(cart);
    }
    
    // Cache miss - fetch from database
    cart = await fetchCartFromDB(userId);
    
    // Store in cache
    await redis.setex(cacheKey, 900, JSON.stringify(cart)); // 15 min TTL
    
    return cart;
}

async function invalidateCartCache(userId) {
    await redis.del(`cart:${userId}`);
}
```

3. **Batch Operations:**
```javascript
// Batch inventory checks
async function checkInventoryBatch(productIds) {
    const query = `
        SELECT product_id, quantity_available 
        FROM inventory 
        WHERE product_id IN (?)
    `;
    return await db.query(query, [productIds]);
}
```

4. **Asynchronous Processing:**
```javascript
// Queue cart recalculation for async processing
async function queueCartRecalculation(cartId) {
    await messageQueue.publish('cart.recalculate', {
        cartId: cartId,
        timestamp: new Date()
    });
}
```

**Monitoring & Metrics:**

1. **Key Metrics:**
   - Request latency (p50, p95, p99)
   - Error rate (target: < 0.1%)
   - Cache hit rate (target: > 80%)
   - Database connection pool usage
   - API throughput (requests/second)

2. **Alerting Thresholds:**
   - Response time > 1 second
   - Error rate > 1%
   - Cache hit rate < 70%
   - Database connection pool > 90%
   - CPU utilization > 80%

3. **Performance Testing:**
   - Load testing: 10,000 concurrent users
   - Stress testing: 2x expected peak load
   - Endurance testing: 24-hour sustained load
   - Spike testing: Sudden 10x traffic increase
