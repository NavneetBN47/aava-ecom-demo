## 9. Shopping Cart Business Logic

### 9.1 Minimum Procurement Threshold Logic

When adding products to cart, the system automatically applies minimum procurement threshold rules:

- **Subscription Products:** Quantity is set to the product's minimum procurement threshold automatically
- **One-Time Purchase:** User can specify quantity, but must meet minimum threshold
- The threshold value is retrieved from product configuration
- Validation occurs before cart item creation

### 9.2 Inventory Validation Logic

Real-time inventory validation prevents overselling:

- Before adding items: Check if `requested_quantity <= product.stock_quantity`
- Before updating quantities: Validate new quantity against current stock
- On validation failure: Return error message "Requested quantity exceeds available stock"
- Inventory checks are performed at service layer before any database operations

### 9.3 Empty Cart Handling Logic

The system gracefully handles empty cart scenarios:

- When cart has no items: Display message "Your cart is empty"
- Provide navigation link back to product catalog
- Cart entity exists but items collection is empty
- Total amount is set to 0.00
- UI should show empty state with call-to-action to browse products

### 9.4 Total Calculation Logic

Cart totals are recalculated automatically on every cart modification:

```java
public void calculateTotals(Cart cart) {
    BigDecimal total = BigDecimal.ZERO;
    for (CartItem item : cart.getItems()) {
        item.setSubtotal(item.getUnitPrice().multiply(new BigDecimal(item.getQuantity())));
        total = total.add(item.getSubtotal());
    }
    cart.setTotalAmount(total);
    cart.setUpdatedAt(LocalDateTime.now());
}
```

Operations triggering recalculation:
- Add item to cart
- Update item quantity
- Remove item from cart

## 10. Service Layer Components

### 10.1 CartService

The CartService class manages all shopping cart operations:

**Methods:**
- `getCart(Long customerId)`: Retrieves cart with all items for a customer
- `addToCart(Long customerId, Long productId, Integer quantity, Boolean isSubscription)`: Adds product to cart with threshold logic
- `updateQuantity(Long itemId, Integer quantity)`: Updates cart item quantity with validation
- `removeFromCart(Long itemId)`: Removes item and recalculates totals
- `calculateTotals(Cart cart)`: Recalculates all subtotals and cart total
- `validateInventory(Long productId, Integer quantity)`: Checks stock availability

**Dependencies:**
- CartRepository
- CartItemRepository
- ProductRepository

**Annotations:**
- `@Service`
- `@Transactional`

## 11. Repository Layer Components

### 11.1 CartRepository

Interface for cart data persistence operations:

**Methods:**
- `findByCustomerId(Long customerId)`: Find cart by customer ID
- `save(Cart cart)`: Create or update cart
- `deleteById(Long id)`: Delete cart

**Extends:** `JpaRepository<Cart, Long>`

### 11.2 CartItemRepository

Interface for cart item data persistence operations:

**Methods:**
- `findById(Long id)`: Find cart item by ID
- `save(CartItem cartItem)`: Create or update cart item
- `deleteById(Long id)`: Delete cart item
- `findByCartIdAndProductId(Long cartId, Long productId)`: Find specific item in cart

**Extends:** `JpaRepository<CartItem, Long>`