# Low Level Design Document
## E-Commerce Shopping Cart Module

### 1. Introduction

#### 1.1 Purpose
This document provides a detailed low-level design for the Shopping Cart module of an e-commerce platform. It covers the technical implementation details, data structures, APIs, and integration points necessary for development.

#### 1.2 Scope
The Shopping Cart module handles:
- Adding/removing items to/from cart
- Updating item quantities
- Calculating totals and applying discounts
- Managing cart persistence across sessions
- Integration with inventory and pricing services

Out of scope:
- Payment processing
- Order fulfillment
- Wishlist functionality
- Save for Later feature

#### 1.3 Definitions and Acronyms
- **SKU**: Stock Keeping Unit
- **UUID**: Universally Unique Identifier
- **REST**: Representational State Transfer
- **ACID**: Atomicity, Consistency, Isolation, Durability

---

### 2. System Architecture

#### 2.1 Component Overview
```
┌─────────────────┐
│   Web Client    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Shopping Cart Service         │
│  ┌──────────────────────────┐   │
│  │  Cart Controller         │   │
│  └──────────┬───────────────┘   │
│             │                   │
│  ┌──────────▼───────────────┐   │
│  │  Cart Business Logic     │   │
│  └──────────┬───────────────┘   │
│             │                   │
│  ┌──────────▼───────────────┐   │
│  │  Cart Repository         │   │
│  └──────────┬───────────────┘   │
└─────────────┼───────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐      ┌──────────────┐
│ Database│      │ Cache (Redis)│
└─────────┘      └──────────────┘
```

#### 2.2 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ (for async operations)
- **API Protocol**: REST with JSON

---

### 3. Data Models

#### 3.1 Database Schema

##### 3.1.1 Cart Table
```sql
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status)
);
```

##### 3.1.2 Cart Items Table
```sql
CREATE TABLE cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    product_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);
```

##### 3.1.3 Cart Metadata Table
```sql
CREATE TABLE cart_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_total DECIMAL(10, 2) DEFAULT 0,
    tax_total DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    item_count INTEGER DEFAULT 0,
    coupon_code VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_meta FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    UNIQUE (cart_id)
);
```

#### 3.2 Data Transfer Objects (DTOs)

##### 3.2.1 CartDTO
```javascript
class CartDTO {
    constructor(data) {
        this.cartId = data.cart_id;
        this.userId = data.user_id;
        this.sessionId = data.session_id;
        this.status = data.status;
        this.items = data.items || [];
        this.metadata = data.metadata || {};
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
        this.expiresAt = data.expires_at;
    }
}
```

##### 3.2.2 CartItemDTO
```javascript
class CartItemDTO {
    constructor(data) {
        this.cartItemId = data.cart_item_id;
        this.cartId = data.cart_id;
        this.productId = data.product_id;
        this.sku = data.sku;
        this.quantity = data.quantity;
        this.unitPrice = data.unit_price;
        this.discountAmount = data.discount_amount;
        this.taxAmount = data.tax_amount;
        this.totalPrice = data.total_price;
        this.productDetails = data.product_details || {};
    }
}
```

##### 3.2.3 CartMetadataDTO
```javascript
class CartMetadataDTO {
    constructor(data) {
        this.subtotal = data.subtotal;
        this.discountTotal = data.discount_total;
        this.taxTotal = data.tax_total;
        this.shippingCost = data.shipping_cost;
        this.grandTotal = data.grand_total;
        this.itemCount = data.item_count;
        this.couponCode = data.coupon_code;
    }
}
```

---

### 4. API Specifications

#### 4.1 REST Endpoints

##### 4.1.1 Create/Get Cart
```
GET /api/v1/cart
Headers:
  Authorization: Bearer {token}
  X-Session-Id: {session_id}

Response 200:
{
  "success": true,
  "data": {
    "cartId": "uuid",
    "userId": "uuid",
    "items": [],
    "metadata": {
      "subtotal": 0,
      "grandTotal": 0,
      "itemCount": 0
    }
  }
}
```

##### 4.1.2 Add Item to Cart
```
POST /api/v1/cart/items
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Request Body:
{
  "productId": "uuid",
  "sku": "string",
  "quantity": 1
}

Response 201:
{
  "success": true,
  "data": {
    "cartItemId": "uuid",
    "productId": "uuid",
    "quantity": 1,
    "unitPrice": 99.99,
    "totalPrice": 99.99
  },
  "message": "Item added to cart successfully"
}

Error Response 400:
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity not available"
  }
}
```

