## 8. Business Logic

### 8.1 Automatic Cart Recalculation

**Trigger Events:**
- Item quantity change
- Item addition to cart
- Item removal from cart
- Price updates from product catalog
- Discount/promotion application

**Recalculation Process:**

1. **Item-Level Calculation:**
   - Fetch current product price
   - Calculate subtotal: `quantity × unit_price`
   - Apply item-level discounts if applicable

2. **Cart-Level Calculation:**
   - Sum all item subtotals
   - Apply cart-level discounts/promotions
   - Calculate tax based on shipping address
   - Add shipping costs
   - Calculate final total

3. **Validation:**
   - Verify all items still available
   - Check quantity against current stock
   - Validate price changes
   - Confirm discount eligibility

4. **Update Operations:**
   - Update cart_items table with new prices
   - Update shopping_carts table with new total
   - Update cache with latest cart state
   - Trigger UI refresh

**Implementation:**
```javascript
async function recalculateCart(cartId) {
    const cartItems = await getCartItems(cartId);
    let cartTotal = 0;
    
    for (const item of cartItems) {
        const currentPrice = await getProductPrice(item.product_id);
        const subtotal = item.quantity * currentPrice;
        
        await updateCartItem(item.cart_item_id, {
            price_at_addition: currentPrice,
            subtotal: subtotal
        });
        
        cartTotal += subtotal;
    }
    
    const discounts = await applyDiscounts(cartId, cartTotal);
    const tax = await calculateTax(cartId, cartTotal - discounts);
    const shipping = await calculateShipping(cartId);
    
    const finalTotal = cartTotal - discounts + tax + shipping;
    
    await updateCart(cartId, {
        subtotal: cartTotal,
        discounts: discounts,
        tax: tax,
        shipping: shipping,
        total_amount: finalTotal,
        updated_at: new Date()
    });
    
    await invalidateCartCache(cartId);
    
    return {
        cartTotal: finalTotal,
        breakdown: { subtotal: cartTotal, discounts, tax, shipping }
    };
}
```

### 8.2 Stock Reservation Logic

**Purpose:** Ensure inventory is reserved during checkout to prevent overselling

**Process:**
1. When user initiates checkout, reserve stock for all cart items
2. Reservation expires after 15 minutes if order not completed
3. Upon successful payment, convert reservation to committed stock reduction
4. If payment fails or user abandons, release reserved stock

### 8.3 Price Consistency Logic

**Purpose:** Maintain price integrity between cart addition and checkout

**Rules:**
- Price is captured at time of adding to cart (`price_at_addition`)
- If product price changes, user is notified before checkout
- User must acknowledge price changes to proceed
- Cart recalculation updates prices but preserves original for comparison

## 9. Integration Requirements

### 9.1 Product Catalog Integration

**Integration Point:** Cart Service ↔ Product Service

**Purpose:** Ensure cart items reference valid, up-to-date product information

**Requirements:**

1. **Product Validation:**
   - Verify product exists and is active before adding to cart
   - Check product availability status
   - Validate product pricing

2. **Real-time Sync:**
   - Subscribe to product update events
   - Handle product discontinuation (notify users with item in cart)
   - Update cart when product prices change

3. **API Contracts:**
   ```
   GET /api/products/{productId}/validate
   Response: { isValid, isActive, currentPrice, stockStatus }
   ```

4. **Event Subscriptions:**
   - `product.updated` - Update cart item details
   - `product.discontinued` - Remove from carts and notify users
   - `product.price_changed` - Flag for user notification

### 9.2 Inventory System Integration

**Integration Point:** Cart Service ↔ Inventory Service

**Purpose:** Ensure stock availability and prevent overselling

**Requirements:**

1. **Stock Validation:**
   - Check real-time availability before adding to cart
   - Validate quantity against available stock
   - Reserve stock during checkout process

2. **Reservation Management:**
   - Create temporary stock reservations (15-minute TTL)
   - Release reservations on cart abandonment
   - Convert reservations to committed on order completion

3. **API Contracts:**
   ```
   POST /api/inventory/check-availability
   Request: { productId, quantity }
   Response: { available, quantityAvailable, canFulfill }
   
   POST /api/inventory/reserve
   Request: { productId, quantity, cartId, expiresIn }
   Response: { reservationId, expiresAt }
   
   DELETE /api/inventory/reservation/{reservationId}
   ```

