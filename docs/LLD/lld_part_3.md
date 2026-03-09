## 4. API Endpoints Summary

### 4.1 Product Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | None |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?keyword={keyword}` | Search products by name | None | List<Product> |

### 4.2 Shopping Cart Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/cart/items` | Add product to cart | AddToCartRequest (customerId, productId, quantity, subscriptionType) | CartDetailsDTO |
| GET | `/api/cart?customerId={customerId}` | View cart details | None | CartDetailsDTO |
| PUT | `/api/cart/items/{cartItemId}` | Update cart item quantity | UpdateQuantityRequest (quantity) | CartDetailsDTO |
| DELETE | `/api/cart/items/{cartItemId}` | Remove item from cart | None | CartDetailsDTO |
| DELETE | `/api/cart?customerId={customerId}` | Clear entire cart | None | None |

### 4.3 Order Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/orders/checkout` | Create order from cart | CheckoutRequest (customerId, paymentMethod, shippingAddress) | OrderDTO |
| GET | `/api/orders/{orderId}` | Get order details | None | OrderDTO |
| GET | `/api/orders?customerId={customerId}` | Get customer orders | None | List<OrderDTO> |
| PUT | `/api/orders/{orderId}/status` | Update order status | UpdateStatusRequest (status) | OrderDTO |
| GET | `/api/orders/{orderId}/tracking` | Get shipping tracking info | None | TrackingDTO |

### 4.4 Payment Processing Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/payments/process` | Process payment | PaymentRequest (customerId, amount, paymentMethod, cardDetails) | PaymentResultDTO |
| GET | `/api/payments/{paymentId}` | Get payment details | None | PaymentDTO |
| POST | `/api/payments/{paymentId}/refund` | Process refund | RefundRequest (amount, reason) | RefundResultDTO |

### 4.5 Promotion Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/promotions/apply` | Apply promotion code | ApplyPromotionRequest (cartId, promoCode) | DiscountDTO |
| GET | `/api/promotions/active` | Get active promotions | None | List<PromotionDTO> |
| POST | `/api/promotions` | Create promotion | PromotionRequest | PromotionDTO |

### 4.6 Notification Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/notifications?customerId={customerId}` | Get customer notifications | None | List<NotificationDTO> |
| PUT | `/api/notifications/{notificationId}/read` | Mark notification as read | None | NotificationDTO |

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

### 5.4 Orders Table

```sql
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    cart_id BIGINT,
    order_status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    shipping_address TEXT NOT NULL,
    tracking_number VARCHAR(100),
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id)
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);
```

### 5.5 Promotions Table

```sql
CREATE TABLE promotions (
    promotion_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(active);
```

### 5.6 Notifications Table