##### 4.1.3 Update Cart Item Quantity
```
PUT /api/v1/cart/items/{cartItemId}
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Request Body:
{
  "quantity": 3
}

Response 200:
{
  "success": true,
  "data": {
    "cartItemId": "uuid",
    "quantity": 3,
    "totalPrice": 299.97
  }
}
```

##### 4.1.4 Remove Item from Cart
```
DELETE /api/v1/cart/items/{cartItemId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Item removed from cart"
}
```

##### 4.1.5 Apply Coupon
```
POST /api/v1/cart/coupon
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Request Body:
{
  "couponCode": "SUMMER2024"
}

Response 200:
{
  "success": true,
  "data": {
    "discountAmount": 15.00,
    "newGrandTotal": 284.97
  }
}
```

##### 4.1.6 Clear Cart
```
DELETE /api/v1/cart
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

### 5. Business Logic Components

#### 5.1 Cart Service Class

```javascript
class CartService {
    constructor(cartRepository, productService, pricingService, inventoryService) {
        this.cartRepository = cartRepository;
        this.productService = productService;
        this.pricingService = pricingService;
        this.inventoryService = inventoryService;
    }

    async getOrCreateCart(userId, sessionId) {
        try {
            let cart = await this.cartRepository.findActiveCart(userId, sessionId);
            
            if (!cart) {
                cart = await this.cartRepository.createCart({
                    userId,
                    sessionId,
                    status: 'active',
                    expiresAt: this.calculateExpiry()
                });
            }
            
            return await this.enrichCartWithDetails(cart);
        } catch (error) {
            throw new CartServiceError('Failed to get or create cart', error);
        }
    }

    async addItemToCart(userId, sessionId, itemData) {
        const { productId, sku, quantity } = itemData;
        
        // Validate product exists
        const product = await this.productService.getProduct(productId);
        if (!product) {
            throw new ValidationError('Product not found');
        }

        // Check inventory
        const available = await this.inventoryService.checkAvailability(sku, quantity);
        if (!available) {
            throw new InsufficientStockError('Requested quantity not available');
        }

        // Get current price
        const pricing = await this.pricingService.getPrice(productId, sku);
        
        const cart = await this.getOrCreateCart(userId, sessionId);
        
        // Check if item already exists in cart
        const existingItem = await this.cartRepository.findCartItem(cart.cartId, productId, sku);
        
        let cartItem;
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            cartItem = await this.updateCartItemQuantity(existingItem.cartItemId, newQuantity);
        } else {
            cartItem = await this.cartRepository.addCartItem({
                cartId: cart.cartId,
                productId,
                sku,
                quantity,
                unitPrice: pricing.price,
                discountAmount: 0,
                taxAmount: this.calculateTax(pricing.price, quantity),
                totalPrice: this.calculateItemTotal(pricing.price, quantity)
            });
        }

        // Update cart metadata
        await this.updateCartMetadata(cart.cartId);
        
        // Invalidate cache
        await this.invalidateCartCache(cart.cartId);
        
