## 4. API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### 4.1 Shopping Cart API Endpoints

**Requirement Reference:** Epic SCRUM-344: shopping cart management, Story SCRUM-343: add products to shopping cart and manage quantities

#### POST /api/v1/cart/items - Add Product to Cart

**Requirement Reference:** Story SCRUM-343 AC1: When they click Add to Cart, Then the product is added to their shopping cart with quantity 1

**Description:** Adds a product to the shopping cart with specified quantity. If the product already exists in the cart, the quantity is incremented.

**Authentication:** Required (JWT Bearer Token or Session Cookie)

**Request:**
```json
{
  "productId": "123",
  "quantity": 1
}
```

**Request Schema:**
- `productId` (Long, required): Valid product ID that exists in the products table
- `quantity` (Integer, required): Quantity to add (1-99, must not exceed available stock)

**Response 201 Created:**
```json
{
  "itemId": "uuid-here",
  "cartId": "cart-uuid",
  "productId": 123,
  "productName": "Product Name",
  "productImageUrl": "https://...",
  "productSku": "SKU-123",
  "unitPrice": 29.99,
  "quantity": 1,
  "subtotal": 29.99,
  "addedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body (missing productId, invalid quantity)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Product does not exist
- `409 Conflict`: Insufficient stock or duplicate item conflict
- `500 Internal Server Error`: Server error during processing

**Error Response Format:**
```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Requested quantity exceeds available stock",
  "availableStock": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET /api/v1/cart - View Shopping Cart

**Requirement Reference:** Story SCRUM-343 AC2: all added products are displayed with name, price, quantity, and subtotal, AC5: message Your cart is empty is displayed

**Description:** Retrieves the complete shopping cart with all items, product details, and calculated totals. Returns empty cart message when no items present.

**Authentication:** Required (JWT Bearer Token or Session Cookie)

**Response 200 OK (with items):**
```json
{
  "cartId": "cart-uuid",
  "userId": "user-uuid",
  "status": "active",
  "items": [
    {
      "itemId": "item-uuid-1",
      "productId": 123,
      "productName": "Product Name",
      "productImageUrl": "https://...",
      "productSku": "SKU-123",
      "productUrl": "/products/123",
      "unitPrice": 29.99,
      "quantity": 2,
      "subtotal": 59.98,
      "availabilityStatus": "in_stock"
    }
  ],
  "itemsSubtotal": 59.98,
  "appliedDiscounts": 0.00,
  "subtotalAfterDiscounts": 59.98,
  "estimatedShipping": 5.99,
  "estimatedTax": 4.80,
  "orderTotal": 70.77,
  "disclaimer": "Final tax and shipping calculated at checkout",
  "itemCount": 2,
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response 200 OK (empty cart):**
```json
{
  "cartId": "cart-uuid",
  "userId": "user-uuid",
  "status": "active",
  "items": [],
  "message": "Your cart is empty",
  "continueShoppingUrl": "/products",
  "itemCount": 0,
  "orderTotal": 0.00
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Cart not found for user/session
- `500 Internal Server Error`: Server error during processing

#### PATCH /api/v1/cart/items/{item_id} - Update Item Quantity

**Requirement Reference:** Story SCRUM-343 AC3: update the quantity of an item, Then the subtotal and total are recalculated automatically

**Description:** Updates the quantity of a specific cart item with automatic recalculation of subtotals and totals. Validates against available stock.

**Authentication:** Required (JWT Bearer Token or Session Cookie)

**Path Parameters:**
- `item_id` (UUID, required): The unique identifier of the cart item

**Request:**
```json
{
  "quantity": 3
}
```

**Request Schema:**
- `quantity` (Integer, required): New quantity (1-99, must not exceed available stock, 0 triggers removal prompt)

**Response 200 OK:**
```json
{
  "itemId": "item-uuid",
  "cartId": "cart-uuid",
  "productId": 123,
  "productName": "Product Name",
  "unitPrice": 29.99,
  "quantity": 3,
  "subtotal": 89.97,
  "cartTotals": {
    "itemsSubtotal": 89.97,
    "appliedDiscounts": 0.00,
    "subtotalAfterDiscounts": 89.97,
    "estimatedShipping": 5.99,
    "estimatedTax": 7.20,
    "orderTotal": 103.16
  },
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid quantity (not integer, less than 0, exceeds 99)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Cart item not found
- `409 Conflict`: Insufficient stock for requested quantity
- `500 Internal Server Error`: Server error during processing

**Error Response Format (Insufficient Stock):**
```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Requested quantity exceeds available stock",
  "requestedQuantity": 10,
  "availableStock": 5,
  "currentQuantity": 2,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

#### DELETE /api/v1/cart/items/{item_id} - Remove Item from Cart

**Requirement Reference:** Story SCRUM-343 AC4: When they click Remove, Then the item is deleted from the cart and totals are updated

**Description:** Removes a specific item from the shopping cart with automatic recalculation of cart totals.

**Authentication:** Required (JWT Bearer Token or Session Cookie)

**Path Parameters:**
- `item_id` (UUID, required): The unique identifier of the cart item to remove

**Response 204 No Content:**
```json
{
  "cartTotals": {
    "itemsSubtotal": 29.99,
    "appliedDiscounts": 0.00,
    "subtotalAfterDiscounts": 29.99,
    "estimatedShipping": 5.99,
    "estimatedTax": 2.40,
    "orderTotal": 38.38
  },
  "itemCount": 1,
  "message": "Item removed successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Cart item not found or does not belong to user's cart
- `500 Internal Server Error`: Server error during processing

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

### 5.1 Shopping Cart Database Schema

**Requirement Reference:** Epic SCRUM-344: shopping cart management, Story SCRUM-343: all cart functionality

#### Carts Table

```sql
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_status CHECK (status IN ('active', 'abandoned', 'converted', 'expired')),
    CONSTRAINT chk_user_or_session CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Indexes for performance optimization
CREATE INDEX idx_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);

