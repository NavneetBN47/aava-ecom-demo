## 9. Business Logic

### 9.1 Minimum Procurement Threshold Logic

When adding a product to the cart, the system automatically determines the initial quantity based on the following rules:

1. **If Minimum Procurement Threshold exists** for the product:
   - Set cart item quantity to the threshold value
   - Store the threshold value in the cart_item record for reference

2. **If no Minimum Procurement Threshold**:
   - Default quantity to 1

3. **Implementation in CartService.addItemToCart()**:
```java
Integer quantity;
if (product.getMinimumProcurementThreshold() != null) {
    quantity = product.getMinimumProcurementThreshold();
} else {
    quantity = 1;
}
```

### 9.2 Subscription vs One-Time Buy Quantity Logic

The system differentiates quantity handling based on purchase type:

1. **Subscription Purchase** (isSubscription = true):
   - Apply recurring quantity rules
   - May enforce minimum threshold more strictly
   - Quantity adjustments consider subscription frequency

2. **One-Time Purchase** (isSubscription = false):
   - Standard quantity rules apply
   - More flexible quantity adjustments allowed
   - No recurring considerations

3. **Implementation**:
```java
CartItem cartItem = new CartItem();
cartItem.setIsSubscription(isSubscription);
cartItem.setQuantity(determineQuantity(product, isSubscription));
```

### 9.3 Inventory Validation Logic

Before adding or updating cart items, the system validates product availability:

1. **Validation Rules**:
   - Requested quantity must not exceed product.stock_quantity
   - Check performed on both add and update operations
   - Real-time validation against current inventory

2. **Implementation in CartService.validateInventory()**:
```java
public boolean validateInventory(Long productId, Integer requestedQuantity) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException(productId));
    
    if (requestedQuantity > product.getStockQuantity()) {
        throw new InsufficientInventoryException(
            "Requested quantity " + requestedQuantity + 
            " exceeds available stock " + product.getStockQuantity()
        );
    }
    return true;
}
```

3. **Error Response**:
   - HTTP 400 Bad Request
   - Error message: "Insufficient inventory. Available: {stock_quantity}, Requested: {quantity}"

### 9.4 Real-Time Total Calculation

The system provides instant calculation of cart totals without page refresh:

1. **Line Item Subtotal Calculation**:
```java
public void calculateSubtotal(CartItem item) {
    BigDecimal subtotal = item.getUnitPrice()
        .multiply(BigDecimal.valueOf(item.getQuantity()));
    item.setSubtotal(subtotal);
}
```

2. **Cart Total Calculation**:
```java
public BigDecimal calculateCartTotal(Long cartId) {
    List<CartItem> items = cartItemRepository.findByCartId(cartId);
    return items.stream()
        .map(CartItem::getSubtotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

3. **Recalculation Triggers**:
   - When cart item quantity is updated
   - When cart item is added
   - When cart item is removed
   - Performed automatically in service layer

4. **Response Structure**:
```json
{
  "cartId": 123,
  "items": [
    {
      "itemId": 1,
      "productName": "Product A",
      "quantity": 2,
      "unitPrice": 10.00,
      "subtotal": 20.00
    }
  ],
  "total": 20.00
}
```

### 9.5 Empty Cart Handling

When retrieving a cart with no items:

1. **Detection Logic**:
   - Check if cart exists for customer
   - Check if cart has any items

2. **Response for Empty Cart**:
```json
{
  "cartId": 123,
  "customerId": 456,
  "items": [],
  "total": 0.00,
  "message": "Your cart is empty"
}
```

3. **HTTP Status**: 200 OK (not an error condition)