4. **Event Subscriptions:**
   - `inventory.low_stock` - Notify users with item in cart
   - `inventory.out_of_stock` - Prevent adding to cart, notify existing cart holders

### 9.3 Checkout Module Integration

**Integration Point:** Cart Service ↔ Order Service

**Purpose:** Seamless transition from cart to order

**Requirements:**

1. **Cart to Order Conversion:**
   - Transfer all cart items to order items
   - Preserve pricing at time of checkout
   - Include cart-level discounts and promotions

2. **Data Mapping:**
   ```
   Cart Item → Order Item
   - cart_item_id → order_item_id (new)
   - product_id → product_id
   - quantity → quantity
   - price_at_addition → unit_price
   - subtotal → subtotal
   ```

3. **API Contracts:**
   ```
   POST /api/orders/from-cart
   Request: { cartId, shippingAddress, paymentMethod }
   Response: { orderId, orderNumber, status }
   ```

4. **Post-Checkout Actions:**
   - Clear cart after successful order creation
   - Maintain cart history for analytics
   - Trigger order confirmation notifications

### 9.4 Integration Error Handling

**Scenarios:**

1. **Product Service Unavailable:**
   - Use cached product data (with staleness indicator)
   - Allow cart operations with warning
   - Queue validation for when service recovers

2. **Inventory Service Unavailable:**
   - Prevent new cart additions
   - Allow viewing existing cart
   - Display service unavailability message

3. **Checkout Service Unavailable:**
   - Prevent checkout initiation
   - Preserve cart state
   - Notify user to retry later

## 10. Validation Rules

### 10.1 Cart Item Validation

**Add to Cart Validation:**

1. **Product Validation:**
   - Product must exist in catalog
   - Product must be active (`is_active = true`)
   - Product must have valid price (> 0)
   - Product must not be discontinued

2. **Quantity Validation:**
   - Quantity must be positive integer (> 0)
   - Quantity must not exceed maximum per order (e.g., 99)
   - Quantity must not exceed available stock
   - Quantity must meet minimum order quantity if specified

3. **User Validation:**
   - User must be authenticated
   - User account must be active
   - User must not be blocked/suspended

4. **Business Rules:**
   - Check for duplicate items (merge quantities if exists)
   - Validate against cart size limits (e.g., max 50 unique items)
   - Check for restricted products based on user location
   - Validate age-restricted products against user profile

**Update Cart Item Validation:**

1. **Item Existence:**
   - Cart item must exist
   - Cart item must belong to requesting user
   - Cart must be active

2. **Quantity Update:**
   - New quantity must be positive integer
   - New quantity must not exceed available stock
   - If quantity = 0, treat as removal

3. **Price Validation:**
   - Recalculate with current product price
   - Flag if price has changed since addition
   - Require user acknowledgment for significant price changes (>10%)

**Remove from Cart Validation:**

1. **Authorization:**
   - User must own the cart item
   - Cart must be active

2. **State Validation:**
   - Cart item must not be in checkout process
   - No pending reservations on the item

### 10.2 Cart-Level Validation

**Cart State Validation:**

1. **Cart Integrity:**
   - All items must reference valid products
   - All quantities must be within stock limits
   - Total amount must match sum of item subtotals
   - Cart must not be expired (inactive carts older than 30 days)

2. **Checkout Readiness:**
   - Cart must not be empty
   - All items must be in stock
   - All prices must be current
   - No items from restricted categories
   - Total must meet minimum order value

3. **Concurrent Modification:**
   - Use optimistic locking (version field)
   - Detect and handle concurrent updates
   - Refresh cart state before critical operations

### 10.3 Input Sanitization

**Security Validation:**

1. **SQL Injection Prevention:**
   - Use parameterized queries
   - Validate all numeric inputs
   - Sanitize string inputs

2. **XSS Prevention:**
   - Escape HTML in product names/descriptions
   - Validate URLs (image_url)
   - Sanitize user-generated content

3. **Data Type Validation:**
   - Enforce strict type checking
   - Validate JSON structure
   - Check field lengths and formats

**Example Validation Schema:**
```javascript
const addToCartSchema = {
  product_id: {
    type: 'integer',
    minimum: 1,
    required: true
  },
  quantity: {
    type: 'integer',
    minimum: 1,
    maximum: 99,
    required: true
  }
};

const updateCartItemSchema = {
  quantity: {
    type: 'integer',
    minimum: 1,
    maximum: 99,
    required: true
  }
};
```
