# Low Level Design Document: E-commerce Product Management System with Shopping Cart

## 1. System Overview

This document provides the low-level design for an E-commerce Product Management System with Shopping Cart functionality. The system enables users to browse products, manage a shopping cart, and prepare for checkout.

## 2. Architecture Components

### 2.1 Module Structure

```
ecommerce-system/
├── product-management/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── models/
├── shopping-cart/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── models/
└── shared/
    ├── middleware/
    ├── utils/
    └── config/
```

## 3. Product Management Module

### 3.1 Data Model

#### Product Entity
```typescript
interface Product {
  id: string;              // UUID
  name: string;            // Product name (max 200 chars)
  description: string;     // Product description (max 2000 chars)
  price: number;           // Price in cents (integer)
  currency: string;        // ISO 4217 currency code (e.g., "USD")
  stockQuantity: number;   // Available stock count
  category: string;        // Product category
  imageUrl: string;        // Product image URL
  isActive: boolean;       // Product availability status
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### 3.2 API Endpoints

#### GET /api/v1/products
**Purpose**: Retrieve paginated list of active products

**Request Parameters**:
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  category?: string;    // Optional filter
  sortBy?: string;      // Options: "price", "name", "createdAt"
  sortOrder?: string;   // Options: "asc", "desc"
}
```

**Response**:
```typescript
{
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  }
}
```

**Status Codes**:
- 200: Success
- 400: Invalid parameters
- 500: Server error

#### GET /api/v1/products/:id
**Purpose**: Retrieve single product details

**Response**:
```typescript
{
  data: Product;
}
```

**Status Codes**:
- 200: Success
- 404: Product not found
- 500: Server error

### 3.3 Business Logic Implementation

#### Product Retrieval Service
```typescript
class ProductService {
  async getProducts(filters: ProductFilters): Promise<PaginatedProducts> {
    // 1. Validate input parameters
    // 2. Apply default values for pagination
    // 3. Build query with filters (category, active status)
    // 4. Apply sorting
    // 5. Execute paginated query
    // 6. Calculate pagination metadata
    // 7. Return formatted response
  }

  async getProductById(id: string): Promise<Product> {
    // 1. Validate UUID format
    // 2. Query database for product
    // 3. Check if product exists and is active
    // 4. Return product or throw NotFoundError
  }
}
```

