## 7. Validation Rules

### 7.1 Product Validation
- **Name:** Required, max 255 characters
- **Price:** Required, must be positive, precision (10,2)
- **Category:** Required, max 100 characters
- **Stock Quantity:** Required, must be non-negative integer
- **Minimum Procurement Threshold:** Required, must be positive integer, default 10

### 7.2 Shopping Cart Validation
- **Quantity:** Must be positive integer (> 0)
- **Product Existence:** Product must exist in database
- **Inventory Availability:** Requested quantity must not exceed available stock
- **Minimum Threshold:** Post-purchase stock must meet minimum procurement threshold

### 7.3 Inventory Validation Rules

**Rule 1: Stock Availability Check**
```
requested_quantity <= current_stock_quantity
```
Error Message: "Insufficient stock. Only {available} units available."

**Rule 2: Minimum Threshold Check**
```
(current_stock_quantity - requested_quantity) >= minimum_procurement_threshold
```
Error Message: "Cannot fulfill request. Minimum procurement threshold of {threshold} units must be maintained. Maximum available for purchase: {max_available} units."

**Rule 3: Combined Validation**
Both rules must pass for the transaction to proceed.

## 8. Database Schema

### 8.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_procurement_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_threshold_positive CHECK (minimum_procurement_threshold > 0)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 8.2 Shopping Cart Table

```sql
CREATE TABLE shopping_cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_id_positive CHECK (user_id > 0)
);

CREATE INDEX idx_shopping_cart_user_id ON shopping_cart(user_id);
```

### 8.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    shopping_cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_addition DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_shopping_cart FOREIGN KEY (shopping_cart_id) 
        REFERENCES shopping_cart(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_price_at_addition_positive CHECK (price_at_addition > 0)
);

CREATE INDEX idx_cart_items_shopping_cart_id ON cart_items(shopping_cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 9. Error Handling

### 9.1 Product Not Found
**Exception:** `ProductNotFoundException`  
**HTTP Status:** `404 Not Found`  
**Message:** "Product with ID {id} not found"

### 9.2 Invalid Input
**Exception:** `MethodArgumentNotValidException`  
**HTTP Status:** `400 Bad Request`  
**Message:** Validation error details

### 9.3 Database Errors
**Exception:** `DataAccessException`  
**HTTP Status:** `500 Internal Server Error`  
**Message:** "An error occurred while accessing the database"

### 9.4 Inventory Validation Errors
**Exception:** `InventoryValidationException`  
**HTTP Status:** `400 Bad Request`  
**Messages:**
- "Insufficient stock. Only {available} units available."
- "Cannot fulfill request. Minimum procurement threshold of {threshold} units must be maintained. Maximum available for purchase: {max_available} units."
- "Product with ID {id} not found."

### 9.5 Cart Item Not Found
**Exception:** `CartItemNotFoundException`  
**HTTP Status:** `404 Not Found`  
**Message:** "Cart item with ID {id} not found"

## 10. Technology Stack

### 10.1 Backend
- **Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Build Tool:** Maven/Gradle
- **ORM:** Spring Data JPA (Hibernate)

### 10.2 Database
- **RDBMS:** PostgreSQL 15+
- **Connection Pool:** HikariCP
- **Migration Tool:** Flyway/Liquibase

### 10.3 Additional Libraries
- **Validation:** Spring Boot Starter Validation
- **Logging:** SLF4J with Logback
- **Testing:** JUnit 5, Mockito, Spring Boot Test
- **API Documentation:** SpringDoc OpenAPI (Swagger)

## 11. Testing Strategy

### 11.1 Unit Tests
- Test all service layer methods
- Mock repository dependencies
- Test business logic and validation rules
- Test inventory validation logic
- Test cart total calculation
- Coverage target: 80%+

### 11.2 Integration Tests
- Test controller endpoints
- Test database interactions
- Test complete request-response cycles
- Test shopping cart workflows
- Use test containers for PostgreSQL

### 11.3 Test Cases for Shopping Cart
- Add item to cart with valid inventory
- Add item to cart with insufficient stock
- Add item violating minimum threshold
- Update cart item quantity within limits
- Update cart item quantity exceeding limits
- Remove item from cart
- Calculate cart total with multiple items
- Validate price consistency after product price changes

## 12. Performance Considerations

### 12.1 Database Optimization
- Index on frequently queried columns (category, name, user_id)
- Use connection pooling
- Implement pagination for large result sets
- Optimize JOIN queries for cart operations

### 12.2 Caching Strategy
- Cache frequently accessed products
- Cache product categories
- Implement cache invalidation on updates
- Consider Redis for distributed caching

### 12.3 Query Optimization
- Use native queries for complex operations
- Implement lazy loading for relationships
- Batch operations where applicable
- Use database-level constraints for data integrity

## 13. Security Considerations

### 13.1 Input Validation
- Validate all user inputs
- Sanitize search keywords
- Prevent SQL injection through parameterized queries
- Validate quantity and price ranges

### 13.2 Authentication & Authorization
- Implement JWT-based authentication
- Role-based access control (RBAC)
- Secure cart operations to authenticated users only
- Ensure users can only access their own carts

### 13.3 Data Protection
- Use HTTPS for all communications
- Encrypt sensitive data at rest
- Implement rate limiting
- Log security events

## 14. Deployment

### 14.1 Environment Configuration
- Development, Staging, Production profiles
- Externalized configuration
- Environment-specific database connections
- Feature flags for gradual rollout

### 14.2 Containerization
- Docker container for application
- Docker Compose for local development
- Kubernetes for orchestration
- Health check endpoints

### 14.3 Monitoring
- Application metrics (Micrometer)
- Log aggregation (ELK Stack)
- Performance monitoring (APM tools)
- Database monitoring
- Alert on inventory threshold violations

## 15. Future Enhancements

### 15.1 Planned Features
- Product image management
- Product reviews and ratings
- Advanced search with filters
- Product recommendations
- Wishlist functionality
- Order checkout from cart
- Cart persistence across sessions
- Cart sharing functionality
- Bulk operations for cart management

### 15.2 Scalability Improvements
- Microservices architecture
- Event-driven architecture
- CQRS pattern implementation
- Read replicas for database
- Distributed caching
- Asynchronous processing for inventory updates

---

**Document Version:** 2.0  
**Last Updated:** 2024  
**Author:** Development Team  
**Status:** Active