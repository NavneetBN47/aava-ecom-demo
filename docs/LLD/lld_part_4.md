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
| POST | `/api/cart/items` | Add product to cart | {"productId": Long, "quantity": Integer} | CartItem |
| GET | `/api/cart` | View cart with all items | None | Cart (with items, quantities, prices, subtotals, and total) |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | {"quantity": Integer} | CartItem (with recalculated subtotal and cart total) |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | None | Cart (with recalculated total) |

### 4.1 User Authentication API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/users/register` | Register new user | {"email": String, "password": String, "firstName": String, "lastName": String, "phoneNumber": String, "address": String} | User |
| POST | `/api/users/login` | User login | {"email": String, "password": String} | AuthenticationResponse {"token": String, "userId": Long, "expiresAt": LocalDateTime} |
| POST | `/api/users/logout` | User logout | {"token": String} | None |
| GET | `/api/users/{userId}` | Get user profile | None | User |
| PUT | `/api/users/{userId}` | Update user profile | {"firstName": String, "lastName": String, "phoneNumber": String, "address": String} | User |

### 4.2 Order Management API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/orders` | Create order from cart | {"userId": Long, "shippingAddress": String, "paymentMethod": String} | Order (with items, subtotal, tax, shipping, grandTotal) |
| GET | `/api/orders/{orderId}` | Get order by ID | None | Order (with items and cost breakdown) |
| GET | `/api/orders/user/{userId}` | Get all orders for user | None | List<Order> |
| PUT | `/api/orders/{orderId}/status` | Update order status | {"status": String} | Order |
| DELETE | `/api/orders/{orderId}` | Cancel order | None | Order |

### 4.3 Payment Processing API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/payments` | Process payment | {"orderId": Long, "paymentMethod": String, "amount": BigDecimal, "cardDetails": Object} | PaymentResponse {"transactionId": String, "status": String, "amount": BigDecimal} |
| GET | `/api/payments/status/{transactionId}` | Get payment status | None | PaymentStatus {"transactionId": String, "status": String, "amount": BigDecimal} |
| POST | `/api/payments/refund/{transactionId}` | Refund payment | None | RefundResponse {"transactionId": String, "refundAmount": BigDecimal, "status": String} |

### 4.4 Shipping Integration API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/shipping/rates` | Calculate shipping rates | {"fromAddress": String, "toAddress": String, "weight": BigDecimal, "dimensions": Object} | List<ShippingRate> |
| POST | `/api/shipments` | Create shipment | {"orderId": Long, "carrier": String, "serviceType": String} | Shipment {"trackingNumber": String, "carrier": String, "estimatedDelivery": LocalDateTime} |
| GET | `/api/shipments/track/{trackingNumber}` | Track shipment | None | ShipmentTracking {"trackingNumber": String, "status": String, "location": String, "events": List<TrackingEvent>} |
| GET | `/api/shipping/estimate` | Get delivery estimate | {"toAddress": String, "serviceType": String} | DeliveryEstimate {"estimatedDays": Integer, "estimatedDelivery": LocalDate} |

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

### Cart Table

```sql
CREATE TABLE cart (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_status ON cart(status);
```

### Cart Items Table

```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE UNIQUE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
```

### 5.1 User Authentication Tables

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### 5.2 Order Management Tables

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    grand_total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 5.3 Payment Processing Tables

```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    gateway_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### 5.4 Shipping Integration Tables

```sql
CREATE TABLE shipments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    carrier VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
```

### 5.5 Customer Notification Tables

```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
```

### 5.6 Inventory Management Tables

```sql
CREATE TABLE inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL UNIQUE,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

### 5.7 Tax Calculation Tables

```sql
CREATE TABLE tax_rates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    state VARCHAR(50) NOT NULL UNIQUE,
    rate DECIMAL(5,4) NOT NULL,
    effective_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tax_rates_state ON tax_rates(state);
```

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3
- **Authentication:** JWT (JSON Web Tokens)
- **Password Encryption:** BCrypt
- **Email Service:** JavaMailSender / SMTP
- **SMS Service:** Twilio API
- **Payment Gateways:** Stripe API, PayPal API
- **Shipping Carriers:** FedEx API, UPS API, USPS API

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses
5. **Exception Handling:** Custom exceptions for business logic errors
6. **Adapter Pattern:** Payment gateway and shipping carrier adapters for third-party integrations
7. **Strategy Pattern:** Multiple payment methods and shipping carriers
8. **Observer Pattern:** Notification system for order and shipment events
9. **Factory Pattern:** Creating different types of notifications (email, SMS)

## 8. Key Features

