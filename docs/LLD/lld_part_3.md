## 11. Error Handling

### 11.1 Cart-Specific Error Scenarios

**Product Not Found When Adding to Cart:**
- Exception: ProductNotFoundException
- HTTP Status: 404 Not Found
- Message: "Product with ID {productId} not found"

**Cart Item Not Found When Updating:**
- Exception: CartItemNotFoundException
- HTTP Status: 404 Not Found
- Message: "Cart item with ID {itemId} not found"

**Cart Item Not Found When Removing:**
- Exception: CartItemNotFoundException
- HTTP Status: 404 Not Found
- Message: "Cart item with ID {itemId} not found"

**Invalid Quantity Value:**
- Exception: ValidationException
- HTTP Status: 400 Bad Request
- Message: "Quantity must be a positive integer (>= 1)"

**Insufficient Stock (Optional Enhancement):**
- Exception: InsufficientStockException
- HTTP Status: 400 Bad Request
- Message: "Requested quantity exceeds available stock"

### 11.2 Error Response Format

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Product with ID 123 not found",
  "path": "/api/cart/items"
}
```

## 12. Service Layer Implementation

### 12.1 CartService

**Class:** CartService

**Dependencies:**
- CartRepository
- CartItemRepository
- ProductRepository

**Methods:**

1. **addItemToCart(Long productId): CartItem**
   - Validates product exists
   - Gets or creates customer cart
   - Creates cart item with quantity = 1
   - Calculates subtotal = price × 1
   - Saves cart item
   - Returns created CartItem

2. **getCart(): CartResponse**
   - Retrieves all cart items for customer
   - If empty, returns empty cart message
   - Calculates total from all subtotals
   - Returns CartResponse with items and total

3. **updateItemQuantity(Long itemId, Integer quantity): CartItem**
   - Validates quantity > 0
   - Finds cart item by ID
   - Updates quantity
   - Recalculates subtotal = price × quantity
   - Saves updated cart item
   - Recalculates cart total
   - Returns updated CartItem

4. **removeItem(Long itemId): CartResponse**
   - Finds cart item by ID
   - Deletes cart item
   - Recalculates cart total
   - Returns updated CartResponse

5. **calculateTotal(): BigDecimal**
   - Sums all item subtotals in cart
   - Returns total amount

6. **isCartEmpty(): boolean**
   - Checks if cart has any items
   - Returns true if empty, false otherwise

## 13. Repository Layer Implementation

### 13.1 CartRepository

**Interface:** CartRepository extends JpaRepository<ShoppingCart, Long>

**Custom Methods:**
- `Optional<ShoppingCart> findByCustomerId(Long customerId)`
- `List<CartItem> findCartItemsByCartId(Long cartId)`

### 13.2 CartItemRepository

**Interface:** CartItemRepository extends JpaRepository<CartItem, Long>

**Custom Methods:**
- `List<CartItem> findByCartId(Long cartId)`
- `Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId)`
- `void deleteByCartIdAndId(Long cartId, Long id)`

## 14. Controller Layer Implementation

### 14.1 CartController

**Class:** CartController

**Annotation:** @RestController

**Base Path:** /api/cart

**Dependencies:**
- CartService

**Endpoints:**

1. **POST /api/cart/items**
   - Request Body: {productId: Long}
   - Response: CartItem (201 Created)
   - Calls: cartService.addItemToCart(productId)

2. **GET /api/cart**
   - Response: CartResponse (200 OK)
   - Calls: cartService.getCart()

3. **PUT /api/cart/items/{itemId}**
   - Path Variable: itemId
   - Request Body: {quantity: Integer}
   - Response: CartItem (200 OK)
   - Calls: cartService.updateItemQuantity(itemId, quantity)

4. **DELETE /api/cart/items/{itemId}**
   - Path Variable: itemId
   - Response: CartResponse (200 OK)
   - Calls: cartService.removeItem(itemId)