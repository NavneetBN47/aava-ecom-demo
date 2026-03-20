## 4. API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |

### 4.1 Cart Management API Endpoints (NEW)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/add` | Add product to cart with minimum procurement threshold and subscription logic | {userId, productId, quantity} | Cart |
| PUT | `/api/cart/update` | Update cart item quantity with real-time recalculation | {userId, cartItemId, quantity} | Cart |
| DELETE | `/api/cart/remove` | Remove product from cart | {userId, cartItemId} | Cart |
| GET | `/api/cart/{userId}` | Get cart details with empty state handling | None | Cart |
| DELETE | `/api/cart/clear/{userId}` | Clear all items from cart | None | None |

## 5. Database Schema

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.1 Cart Management Database Schema (NEW)

```sql
-- Carts Table
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT uk_carts_user_id UNIQUE (user_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_status ON carts(status);

-- Cart Items Table
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    minimum_procurement_threshold INTEGER,
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uk_cart_items_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)

## 9. Cart Management Business Logic (NEW)

### 9.1 Minimum Procurement Threshold Logic

The system enforces minimum procurement thresholds for products during cart operations:

- When a product is added to the cart, the system checks if the product has a minimum procurement threshold defined
- If the requested quantity is less than the minimum threshold, the system automatically sets the quantity to the minimum threshold value
- This ensures compliance with procurement policies and prevents orders below minimum quantities
- The logic is implemented in `CartService.validateMinimumProcurementThreshold()` method

### 9.2 Subscription Logic

The system supports subscription-based products with special handling:

- Products can be marked as subscription items using the `is_subscription` flag in cart items
- Subscription products may have different quantity rules and pricing models
- The system distinguishes between one-time purchases and recurring subscription orders
- Subscription logic is applied during product addition and quantity updates
- This enables support for recurring delivery models and subscription-based pricing

### 9.3 Real-time Recalculation Logic

The system provides instant price and total updates without page refresh:

- When cart item quantities are updated, the system immediately recalculates:
  - Individual cart item total price (quantity × unit price)
  - Overall cart total amount (sum of all cart item totals)
- Recalculation is performed synchronously within the same transaction
- Updated values are persisted to the database and returned in the API response
- This ensures users always see accurate pricing information in real-time
- Implementation is in `CartService.recalculateCartTotals()` method

### 9.4 Inventory Validation Service

The system integrates real-time inventory validation:

- Before adding or updating cart items, the system validates stock availability
- `InventoryValidationService` checks if requested quantity exceeds available stock
- If validation fails, the system returns an error message: "Quantity exceeds available stock"
- This prevents overselling and ensures order fulfillment capability
- Validation is performed for both add and update operations
- Integration point: `CartService` calls `InventoryValidationService.validateStockAvailability()`

### 9.5 Empty Cart State Management

The system handles empty cart scenarios gracefully:

- When a user's cart is empty or doesn't exist, the system returns an appropriate empty state response
- The response includes a user-friendly message indicating the cart is empty
- The system provides a "Return to catalog" action to guide users back to product browsing
- Empty state is detected in `CartService.getCartByUserId()` method
- This improves user experience by providing clear guidance when the cart has no items

## 10. Exception Handling for Cart Operations (NEW)

### 10.1 Custom Exceptions

- **InsufficientStockException:** Thrown when requested quantity exceeds available inventory
- **CartNotFoundException:** Thrown when attempting to access a non-existent cart
- **CartItemNotFoundException:** Thrown when attempting to update or remove a non-existent cart item
- **InvalidQuantityException:** Thrown when quantity is less than minimum procurement threshold or invalid

### 10.2 Error Response Format

All cart-related errors return standardized error responses:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Quantity exceeds available stock",
  "path": "/api/cart/add"
}
```

## 11. Validation Rules for Cart Operations (NEW)

### 11.1 Add Product to Cart Validation

- Product ID must exist in the products table
- Quantity must be a positive integer
- Quantity must meet minimum procurement threshold if defined
- Requested quantity must not exceed available stock
- User ID must be valid

### 11.2 Update Cart Item Quantity Validation

- Cart item ID must exist
- New quantity must be a positive integer
- New quantity must not exceed available stock
- Cart must belong to the requesting user

### 11.3 Remove Product from Cart Validation

- Cart item ID must exist
- Cart must belong to the requesting user

### 11.4 Get Cart Details Validation

- User ID must be valid
- Returns empty cart state if cart doesn't exist

### 11.5 Clear Cart Validation

- User ID must be valid
- Operation succeeds even if cart doesn't exist (idempotent)

## 12. Performance Optimization for Cart Operations (NEW)

### 12.1 Database Indexing Strategy

- Index on `carts.user_id` for fast cart lookup by user
- Index on `cart_items.cart_id` for efficient cart item retrieval
- Index on `cart_items.product_id` for product reference validation
- Composite unique index on `(cart_id, product_id)` to prevent duplicate products in cart

### 12.2 Caching Strategy

- Cart data can be cached at the service layer to reduce database queries
- Cache invalidation on cart modifications (add, update, remove, clear)
- Product stock information can be cached with short TTL for inventory validation

### 12.3 Transaction Management

- All cart modification operations are wrapped in database transactions
- Ensures atomicity of cart updates and total recalculations
- Prevents race conditions in concurrent cart operations

## 13. Security Considerations for Cart Operations (NEW)

### 13.1 Authorization

- Users can only access and modify their own carts
- User ID validation required for all cart operations
- Implement user authentication and authorization checks in CartController

### 13.2 Input Validation

- Sanitize all user inputs to prevent SQL injection
- Validate quantity ranges to prevent integer overflow
- Validate product IDs to prevent unauthorized product access

### 13.3 Rate Limiting

- Implement rate limiting on cart operations to prevent abuse
- Protect against automated cart manipulation attacks
- Monitor for suspicious cart activity patterns