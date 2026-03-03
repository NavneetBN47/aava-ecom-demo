## 9. Shopping Cart Management Features

### 9.1 Cart Operations

- **Add to Cart:** Users can add products to their shopping cart with specified quantities
- **View Cart:** Display all items in the cart with product details (name, price, quantity, subtotal)
- **Update Quantity:** Modify the quantity of items in the cart with automatic total recalculation
- **Remove Items:** Delete individual items from the cart
- **Clear Cart:** Remove all items from the cart at once
- **Empty State Handling:** Display "Your cart is empty" message when no items are present

### 9.2 Cost Calculations

- **Subtotal Calculation:** Sum of all cart item subtotals (quantity × unit price)
- **Tax Calculation:** Configurable tax rate applied to subtotal
- **Shipping Calculation:** Dynamic shipping cost based on subtotal thresholds
- **Grand Total:** Final amount including subtotal, tax, and shipping
- **Automatic Recalculation:** All totals automatically update when quantities change

### 9.3 Validation & Error Handling

- **Stock Validation:** Verify product availability before adding to cart
- **Quantity Limits:** Enforce minimum (1) and maximum quantity constraints
- **Product Availability:** Check if product exists and is in stock
- **Cart Item Validation:** Validate cart item existence before updates/deletions
- **Error Responses:** Proper HTTP status codes and error messages for invalid operations

### 9.4 Data Transfer Objects (DTOs)

#### CartDTO
```java
public class CartDTO {
    private Long cartId;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal shipping;
    private BigDecimal grandTotal;
    private Boolean isEmpty;
    // getters and setters
}
```

#### CartItemDTO
```java
public class CartItemDTO {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    // getters and setters
}
```

#### AddToCartRequest
```java
public class AddToCartRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Long productId;
    @NotNull
    @Min(1)
    private Integer quantity;
    // getters and setters
}
```

#### UpdateCartItemRequest
```java
public class UpdateCartItemRequest {
    @NotNull
    @Min(1)
    private Integer quantity;
    // getters and setters
}
```

### 9.5 Business Logic Rules

1. **Cart Creation:** A cart is automatically created for a user when they add their first item
2. **Stock Reservation:** Stock is validated but not reserved until checkout
3. **Price Locking:** Unit price is captured at the time of adding to cart
4. **Automatic Cleanup:** Cart items are cascade deleted when cart is deleted
5. **Concurrent Updates:** Optimistic locking prevents concurrent modification issues
6. **Subtotal Calculation:** CartItem subtotal = quantity × unit_price
7. **Tax Rate:** Configurable tax rate (default 8%)
8. **Shipping Rules:**
   - Free shipping for orders over $100
   - $10 flat rate for orders under $100
9. **Total Recalculation Trigger:** Automatically triggered on quantity updates, item additions, and item removals

### 9.6 User Interface Integration Points

- **Add to Cart Button:** Integrated on product listing and detail pages
- **Cart Icon:** Header component showing cart item count
- **Cart Page:** Full cart display with item management controls
- **Quantity Controls:** Increment/decrement buttons with manual input option
- **Remove Button:** Individual item removal with confirmation
- **Clear Cart Button:** Bulk removal with confirmation dialog
- **Checkout Button:** Proceeds to checkout when cart has items
- **Empty State Message:** Displayed when cart has no items
- **Cost Breakdown Display:** Shows subtotal, tax, shipping, and grand total

### 9.7 Exception Handling

```java
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long productId) {
        super("Product not found with id: " + productId);
    }
}

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(Long productId, Integer requested, Integer available) {
        super(String.format("Insufficient stock for product %d. Requested: %d, Available: %d", 
            productId, requested, available));
    }
}

public class CartNotFoundException extends RuntimeException {
    public CartNotFoundException(Long userId) {
        super("Cart not found for user: " + userId);
    }
}

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long cartItemId) {
        super("Cart item not found with id: " + cartItemId);
    }
}
```

## 10. Integration Between Product and Cart Modules

### 10.1 Product-Cart Relationship

- Cart items reference products via foreign key relationship
- Product stock is validated before cart operations
- Product price changes do not affect existing cart items (price locking)
- Product deletion cascades to remove associated cart items

### 10.2 Stock Management Integration

- **checkStockAvailability():** Validates if requested quantity is available
- **reserveStock():** Reserves stock during checkout process
- **releaseStock():** Releases reserved stock if checkout fails or cart is cleared
- **validateProductAvailability():** Comprehensive validation including product existence and stock

### 10.3 Enhanced Product Service Methods

```java
public Boolean checkStockAvailability(Long productId, Integer quantity) {
    Product product = getProductById(productId);
    return product.getStockQuantity() >= quantity;
}

public void reserveStock(Long productId, Integer quantity) {
    Product product = getProductById(productId);
    if (product.getStockQuantity() < quantity) {
        throw new InsufficientStockException(productId, quantity, product.getStockQuantity());
    }
    product.setStockQuantity(product.getStockQuantity() - quantity);
    productRepository.save(product);
}

public void releaseStock(Long productId, Integer quantity) {
    Product product = getProductById(productId);
    product.setStockQuantity(product.getStockQuantity() + quantity);
    productRepository.save(product);
}

public Boolean validateProductAvailability(Long productId, Integer quantity) {
    try {
        Product product = getProductById(productId);
        return product.getStockQuantity() >= quantity && quantity > 0;
    } catch (ProductNotFoundException e) {
        return false;
    }
}
```