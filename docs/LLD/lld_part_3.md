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

### 5.1 Shopping Cart Tables

```sql
CREATE TABLE shopping_carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopping_carts_customer ON shopping_carts(customer_id);

CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
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

## 9. Shopping Cart Functional Requirements

### 9.1 Shopping Cart Quantity Management

**Description:** Functionality for updating item quantities in shopping cart with automatic subtotal and total recalculation

**Impact:** HIGH  
**Category:** FUNCTIONAL_REQUIREMENT  
**Traceability:** Story AC3 - When they update the quantity of an item, Then the subtotal and total are recalculated automatically

**Implementation Details:**
- Quantity updates trigger immediate recalculation of item subtotal (quantity × unit price)
- Cart total is automatically updated by summing all item subtotals
- Validation ensures quantity must be greater than 0
- Optimistic locking prevents concurrent modification issues
- Transaction management ensures atomicity of quantity update and total recalculation

### 9.2 Shopping Cart Item Removal

**Description:** Functionality for removing individual items from shopping cart with total recalculation

**Impact:** HIGH  
**Category:** FUNCTIONAL_REQUIREMENT  
**Traceability:** Story AC4 - When they click Remove, Then the item is deleted from the cart and totals are updated

**Implementation Details:**
- DELETE operation removes specific cart item by itemId
- Cart total is automatically recalculated after item removal
- Cascade delete ensures referential integrity
- Returns updated cart state with remaining items
- Handles transition to empty cart state gracefully

### 9.3 Empty Cart State Handling

**Description:** Empty cart state display with appropriate messaging and navigation

**Impact:** MEDIUM  
**Category:** UI_UX_REQUIREMENT  
**Traceability:** Story AC5 - When the customer views the cart, Then a message 'Your cart is empty' is displayed with a link to continue shopping

**Implementation Details:**
- GET cart endpoint returns isEmpty flag when no items present
- Response includes message: "Your cart is empty"
- Frontend displays empty state UI with call-to-action
- Provides navigation link to product catalog
- Maintains cart entity even when empty for customer tracking

### 9.4 Cart Item Details Display

**Description:** Comprehensive cart item display showing name, price, quantity, and subtotal for each item

**Impact:** MEDIUM  
**Category:** UI_UX_REQUIREMENT  
**Traceability:** Story AC2 - Then all added products are displayed with name, price, quantity, and subtotal

**Implementation Details:**
- Each CartItem entity stores: productName, productPrice, quantity, subtotal
- GET cart endpoint returns complete item details in structured format
- Subtotal calculated as: quantity × productPrice
- Product information denormalized in cart for performance and historical accuracy
- Supports display of product details even if product is later modified or deleted

## 10. Validation and Business Rules

### 10.1 Product Validation Rules
- Product name: Required, max 255 characters
- Price: Required, must be positive, max 2 decimal places
- Category: Required, max 100 characters
- Stock quantity: Required, must be non-negative integer

### 10.2 Shopping Cart Validation Rules
- Quantity: Must be positive integer (> 0)
- Product must exist and be available before adding to cart
- Customer can have only one active shopping cart
- Cart item uniqueness: One entry per product per cart
- Subtotal and total calculations must be accurate to 2 decimal places
- Empty cart operations return appropriate empty state response

### 10.3 Cart Validation Enhancement

**Description:** Enhanced cart count validation to include comprehensive cart state verification

**Impact:** MEDIUM  
**Category:** TEST_ENHANCEMENT  
**Current Implementation:** Basic cart count validation (cart_count >= 1)  
**Proposed Enhancement:** Extended validation to verify:
- Item names match expected products
- Prices are accurate and properly formatted
- Quantities reflect user actions
- Subtotals are correctly calculated (quantity × price)
- Total amount equals sum of all subtotals
- Cart state consistency across operations

### 10.4 Add to Cart Validation Enhancement

**Description:** Enhanced add to cart functionality to validate quantity initialization and cart state

**Impact:** LOW  
**Category:** TEST_ENHANCEMENT  
**Current Implementation:** Validates 'Added to Cart' message only  
**Proposed Enhancement:** Additional validation for:
- Initial quantity set to 1 for new items
- Proper cart state update after addition
- Item appears in cart with correct details
- Cart count increments appropriately
- Duplicate additions increment quantity instead of creating new entry

## 11. Error Handling

### 11.1 Product Management Exceptions
- **ProductNotFoundException:** Thrown when product ID not found (HTTP 404)
- **InvalidProductDataException:** Thrown for validation failures (HTTP 400)
- **DuplicateProductException:** Thrown when creating product with existing identifier (HTTP 409)

### 11.2 Shopping Cart Exceptions
- **CartNotFoundException:** Thrown when cart not found for customer (HTTP 404)
- **CartItemNotFoundException:** Thrown when cart item ID not found (HTTP 404)
- **InvalidQuantityException:** Thrown when quantity <= 0 (HTTP 400)
- **ProductOutOfStockException:** Thrown when requested quantity exceeds stock (HTTP 400)
- **EmptyCartException:** Thrown when attempting operations on empty cart (HTTP 400)

## 12. Performance Considerations

### 12.1 Database Optimization
- Indexes on frequently queried columns (category, name, customer_id, cart_id)
- Composite unique index on (cart_id, product_id) for cart items
- Connection pooling for database connections
- Query optimization using JPA query methods

### 12.2 Caching Strategy
- Product catalog caching for frequently accessed products
- Cart state caching with TTL for active sessions
- Cache invalidation on cart modifications

### 12.3 Transaction Management
- @Transactional annotations for cart operations
- Isolation level configuration for concurrent cart updates
- Rollback strategies for failed operations

## 13. Security Considerations

### 13.1 Authentication & Authorization
- Customer authentication required for cart operations
- Customer can only access their own cart
- Admin roles for product management operations

### 13.2 Input Validation
- Request body validation using Bean Validation annotations
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### 13.3 Data Protection
- Sensitive data encryption at rest
- HTTPS for data in transit
- Audit logging for cart modifications