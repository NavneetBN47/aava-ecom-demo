## 4. Database Schema

### 4.1 Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_procurement_threshold INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT threshold_non_negative CHECK (minimum_procurement_threshold >= 0)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 4.2 Cart Table

```sql
CREATE TABLE cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    CONSTRAINT unique_user_cart UNIQUE (user_id, status)
);

CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_status ON cart(status);
```

### 4.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT subtotal_non_negative CHECK (subtotal >= 0),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 5. Technology Stack

### 5.1 Backend
- **Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Build Tool:** Maven/Gradle
- **ORM:** Spring Data JPA with Hibernate

### 5.2 Database
- **Primary Database:** PostgreSQL 15+
- **Connection Pooling:** HikariCP (default in Spring Boot)

### 5.3 Dependencies
```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Lombok (Optional) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## 6. Design Patterns

### 6.1 Layered Architecture
- **Controller Layer:** Handles HTTP requests and responses
- **Service Layer:** Contains business logic
- **Repository Layer:** Handles data persistence
- **Entity Layer:** Represents database tables

### 6.2 Dependency Injection
- Uses Spring's `@Autowired` or constructor injection
- Promotes loose coupling and testability

### 6.3 Repository Pattern
- Abstracts data access logic
- Uses Spring Data JPA repositories

### 6.4 DTO Pattern (Implicit)
- Entity objects serve as DTOs in this simple implementation
- Can be extended with separate DTO classes for complex scenarios

## 7. Key Features

### 7.1 Product Management
- Full CRUD operations for products
- Category-based filtering
- Search functionality by product name
- Stock quantity tracking
- Minimum procurement threshold management

### 7.2 Cart Management Features

#### 7.2.1 Minimum Procurement Threshold Logic
The system enforces minimum procurement thresholds for bulk purchases:

**Business Rules:**
- Each product has a `minimumProcurementThreshold` field
- When `purchaseType` is "BULK", the system enforces this threshold
- If requested quantity < threshold, the system automatically adjusts to threshold
- For "RETAIL" purchases, no threshold is enforced

**Implementation in CartService:**
```java
public Integer applyMinimumProcurementThreshold(Product product, String purchaseType) {
    if ("BULK".equalsIgnoreCase(purchaseType)) {
        Integer threshold = product.getMinimumProcurementThreshold();
        if (threshold != null && threshold > 0) {
            return threshold;
        }
    }
    return null; // No threshold for retail purchases
}
```

#### 7.2.2 Inventory Validation
Real-time inventory checking before adding/updating cart items:

**Validation Rules:**
- Check if product exists
- Verify requested quantity <= available stock
- Throw `InsufficientInventoryException` if stock is insufficient
- Integration with ProductService for stock availability checks

**Implementation:**
```java
public void validateInventory(Long productId, Integer quantity) {
    Product product = productService.getProductById(productId);
    if (product.getStockQuantity() < quantity) {
        throw new InsufficientInventoryException(
            "Insufficient inventory for product: " + product.getName()
        );
    }
}
```

#### 7.2.3 Automatic Calculation
- **Subtotal Calculation:** `unitPrice × quantity`
- **Cart Total:** Sum of all cart item subtotals
- **Automatic Recalculation:** Triggered on quantity updates
- **Price Locking:** Unit price is captured at time of adding to cart

#### 7.2.4 Empty Cart Handling
**UI Component Behavior:**
- Display empty cart message when no items exist
- Show "Continue Shopping" button
- Hide cart totals and checkout button
- Provide visual feedback for empty state

**Frontend Implementation Example:**
```javascript
if (cartItems.length === 0) {
    return (
        <div className="empty-cart">
            <img src="/empty-cart-icon.svg" alt="Empty Cart" />
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <button onClick={navigateToProducts}>Continue Shopping</button>
        </div>
    );
}
```

## 8. Error Handling

### 8.1 Product-Related Exceptions
- **ProductNotFoundException:** Thrown when product ID doesn't exist
- **InvalidProductDataException:** Thrown for validation failures

### 8.2 Cart-Related Exceptions
- **InsufficientInventoryException:** Thrown when requested quantity exceeds available stock
- **CartItemNotFoundException:** Thrown when cart item doesn't exist
- **InvalidQuantityException:** Thrown for invalid quantity values (e.g., negative, zero)
- **CartNotFoundException:** Thrown when user's cart doesn't exist

### 8.3 Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
    
    @ExceptionHandler(InsufficientInventoryException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientInventory(InsufficientInventoryException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage()));
    }
    
    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
}
```

## 9. Performance Considerations

### 9.1 Database Optimization
- Proper indexing on frequently queried columns (category, name, user_id, cart_id)
- Connection pooling with HikariCP
- Lazy loading for entity relationships

### 9.2 Caching Strategy (Future Enhancement)
- Cache frequently accessed products
- Cache user cart data
- Use Redis for distributed caching

### 9.3 Optimistic UI Updates
**Frontend Strategy:**
- Update UI immediately when user adds/updates cart items
- Show loading indicators during API calls
- Rollback UI changes if API call fails
- Display success/error notifications

**Implementation Pattern:**
```javascript
const addToCart = async (productId, quantity) => {
    // Optimistic update
    setCartItems([...cartItems, { productId, quantity, status: 'pending' }]);
    
    try {
        const response = await api.post('/api/cart/add', { productId, quantity });
        // Update with server response
        setCartItems(cartItems.map(item => 
            item.productId === productId ? response.data : item
        ));
        showSuccessNotification('Item added to cart');
    } catch (error) {
        // Rollback on error
        setCartItems(cartItems.filter(item => item.productId !== productId));
        showErrorNotification('Failed to add item to cart');
    }
};
```

## 10. Security Considerations

### 10.1 Input Validation
- Validate all incoming request data
- Use Bean Validation annotations (@NotNull, @Min, @Max, etc.)
- Sanitize user inputs to prevent SQL injection

### 10.2 Authentication & Authorization (Future Enhancement)
- Implement Spring Security
- JWT-based authentication
- Role-based access control (RBAC)
- Secure cart operations to authenticated users only

## 11. Testing Strategy

### 11.1 Unit Tests
- Test service layer business logic
- Mock repository dependencies
- Test edge cases and error scenarios

### 11.2 Integration Tests
- Test controller endpoints
- Test database interactions
- Use @SpringBootTest and TestRestTemplate

### 11.3 Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical business logic (inventory validation, threshold enforcement)

## 12. Deployment Configuration

### 12.1 Application Properties
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/ecommerce_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Server Configuration
server.port=8080
server.servlet.context-path=/api

# Logging
logging.level.com.ecommerce=INFO
logging.level.org.hibernate.SQL=DEBUG
```

### 12.2 Environment-Specific Profiles
- `application-dev.properties` - Development environment
- `application-test.properties` - Testing environment
- `application-prod.properties` - Production environment

## 13. Future Enhancements

### 13.1 Planned Features
- Order management system
- Payment gateway integration
- User authentication and authorization
- Product reviews and ratings
- Wishlist functionality
- Advanced search with filters
- Product recommendations
- Inventory management system
- Multi-currency support
- Shipping and delivery tracking

### 13.2 Technical Improvements
- Implement caching layer
- Add API rate limiting
- Implement event-driven architecture
- Add comprehensive logging and monitoring
- Implement circuit breaker pattern
- Add API documentation with Swagger/OpenAPI

---

**Document Version:** 2.0  
**Last Updated:** 2024  
**Author:** Development Team  
**Status:** Active Development