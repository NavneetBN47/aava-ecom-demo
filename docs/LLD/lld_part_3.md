## 10. Validation Rules

### 10.1 Product Validation

- Product name: Required, max 255 characters
- Price: Required, must be positive, max 2 decimal places
- Category: Required, max 100 characters
- Stock quantity: Required, must be non-negative integer
- Minimum procurement threshold: Optional, must be positive integer if provided

### 10.2 Cart Validation

- Customer ID: Required for all cart operations
- Product ID: Must exist in products table
- Quantity: Must be positive integer
- Quantity must not exceed available stock
- Subscription type: Must be either 'one-time' or 'subscription'

## 11. Service Layer Details

### 11.1 CartService Methods

**addToCart(Long customerId, Long productId, String subscriptionType)**
- Validates product exists
- Retrieves or creates customer cart
- Determines initial quantity based on minimum procurement threshold
- Creates cart item with calculated subtotal
- Returns created cart item

**getCart(Long customerId)**
- Retrieves customer's active cart
- Fetches all cart items with product details
- Calculates total cart value
- Returns shopping cart with items or empty cart message

**updateCartItemQuantity(Long cartItemId, Integer quantity)**
- Validates cart item exists
- Validates inventory availability
- Updates quantity and recalculates subtotal
- Recalculates cart total
- Returns updated cart item

**removeCartItem(Long cartItemId)**
- Validates cart item exists
- Deletes cart item
- Recalculates cart total
- Returns void

**calculateCartTotal(Long cartId)**
- Retrieves all cart items for given cart
- Sums all subtotals
- Returns total as BigDecimal

**validateInventory(Long productId, Integer quantity)**
- Retrieves product stock quantity
- Compares requested quantity with available stock
- Returns true if sufficient inventory, false otherwise

## 12. Controller Layer Details

### 12.1 CartController Endpoints

**POST /api/cart/items**
- Request Body: {customerId, productId, subscriptionType}
- Calls CartService.addToCart()
- Returns 201 Created with CartItem
- Returns 400 Bad Request if validation fails
- Returns 404 Not Found if product doesn't exist

**GET /api/cart**
- Query Parameter: customerId
- Calls CartService.getCart()
- Returns 200 OK with ShoppingCart and items
- Returns 200 OK with empty cart message if no items

**PUT /api/cart/items/{cartItemId}**
- Path Variable: cartItemId
- Request Body: {quantity}
- Calls CartService.updateCartItemQuantity()
- Returns 200 OK with updated CartItem
- Returns 400 Bad Request if inventory exceeded
- Returns 404 Not Found if cart item doesn't exist

**DELETE /api/cart/items/{cartItemId}**
- Path Variable: cartItemId
- Calls CartService.removeCartItem()
- Returns 204 No Content on success
- Returns 404 Not Found if cart item doesn't exist

## 13. Repository Layer Details

### 13.1 CartRepository

```java
public interface CartRepository extends JpaRepository<ShoppingCart, Long> {
    Optional<ShoppingCart> findByCustomerId(Long customerId);
}
```

### 13.2 CartItemRepository

```java
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartId(Long cartId);
}
```