- RESTful API design following HTTP standards
- Proper HTTP status codes for different scenarios
- Input validation and error handling
- Database indexing for performance optimization
- Transactional operations for data consistency
- Pagination support for large datasets (can be extended)
- Search functionality with case-insensitive matching
- Shopping cart management with add, view, update quantity, and remove operations
- Automatic subtotal and total recalculation when cart item quantities are updated
- Empty cart detection with user-friendly message 'Your cart is empty' and link to continue shopping
- User authentication and authorization with JWT tokens
- Secure password storage using BCrypt hashing
- Order management with complete workflow from cart to delivery
- Multiple payment gateway integration (Stripe, PayPal)
- PCI compliance for payment processing
- Shipping carrier integration (FedEx, UPS, USPS)
- Real-time shipment tracking
- Automated customer notifications via email and SMS
- Tax calculation based on shipping address
- Shipping cost calculation based on weight and destination
- Detailed cost breakdown (subtotal, tax, shipping, grand total)
- Real-time inventory validation and stock management
- Inventory reservation during order processing

## 9. Security Considerations

- **Authentication:** JWT-based authentication with token expiration
- **Password Security:** BCrypt hashing with salt for password storage
- **Authorization:** Role-based access control for API endpoints
- **PCI Compliance:** Secure payment processing without storing sensitive card data
- **Data Encryption:** HTTPS/TLS for all API communications
- **Input Validation:** Server-side validation for all user inputs
- **SQL Injection Prevention:** Parameterized queries via JPA
- **Session Management:** Secure session handling with token expiration
- **Rate Limiting:** API rate limiting to prevent abuse
- **CORS Configuration:** Proper CORS settings for frontend integration

## 10. Error Handling

### Custom Exceptions

- **ProductNotFoundException:** Thrown when product is not found
- **CartItemNotFoundException:** Thrown when cart item is not found
- **OutOfStockException:** Thrown when product is out of stock
- **UserNotFoundException:** Thrown when user is not found
- **EmailAlreadyExistsException:** Thrown when email is already registered
- **InvalidCredentialsException:** Thrown when login credentials are invalid
- **EmptyCartException:** Thrown when attempting to create order from empty cart
- **InvalidOrderException:** Thrown when order is in invalid state
- **PaymentFailedException:** Thrown when payment processing fails
- **ShipmentCreationException:** Thrown when shipment creation fails
- **ShipmentNotFoundException:** Thrown when tracking number is not found

### HTTP Status Codes

- **200 OK:** Successful GET, PUT requests
- **201 Created:** Successful POST requests (resource creation)
- **204 No Content:** Successful DELETE requests
- **400 Bad Request:** Invalid input, business logic errors
- **401 Unauthorized:** Authentication required or failed
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource already exists (e.g., duplicate email)
- **500 Internal Server Error:** Unexpected server errors

## 11. Performance Optimization

- **Database Indexing:** Indexes on frequently queried columns
- **Connection Pooling:** Database connection pooling for better performance
- **Caching:** Redis/Memcached for frequently accessed data (can be extended)
- **Lazy Loading:** JPA lazy loading for related entities
- **Pagination:** Limit result sets for large data queries
- **Asynchronous Processing:** Async notification sending to avoid blocking
- **Query Optimization:** Efficient JPA queries with proper joins
- **CDN Integration:** Static content delivery via CDN (can be extended)

## 12. Testing Strategy

- **Unit Tests:** JUnit 5 for service layer testing
- **Integration Tests:** Spring Boot Test for API endpoint testing
- **Repository Tests:** @DataJpaTest for repository layer testing
- **Mock Testing:** Mockito for mocking dependencies
- **Test Coverage:** Minimum 80% code coverage target
- **API Testing:** Postman/REST Assured for API testing
- **Load Testing:** JMeter for performance testing (can be extended)

## 13. Deployment Considerations

- **Containerization:** Docker containers for application deployment
- **Orchestration:** Kubernetes for container orchestration (can be extended)
- **CI/CD:** Jenkins/GitLab CI for automated deployment
- **Environment Configuration:** Spring Profiles for different environments
- **Logging:** SLF4J with Logback for application logging
- **Monitoring:** Prometheus + Grafana for application monitoring (can be extended)
- **Health Checks:** Spring Actuator for health monitoring
- **Database Migration:** Flyway/Liquibase for database versioning

## 14. Future Enhancements

- **Wishlist Feature:** Allow users to save products for later
- **Product Reviews:** Customer reviews and ratings
- **Recommendation Engine:** AI-based product recommendations
- **Multi-currency Support:** Support for multiple currencies
- **Multi-language Support:** Internationalization (i18n)
- **Advanced Search:** Elasticsearch integration for advanced search
- **Analytics Dashboard:** Business intelligence and reporting
- **Mobile App:** Native mobile applications (iOS/Android)
- **Social Media Integration:** Social login and sharing
- **Loyalty Program:** Customer rewards and loyalty points