        return cartItem;
    }

    async updateCartItemQuantity(cartItemId, newQuantity) {
        if (newQuantity <= 0) {
            throw new ValidationError('Quantity must be greater than 0');
        }

        const cartItem = await this.cartRepository.getCartItem(cartItemId);
        if (!cartItem) {
            throw new NotFoundError('Cart item not found');
        }

        // Check inventory for new quantity
        const available = await this.inventoryService.checkAvailability(
            cartItem.sku, 
            newQuantity
        );
        if (!available) {
            throw new InsufficientStockError('Requested quantity not available');
        }

        // Recalculate prices
        const newTotalPrice = this.calculateItemTotal(cartItem.unitPrice, newQuantity);
        const newTaxAmount = this.calculateTax(cartItem.unitPrice, newQuantity);

        const updatedItem = await this.cartRepository.updateCartItem(cartItemId, {
            quantity: newQuantity,
            taxAmount: newTaxAmount,
            totalPrice: newTotalPrice
        });

        // Update cart metadata
        await this.updateCartMetadata(cartItem.cartId);
        await this.invalidateCartCache(cartItem.cartId);

        return updatedItem;
    }

    async removeItemFromCart(cartItemId) {
        const cartItem = await this.cartRepository.getCartItem(cartItemId);
        if (!cartItem) {
            throw new NotFoundError('Cart item not found');
        }

        await this.cartRepository.deleteCartItem(cartItemId);
        await this.updateCartMetadata(cartItem.cartId);
        await this.invalidateCartCache(cartItem.cartId);

        return { success: true };
    }

    async applyCoupon(cartId, couponCode) {
        const cart = await this.cartRepository.getCart(cartId);
        if (!cart) {
            throw new NotFoundError('Cart not found');
        }

        // Validate coupon with pricing service
        const couponDetails = await this.pricingService.validateCoupon(couponCode, cart);
        if (!couponDetails.valid) {
            throw new ValidationError('Invalid or expired coupon');
        }

        const discountAmount = this.calculateCouponDiscount(cart, couponDetails);
        
        await this.cartRepository.updateCartMetadata(cartId, {
            couponCode,
            discountTotal: discountAmount
        });

        await this.updateCartMetadata(cartId);
        await this.invalidateCartCache(cartId);

        return { discountAmount, newGrandTotal: cart.metadata.grandTotal - discountAmount };
    }

    async clearCart(cartId) {
        await this.cartRepository.deleteAllCartItems(cartId);
        await this.updateCartMetadata(cartId);
        await this.invalidateCartCache(cartId);
        return { success: true };
    }

    async updateCartMetadata(cartId) {
        const items = await this.cartRepository.getCartItems(cartId);
        
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const taxTotal = items.reduce((sum, item) => sum + parseFloat(item.taxAmount), 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        
        const metadata = await this.cartRepository.getCartMetadata(cartId);
        const discountTotal = metadata?.discountTotal || 0;
        const shippingCost = await this.calculateShipping(subtotal);
        
        const grandTotal = subtotal + taxTotal + shippingCost - discountTotal;

        await this.cartRepository.updateCartMetadata(cartId, {
            subtotal,
            discountTotal,
            taxTotal,
            shippingCost,
            grandTotal,
            itemCount
        });
    }

    calculateItemTotal(unitPrice, quantity) {
        return (parseFloat(unitPrice) * quantity).toFixed(2);
    }

    calculateTax(unitPrice, quantity) {
        const TAX_RATE = 0.08; // 8% tax
        return (parseFloat(unitPrice) * quantity * TAX_RATE).toFixed(2);
    }

    async calculateShipping(subtotal) {
        if (subtotal >= 50) return 0; // Free shipping over $50
        return 5.99;
    }

    calculateExpiry() {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
        return expiryDate;
    }

    async enrichCartWithDetails(cart) {
        const items = await this.cartRepository.getCartItems(cart.cartId);
        const metadata = await this.cartRepository.getCartMetadata(cart.cartId);
        
        // Enrich items with product details
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
                const productDetails = await this.productService.getProduct(item.productId);
                return { ...item, productDetails };
            })
        );

        return {
            ...cart,
            items: enrichedItems,
            metadata
        };
    }

    async invalidateCartCache(cartId) {
        // Implementation for cache invalidation
        await this.cacheService.delete(`cart:${cartId}`);
    }
}
```

#### 5.2 Cart Repository Class

```javascript
class CartRepository {
    constructor(database) {
        this.db = database;
    }

    async findActiveCart(userId, sessionId) {
        const query = `
            SELECT * FROM carts 
            WHERE (user_id = $1 OR session_id = $2) 
            AND status = 'active' 
            AND expires_at > NOW()
            ORDER BY updated_at DESC 
            LIMIT 1
        `;
        const result = await this.db.query(query, [userId, sessionId]);
        return result.rows[0];
    }

