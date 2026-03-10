## 4. API Endpoints Summary

### Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |
| GET | `/api/products/{productId}/stock-availability?quantity={quantity}` | Check stock availability | None | Boolean |

### Shopping Cart Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart | AddToCartRequest | CartResponse |
| GET | `/api/cart/{customerId}` | View shopping cart | None | CartResponse |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | UpdateCartItemRequest | CartResponse |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | None | None |
| DELETE | `/api/cart/{cartId}` | Clear entire cart | None | None |

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
    procurement_threshold INTEGER NOT NULL DEFAULT 1,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    minimum_procurement_threshold INTEGER NULL,
    subscription_eligible BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_availability ON products(is_available);
```

### Shopping Carts Table

```sql
CREATE TABLE shopping_carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX idx_shopping_carts_customer ON shopping_carts(customer_id);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purchase_type VARCHAR(20) NOT NULL,
    minimum_procurement_threshold INTEGER NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, product_id);
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
- Search functionality with case-insensitive matching

## 9. Shopping Cart Features

### 9.1 Cart Management
- Add products to cart with quantity validation
- View cart contents with real-time total calculation
- Update item quantities with inventory validation
- Remove items from cart
- Empty cart handling with appropriate messaging

### 9.2 Inventory Validation
- Real-time stock availability checking
- Procurement threshold enforcement (minimum order quantity)
- Reserved quantity tracking to prevent overselling
- Automatic inventory reservation on cart operations
- Inventory release on item removal

### 9.3 Cart DTOs

**AddToCartRequest:**
```json
{
  "customerId": "CUST-12345",
  "productId": 100,
  "quantity": 5,
  "purchaseType": "SUBSCRIPTION"
}
```

**UpdateCartItemRequest:**
```json
{
  "quantity": 10
}
```

**UpdateQuantityRequest:**
```json
{
  "cartItemId": "550e8400-e29b-41d4-a716-446655440000",
  "newQuantity": 10
}
```

**CartResponse:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "CUST-12345",
  "items": [
    {
      "cartItemId": "660e8400-e29b-41d4-a716-446655440001",
      "productId": 100,
      "productName": "Product Name",
      "quantity": 5,
      "unitPrice": 29.99,
      "subtotal": 149.95,
      "purchaseType": "SUBSCRIPTION"
    }
  ],
  "subtotal": 149.95,
  "total": 149.95,
  "isEmpty": false,
  "itemCount": 1,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:35:00"
}
```

**CartSummaryResponse (Empty Cart):**
```json
{
  "cartId": null,
  "customerId": "CUST-12345",
  "items": [],
  "subtotal": 0.00,
  "total": 0.00,
  "isEmpty": true,
  "itemCount": 0,
  "message": "Your cart is empty. Start shopping to add items!"
}
```

**CartItemDTO:**
```json
{
  "cartItemId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": 100,
  "productName": "Premium Laptop",
  "unitPrice": 999.99,
  "quantity": 2,
  "subtotal": 1999.98,
  "purchaseType": "ONE_TIME"
}
```

### 9.4 Exception Handling

**Custom Exceptions:**
- `CartNotFoundException`: Thrown when cart is not found for customer
- `InsufficientStockException`: Thrown when requested quantity exceeds available stock
- `InvalidQuantityException`: Thrown when quantity is invalid (negative, zero, or exceeds limits)
- `CartItemNotFoundException`: Thrown when cart item is not found
- `ProcurementThresholdException`: Thrown when quantity is below minimum procurement threshold
- `InventoryValidationException`: Thrown when inventory validation fails (SCRUM-343 AC-6)

**InventoryValidationException Structure:**
```java
public class InventoryValidationException extends RuntimeException {
    private Long productId;
    private Integer requestedQuantity;
    private Integer availableStock;
    private String message;
    
    // Constructor and getters
}
```

**CartNotFoundException Structure:**
```java
public class CartNotFoundException extends RuntimeException {
    private String customerId;
    private String message;
    
    // Constructor and getters
}
```

**Error Response Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient stock. Available quantity: 3, Requested: 5",
  "path": "/api/cart/items",
  "productId": 100,
  "requestedQuantity": 5,
  "availableStock": 3
}
```

## 10. Business Rules

