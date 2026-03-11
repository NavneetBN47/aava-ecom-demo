## 4. Database Schema

### 4.1 Products Table (Enhanced)
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    minimum_procurement_threshold INTEGER NOT NULL DEFAULT 1,
    weight DECIMAL(10, 2),
    dimensions VARCHAR(100),
    tax_category VARCHAR(50),
    is_subscription_eligible BOOLEAN DEFAULT false,
    image_urls TEXT[],
    sku VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT false,
    CONSTRAINT chk_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_available_stock CHECK (available_stock >= 0),
    CONSTRAINT chk_reserved_stock CHECK (reserved_stock >= 0)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_deleted ON products(deleted);
CREATE INDEX idx_products_name ON products(name);
```

### 4.2 Shopping Carts Table
```sql
CREATE TABLE shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_carts_user_id ON shopping_carts(user_id);
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
    is_subscription BOOLEAN DEFAULT false,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

### 4.4 Orders Table
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    grand_total DECIMAL(10, 2) NOT NULL,
    shipping_address_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_shipping_address FOREIGN KEY (shipping_address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
```

### 4.5 Order Items Table
```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    is_subscription BOOLEAN DEFAULT false,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 4.6 Payments Table
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    encrypted_payment_data TEXT,
    processed_at TIMESTAMP,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
```

### 4.7 Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 4.8 Addresses Table
```sql
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

### 4.9 Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    next_delivery_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

## 5. Business Logic

### 5.1 Inventory Validation Logic

**Purpose:** Ensure real-time inventory availability before adding items to cart or creating orders.

**Implementation:**
```java
public boolean validateInventoryAvailability(Long productId, Integer requestedQuantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    Integer availableStock = product.getStockQuantity() - product.getReservedStock();
    
    if (availableStock < requestedQuantity) {
        throw new InsufficientInventoryException(
            String.format("Insufficient inventory. Available: %d, Requested: %d", 
                availableStock, requestedQuantity)
        );
    }
    
    return true;
}

public void reserveInventory(Long productId, Integer quantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    product.setReservedStock(product.getReservedStock() + quantity);
    product.setAvailableStock(product.getStockQuantity() - product.getReservedStock());
    product.setUpdatedAt(LocalDateTime.now());
    
    productRepository.save(product);
}

public void releaseInventory(Long productId, Integer quantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    product.setReservedStock(Math.max(0, product.getReservedStock() - quantity));
    product.setAvailableStock(product.getStockQuantity() - product.getReservedStock());
    product.setUpdatedAt(LocalDateTime.now());
    
    productRepository.save(product);
}
```

### 5.2 Minimum Procurement Threshold Logic

**Purpose:** Automatically adjust cart quantity to meet minimum procurement requirements.

**Implementation:**
```java
public Integer applyMinimumProcurementThreshold(Long productId, Integer requestedQuantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    Integer minimumThreshold = product.getMinimumProcurementThreshold();
    
    if (requestedQuantity < minimumThreshold) {
        logger.info("Adjusting quantity from {} to minimum threshold {}", 
            requestedQuantity, minimumThreshold);
        return minimumThreshold;
    }
    
    return requestedQuantity;
}
```

### 5.3 Tax Calculation Logic

**Purpose:** Calculate applicable taxes based on product category and shipping location.

**Implementation:**
```java
public BigDecimal calculateTax(BigDecimal subtotal, String taxCategory, String state) {
    BigDecimal taxRate = getTaxRate(taxCategory, state);
    BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
    
    logger.info("Calculated tax: {} for subtotal: {} with rate: {}", tax, subtotal, taxRate);
    return tax;
}

public BigDecimal getTaxRate(String taxCategory, String state) {
    // Fetch tax rate from database or configuration
    TaxRate taxRate = taxRateRepository.findByCategoryAndState(taxCategory, state)
        .orElse(new TaxRate("DEFAULT", state, new BigDecimal("0.08")));
    
    return taxRate.getRate();
}
```

### 5.4 Shipping Cost Calculation Logic

**Purpose:** Calculate shipping costs based on weight, dimensions, and destination.

**Implementation:**
```java
public BigDecimal calculateShipping(BigDecimal totalWeight, String dimensions, String destinationZip) {
    String zone = determineShippingZone(destinationZip);
    BigDecimal baseRate = getShippingRate(zone, totalWeight);
    
    // Apply dimensional weight pricing if applicable
    BigDecimal dimensionalWeight = calculateDimensionalWeight(dimensions);
    BigDecimal chargeableWeight = totalWeight.max(dimensionalWeight);
    
    BigDecimal shippingCost = baseRate.multiply(chargeableWeight)
        .setScale(2, RoundingMode.HALF_UP);
    
    logger.info("Calculated shipping cost: {} for zone: {} and weight: {}", 
        shippingCost, zone, chargeableWeight);
    
    return shippingCost;
}

private BigDecimal calculateDimensionalWeight(String dimensions) {
    // Parse dimensions (e.g., "15x10x8") and calculate dimensional weight
    // Formula: (Length x Width x Height) / 166 (for inches)
    String[] dims = dimensions.split("x");
    if (dims.length != 3) return BigDecimal.ZERO;
    
    BigDecimal length = new BigDecimal(dims[0].trim());
    BigDecimal width = new BigDecimal(dims[1].trim());
    BigDecimal height = new BigDecimal(dims[2].trim());
    
    return length.multiply(width).multiply(height)
        .divide(new BigDecimal("166"), 2, RoundingMode.HALF_UP);
}
```

### 5.5 Real-time Cart Total Recalculation

**Purpose:** Automatically recalculate cart totals whenever items are added, updated, or removed.

**Implementation:**
```java
public CartResponse recalculateCartTotals(Long cartId) {
    List<CartItem> items = cartItemRepository.findByCartId(cartId);
    
    if (items.isEmpty()) {
        return handleEmptyCart(cartId);
    }
    
    // Calculate subtotal
    BigDecimal subtotal = items.stream()
        .map(CartItem::getSubtotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Get shipping address for tax and shipping calculation
    ShoppingCart cart = cartRepository.findById(cartId)
        .orElseThrow(() -> new CartNotFoundException("Cart not found"));
    
    User user = userRepository.findById(cart.getUserId())
        .orElseThrow(() -> new UserNotFoundException("User not found"));
    
    Address defaultAddress = addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
        .orElse(null);
    
    // Calculate tax
    String taxCategory = determineTaxCategory(items);
    String state = defaultAddress != null ? defaultAddress.getState() : "DEFAULT";
    BigDecimal tax = taxCalculationService.calculateTax(subtotal, taxCategory, state);
    
    // Calculate shipping
    BigDecimal totalWeight = calculateTotalWeight(items);
    String dimensions = calculateTotalDimensions(items);
    String zipCode = defaultAddress != null ? defaultAddress.getZipCode() : "00000";
    BigDecimal shipping = shippingCalculationService.calculateShipping(totalWeight, dimensions, zipCode);
    
    // Calculate grand total
    BigDecimal grandTotal = subtotal.add(tax).add(shipping);
    
    // Build response
    List<CartItemResponse> itemResponses = items.stream()
        .map(this::buildCartItemResponse)
        .collect(Collectors.toList());
    
    CartResponse response = new CartResponse();
    response.setItems(itemResponses);
    response.setSubtotal(subtotal);
    response.setTax(tax);
    response.setShipping(shipping);
    response.setGrandTotal(grandTotal);
    response.setIsEmpty(false);
    
    return response;
}
```

### 5.6 Empty Cart Handling

**Purpose:** Properly handle and represent empty cart state.

**Implementation:**
```java
public CartResponse handleEmptyCart(Long userId) {
    CartResponse response = new CartResponse();
    response.setItems(new ArrayList<>());
    response.setSubtotal(BigDecimal.ZERO);
    response.setTax(BigDecimal.ZERO);
    response.setShipping(BigDecimal.ZERO);
    response.setGrandTotal(BigDecimal.ZERO);
    response.setIsEmpty(true);
    
    logger.info("Returning empty cart response for user: {}", userId);
    return response;
}
```

### 5.7 Subscription vs One-time Purchase Handling

**Purpose:** Differentiate between subscription and one-time purchases throughout the order flow.

**Implementation:**
```java
public void processSubscriptionItem(CartItem item, Order order) {
    if (item.getIsSubscription()) {
        // Create subscription record
        Subscription subscription = new Subscription();
        subscription.setUserId(order.getUserId());
        subscription.setProductId(item.getProductId());
        subscription.setQuantity(item.getQuantity());
        subscription.setFrequency(SubscriptionFrequency.MONTHLY); // Default or from request
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setNextDeliveryDate(calculateNextDeliveryDate(SubscriptionFrequency.MONTHLY));
        subscription.setCreatedAt(LocalDateTime.now());
        
        subscriptionRepository.save(subscription);
        
        logger.info("Created subscription for product: {} with frequency: {}", 
            item.getProductId(), SubscriptionFrequency.MONTHLY);
    }
}

private LocalDateTime calculateNextDeliveryDate(SubscriptionFrequency frequency) {
    LocalDateTime now = LocalDateTime.now();
    switch (frequency) {
        case WEEKLY:
            return now.plusWeeks(1);
        case BIWEEKLY:
            return now.plusWeeks(2);
        case MONTHLY:
            return now.plusMonths(1);
        case QUARTERLY:
            return now.plusMonths(3);
        default:
            return now.plusMonths(1);
    }
}
```

### 5.8 Payment Processing Security

**Purpose:** Securely process payments with encryption and validation.

**Implementation:**
```java
public PaymentResponse processPayment(Long orderId, PaymentRequest request) {
    // Validate payment details
    if (!validatePaymentDetails(request)) {
        throw new InvalidPaymentException("Invalid payment details");
    }
    
    // Encrypt sensitive payment data
    String encryptedData = encryptPaymentData(request);
    
    // Process payment through gateway
    PaymentResult result = paymentGatewayAdapter.initiatePayment(
        encryptedData, 
        request.getAmount()
    );
    
    // Save payment record
    Payment payment = new Payment();
    payment.setOrderId(orderId);
    payment.setPaymentMethod(request.getPaymentMethod());
    payment.setAmount(request.getAmount());
    payment.setStatus(result.isSuccess() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
    payment.setTransactionId(result.getTransactionId());
    payment.setEncryptedPaymentData(encryptedData);
    payment.setProcessedAt(LocalDateTime.now());
    
    paymentRepository.save(payment);
    
    // Build response
    PaymentResponse response = new PaymentResponse();
    response.setPaymentId(payment.getId());
    response.setStatus(payment.getStatus());
    response.setTransactionId(payment.getTransactionId());
    response.setAmount(payment.getAmount());
    response.setProcessedAt(payment.getProcessedAt());
    
    return response;
}

private String encryptPaymentData(PaymentRequest request) {
    // Use AES encryption or similar
    try {
        // Implementation of encryption logic
        return encryptionService.encrypt(request.toString());
    } catch (Exception e) {
        throw new PaymentProcessingException("Failed to encrypt payment data", e);
    }
}
```