-- Unique constraint: one active cart per user
CREATE UNIQUE INDEX idx_unique_active_cart_user ON carts(user_id) 
    WHERE status = 'active' AND user_id IS NOT NULL;

-- Unique constraint: one active cart per session
CREATE UNIQUE INDEX idx_unique_active_cart_session ON carts(session_id) 
    WHERE status = 'active' AND session_id IS NOT NULL;
```

#### Cart Items Table

```sql
CREATE TABLE cart_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_quantity_limit CHECK (quantity <= 99),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT chk_subtotal_positive CHECK (subtotal > 0)
);

-- Indexes for performance optimization
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Unique constraint: one product per cart
CREATE UNIQUE INDEX idx_unique_cart_product ON cart_items(cart_id, product_id);

-- Trigger to automatically calculate subtotal
CREATE OR REPLACE FUNCTION calculate_cart_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.unit_price * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_subtotal
    BEFORE INSERT OR UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cart_item_subtotal();

-- Trigger to update cart updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cart_timestamp
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_timestamp();
```

**Description:** Complete database schema including carts table (cart_id UUID PK, user_id, session_id, status, timestamps), cart_items table (item_id UUID PK, cart_id FK, product_id FK, quantity, unit_price, subtotal), indexes (user_id, session_id, cart_id, product_id), and constraints (unique_active_cart, unique_cart_product, check_quantity_positive).

**Reason:** Required for implementing persistence layer with complete database schema and performance optimization indexes.

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3

### 6.1 Additional Technology Stack for Shopping Cart

- **Caching:** Redis (for cart session management and performance)
- **Session Management:** Spring Session with Redis backend
- **Security:** Spring Security with JWT authentication
- **Validation:** Jakarta Bean Validation (JSR 380)
- **Rate Limiting:** Bucket4j with Redis
- **Monitoring:** Spring Boot Actuator with Micrometer

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors

### 7.1 Additional Design Patterns for Shopping Cart

6. **Strategy Pattern:** Different cart calculation strategies (with/without tax, discounts)
7. **Factory Pattern:** Cart creation for authenticated vs guest users
8. **Observer Pattern:** Cart event listeners for analytics and notifications
9. **Builder Pattern:** Complex cart summary object construction
10. **Facade Pattern:** CartService as facade for complex cart operations

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

### 8.1 Shopping Cart Key Features

**Requirement Reference:** Epic SCRUM-344: shopping cart management, Story SCRUM-343: add products to shopping cart and manage quantities

- **Add to Cart:** Single-click product addition with quantity 1 (AC1)
- **Cart Display:** Complete product details with name, price, quantity, subtotal (AC2)
- **Quantity Management:** Real-time quantity updates with automatic recalculation (AC3)
- **Item Removal:** One-click item deletion with total updates (AC4)
- **Empty Cart Handling:** User-friendly empty cart message with continue shopping link (AC5)
- **Session Persistence:** 24-hour cart retention for guest users
- **User Cart Migration:** Automatic cart merge on login
- **Stock Validation:** Real-time inventory checks preventing overselling
- **Price Consistency:** Unit price locked at add-to-cart time
- **Performance Optimization:** Redis caching with 15-minute TTL
- **Security:** CSRF protection, rate limiting (100 req/min), JWT authentication

## 9. Business Logic Specification

**Requirement Reference:** Story SCRUM-343 AC3: subtotal and total are recalculated automatically

### 9.1 Cart Calculation Logic

#### Item Subtotal Calculation
```
item_subtotal = unit_price × quantity
```
- **Precision:** DECIMAL(10,2)
- **Rounding:** HALF_UP (banker's rounding)
- **Validation:** subtotal > 0

#### Cart Subtotal Calculation
```
cart_subtotal = SUM(item_subtotal for all items in cart)
```

#### Discount Application
```
discount_amount = cart_subtotal × (discount_percentage / 100)
subtotal_after_discounts = cart_subtotal - discount_amount
```
- **Coupon Codes:** Applied before tax calculation
- **Promotional Discounts:** Stackable with coupon codes (configurable)
- **Minimum Order:** Some discounts require minimum cart value

#### Tax Calculation
```
estimated_tax = subtotal_after_discounts × tax_rate
```
- **Tax Rate:** Based on shipping address (default: 8%)
- **Tax Exemptions:** Handled for specific product categories
- **Precision:** DECIMAL(10,2) with HALF_UP rounding

#### Shipping Estimation
```
estimated_shipping = base_shipping_rate + (weight_based_charge)
```
- **Free Shipping Threshold:** Orders over $50
- **Flat Rate:** $5.99 for orders under threshold
- **Weight-Based:** Additional charges for heavy items

#### Order Total Calculation
```
order_total = subtotal_after_discounts + estimated_tax + estimated_shipping
```

**Calculation Sequence:**
1. Calculate item subtotals
2. Sum cart subtotal
3. Apply discounts
4. Calculate tax on discounted subtotal
5. Add shipping estimate
6. Compute final order total

**Recalculation Triggers:**
- Item quantity change
- Item addition
- Item removal
- Coupon code application/removal
- Shipping address change (tax rate update)

**Description:** Detailed cart calculation logic including item subtotal formula (unit_price × quantity), cart subtotal (SUM of item subtotals), tax calculation, shipping estimates, discount handling, precision rules (decimal 10,2), and rounding specifications (HALF_UP).

**Reason:** Prevents inconsistent calculations and incorrect totals without comprehensive calculation logic specification.
