## 5. Database Schema

### 5.1 Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_procurement_threshold INTEGER,
    subscription_eligible BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### 5.2 Carts Table

```sql
CREATE TABLE carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX idx_carts_customer_id ON carts(customer_id);
CREATE INDEX idx_carts_status ON carts(status);
```

### 5.3 Cart Items Table

```sql
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    subscription_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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
- **Real-time Updates:** AJAX / WebSocket (for cart updates without page refresh)

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository, CartRepository, and CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses (CartDetailsDTO, CartItemDTO)
5. **Exception Handling:** Custom exceptions for business logic errors (ProductNotFoundException, CartItemNotFoundException, InsufficientStockException)

## 8. Key Features

### 8.1 Product Management Features
- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching

### 8.2 Shopping Cart Management Features
- **Add to Cart:** Support for both subscription and one-time purchase products with configurable default quantities based on minimum procurement thresholds
- **View Cart:** Display cart items with product details, quantities, prices, subtotals, tax, and total amount
- **Update Quantity:** Real-time cart total recalculation without page refresh when quantities are modified
- **Remove Items:** Individual item removal with automatic cart total updates
- **Clear Cart:** Complete cart clearing functionality
- **Empty Cart Handling:** User-friendly empty cart view with navigation back to product catalog
- **Inventory Validation:** Real-time stock availability checking to prevent overselling with appropriate error messages indicating available stock
- **Pessimistic Locking:** Database-level locking during cart operations to prevent race conditions in concurrent scenarios
- **Cart Persistence:** Persistent cart storage allowing users to return to their carts across sessions
- **Real-time Updates:** AJAX/WebSocket integration for instant cart updates without full page refresh

## 9. Business Logic Implementation

### 9.1 Default Quantity Logic
- When adding a product to cart, if the product has a `minimumProcurementThreshold` defined, set the default quantity to this threshold value
- If no `minimumProcurementThreshold` is defined, default quantity is set to 1
- This logic applies to both subscription and one-time purchase products

### 9.2 Subscription vs One-Time Purchase Handling
- Products are marked with `subscriptionEligible` flag to differentiate subscription products from one-time purchase products
- Cart items store `subscriptionType` field to track whether the item was added as a subscription or one-time purchase
- Quantity handling and pricing logic can be differentiated based on subscription type

### 9.3 Real-Time Cart Total Calculation
- Cart totals (subtotal, tax, total) are calculated in real-time whenever:
  - A product is added to the cart
  - A cart item quantity is updated
  - A cart item is removed
- Calculations are performed server-side in CartService
- Updated totals are immediately returned to the client without requiring page refresh
- Frontend uses AJAX or WebSocket to receive and display updated totals instantly

### 9.4 Inventory Validation
- Before adding or updating cart items, the system validates that requested quantity does not exceed available stock
- Validation uses pessimistic locking (`findByIdWithStockLock`) to prevent race conditions during concurrent operations
- If requested quantity exceeds available stock, an `InsufficientStockException` is thrown with an error message indicating the available quantity
- Stock reservation logic can be implemented to temporarily hold inventory for items in active carts

### 9.5 Empty Cart Handling
- When a cart has no items, the API returns a CartDetailsDTO with:
  - Empty `cartItems` list
  - Zero values for subtotal, tax, and total
  - Zero `itemCount`
- Frontend displays a user-friendly message: "Your cart is empty"
- A button/link is provided to navigate back to the product catalog

## 10. Error Handling

### 10.1 Product-Related Errors
- **ProductNotFoundException:** Thrown when a product with the specified ID is not found (HTTP 404)
- **InvalidProductDataException:** Thrown when product data validation fails (HTTP 400)

### 10.2 Cart-Related Errors
- **CartItemNotFoundException:** Thrown when a cart item with the specified ID is not found (HTTP 404)
- **InsufficientStockException:** Thrown when requested quantity exceeds available stock (HTTP 400)
  - Error message includes available stock quantity: "Requested quantity exceeds available stock. Available: {availableQuantity}"
- **InvalidQuantityException:** Thrown when quantity is less than minimum procurement threshold or invalid (HTTP 400)

## 11. Integration Requirements

### 11.1 Real-Time Updates Without Page Refresh
- **Technology Options:**
  - **AJAX:** Use XMLHttpRequest or Fetch API for asynchronous cart operations
  - **WebSocket:** Establish persistent connection for real-time bidirectional communication
- **Implementation:**
  - Cart operations (add, update, remove) trigger AJAX calls to backend APIs
  - Backend returns updated CartDetailsDTO
  - Frontend JavaScript updates cart display elements (item count, subtotal, tax, total) without full page reload
  - Loading indicators shown during API calls for better UX

### 11.2 Frontend-Backend Communication
- All cart operations use RESTful API endpoints
- Request/response format: JSON
- Authentication tokens (JWT) included in request headers for user identification
- CORS configuration enabled for cross-origin requests if frontend and backend are on different domains

## 12. Security Considerations

- **Authentication:** All cart operations require authenticated user session
- **Authorization:** Users can only access and modify their own carts (validated via customerId)
- **Input Validation:** All user inputs (quantities, product IDs) are validated server-side
- **SQL Injection Prevention:** Parameterized queries used throughout (JPA handles this automatically)
- **Pessimistic Locking:** Prevents race conditions during concurrent cart operations
- **Rate Limiting:** Consider implementing rate limiting on cart operations to prevent abuse

## 13. Performance Optimization

- **Database Indexing:** Indexes on frequently queried columns (customer_id, cart_id, product_id, category, name)
- **Caching:** Consider implementing Redis cache for frequently accessed product data
- **Connection Pooling:** Database connection pooling configured for optimal performance
- **Lazy Loading:** JPA lazy loading for related entities to avoid unnecessary data fetching
- **Batch Operations:** Batch updates for multiple cart items when possible

## 14. Testing Strategy

### 14.1 Unit Tests
- Test individual service methods (CartService, ProductService)
- Mock repository dependencies
- Test business logic in isolation

### 14.2 Integration Tests
- Test controller endpoints with MockMvc
- Test database operations with test database
- Test complete request-response flows

### 14.3 Test Scenarios for Cart Functionality
- Add product to empty cart
- Add product to existing cart
- Add same product multiple times (quantity update)
- Update cart item quantity within stock limits
- Update cart item quantity exceeding stock limits (should fail)
- Remove cart item
- Clear entire cart
- View empty cart
- View cart with items
- Concurrent cart operations (race condition testing)
- Default quantity based on minimum procurement threshold
- Subscription vs one-time purchase handling

## 15. Future Enhancements

- **Cart Expiration:** Implement cart expiration logic to clear abandoned carts after a certain period
- **Save for Later:** Allow users to move items from cart to a "Save for Later" list
- **Cart Sharing:** Enable users to share their cart with others
- **Promotional Codes:** Support for discount codes and promotional offers
- **Bulk Operations:** Add multiple products to cart in a single operation
- **Cart Analytics:** Track cart abandonment rates and popular product combinations
- **Wishlist Integration:** Allow moving items between cart and wishlist
- **Guest Cart:** Support for anonymous users with cart persistence via session/cookies