### 10.1 Product Management Rules
- Product price must be positive
- Stock quantity cannot be negative
- Procurement threshold must be at least 1
- Available quantity = stock_quantity - reserved_quantity
- Product is available only if is_available = true AND available_quantity > 0
- Products can have optional minimumProcurementThreshold field
- Products can be marked as subscriptionEligible

### 10.2 Shopping Cart Rules
- Each customer can have only one active cart at a time
- Cart items must reference valid products
- Quantity must meet or exceed procurement threshold
- Quantity cannot exceed available stock
- Cart total is automatically calculated from item subtotals
- Item subtotal = unit_price × quantity
- Removing last item does not delete the cart (cart remains empty)
- Cart status can be: ACTIVE, CHECKED_OUT, ABANDONED
- If product has minimumProcurementThreshold, initial quantity is set to that threshold (SCRUM-343 AC-1)
- Purchase type (SUBSCRIPTION/ONE_TIME) affects quantity increment rules (SCRUM-343 AC-1)

### 10.3 Inventory Management Rules
- Inventory is reserved when items are added to cart
- Reserved inventory is released when items are removed
- Reserved inventory is released when cart is abandoned (after timeout)
- Stock updates must consider reserved quantities
- Concurrent cart operations use pessimistic locking to prevent race conditions
- Real-time inventory validation before adding/updating cart items (SCRUM-343 AC-6)

### 10.4 Minimum Procurement Threshold Logic (SCRUM-343 AC-1)
- When adding product to cart, check if product.minimumProcurementThreshold exists
- If threshold exists and is not null, set initial quantity = minimumProcurementThreshold
- If threshold does not exist or is null, set initial quantity = 1
- Store minimumProcurementThreshold value in CartItem for reference
- Validate that updated quantities still meet the threshold requirement

### 10.5 Purchase Type Logic (SCRUM-343 AC-1)
- CartItem must store purchaseType field (SUBSCRIPTION or ONE_TIME)
- SUBSCRIPTION purchases may have different quantity increment rules
- ONE_TIME purchases follow standard quantity management
- Purchase type affects how quantities are added/updated in cart

## 11. Real-time Total Calculation Logic

The cart total is automatically recalculated whenever:
1. A new item is added to the cart
2. An item quantity is updated
3. An item is removed from the cart

**Calculation Flow:**
```
FOR EACH cart_item IN cart:
    item.subtotal = item.unit_price × item.quantity
    
cart.total_amount = SUM(all item.subtotal)
cart.updated_at = CURRENT_TIMESTAMP
```

**Real-time Calculation Requirements (SCRUM-343 AC-3):**
- Line item subtotal updates instantly when quantity changes
- Overall cart total updates instantly without page refresh
- Calculation triggered on every quantity update operation
- No manual refresh required by user
- Frontend receives updated CartResponse with recalculated totals

## 12. Empty Cart Handling

When a customer views their cart and it's empty:
- Return HTTP 200 (OK) status
- Include empty items array
- Set totalAmount to 0.00
- Set itemCount to 0
- Set isEmpty flag to true
- Include user-friendly message: "Your cart is empty. Start shopping to add items!"
- Frontend should display appropriate empty state UI

**Empty Cart Response (SCRUM-343 AC-5):**
```json
{
  "cartId": null,
  "customerId": "CUST-12345",
  "items": [],
  "subtotal": 0.00,
  "total": 0.00,
  "isEmpty": true,
  "itemCount": 0,
  "message": "Your cart is empty"
}
```

## 13. Validation Rules

### Product Validation
- Name: Required, max 255 characters
- Price: Required, positive decimal
- Category: Required, max 100 characters
- Stock Quantity: Required, non-negative integer
- Procurement Threshold: Required, minimum 1
- Minimum Procurement Threshold: Optional, if present must be positive integer
- Subscription Eligible: Optional, boolean, defaults to false

### Cart Operation Validation
- Customer ID: Required, must be valid
- Product ID: Required, must exist
- Quantity: Required, must be >= procurement_threshold
- Quantity: Must be <= available stock
- Cart Item ID: Must exist for update/delete operations
- Purchase Type: Required for add to cart, must be SUBSCRIPTION or ONE_TIME

### Inventory Validation (SCRUM-343 AC-6)
- Before adding item to cart: validate requested quantity <= available stock
- Before updating quantity: validate new quantity <= available stock
- If validation fails: throw InventoryValidationException with details
- Display error message to user: "Insufficient stock. Available: X, Requested: Y"
- Prevent cart operation from completing if validation fails