### 3.4 Database Schema

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at);
```

## 4. Shopping Cart Management Module

### 4.1 Data Model

#### Cart Entity
```typescript
interface Cart {
  id: string;              // UUID
  userId: string;          // User identifier
  items: CartItem[];       // Array of cart items
  totalAmount: number;     // Total cart value in cents
  currency: string;        // ISO 4217 currency code
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

#### CartItem Entity
```typescript
interface CartItem {
  id: string;              // UUID
  cartId: string;          // Reference to cart
  productId: string;       // Reference to product
  productName: string;     // Cached product name for display (populated from Product entity at the time of adding to cart and returned in API responses)
  price: number;           // Price at time of adding (cents)
  quantity: number;        // Item quantity
  subtotal: number;        // price * quantity
  addedAt: Date;           // Timestamp when added
}
```

### 4.2 API Endpoints

#### POST /api/v1/cart/items
**Purpose**: Add item to shopping cart

**Request Body**:
```typescript
{
  productId: string;    // Required: UUID of product
  quantity?: number;    // Optional: Number of items (must be positive integer; if not provided, defaults to 1)
}
```

**Response**:
```typescript
{
  data: Cart;           // Updated cart with all items
  message: string;      // Success message
}
```

**Status Codes**:
- 201: Item added successfully
- 400: Invalid request (invalid productId, invalid quantity)
- 404: Product not found
- 409: Insufficient stock
- 500: Server error

#### GET /api/v1/cart
**Purpose**: Retrieve current user's cart

**Response**:
```typescript
{
  data: Cart;
}
```

**Status Codes**:
- 200: Success
- 404: Cart not found (empty cart)
- 500: Server error

#### PUT /api/v1/cart/items/:itemId
**Purpose**: Update cart item quantity

**Request Body**:
```typescript
{
  quantity: number;     // Required: New quantity (must be positive)
}
```

**Response**:
```typescript
{
  data: Cart;           // Updated cart
  message: string;
}
```

**Status Codes**:
- 200: Updated successfully
- 400: Invalid quantity
- 404: Item not found
- 409: Insufficient stock
- 500: Server error

#### DELETE /api/v1/cart/items/:itemId
**Purpose**: Remove item from cart

**Response**:
```typescript
{
  data: Cart;           // Updated cart
  message: string;
}
```

**Status Codes**:
- 200: Removed successfully
- 404: Item not found
- 500: Server error

#### DELETE /api/v1/cart
**Purpose**: Clear entire cart

**Response**:
```typescript
{
  message: string;      // Success message
}
```

**Status Codes**:
- 200: Cart cleared
- 404: Cart not found
- 500: Server error

### 4.3 Business Logic Implementation

#### Cart Service
```typescript
class CartService {
  async addItemToCart(userId: string, productId: string, quantity: number = 1): Promise<Cart> {
    // 1. Validate productId format (UUID)
    // 2. Validate quantity (positive integer, default to 1 if not provided)
    // 3. Fetch product details and verify it exists and is active
    // 4. Check stock availability (product.stockQuantity >= quantity)
    // 5. Get or create cart for user
    // 6. Check if product already exists in cart
    //    - If exists: update quantity (add to existing)
    //    - If new: create new cart item
    // 7. Recalculate cart totals
    // 8. Save cart and return updated cart
  }

  async getCart(userId: string): Promise<Cart> {
    // 1. Query cart by userId
    // 2. Include all cart items with product details
    // 3. Verify all products are still active and in stock
    // 4. Recalculate totals to ensure accuracy
    // 5. Return cart or throw NotFoundError if empty
  }

  async updateCartItem(userId: string, itemId: string, quantity: number): Promise<Cart> {
    // 1. Validate quantity (must be positive)
    // 2. Get cart and verify ownership (userId matches)
    // 3. Find cart item by itemId
    // 4. Fetch current product details
    // 5. Verify stock availability for new quantity
    // 6. Update item quantity and subtotal
    // 7. Recalculate cart totals
    // 8. Save and return updated cart
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    // 1. Get cart and verify ownership
    // 2. Find and remove cart item
    // 3. Recalculate cart totals
    // 4. Save and return updated cart
  }

  async clearCart(userId: string): Promise<void> {
    // 1. Find cart by userId
    // 2. Delete all cart items
    // 3. Reset cart totals to zero
    // 4. Save cart or delete cart record
  }

  private calculateCartTotals(cart: Cart): void {
    // 1. Sum all item subtotals
    // 2. Update cart.totalAmount
    // 3. Ensure currency consistency
  }
}
```

#### Stock Validation Logic
```typescript
class StockValidator {
  async validateStock(productId: string, requestedQuantity: number): Promise<boolean> {
    // 1. Fetch current product stock
    // 2. Compare requestedQuantity with stockQuantity
    // 3. Return true if sufficient, false otherwise
    // 4. Consider reserved stock (items in other carts)
  }
}
```

#### Empty Cart Handling
When a cart is empty or all items are removed:
- The GET /api/v1/cart endpoint returns 404 with message "Cart is empty"
- The presentation layer (frontend) is responsible for handling this response and redirecting users to the product browsing page
- The API includes a specific response field `isEmpty: true` and/or uses status code 404 to signal that the cart is empty, which triggers the presentation layer's redirection logic
- This separation ensures the API remains stateless while allowing the UI to implement appropriate navigation flows

### 4.4 Database Schema

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 5. Error Handling

### 5.1 Error Response Format
```typescript
{
  error: {
    code: string;        // Error code (e.g., "PRODUCT_NOT_FOUND")
    message: string;     // Human-readable message
    details?: any;       // Optional additional details
  }
}
```

### 5.2 Common Error Scenarios

#### Product Not Found
```typescript
{
  error: {
    code: "PRODUCT_NOT_FOUND",
    message: "The requested product does not exist or is no longer available"
  }
}
```

#### Insufficient Stock
```typescript
{
  error: {
    code: "INSUFFICIENT_STOCK",
    message: "Not enough stock available",
    details: {
      requested: 5,
      available: 2
    }
  }
}
```

#### Invalid Quantity
```typescript
{
  error: {
    code: "INVALID_QUANTITY",
    message: "Quantity must be a positive integer"
  }
}
```

## 6. Security Considerations

### 6.1 Authentication & Authorization
- All cart endpoints require valid user authentication
- Users can only access and modify their own carts
- JWT tokens used for authentication with 24-hour expiry

### 6.2 Input Validation
- All UUIDs validated for correct format
- Quantity values must be positive integers
- Price values stored as integers (cents) to avoid floating-point issues
- SQL injection prevention through parameterized queries

### 6.3 Rate Limiting
- Product listing: 100 requests per minute per IP
- Cart operations: 50 requests per minute per user
- Implement exponential backoff for repeated failures

## 7. Performance Optimization

### 7.1 Caching Strategy
- Product catalog cached with 5-minute TTL
- Individual product details cached with 10-minute TTL
- Cart data not cached (real-time accuracy required)

### 7.2 Database Optimization
- Indexes on frequently queried fields (category, userId, productId)
- Pagination to limit result set size
- Connection pooling for database connections

### 7.3 Query Optimization
- Use SELECT specific columns instead of SELECT *
- Implement eager loading for cart items with product details
- Batch operations where possible

## 8. Monitoring & Logging

### 8.1 Logging Requirements
- Log all cart modifications (add, update, remove)
- Log stock validation failures
- Log authentication failures
- Include userId, timestamp, and operation details

### 8.2 Metrics to Track
- Cart abandonment rate
- Average items per cart
- Most added products
- Stock-out frequency
- API response times
- Error rates by endpoint

## 9. Testing Strategy

### 9.1 Unit Tests
- Product service methods
- Cart service methods
- Stock validation logic
- Price calculation accuracy

### 9.2 Integration Tests
- End-to-end cart workflows
- Product to cart integration
- Database transaction integrity
- Error handling scenarios

### 9.3 Test Scenarios
- Add item to empty cart
- Add duplicate item (quantity update)
- Update item quantity
- Remove item from cart
- Clear entire cart
- Handle insufficient stock
- Handle deleted products in cart
- Concurrent cart modifications

## 10. Deployment Considerations

### 10.1 Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
API_PORT=3000
NODE_ENV=production
```

### 10.2 Scalability
- Horizontal scaling of API servers
- Database read replicas for product queries
- Redis for session and cache management
- CDN for product images

### 10.3 Backup & Recovery
- Daily database backups
- Point-in-time recovery capability
- Cart data retention: 90 days for inactive carts

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Prepared By**: Engineering Team