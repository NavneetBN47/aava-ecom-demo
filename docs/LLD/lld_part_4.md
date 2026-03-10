## 14. New Business Logic Implementation

### 14.1 Add to Cart with Minimum Procurement Threshold (SCRUM-343 AC-1)

**Implementation in ShoppingCartService.addProductToCart():**

```java
public CartResponse addProductToCart(String customerId, Long productId, String purchaseType) {
    // Fetch product details
    Product product = productService.getProductById(productId);
    
    // Determine initial quantity based on minimum procurement threshold
    Integer initialQuantity;
    if (product.getMinimumProcurementThreshold() != null) {
        initialQuantity = product.getMinimumProcurementThreshold();
    } else {
        initialQuantity = 1;
    }
    
    // Validate inventory availability
    validateInventory(productId, initialQuantity);
    
    // Create or update cart item with purchase type
    CartItem cartItem = new CartItem();
    cartItem.setProductId(productId);
    cartItem.setQuantity(initialQuantity);
    cartItem.setPurchaseType(purchaseType);
    cartItem.setMinimumProcurementThreshold(product.getMinimumProcurementThreshold());
    cartItem.setUnitPrice(product.getPrice());
    cartItem.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(initialQuantity)));
    
    // Save and return response
    // ...
}
```

### 14.2 Real-time Cart Total Calculation (SCRUM-343 AC-3)

**Implementation in ShoppingCartService.calculateCartTotal():**

```java
public BigDecimal calculateCartTotal(UUID cartId) {
    List<CartItem> cartItems = cartItemRepository.findByCartId(cartId);
    
    BigDecimal total = BigDecimal.ZERO;
    for (CartItem item : cartItems) {
        // Calculate line item subtotal
        BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        item.setSubtotal(subtotal);
        cartItemRepository.save(item);
        
        // Add to cart total
        total = total.add(subtotal);
    }
    
    // Update cart total
    ShoppingCart cart = shoppingCartRepository.findById(cartId).orElseThrow();
    cart.setTotalAmount(total);
    cart.setUpdatedAt(LocalDateTime.now());
    shoppingCartRepository.save(cart);
    
    return total;
}
```

**Trigger Points:**
- After adding new item to cart
- After updating item quantity
- After removing item from cart
- Returns updated CartResponse with recalculated totals immediately

### 14.3 Inventory Validation (SCRUM-343 AC-6)

**Implementation in ShoppingCartService.validateInventory():**

```java
private void validateInventory(Long productId, Integer requestedQuantity) {
    Product product = productService.getProductById(productId);
    Integer availableStock = product.getStockQuantity() - product.getReservedQuantity();
    
    if (requestedQuantity > availableStock) {
        throw new InventoryValidationException(
            productId,
            requestedQuantity,
            availableStock,
            String.format("Insufficient stock. Available: %d, Requested: %d", 
                availableStock, requestedQuantity)
        );
    }
}
```

**Error Handling:**
- Exception caught by controller
- Returns HTTP 400 Bad Request
- Error response includes productId, requestedQuantity, availableStock
- User-friendly error message displayed to customer

### 14.4 Empty Cart Detection (SCRUM-343 AC-5)

**Implementation in ShoppingCartService.getCartByCustomerId():**

```java
public CartResponse getCartByCustomerId(String customerId) {
    Optional<ShoppingCart> cartOpt = shoppingCartRepository.findActiveCartByCustomerId(customerId);
    
    if (cartOpt.isEmpty()) {
        // Return empty cart response
        return CartResponse.builder()
            .customerId(customerId)
            .items(Collections.emptyList())
            .total(BigDecimal.ZERO)
            .subtotal(BigDecimal.ZERO)
            .isEmpty(true)
            .itemCount(0)
            .message("Your cart is empty")
            .build();
    }
    
    ShoppingCart cart = cartOpt.get();
    List<CartItem> items = cartItemRepository.findByCartId(cart.getCartId());
    
    if (items.isEmpty()) {
        // Cart exists but has no items
        return CartResponse.builder()
            .cartId(cart.getCartId())
            .customerId(customerId)
            .items(Collections.emptyList())
            .total(BigDecimal.ZERO)
            .subtotal(BigDecimal.ZERO)
            .isEmpty(true)
            .itemCount(0)
            .message("Your cart is empty")
            .createdAt(cart.getCreatedAt())
            .updatedAt(cart.getUpdatedAt())
            .build();
    }
    
    // Build response with items
    // ...
}
```

## 15. Modified Product Entity Fields

### 15.1 New Fields Added to Product Entity

**minimumProcurementThreshold (Integer, nullable):**
- Purpose: Defines the minimum quantity that must be ordered for this product
- Usage: When adding product to cart, if this field is present, initial quantity is set to this value
- Database Column: `minimum_procurement_threshold INTEGER NULL`
- Default: NULL (no minimum threshold)
- Validation: If present, must be positive integer

