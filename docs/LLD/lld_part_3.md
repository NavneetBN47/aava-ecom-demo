## 6. Business Logic

### 6.1 Minimum Procurement Threshold Logic

When adding a product to the cart:
- If the requested quantity is less than the product's `min_quantity`, automatically set quantity to `min_quantity`
- Apply this logic differently for subscription vs one-time purchases:
  - **Subscription purchases**: Enforce minimum threshold strictly
  - **One-time purchases**: Enforce minimum threshold with user notification
- Display clear messaging to user when quantity is adjusted

### 6.2 Inventory Validation Logic

Before any cart operation that affects quantity:
- Check current `stock_quantity` in products table
- Validate that requested quantity does not exceed available stock
- Return appropriate error message if validation fails:
  - "Insufficient stock available. Only X items remaining."
- Prevent cart updates that would result in over-allocation

### 6.3 Real-time Calculation Engine

Cart totals must be recalculated in real-time (< 200ms) when:
- Item is added to cart
- Item quantity is updated
- Item is removed from cart

Calculations include:
- **Line Item Subtotal**: `product.price × quantity`
- **Cart Subtotal**: Sum of all line item subtotals
- **Tax**: Based on user location (configurable tax rates)
- **Shipping**: Based on delivery method selected
- **Grand Total**: `Subtotal + Tax + Shipping`

### 6.4 Empty State Handling

When cart is empty:
- Display message: "Your cart is empty"
- Provide navigation link back to product catalog
- Return HTTP 200 with empty cart structure
- Maintain session for future cart operations

### 6.5 Session Management

Cart persistence strategy:
- Use session-based storage for anonymous users
- Associate cart with `session_id` (UUID format)
- Store session data in:
  - Server-side session storage (primary)
  - Local storage (backup for client-side persistence)
- Session timeout: 24 hours of inactivity
- On user login: Merge anonymous cart with user cart if exists

### 6.6 Cost Calculation Engine

Comprehensive cost breakdown:

**Subtotal Calculation:**
```
Subtotal = Σ(item.price × item.quantity) for all items in cart
```

**Tax Calculation (Location-based):**
```
Tax = Subtotal × tax_rate(user.location)
```
- Tax rates stored in configuration
- Support for multiple tax jurisdictions
- Default tax rate: 0% if location unknown

**Shipping Calculation (Delivery Method-based):**
```
Shipping = shipping_rate(delivery_method)
```
Delivery methods:
- Standard (5-7 days): $5.99
- Express (2-3 days): $12.99
- Overnight: $24.99
- Free shipping threshold: Orders > $50

**Grand Total:**
```
Grand Total = Subtotal + Tax + Shipping
```

All calculations must complete within 200ms performance requirement.

## 7. Validation Rules

### 7.1 Product Validation
- Product name: Required, max 255 characters
- Price: Required, must be > 0
- Stock quantity: Required, must be ≥ 0
- Min quantity: Optional, must be ≥ 1 if specified
- Max quantity: Optional, must be > min_quantity if specified

### 7.2 Cart Item Validation
- Product ID: Required, must reference existing product
- Quantity: Required, must be ≥ min_quantity and ≤ max_quantity
- Quantity must not exceed available stock
- Session ID: Required for cart operations

### 7.3 Cart Operation Validation Rules

**Add to Cart:**
- Product must exist and be active
- Quantity must meet minimum threshold
- Sufficient stock must be available
- Invalid input returns 400 Bad Request

**Update Quantity:**
- Cart item must exist
- New quantity must be ≥ min_quantity
- New quantity must be ≤ max_quantity
- New quantity must not exceed stock
- Quantity below minimum: "Quantity below minimum threshold of X"
- Quantity exceeds maximum: "Quantity exceeds maximum limit of X"
- Insufficient stock: "Quantity exceeds available stock of X"

**Remove Item:**
- Cart item must exist
- Returns 404 if item not found

## 8. Error Handling

### 8.1 Product-Related Errors
- **ProductNotFoundException** (404): Product ID does not exist
- **InvalidProductDataException** (400): Product data validation failed
- **ProductOutOfStockException** (400): Product stock quantity is 0

### 8.2 Cart-Related Errors
- **InsufficientStockException** (400): Requested quantity exceeds available stock
  - Message: "Insufficient stock available. Only X items remaining."
- **QuantityBelowMinimumException** (400): Quantity below minimum procurement threshold
  - Message: "Quantity below minimum threshold of X items."
- **QuantityExceedsMaximumException** (400): Quantity exceeds maximum purchase limit
  - Message: "Quantity exceeds maximum limit of X items."
- **CartItemNotFoundException** (404): Cart item ID does not exist
  - Message: "Cart item not found."
- **InvalidInputException** (400): Invalid request data
  - Message: "Invalid input data provided."
- **CartUpdateFailedException** (500): Cart operation failed due to system error
  - Message: "Failed to update cart. Please try again."

### 8.3 Error Response Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient stock available. Only 5 items remaining.",
  "path": "/api/cart/items"
}
```

## 9. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3
- **Session Management:** Spring Session
- **Caching:** Redis (for session storage)

## 10. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository, CartRepository, CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors
6. **Strategy Pattern:** Cost calculation strategies for different scenarios
7. **Factory Pattern:** Cart creation and management

## 11. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- Real-time cart total calculations (< 200ms)
- Session-based cart persistence
- Minimum procurement threshold enforcement
- Inventory validation and stock management
- Multi-tier cost calculation (subtotal, tax, shipping)
- Empty cart state handling
- Comprehensive error messaging