    async createCart(cartData) {
        const query = `
            INSERT INTO carts (user_id, session_id, status, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [
            cartData.userId,
            cartData.sessionId,
            cartData.status,
            cartData.expiresAt
        ];
        const result = await this.db.query(query, values);
        
        // Initialize metadata
        await this.initializeCartMetadata(result.rows[0].cart_id);
        
        return result.rows[0];
    }

    async getCart(cartId) {
        const query = 'SELECT * FROM carts WHERE cart_id = $1';
        const result = await this.db.query(query, [cartId]);
        return result.rows[0];
    }

    async addCartItem(itemData) {
        const query = `
            INSERT INTO cart_items 
            (cart_id, product_id, sku, quantity, unit_price, discount_amount, tax_amount, total_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            itemData.cartId,
            itemData.productId,
            itemData.sku,
            itemData.quantity,
            itemData.unitPrice,
            itemData.discountAmount,
            itemData.taxAmount,
            itemData.totalPrice
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async findCartItem(cartId, productId, sku) {
        const query = `
            SELECT * FROM cart_items 
            WHERE cart_id = $1 AND product_id = $2 AND sku = $3
        `;
        const result = await this.db.query(query, [cartId, productId, sku]);
        return result.rows[0];
    }

    async getCartItem(cartItemId) {
        const query = 'SELECT * FROM cart_items WHERE cart_item_id = $1';
        const result = await this.db.query(query, [cartItemId]);
        return result.rows[0];
    }

    async getCartItems(cartId) {
        const query = 'SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY added_at DESC';
        const result = await this.db.query(query, [cartId]);
        return result.rows;
    }

    async updateCartItem(cartItemId, updates) {
        const query = `
            UPDATE cart_items 
            SET quantity = $1, tax_amount = $2, total_price = $3, updated_at = NOW()
            WHERE cart_item_id = $4
            RETURNING *
        `;
        const values = [
            updates.quantity,
            updates.taxAmount,
            updates.totalPrice,
            cartItemId
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async deleteCartItem(cartItemId) {
        const query = 'DELETE FROM cart_items WHERE cart_item_id = $1';
        await this.db.query(query, [cartItemId]);
    }

    async deleteAllCartItems(cartId) {
        const query = 'DELETE FROM cart_items WHERE cart_id = $1';
        await this.db.query(query, [cartId]);
    }

    async initializeCartMetadata(cartId) {
        const query = `
            INSERT INTO cart_metadata (cart_id, subtotal, grand_total, item_count)
            VALUES ($1, 0, 0, 0)
        `;
        await this.db.query(query, [cartId]);
    }

    async getCartMetadata(cartId) {
        const query = 'SELECT * FROM cart_metadata WHERE cart_id = $1';
        const result = await this.db.query(query, [cartId]);
        return result.rows[0];
    }

    async updateCartMetadata(cartId, metadata) {
        const query = `
            UPDATE cart_metadata 
            SET subtotal = $1, discount_total = $2, tax_total = $3, 
                shipping_cost = $4, grand_total = $5, item_count = $6, 
                coupon_code = $7, updated_at = NOW()
            WHERE cart_id = $8
        `;
        const values = [
            metadata.subtotal,
            metadata.discountTotal || 0,
            metadata.taxTotal,
            metadata.shippingCost,
            metadata.grandTotal,
            metadata.itemCount,
            metadata.couponCode || null,
            cartId
        ];
        await this.db.query(query, values);
    }
}
```

---

### 6. Integration Points

#### 6.1 Product Service Integration

```javascript
class ProductServiceClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async getProduct(productId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/v1/products/${productId}`,
                {
                    headers: { 'X-API-Key': this.apiKey }
                }
            );
            return response.data;
        } catch (error) {
            throw new ServiceIntegrationError('Product service unavailable', error);
        }
    }

    async validateProduct(productId, sku) {
        const product = await this.getProduct(productId);
        return product && product.skus.includes(sku);
    }
}
```

#### 6.2 Inventory Service Integration

```javascript
class InventoryServiceClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async checkAvailability(sku, quantity) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v1/inventory/check`,
                { sku, quantity },
                {
                    headers: { 'X-API-Key': this.apiKey }
                }
            );
            return response.data.available;
        } catch (error) {
            throw new ServiceIntegrationError('Inventory service unavailable', error);
        }
    }

    async reserveInventory(sku, quantity, cartId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v1/inventory/reserve`,
                { sku, quantity, referenceId: cartId },
                {
                    headers: { 'X-API-Key': this.apiKey }
                }
            );
            return response.data;
        } catch (error) {
            throw new ServiceIntegrationError('Failed to reserve inventory', error);
        }
    }
}
```

#### 6.3 Pricing Service Integration

```javascript
class PricingServiceClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async getPrice(productId, sku) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/v1/pricing/${productId}/${sku}`,
                {
                    headers: { 'X-API-Key': this.apiKey }
                }
            );
            return response.data;
        } catch (error) {
            throw new ServiceIntegrationError('Pricing service unavailable', error);
        }
    }

    async validateCoupon(couponCode, cart) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v1/coupons/validate`,
                { couponCode, cartTotal: cart.metadata.subtotal },
                {
                    headers: { 'X-API-Key': this.apiKey }
                }
            );
            return response.data;
        } catch (error) {
            throw new ServiceIntegrationError('Coupon validation failed', error);
        }
    }
}
```

