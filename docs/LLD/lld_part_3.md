## 9. Shopping Cart Module - Business Logic

### 9.1 Minimum Procurement Threshold Logic

When adding a product to the cart:
- Check if the product has a `minimumProcurementThreshold` value
- If threshold exists and requested quantity is below threshold, automatically set quantity to threshold value
- This ensures compliance with minimum order requirements

### 9.2 Purchase Type Handling

The system supports two purchase types:
- **Subscription:** Recurring purchases with specific quantity increments
- **One-time:** Single purchase transactions

Quantity management varies based on purchase type:
- Subscription purchases may have different increment rules
- One-time purchases follow standard quantity management

### 9.3 Inventory Validation

Real-time inventory validation occurs when:
- Adding items to cart
- Updating cart item quantities

Validation process:
1. Retrieve current product stock quantity
2. Compare requested quantity against available stock
3. If quantity exceeds stock, return validation error: "Quantity exceeds available stock"
4. Prevent cart operations that would result in overselling

### 9.4 Cart Calculation Logic

**Line Item Subtotal Calculation:**
```
subtotal = unitPrice × quantity
```

**Cart Total Calculation:**
```
cartTotal = Σ(subtotal of all cart items)
```

Calculations update instantly when:
- Items are added to cart
- Item quantities are modified
- Items are removed from cart

### 9.5 Empty Cart State Handling

When cart is empty:
- Display message: "Your cart is empty"
- Provide button/link to return to product catalog
- Cart total shows $0.00
- No cart items displayed

### 9.6 Cart State Persistence

- Cart data persists in database across sessions
- Each customer has one active shopping cart
- Cart items maintain relationship with cart via `cart_id`
- Cart updates trigger `updated_at` timestamp modification

### 9.7 Quantity Management Controls

UI provides increment/decrement controls:
- **Increment (+):** Increases quantity by 1 (subject to inventory validation)
- **Decrement (-):** Decreases quantity by 1 (minimum quantity = 1)
- **Direct Input:** Allow manual quantity entry with validation
- Real-time subtotal and total updates on quantity change

## 10. Exception Handling

### Product Module Exceptions
- `ProductNotFoundException`: Thrown when product ID not found
- `InvalidProductDataException`: Thrown for validation failures

### Shopping Cart Module Exceptions
- `CartNotFoundException`: Thrown when cart not found for customer
- `CartItemNotFoundException`: Thrown when cart item ID not found
- `InsufficientInventoryException`: Thrown when requested quantity exceeds available stock
- `InvalidQuantityException`: Thrown for invalid quantity values (e.g., negative, zero)
- `MinimumThresholdException`: Thrown when quantity below minimum procurement threshold

## 11. Validation Rules

### Product Validation
- Name: Required, max 255 characters
- Price: Required, must be positive, max 2 decimal places
- Category: Required, max 100 characters
- Stock Quantity: Required, must be non-negative integer
- Minimum Procurement Threshold: Optional, must be positive integer if provided

### Cart Item Validation
- Product ID: Required, must exist in products table
- Quantity: Required, must be positive integer, cannot exceed available stock
- Purchase Type: Required, must be either "subscription" or "one-time"
- Customer ID: Required, must be valid customer identifier

## 12. Performance Considerations

- Database indexes on frequently queried fields (customer_id, cart_id, product_id)
- Cascade delete on cart items when cart is deleted
- Optimistic locking for concurrent cart updates
- Caching strategy for frequently accessed product data
- Batch operations for cart total recalculations

## 13. Security Considerations

- Customer can only access their own cart
- Validate customer ownership before cart operations
- Sanitize all user inputs to prevent SQL injection
- Implement rate limiting on cart operations
- Audit logging for cart modifications