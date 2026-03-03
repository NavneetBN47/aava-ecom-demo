# Low Level Design Document
# E-Commerce Shopping Cart Module

**Version:** 1.5  
**Date:** 2024-01-21  
**Author:** Engineering Team  
**Status:** Approved

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------||
| 1.0 | 2023-09-15 | Engineering Team | Initial draft |
| 1.1 | 2023-10-01 | Engineering Team | Added API specifications |
| 1.2 | 2023-11-10 | Engineering Team | Updated data models |
| 1.3 | 2023-12-05 | Engineering Team | Enhanced security specifications |
| 1.4 | 2024-01-10 | Engineering Team | Added performance requirements |
| 1.5 | 2024-01-21 | Engineering Team | Enhanced POST endpoint documentation, clarified price snapshot mechanism, documented recalculation triggers, enhanced dual binding strategy for guest/authenticated users, and added empty cart state UI redirection business rule |

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Data Models](#data-models)
4. [API Specifications](#api-specifications)
5. [Business Logic](#business-logic)
6. [Security Considerations](#security-considerations)
7. [Performance Requirements](#performance-requirements)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## 1. Introduction

### 1.1 Purpose
This document provides the low-level design for the E-Commerce Shopping Cart Module. It details the technical implementation, data structures, APIs, and business logic required to build a robust shopping cart system.

### 1.2 Scope
The shopping cart module handles:
- Adding/removing items to/from cart
- Updating item quantities
- Calculating totals (subtotal, tax, shipping, total)
- Managing cart persistence for both guest and authenticated users
- Cart expiration and cleanup
- Integration with inventory and pricing services

### 1.3 Assumptions
- Users can be either authenticated or guest users
- Guest carts are identified by session tokens
- Authenticated user carts are persisted in the database
- Price and availability are validated in real-time
- Tax calculation is based on user location
- Shipping costs are calculated based on cart contents and destination

---

## 2. System Architecture

### 2.1 Component Diagram

```mermaid
graph TB
    Client[Client Application]
    API[Cart API Gateway]
    CartService[Cart Service]
    DB[(Cart Database)]
    Cache[(Redis Cache)]
    InventoryService[Inventory Service]
    PricingService[Pricing Service]
    TaxService[Tax Service]
    
    Client -->|HTTP/REST| API
    API --> CartService
    CartService --> DB
    CartService --> Cache
    CartService -->|gRPC| InventoryService
    CartService -->|gRPC| PricingService
    CartService -->|gRPC| TaxService
```

### 2.2 Technology Stack
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL (primary), Redis (cache)
- **API Protocol:** REST (external), gRPC (internal services)
- **Authentication:** JWT tokens
- **Message Queue:** RabbitMQ (for async operations)

---

## 3. Data Models

### 3.1 ShoppingCart Entity

```typescript
interface ShoppingCart {
  id: string;                    // UUID
  userId?: string;               // UUID (null for guest users)
  sessionToken?: string;         // For guest users - used for guest cart identification
  userToken?: string;            // For authenticated users - JWT token binding
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;              // ISO 4217 code
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  status: CartStatus;
}

enum CartStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',       // Converted to order
  ABANDONED = 'ABANDONED'
}
```

**Dual Binding Strategy for Guest/Authenticated Users:**
- **Guest Users:** Carts are bound using `sessionToken` (generated on first cart interaction). The `userId` field remains null. Session tokens are stored in HTTP-only cookies and have a configurable expiration time (default: 30 days).
- **Authenticated Users:** Carts are bound using both `userId` (primary identifier) and `userToken` (JWT token for additional security validation). When a guest user authenticates, their guest cart (identified by `sessionToken`) is merged with any existing authenticated cart, and the `userId` field is populated.
- **Cart Merging Logic:** During authentication, if both guest and authenticated carts exist, items are merged with quantity aggregation. Duplicate items have their quantities summed. The guest cart is then marked as CONVERTED and archived.
- **Security:** Session tokens are validated on each request. For authenticated users, both `userId` and `userToken` are verified to prevent session hijacking.

### 3.2 CartItem Entity

```typescript
interface CartItem {
  id: string;                    // UUID
  cartId: string;                // Foreign key to ShoppingCart
  productId: string;             // UUID
  variantId?: string;            // UUID (for product variants)
  quantity: number;
  price: number;                 // Price at time of addition (snapshot)
  price_at_addition: number;     // Explicit price snapshot field
  originalPrice?: number;        // For displaying discounts
  discount?: number;
  productName: string;
  productImage: string;
  attributes: ProductAttribute[];
  addedAt: Date;
  updatedAt: Date;
}

interface ProductAttribute {
  name: string;                  // e.g., "Size", "Color"
  value: string;                 // e.g., "Large", "Red"
}
```

**Price Snapshot Mechanism:**
The `price_at_addition` field captures the exact price of the product at the moment it is added to the cart. This mechanism ensures:
- **Price Consistency:** Users see the same price throughout their shopping session, even if the product price changes in the catalog.
- **Snapshot Timing:** The price is captured from the Pricing Service at the exact moment the POST /api/v1/cart/items endpoint is called.
- **Price Updates:** The snapshot is NOT automatically updated when catalog prices change. It is only updated when:
  - The user explicitly updates the item quantity (PUT /api/v1/cart/items/{itemId})
  - The cart is recalculated due to a user-initiated action (e.g., applying a coupon)
  - The item is removed and re-added to the cart
- **Display Logic:** The UI should display both `price_at_addition` (locked-in price) and `originalPrice` (current catalog price) if they differ, allowing users to see if they're getting a better or worse deal.
- **Validation:** On checkout, the system validates that the `price_at_addition` is still within acceptable bounds (configurable threshold, e.g., ±5%) of the current catalog price. If the variance exceeds the threshold, the user is notified and must confirm the updated price.

### 3.3 Database Schema

```sql
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_token VARCHAR(255),
  user_token TEXT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  variant_id UUID,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  price_at_addition DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount DECIMAL(10, 2) DEFAULT 0,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  attributes JSONB,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_cart_id (cart_id),
  INDEX idx_product_id (product_id)
);
```

---

## 4. API Specifications

### 4.1 Get Cart

**Endpoint:** `GET /api/v1/cart`

**Description:** Retrieves the current user's shopping cart.

**Authentication:** Optional (supports both guest and authenticated users)

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
X-Session-Token: <session_token> (for guest users)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "items": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "variantId": "variant-uuid",
        "quantity": 2,
        "price": 29.99,
        "originalPrice": 39.99,
        "discount": 10.00,
        "productName": "Premium T-Shirt",
        "productImage": "https://cdn.example.com/image.jpg",
        "attributes": [
          {"name": "Size", "value": "Large"},
          {"name": "Color", "value": "Blue"}
        ],
        "addedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "subtotal": 59.98,
    "tax": 5.40,
    "shipping": 9.99,
    "total": 75.37,
    "currency": "USD",
    "itemCount": 2
  }
}
```

**Error Responses:**
- `404 Not Found`: Cart not found
- `401 Unauthorized`: Invalid or expired token

### 4.2 Add Item to Cart

**Endpoint:** `POST /api/v1/cart/items`

**Description:** Adds a new item to the shopping cart or updates quantity if item already exists. If no quantity is specified in the request, the system defaults to adding 1 unit of the product.

**Authentication:** Optional (supports both guest and authenticated users)

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
X-Session-Token: <session_token> (for guest users)
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product-uuid",
  "variantId": "variant-uuid",
  "quantity": 1,
  "attributes": [
    {"name": "Size", "value": "Large"},
    {"name": "Color", "value": "Blue"}
  ]
}
```

**Field Specifications:**
- `productId` (required): UUID of the product to add
- `variantId` (optional): UUID of the product variant (if applicable)
- `quantity` (optional): Number of units to add. **Default: 1** if not specified
- `attributes` (optional): Array of product attributes for display purposes

**Default Quantity Handling:**
When the `quantity` field is omitted from the request:
1. The system automatically sets quantity to 1
2. If the item already exists in the cart, the quantity is incremented by 1
3. The response includes the updated quantity in the cart

**Response:**
```json
{
  "success": true,
  "data": {
    "cartId": "cart-uuid",
    "item": {
      "id": "item-uuid",
      "productId": "product-uuid",
      "variantId": "variant-uuid",
      "quantity": 1,
      "price": 29.99,
      "productName": "Premium T-Shirt",
      "productImage": "https://cdn.example.com/image.jpg",
      "attributes": [
        {"name": "Size", "value": "Large"},
        {"name": "Color", "value": "Blue"}
      ]
    },
    "cart": {
      "subtotal": 29.99,
      "tax": 2.70,
      "shipping": 9.99,
      "total": 42.68,
      "itemCount": 1
    }
  },
  "message": "Item added to cart successfully"
}
```

**Business Logic:**
1. Validate product availability via Inventory Service
2. Fetch current price from Pricing Service and store as price snapshot
3. If item already exists in cart (same productId and variantId), increment quantity
4. Create new cart if user doesn't have an active cart
5. Recalculate cart totals automatically
6. Return updated cart summary

**Error Responses:**
- `400 Bad Request`: Invalid product ID or quantity
- `404 Not Found`: Product not found
- `409 Conflict`: Insufficient inventory
- `401 Unauthorized`: Invalid or expired token

### 4.3 Update Cart Item

**Endpoint:** `PUT /api/v1/cart/items/{itemId}`

**Description:** Updates the quantity of an existing cart item. This endpoint also refreshes the price snapshot from the Pricing Service to ensure the user has the most current pricing information.

**Authentication:** Optional (supports both guest and authenticated users)

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
X-Session-Token: <session_token> (for guest users)
Content-Type: application/json
```

**Path Parameters:**
- `itemId` (required): UUID of the cart item to update

**Request Body:**
```json
{
  "quantity": 3
}
```

**Field Specifications:**
- `quantity` (required): New quantity for the item. Must be a positive integer greater than 0.

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item-uuid",
      "productId": "product-uuid",
      "variantId": "variant-uuid",
      "quantity": 3,
      "price": 29.99,
      "price_at_addition": 29.99,
      "originalPrice": 29.99,
      "productName": "Premium T-Shirt",
      "updatedAt": "2024-01-21T14:30:00Z"
    },
    "cart": {
      "subtotal": 89.97,
      "tax": 8.10,
      "shipping": 9.99,
      "total": 108.06,
      "itemCount": 3
    }
  },
  "message": "Cart item updated successfully"
}
```

**Business Logic:**
1. Validate that the cart item exists and belongs to the user's cart
2. Validate new quantity against inventory availability via Inventory Service
3. **Refresh price snapshot:** Fetch current price from Pricing Service and update `price_at_addition`
4. Update the item quantity and `updatedAt` timestamp
5. Automatically recalculate cart totals (subtotal, tax, shipping, total)
6. Return updated item and cart summary

**Price Update Notification:**
If the refreshed price differs from the previous `price_at_addition` by more than a configurable threshold (default: 5%), the response includes an additional `priceChanged` flag and notification message:

```json
{
  "success": true,
  "data": { ... },
  "message": "Cart item updated successfully",
  "priceChanged": true,
  "priceChangeNotification": "The price of Premium T-Shirt has changed from $29.99 to $27.99"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity (must be positive integer)
- `404 Not Found`: Cart item not found or doesn't belong to user's cart
- `409 Conflict`: Insufficient inventory for requested quantity
- `401 Unauthorized`: Invalid or expired token

**Notes:**
- To remove an item completely, use the DELETE endpoint instead of setting quantity to 0
- Quantity updates trigger automatic cart recalculation
- Price snapshots are refreshed on every quantity update to ensure pricing accuracy

### 4.4 Remove Item from Cart

**Endpoint:** `DELETE /api/v1/cart/items/{itemId}`

**Description:** Removes an item from the shopping cart.

**Authentication:** Optional (supports both guest and authenticated users)

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
X-Session-Token: <session_token> (for guest users)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "subtotal": 29.99,
      "tax": 2.70,
      "shipping": 9.99,
      "total": 42.68,
      "itemCount": 1
    }
  },
  "message": "Item removed from cart successfully"
}
```

**Error Responses:**
- `404 Not Found`: Item not found in cart
- `401 Unauthorized`: Invalid or expired token

### 4.5 Clear Cart

**Endpoint:** `DELETE /api/v1/cart`

**Description:** Removes all items from the shopping cart.

**Authentication:** Optional (supports both guest and authenticated users)

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
X-Session-Token: <session_token> (for guest users)
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

### 4.6 Apply Coupon

**Endpoint:** `POST /api/v1/cart/coupon`

**Description:** Applies a discount coupon to the cart.

**Authentication:** Optional (supports both guest and authenticated users)

**Request Body:**
```json
{
  "couponCode": "SUMMER2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coupon": {
      "code": "SUMMER2024",
      "discountType": "PERCENTAGE",
      "discountValue": 15,
      "appliedDiscount": 8.99
    },
    "cart": {
      "subtotal": 59.98,
      "discount": 8.99,
      "tax": 4.59,
      "shipping": 9.99,
      "total": 65.57,
      "itemCount": 2
    }
  },
  "message": "Coupon applied successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid coupon code
- `409 Conflict`: Coupon already applied or expired

---

## 5. Business Logic

### 5.1 Cart Creation Logic

**For Guest Users:**
1. Generate unique session token on first cart interaction
2. Store session token in HTTP-only cookie
3. Create cart record with session token binding
4. Set expiration time (default: 30 days)

**For Authenticated Users:**
1. Check if user has existing active cart
2. If yes, return existing cart
3. If no, create new cart with user ID binding
4. If guest cart exists, merge with authenticated cart

### 5.2 Cart Merging Logic

When a guest user authenticates:
1. Retrieve guest cart by session token
2. Retrieve authenticated cart by user ID
3. If both exist:
   - Merge items (aggregate quantities for duplicates)
   - Recalculate totals
   - Mark guest cart as CONVERTED
   - Update authenticated cart
4. If only guest cart exists:
   - Convert guest cart to authenticated cart
   - Update user ID binding

### 5.3 Price Calculation Logic

**Subtotal Calculation:**
```
subtotal = Σ(item.price × item.quantity)
```

**Tax Calculation:**
```
tax = subtotal × taxRate (based on user location)
```

**Shipping Calculation:**
- Free shipping if subtotal > threshold (e.g., $50)
- Flat rate shipping otherwise
- Can be overridden by shipping service

**Total Calculation:**
```
total = subtotal - discount + tax + shipping
```

**Automatic Recalculation Trigger Mechanism:**
Cart totals (subtotal, tax, shipping, total) are automatically recalculated whenever:
1. **Item Addition:** A new item is added via POST /api/v1/cart/items
2. **Item Quantity Update:** An item quantity is modified via PUT /api/v1/cart/items/{itemId}
3. **Item Removal:** An item is deleted via DELETE /api/v1/cart/items/{itemId}
4. **Coupon Application:** A discount coupon is applied via POST /api/v1/cart/coupon
5. **Coupon Removal:** A discount coupon is removed via DELETE /api/v1/cart/coupon
6. **Location Change:** User's shipping address is updated (triggers tax and shipping recalculation)

**Recalculation Process:**
- The recalculation is triggered synchronously within the same API request
- The system calls the Tax Service and Shipping Service to get updated rates
- Price snapshots (`price_at_addition`) are NOT updated during automatic recalculation unless explicitly triggered by a quantity update
- The updated cart totals are persisted to the database before the API response is returned
- If any external service (Tax/Shipping) fails, the system uses cached rates and logs a warning

**Performance Optimization:**
- Tax and shipping rates are cached for 5 minutes per user location
- Recalculation is debounced on the client side to prevent excessive API calls
- Bulk operations (e.g., clearing cart) trigger a single recalculation

### 5.4 Inventory Validation

Before adding/updating items:
1. Call Inventory Service to check availability
2. Validate requested quantity against available stock
3. If insufficient, return error with available quantity
4. Reserve inventory temporarily (5 minutes) during checkout

### 5.5 Cart Expiration Logic

**Expiration Rules:**
- Guest carts: 30 days from last update
- Authenticated carts: 90 days from last update
- Abandoned carts: 7 days without activity

**Cleanup Process:**
1. Background job runs daily
2. Identifies expired carts
3. Marks as EXPIRED
4. Archives cart data
5. Sends abandoned cart email (for authenticated users)

### 5.6 Empty Cart State Handling

**Empty Cart Detection:**
When a cart has zero items (`items.length === 0`), the system sets an `isEmpty` flag in the cart response.

**UI Redirection Business Rule:**
When the cart is empty:
1. The API response includes `isEmpty: true` and a `redirectUrl` field
2. The `redirectUrl` points to a configurable destination (default: `/shop` or `/products`)
3. The client application should display an empty cart message and provide a clear call-to-action button
4. The redirection is client-side and optional (not enforced by the API)

**API Response for Empty Cart:**
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "shipping": 0,
    "total": 0,
    "currency": "USD",
    "itemCount": 0,
    "isEmpty": true,
    "redirectUrl": "/shop"
  },
  "message": "Your cart is empty"
}
```

**Configuration:**
The `redirectUrl` can be configured via environment variable:
```
EMPTY_CART_REDIRECT_URL=/shop
```

**Client-Side Implementation:**
The frontend should:
1. Check the `isEmpty` flag in the cart response
2. Display an empty cart illustration and message
3. Show a prominent "Continue Shopping" button that links to `redirectUrl`
4. Optionally show personalized product recommendations

---

## 6. Security Considerations

### 6.1 Authentication & Authorization

**JWT Token Validation:**
- Validate token signature and expiration
- Extract user ID from token claims
- Verify user has permission to access cart

**Session Token Security:**
- Generate cryptographically secure random tokens
- Store in HTTP-only cookies
- Implement CSRF protection
- Rotate tokens periodically

### 6.2 Input Validation

**Request Validation:**
- Validate all input parameters
- Sanitize user inputs
- Enforce quantity limits (max: 99 per item)
- Validate product IDs against database

**SQL Injection Prevention:**
- Use parameterized queries
- ORM with built-in protection
- Input sanitization

### 6.3 Rate Limiting

**API Rate Limits:**
- 100 requests per minute per user
- 1000 requests per minute per IP
- Exponential backoff for repeated violations

### 6.4 Data Privacy

**PII Protection:**
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement data retention policies
- GDPR compliance for EU users

---

## 7. Performance Requirements

### 7.1 Response Time Targets

| Operation | Target Response Time | Max Response Time |
|-----------|---------------------|-------------------|
| Get Cart | < 100ms | 200ms |
| Add Item | < 200ms | 500ms |
| Update Item | < 200ms | 500ms |
| Remove Item | < 150ms | 300ms |
| Apply Coupon | < 300ms | 1000ms |

### 7.2 Caching Strategy

**Redis Cache:**
- Cache active carts for 15 minutes
- Cache product prices for 5 minutes
- Cache tax rates for 1 hour
- Invalidate on updates

**Cache Keys:**
```
cart:{userId}
cart:session:{sessionToken}
price:{productId}
tax:{locationCode}
```

### 7.3 Database Optimization

**Indexes:**
- Primary keys on all tables
- Index on user_id, session_token
- Composite index on (cart_id, product_id)
- Index on expires_at for cleanup jobs

**Query Optimization:**
- Use connection pooling
- Implement read replicas for GET operations
- Batch operations where possible

### 7.4 Scalability

**Horizontal Scaling:**
- Stateless service design
- Load balancer distribution
- Database sharding by user ID
- Redis cluster for cache

**Capacity Planning:**
- Support 10,000 concurrent users
- Handle 1,000 requests per second
- Store 1 million active carts

---

## 8. Error Handling

### 8.1 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Not enough inventory available",
    "details": {
      "productId": "product-uuid",
      "requested": 10,
      "available": 5
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid"
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| CART_NOT_FOUND | 404 | Cart does not exist |
| ITEM_NOT_FOUND | 404 | Item not in cart |
| INVALID_QUANTITY | 400 | Invalid quantity value |
| INSUFFICIENT_INVENTORY | 409 | Not enough stock |
| INVALID_COUPON | 400 | Coupon invalid or expired |
| PRODUCT_NOT_FOUND | 404 | Product does not exist |
| UNAUTHORIZED | 401 | Invalid or missing token |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### 8.3 Retry Logic

**Client Retry Strategy:**
- Retry on 5xx errors
- Exponential backoff (1s, 2s, 4s)
- Max 3 retry attempts
- Don't retry on 4xx errors

**Circuit Breaker:**
- Open circuit after 5 consecutive failures
- Half-open after 30 seconds
- Close after 3 successful requests

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Coverage Requirements:**
- Minimum 80% code coverage
- Test all business logic functions
- Test error handling paths
- Mock external service calls

**Test Cases:**
- Cart creation for guest/authenticated users
- Item addition with various scenarios
- Quantity updates and validations
- Price calculations
- Cart merging logic
- Expiration handling

### 9.2 Integration Tests

**Test Scenarios:**
- End-to-end cart operations
- Integration with Inventory Service
- Integration with Pricing Service
- Integration with Tax Service
- Database operations
- Cache operations

### 9.3 Performance Tests

**Load Testing:**
- Simulate 10,000 concurrent users
- Test sustained load of 1,000 req/s
- Measure response times under load
- Identify bottlenecks

**Stress Testing:**
- Test system limits
- Gradual load increase
- Monitor system degradation
- Test recovery mechanisms

### 9.4 Security Tests

**Security Validation:**
- SQL injection attempts
- XSS attack prevention
- CSRF protection
- Authentication bypass attempts
- Rate limiting effectiveness

---

## 10. Deployment Considerations

### 10.1 Environment Configuration

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host:5432/cartdb
REDIS_URL=redis://host:6379
JWT_SECRET=<secret>
SESSION_SECRET=<secret>
INVENTORY_SERVICE_URL=http://inventory:8080
PRICING_SERVICE_URL=http://pricing:8080
TAX_SERVICE_URL=http://tax:8080
CART_EXPIRY_DAYS_GUEST=30
CART_EXPIRY_DAYS_AUTH=90
MAX_ITEMS_PER_CART=50
MAX_QUANTITY_PER_ITEM=99
EMPTY_CART_REDIRECT_URL=/shop
```

### 10.2 Monitoring & Logging

**Metrics to Monitor:**
- Request rate and response times
- Error rates by endpoint
- Cache hit/miss ratios
- Database connection pool usage
- Queue depths
- Cart conversion rates

**Logging:**
- Structured JSON logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Include request IDs for tracing
- Log all errors with stack traces
- Audit logs for sensitive operations

**Alerting:**
- Alert on error rate > 5%
- Alert on response time > 1s
- Alert on database connection failures
- Alert on cache failures

### 10.3 Deployment Strategy

**Blue-Green Deployment:**
1. Deploy new version to green environment
2. Run smoke tests
3. Switch traffic to green
4. Monitor for issues
5. Keep blue as rollback option

**Database Migrations:**
- Use migration tools (e.g., Flyway)
- Test migrations in staging
- Backward compatible changes
- Rollback plan for each migration

### 10.4 Disaster Recovery

**Backup Strategy:**
- Daily database backups
- Retain backups for 30 days
- Test restore procedures monthly
- Replicate backups to different region

**Recovery Procedures:**
- Document recovery steps
- RTO: 1 hour
- RPO: 15 minutes
- Regular disaster recovery drills

---

## Appendix A: API Examples

### Example 1: Guest User Adding Item

**Request:**
```bash
curl -X POST https://api.example.com/api/v1/cart/items \
  -H "X-Session-Token: guest-session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "quantity": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartId": "cart-456",
    "item": {
      "id": "item-789",
      "productId": "prod-123",
      "quantity": 2,
      "price": 29.99
    },
    "cart": {
      "subtotal": 59.98,
      "total": 72.67,
      "itemCount": 2
    }
  }
}
```

### Example 2: Authenticated User Merging Cart

**Scenario:** Guest user with items in cart logs in

**Process:**
1. Guest cart has 2 items
2. User authenticates
3. System merges guest cart with user's existing cart
4. Returns merged cart

---

## Appendix B: Database Indexes

```sql
-- Shopping Carts Indexes
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_session_token ON shopping_carts(session_token);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
CREATE INDEX idx_shopping_carts_expires_at ON shopping_carts(expires_at);

-- Cart Items Indexes
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
```

---

## Appendix C: Sequence Diagrams

### Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant CartService
    participant InventoryService
    participant PricingService
    participant Database
    participant Cache

    Client->>API: POST /api/v1/cart/items
    API->>CartService: addItem(productId, quantity)
    CartService->>InventoryService: checkAvailability(productId, quantity)
    InventoryService-->>CartService: available: true
    CartService->>PricingService: getPrice(productId)
    PricingService-->>CartService: price: 29.99
    CartService->>Database: insertCartItem()
    CartService->>Database: updateCartTotals()
    CartService->>Cache: invalidateCart(cartId)
    CartService-->>API: cartItem, updatedCart
    API-->>Client: 200 OK with cart data
```

---

**End of Document**