---

### 7. Error Handling

#### 7.1 Custom Error Classes

```javascript
class CartServiceError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'CartServiceError';
        this.originalError = originalError;
        this.statusCode = 500;
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class InsufficientStockError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientStockError';
        this.statusCode = 400;
        this.code = 'INSUFFICIENT_STOCK';
    }
}

class ServiceIntegrationError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'ServiceIntegrationError';
        this.originalError = originalError;
        this.statusCode = 503;
    }
}
```

#### 7.2 Error Handler Middleware

```javascript
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            code: err.code || err.name,
            message: err.message
        }
    };

    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
        if (err.originalError) {
            response.error.originalError = err.originalError.message;
        }
    }

    res.status(statusCode).json(response);
};
```

---

### 8. Caching Strategy

#### 8.1 Redis Cache Implementation

```javascript
class CacheService {
    constructor(redisClient) {
        this.redis = redisClient;
        this.DEFAULT_TTL = 3600; // 1 hour
    }

    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = this.DEFAULT_TTL) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async delete(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    async deletePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache delete pattern error:', error);
        }
    }
}
```

#### 8.2 Cache Keys and Strategy

```javascript
const CACHE_KEYS = {
    CART: (cartId) => `cart:${cartId}`,
    USER_CART: (userId) => `user:cart:${userId}`,
    CART_ITEMS: (cartId) => `cart:items:${cartId}`,
    PRODUCT: (productId) => `product:${productId}`,
    PRICE: (productId, sku) => `price:${productId}:${sku}`
};

// Cache-aside pattern implementation
class CachedCartService extends CartService {
    constructor(cartRepository, productService, pricingService, inventoryService, cacheService) {
        super(cartRepository, productService, pricingService, inventoryService);
        this.cache = cacheService;
    }

    async getOrCreateCart(userId, sessionId) {
        const cacheKey = CACHE_KEYS.USER_CART(userId);
        let cart = await this.cache.get(cacheKey);

        if (!cart) {
            cart = await super.getOrCreateCart(userId, sessionId);
            await this.cache.set(cacheKey, cart, 1800); // 30 minutes
        }

        return cart;
    }

    async invalidateCartCache(cartId) {
        await this.cache.delete(CACHE_KEYS.CART(cartId));
        await this.cache.deletePattern(`user:cart:*`);
    }
}
```

---

### 9. Security Considerations

#### 9.1 Authentication & Authorization

```javascript
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const cartOwnershipMiddleware = async (req, res, next) => {
    try {
        const cartId = req.params.cartId || req.body.cartId;
        const cart = await cartRepository.getCart(cartId);
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        if (cart.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    } catch (error) {
        next(error);
    }
};
```

#### 9.2 Input Validation

```javascript
const { body, param, validationResult } = require('express-validator');

const addItemValidation = [
    body('productId').isUUID().withMessage('Invalid product ID'),
    body('sku').isString().trim().notEmpty().withMessage('SKU is required'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const updateQuantityValidation = [
    param('cartItemId').isUUID().withMessage('Invalid cart item ID'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

#### 9.3 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const cartApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

const addItemLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 add item requests per minute
    message: 'Too many items added, please slow down'
});
```

---

### 10. Testing Strategy

#### 10.1 Unit Tests

