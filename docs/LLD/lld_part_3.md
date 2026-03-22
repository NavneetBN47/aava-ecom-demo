## 10. Validation Rules

### 10.1 Cart Item Validation

**Quantity Validation:**
- Quantity must be a positive integer (quantity > 0)
- Quantity cannot exceed the product's `stock_quantity`
- Validation occurs on both add and update operations
- Violation results in HTTP 400 Bad Request with descriptive error message

**Price Validation:**
- Price must be positive (price > 0)
- Price is retrieved from the Product entity to ensure consistency
- Price is stored in CartItem for historical accuracy

**Product Validation:**
- Product must exist in the database
- Product must be active/available
- Validation occurs before adding to cart

### 10.2 Business Rule Validations

**Stock Management:**
- System validates available stock before adding/updating cart items
- Prevents overselling by enforcing `quantity <= stock_quantity`
- Returns appropriate error message when stock is insufficient

**Cart Integrity:**
- Each user can have only one active shopping cart
- Duplicate products in the same cart are prevented (unique constraint on cart_id + product_id)
- Cart items are automatically removed when parent cart is deleted (CASCADE)

**Data Consistency:**
- All cart operations are transactional
- Subtotal and total calculations are atomic
- Timestamps are automatically managed by the database