```sql
CREATE TABLE notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## 6. Technology Stack

- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven/Gradle
- **API Documentation:** Swagger/OpenAPI 3
- **Real-time Updates:** AJAX / WebSocket (for cart updates without page refresh)
- **Payment Gateway:** Stripe/PayPal SDK
- **Notification Service:** Spring Mail / AWS SES
- **Caching:** Redis (for product catalog and session management)

## 7. Design Patterns Used

1. **MVC Pattern:** Separation of Controller, Service, and Repository layers
2. **Repository Pattern:** Data access abstraction through ProductRepository, CartRepository, and CartItemRepository
3. **Dependency Injection:** Spring's IoC container manages dependencies
4. **DTO Pattern:** Data Transfer Objects for API requests/responses (CartDetailsDTO, CartItemDTO)
5. **Exception Handling:** Custom exceptions for business logic errors (ProductNotFoundException, CartItemNotFoundException, InsufficientStockException)
6. **Strategy Pattern:** Payment processing with multiple payment method strategies
7. **Observer Pattern:** Notification system for order status updates
8. **Factory Pattern:** Order creation from cart data

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

### 10.3 Order-Related Errors
- **EmptyCartException:** Thrown when attempting to checkout with an empty cart (HTTP 400)
- **PaymentFailedException:** Thrown when payment processing fails (HTTP 400)
- **OrderNotFoundException:** Thrown when order is not found (HTTP 404)

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

### 11.3 Payment Gateway Integration
- Integration with Stripe/PayPal for payment processing
- Secure token-based payment flow
- PCI DSS compliance for handling payment information
- Support for multiple payment methods (credit card, debit card, digital wallets)
- Webhook integration for payment status updates

### 11.4 Shipping Provider Integration
- Integration with shipping providers (FedEx, UPS, USPS) for tracking
- Real-time tracking number generation
- Shipping cost calculation based on weight and destination
- Delivery status updates via webhooks

### 11.5 Notification Service Integration
- Email notifications for order confirmation, shipping updates, delivery
- SMS notifications for critical updates (optional)
- Push notifications for mobile app users
- Template-based notification system

## 12. Security Considerations

- **Authentication:** All cart operations require authenticated user session
- **Authorization:** Users can only access and modify their own carts (validated via customerId)
- **Input Validation:** All user inputs (quantities, product IDs) are validated server-side
- **SQL Injection Prevention:** Parameterized queries used throughout (JPA handles this automatically)
- **Pessimistic Locking:** Prevents race conditions during concurrent cart operations
- **Rate Limiting:** Consider implementing rate limiting on cart operations to prevent abuse
- **Payment Security:** PCI DSS compliance, tokenization of payment data, secure HTTPS communication
- **Data Encryption:** Sensitive data encrypted at rest and in transit
- **Session Management:** Secure session handling with timeout and invalidation
- **CSRF Protection:** Cross-Site Request Forgery protection enabled

## 13. Performance Optimization

- **Database Indexing:** Indexes on frequently queried columns (customer_id, cart_id, product_id, category, name)
- **Caching:** Consider implementing Redis cache for frequently accessed product data
- **Connection Pooling:** Database connection pooling configured for optimal performance
- **Lazy Loading:** JPA lazy loading for related entities to avoid unnecessary data fetching
- **Batch Operations:** Batch updates for multiple cart items when possible
- **CDN Integration:** Static assets served via CDN for faster load times
- **Query Optimization:** Optimized database queries with proper joins and projections
- **Asynchronous Processing:** Background jobs for notifications and non-critical operations

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

### 14.4 Test Scenarios for Order Processing
- Successful checkout with valid payment
- Checkout with insufficient inventory
- Checkout with payment failure
- Order status updates
- Shipping tracking updates

### 14.5 Test Scenarios for Promotions
- Apply valid promotion code
- Apply expired promotion code
- Apply invalid promotion code
- Multiple promotions on same cart

## 15. Future Enhancements

- **Cart Expiration:** Implement cart expiration logic to clear abandoned carts after a certain period
- **Save for Later:** Allow users to move items from cart to a "Save for Later" list
- **Cart Sharing:** Enable users to share their cart with others
- **Promotional Codes:** Support for discount codes and promotional offers
- **Bulk Operations:** Add multiple products to cart in a single operation
- **Cart Analytics:** Track cart abandonment rates and popular product combinations
- **Wishlist Integration:** Allow moving items between cart and wishlist
- **Guest Cart:** Support for anonymous users with cart persistence via session/cookies
- **Multi-currency Support:** Support for multiple currencies and automatic conversion
- **Subscription Management:** Advanced subscription features with recurring billing
- **Product Recommendations:** AI-based product recommendations in cart
- **Social Sharing:** Share cart or products on social media

## 16. Product Discovery

**Requirement Reference:** Epic SCRUM-344

### 16.1 Overview
Product discovery enables customers to browse, search, and filter products efficiently. The system provides multiple discovery mechanisms including category browsing, keyword search, filters, and recommendations.

### 16.2 Features
- **Category Navigation:** Browse products by predefined categories
- **Search Functionality:** Full-text search across product names and descriptions
- **Filters:** Filter by price range, availability, subscription eligibility
- **Sorting:** Sort by price, name, popularity, newest
- **Pagination:** Efficient pagination for large product catalogs
- **Product Details:** Detailed product view with images, specifications, reviews

### 16.3 Implementation
- Search indexing using PostgreSQL full-text search or Elasticsearch
- Caching of popular search queries and category listings
- Lazy loading of product images for performance
- RESTful APIs for all discovery operations

## 17. Payment Processing

**Requirement Reference:** Epic SCRUM-344

### 17.1 Overview
Flexible payment processing system supporting multiple payment methods with secure transaction handling and PCI DSS compliance.

### 17.2 Supported Payment Methods
- Credit Cards (Visa, MasterCard, American Express)
- Debit Cards
- Digital Wallets (PayPal, Apple Pay, Google Pay)
- Bank Transfers (ACH)
- Buy Now Pay Later (Affirm, Klarna)

### 17.3 Payment Flow
1. Customer selects payment method during checkout
2. Payment details collected securely (tokenized)
3. Payment processed through payment gateway
4. Transaction result returned (success/failure)
5. Order created on successful payment
6. Payment confirmation sent to customer

### 17.4 Security Features
- PCI DSS Level 1 compliance
- Payment tokenization (no storage of card details)
- 3D Secure authentication for card payments
- Fraud detection and prevention
- Encrypted communication (TLS 1.3)
- Payment audit logging

### 17.5 Refund Processing
- Full and partial refund support
- Automatic refund to original payment method
- Refund status tracking
- Refund notifications to customers

## 18. Inventory Management

**Requirement Reference:** Epic SCRUM-344

### 18.1 Overview
Real-time inventory management system ensuring accurate stock levels, preventing overselling, and supporting automated reordering.

### 18.2 Features
- **Real-time Stock Tracking:** Immediate updates on stock levels
- **Stock Reservation:** Temporary hold on inventory during checkout
- **Low Stock Alerts:** Notifications when stock falls below threshold
- **Automated Reordering:** Trigger purchase orders when stock is low
- **Multi-warehouse Support:** Track inventory across multiple locations
- **Stock Adjustments:** Manual adjustments for damaged/returned items

### 18.3 Stock Management Operations
- Reserve stock when item added to cart (with timeout)
- Release reserved stock on cart abandonment or timeout
- Deduct stock on successful order completion
- Restore stock on order cancellation or return
- Prevent negative stock levels

### 18.4 Implementation Details
- Pessimistic locking for stock updates
- Database triggers for stock level monitoring
- Background jobs for stock reservation cleanup
- Integration with warehouse management systems
- Real-time stock synchronization across channels