**subscriptionEligible (Boolean, default false):**
- Purpose: Indicates whether product can be purchased via subscription
- Usage: Determines quantity increment rules and purchase type options
- Database Column: `subscription_eligible BOOLEAN NOT NULL DEFAULT false`
- Default: false
- Validation: Required boolean field

### 15.2 Modified ProductService Methods

**New Method: validateInventoryAvailability()**
```java
public Boolean validateInventoryAvailability(Long productId, Integer requestedQuantity) {
    Product product = getProductById(productId);
    Integer availableStock = product.getStockQuantity() - product.getReservedQuantity();
    return requestedQuantity <= availableStock;
}
```

**New Method: reserveStock()**
```java
public void reserveStock(Long productId, Integer quantity) {
    Product product = getProductById(productId);
    Integer currentReserved = product.getReservedQuantity();
    product.setReservedQuantity(currentReserved + quantity);
    productRepository.save(product);
}
```

### 15.3 Modified ProductController Endpoints

**New Endpoint: Check Stock Availability**
```
GET /api/products/{productId}/stock-availability?quantity={quantity}

Response:
{
  "productId": 100,
  "requestedQuantity": 5,
  "availableStock": 10,
  "isAvailable": true
}
```

## 16. SCRUM-343 Requirements Traceability

### AC-1: Add Product to Cart with Minimum Procurement Threshold
- **Entity:** CartItem with purchaseType and minimumProcurementThreshold fields
- **Service:** ShoppingCartService.addProductToCart() with threshold logic
- **Sequence Diagram:** Section 3.12 - Add to Cart Flow
- **Business Logic:** Section 14.1 - Implementation details

### AC-2: View Shopping Cart
- **Entity:** ShoppingCart, CartItem
- **DTO:** CartResponse, CartItemDTO with product name, unit price, quantity, subtotal
- **Service:** ShoppingCartService.getCartByCustomerId()
- **Sequence Diagram:** Section 3.13 - View Cart Flow
- **API Endpoint:** GET /api/cart/{customerId}

### AC-3: Update Quantity with Real-time Calculation
- **Service:** ShoppingCartService.updateCartItemQuantity() with calculateCartTotal()
- **Sequence Diagram:** Section 3.14 - Update Quantity Flow
- **Business Logic:** Section 14.2 - Real-time calculation implementation
- **API Endpoint:** PUT /api/cart/items/{cartItemId}

### AC-4: Remove Item from Cart
- **Service:** ShoppingCartService.removeCartItem()
- **Sequence Diagram:** Section 3.15 - Remove Item Flow
- **API Endpoint:** DELETE /api/cart/items/{cartItemId}

### AC-5: Empty Cart Handling
- **Service:** ShoppingCartService.getCartByCustomerId() with empty cart detection
- **DTO:** CartResponse with isEmpty flag and message field
- **Business Logic:** Section 14.4 - Empty cart detection
- **Sequence Diagram:** Section 3.13 - View Cart Flow (empty cart path)

### AC-6: Inventory Validation
- **Exception:** InventoryValidationException with productId, requestedQuantity, availableStock
- **Service:** ShoppingCartService.validateInventory()
- **Business Logic:** Section 14.3 - Inventory validation implementation
- **Sequence Diagram:** Section 3.14 - Update Quantity Flow (validation error path)
- **Error Response:** Section 9.4 - Exception handling with detailed error format

## 17. Summary of Changes

### New Components Added:
1. **Entities:** ShoppingCart (UUID-based), CartItem (UUID-based) with purchase type support
2. **Controllers:** ShoppingCartController with full CRUD operations
3. **Services:** ShoppingCartService with business logic for all cart operations
4. **Repositories:** ShoppingCartRepository, CartItemRepository with custom queries
5. **DTOs:** AddToCartRequest, CartResponse, CartItemDTO, UpdateQuantityRequest
6. **Exceptions:** InventoryValidationException, CartNotFoundException
7. **Database Tables:** shopping_carts, cart_items with new fields
8. **Sequence Diagrams:** 5 new diagrams for cart operations (sections 3.12-3.15)
9. **Business Logic:** Minimum procurement threshold, real-time calculation, inventory validation

### Modified Components:
1. **Product Entity:** Added minimumProcurementThreshold and subscriptionEligible fields
2. **ProductService:** Added validateInventoryAvailability() and reserveStock() methods
3. **ProductController:** Added stock availability check endpoint
4. **products Table:** Added minimum_procurement_threshold and subscription_eligible columns

### Key Features Implemented:
- Minimum procurement threshold enforcement (SCRUM-343 AC-1)
- Subscription vs one-time purchase type handling (SCRUM-343 AC-1)
- Real-time cart total calculation without page refresh (SCRUM-343 AC-3)
- Inventory validation with detailed error messages (SCRUM-343 AC-6)
- Empty cart detection and messaging (SCRUM-343 AC-5)
- Complete cart CRUD operations (SCRUM-343 AC-2, AC-4)

---

**Document Version:** 2.0  
**Last Updated:** 2024-01-15  
**Change Reference:** SCRUM-343 - Shopping Cart Feature Implementation