```javascript
const { expect } = require('chai');
const sinon = require('sinon');
const CartService = require('../services/CartService');

describe('CartService', () => {
    let cartService;
    let mockCartRepository;
    let mockProductService;
    let mockPricingService;
    let mockInventoryService;

    beforeEach(() => {
        mockCartRepository = {
            findActiveCart: sinon.stub(),
            createCart: sinon.stub(),
            addCartItem: sinon.stub(),
            getCartItems: sinon.stub(),
            updateCartMetadata: sinon.stub()
        };

        mockProductService = {
            getProduct: sinon.stub()
        };

        mockPricingService = {
            getPrice: sinon.stub()
        };

        mockInventoryService = {
            checkAvailability: sinon.stub()
        };

        cartService = new CartService(
            mockCartRepository,
            mockProductService,
            mockPricingService,
            mockInventoryService
        );
    });

    describe('addItemToCart', () => {
        it('should add item to cart successfully', async () => {
            const userId = 'user-123';
            const sessionId = 'session-456';
            const itemData = {
                productId: 'product-789',
                sku: 'SKU-001',
                quantity: 2
            };

            mockCartRepository.findActiveCart.resolves({
                cart_id: 'cart-123',
                user_id: userId
            });

            mockProductService.getProduct.resolves({
                product_id: 'product-789',
                name: 'Test Product'
            });

            mockInventoryService.checkAvailability.resolves(true);

            mockPricingService.getPrice.resolves({
                price: 99.99
            });

            mockCartRepository.findCartItem.resolves(null);
            mockCartRepository.addCartItem.resolves({
                cart_item_id: 'item-123',
                quantity: 2,
                total_price: 199.98
            });

            const result = await cartService.addItemToCart(userId, sessionId, itemData);

            expect(result).to.have.property('cart_item_id');
            expect(mockCartRepository.addCartItem.calledOnce).to.be.true;
        });

        it('should throw error when product not found', async () => {
            mockProductService.getProduct.resolves(null);

            try {
                await cartService.addItemToCart('user-123', 'session-456', {
                    productId: 'invalid',
                    sku: 'SKU-001',
                    quantity: 1
                });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.equal('Product not found');
            }
        });

        it('should throw error when insufficient stock', async () => {
            mockProductService.getProduct.resolves({ product_id: 'product-789' });
            mockInventoryService.checkAvailability.resolves(false);

            try {
                await cartService.addItemToCart('user-123', 'session-456', {
                    productId: 'product-789',
                    sku: 'SKU-001',
                    quantity: 100
                });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.equal('Requested quantity not available');
            }
        });
    });

    describe('calculateItemTotal', () => {
        it('should calculate total correctly', () => {
            const total = cartService.calculateItemTotal(99.99, 2);
            expect(total).to.equal('199.98');
        });
    });

    describe('calculateTax', () => {
        it('should calculate tax at 8%', () => {
            const tax = cartService.calculateTax(100, 1);
            expect(tax).to.equal('8.00');
        });
    });
});
```

#### 10.2 Integration Tests

```javascript
const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('Cart API Integration Tests', () => {
    let authToken;
    let cartId;

    before(async () => {
        // Setup: Login and get auth token
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        authToken = loginResponse.body.token;
    });

    describe('GET /api/v1/cart', () => {
        it('should get or create cart', async () => {
            const response = await request(app)
                .get('/api/v1/cart')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.have.property('cartId');
            cartId = response.body.data.cartId;
        });
    });

    describe('POST /api/v1/cart/items', () => {
        it('should add item to cart', async () => {
            const response = await request(app)
                .post('/api/v1/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: 'test-product-id',
                    sku: 'TEST-SKU-001',
                    quantity: 2
                });

            expect(response.status).to.equal(201);
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.have.property('cartItemId');
        });

        it('should return 400 for invalid quantity', async () => {
            const response = await request(app)
                .post('/api/v1/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: 'test-product-id',
                    sku: 'TEST-SKU-001',
                    quantity: 0
                });

            expect(response.status).to.equal(400);
        });
    });
});
```

---

### 11. Deployment Configuration

#### 11.1 Environment Variables

```bash
# .env.example
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=cart_service
DB_PASSWORD=secure_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# External Services
PRODUCT_SERVICE_URL=http://product-service:3001
INVENTORY_SERVICE_URL=http://inventory-service:3002
PRICING_SERVICE_URL=http://pricing-service:3003
API_KEY=service_api_key

# Logging
LOG_LEVEL=info

# Cart Configuration
CART_EXPIRY_DAYS=30
MAX_CART_ITEMS=50
FREE_SHIPPING_THRESHOLD=50
```

#### 11.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  cart-service:
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
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=cart_service
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

### 12. Monitoring and Logging

#### 12.1 Logging Implementation

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'cart-service' },
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

module.exports = logger;
```

#### 12.2 Metrics Collection

```javascript
const promClient = require('prom-client');

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

const cartOperations = new promClient.Counter({
    name: 'cart_operations_total',
    help: 'Total number of cart operations',
    labelNames: ['operation', 'status'],
    registers: [register]
});

const activeCartsGauge = new promClient.Gauge({
    name: 'active_carts_total',
    help: 'Number of active carts',
    registers: [register]
});

module.exports = {
    register,
    httpRequestDuration,
    cartOperations,
    activeCartsGauge
};
```

---

### 13. Performance Optimization

#### 13.1 Database Indexing Strategy

```sql
-- Indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_carts_user_status ON carts(user_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_carts_session_status ON carts(session_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_carts_expires ON carts(expires_at) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_cart_items_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX CONCURRENTLY idx_cart_items_product ON cart_items(product_id);

CREATE INDEX CONCURRENTLY idx_cart_metadata_cart ON cart_metadata(cart_id);

-- Partial index for active carts with items
CREATE INDEX CONCURRENTLY idx_active_carts_with_items ON carts(cart_id) 
WHERE status = 'active' AND cart_id IN (SELECT DISTINCT cart_id FROM cart_items);
```

#### 13.2 Query Optimization

```javascript
// Optimized query to get cart with all details in single query
async getCartWithDetails(cartId) {
    const query = `
        SELECT 
            c.*,
            json_agg(
                json_build_object(
                    'cartItemId', ci.cart_item_id,
                    'productId', ci.product_id,
                    'sku', ci.sku,
                    'quantity', ci.quantity,
                    'unitPrice', ci.unit_price,
                    'totalPrice', ci.total_price
                )
            ) FILTER (WHERE ci.cart_item_id IS NOT NULL) as items,
            json_build_object(
                'subtotal', cm.subtotal,
                'discountTotal', cm.discount_total,
                'taxTotal', cm.tax_total,
                'shippingCost', cm.shipping_cost,
                'grandTotal', cm.grand_total,
                'itemCount', cm.item_count
            ) as metadata
        FROM carts c
        LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
        LEFT JOIN cart_metadata cm ON c.cart_id = cm.cart_id
        WHERE c.cart_id = $1
        GROUP BY c.cart_id, cm.metadata_id
    `;
    
    const result = await this.db.query(query, [cartId]);
    return result.rows[0];
}
```

---

### 14. Appendix

#### 14.1 Database Migration Scripts

```sql
-- V1__initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart tables as defined in section 3.1
```

#### 14.2 API Response Examples

```json
// Successful cart retrieval
{
  "success": true,
  "data": {
    "cartId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "status": "active",
    "items": [
      {
        "cartItemId": "770e8400-e29b-41d4-a716-446655440002",
        "productId": "880e8400-e29b-41d4-a716-446655440003",
        "sku": "LAPTOP-001",
        "quantity": 1,
        "unitPrice": 999.99,
        "discountAmount": 0,
        "taxAmount": 80.00,
        "totalPrice": 1079.99,
        "productDetails": {
          "name": "Premium Laptop",
          "image": "https://example.com/laptop.jpg"
        }
      }
    ],
    "metadata": {
      "subtotal": 999.99,
      "discountTotal": 0,
      "taxTotal": 80.00,
      "shippingCost": 0,
      "grandTotal": 1079.99,
      "itemCount": 1
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### 15. Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the Shopping Cart module. It covers all aspects from data models and API specifications to error handling, caching strategies, and deployment configurations. The design emphasizes scalability, maintainability, and security while ensuring optimal performance through proper indexing and caching strategies.

**Key Implementation Priorities:**
1. Core cart operations (add, update, remove items)
2. Integration with product, inventory, and pricing services
3. Caching layer for performance
4. Comprehensive error handling and validation
5. Security measures (authentication, authorization, rate limiting)
6. Monitoring and logging infrastructure

**Next Steps:**
1. Review and approval of LLD
2. Setup development environment
3. Implement core cart service
4. Develop integration layers
5. Write comprehensive tests
6. Deploy to staging environment
7. Performance testing and optimization
8. Production deployment