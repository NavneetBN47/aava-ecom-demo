# Low Level Design: E-Commerce Shopping Cart Module

## Document Information
- **Version**: 1.5
- **Last Updated**: 2025-01-24
- **Status**: Approved
- **Author**: Engineering Team

## 1. Overview

### 1.1 Purpose
This document provides the low-level design for the Shopping Cart module of the e-commerce platform. The shopping cart allows users to add, modify, and manage products before proceeding to checkout.

### 1.2 Scope
This LLD covers:
- Cart data models and entities
- Business logic and validation rules
- API endpoints and request/response formats
- Database schema design
- Integration points with other modules
- Error handling and edge cases

**Out of Scope**: Advanced caching strategies, wishlist features, and "Save for Later" functionality are not included in this version.

### 1.3 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis (for session management only)
- **API Style**: RESTful

## 2. System Architecture

### 2.1 Component Diagram
```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cart API       │
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cart Service   │
│  (Business      │
│   Logic)        │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│  Cart  │ │ Product  │
│  Repo  │ │ Service  │
└───┬────┘ └──────────┘
    ▼
┌────────┐
│   DB   │
└────────┘
```

### 2.2 Module Dependencies
- **Product Service**: For product details, pricing, and inventory validation
- **User Service**: For user authentication and profile information
- **Pricing Service**: For discount calculations and promotional pricing
- **Inventory Service**: For stock availability checks

## 3. Data Models

### 3.1 Core Entities

#### 3.1.1 ShoppingCart

**Purpose**: Represents a user's shopping cart with dual binding strategy for both authenticated and guest users.

```typescript
interface ShoppingCart {
  id: string;                    // UUID, Primary Key
  user_id: string | null;        // Foreign Key to User (null for guest carts)
  session_id: string;            // Session identifier for guest users
  created_at: Date;              // Cart creation timestamp
  updated_at: Date;              // Last modification timestamp
  expires_at: Date;              // Cart expiration time
  status: CartStatus;            // ACTIVE | ABANDONED | CONVERTED
  items: CartItem[];             // Array of cart items
  subtotal: number;              // Sum of all item totals (price * quantity)
  total_items: number;           // Total number of items in cart
  currency: string;              // ISO 4217 currency code (e.g., 'USD')
}

enum CartStatus {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED'
}
```

**Dual Binding Strategy**:
- **Authenticated Users**: Cart is bound to `user_id` (session_id also stored for continuity)
- **Guest Users**: Cart is bound to `session_id` only (user_id is null)
- **Guest-to-User Conversion**: When a guest logs in, their session cart is merged with their user cart

**Business Rules**:
- Guest carts expire after 24 hours of inactivity
- Authenticated user carts expire after 30 days of inactivity
- Maximum 50 unique items per cart
- Cart status automatically updates based on user actions

#### 3.1.2 CartItem

**Purpose**: Represents an individual product in the shopping cart with price snapshot mechanism.

```typescript
interface CartItem {
  id: string;                    // UUID, Primary Key
  cart_id: string;               // Foreign Key to ShoppingCart
  product_id: string;            // Foreign Key to Product
  variant_id: string | null;     // Foreign Key to ProductVariant (if applicable)
  quantity: number;              // Item quantity (min: 1, max: 99)
  price_at_addition: number;     // Price snapshot when item was added to cart
  current_price: number;         // Current product price (for comparison)
  subtotal: number;              // price_at_addition * quantity
  added_at: Date;                // Timestamp when item was added
  updated_at: Date;              // Last modification timestamp
}
```

**Price Snapshot Mechanism**:
- `price_at_addition`: Captures the product price at the moment the item is added to the cart. This ensures price consistency during the shopping session.
- `current_price`: Reflects the real-time product price from the Product Service. Used for price change detection.
- **Price Change Handling**: If `current_price` differs from `price_at_addition`, the UI displays a notification to the user. The cart continues to use `price_at_addition` for calculations until the user explicitly refreshes or updates the item.
- **Automatic Price Update**: When a user modifies the quantity (PUT operation), the system automatically updates `price_at_addition` to match `current_price`, ensuring the latest pricing is applied.

**Business Rules**:
- Quantity must be between 1 and 99
- Subtotal is always calculated as: `price_at_addition * quantity`
- Items are validated against inventory before addition
- Duplicate products (same product_id and variant_id) are merged by updating quantity

### 3.2 Database Schema

#### 3.2.1 shopping_carts Table

```sql
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_items INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'ABANDONED', 'CONVERTED')),
  CONSTRAINT chk_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_total_items CHECK (total_items >= 0 AND total_items <= 50)
);

CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_session_id ON shopping_carts(session_id);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
CREATE INDEX idx_shopping_carts_expires_at ON shopping_carts(expires_at);
```

#### 3.2.2 cart_items Table

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_addition DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_quantity CHECK (quantity >= 1 AND quantity <= 99),
  CONSTRAINT chk_price_at_addition CHECK (price_at_addition >= 0),
  CONSTRAINT chk_current_price CHECK (current_price >= 0),
  CONSTRAINT chk_subtotal CHECK (subtotal >= 0),
  CONSTRAINT uq_cart_product_variant UNIQUE (cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

## 4. Business Logic

### 4.1 Cart Operations

#### 4.1.1 Create Cart

**Trigger**: First item addition or explicit cart creation

**Logic**:
```typescript
async function createCart(userId: string | null, sessionId: string): Promise<ShoppingCart> {
  // Check for existing active cart
  const existingCart = userId 
    ? await findCartByUserId(userId)
    : await findCartBySessionId(sessionId);
  
  if (existingCart && existingCart.status === 'ACTIVE') {
    return existingCart;
  }
  
  // Calculate expiration
  const expiresAt = userId
    ? addDays(new Date(), 30)  // 30 days for authenticated users
    : addHours(new Date(), 24); // 24 hours for guests
  
  // Create new cart
  const cart: ShoppingCart = {
    id: generateUUID(),
    user_id: userId,
    session_id: sessionId,
    created_at: new Date(),
    updated_at: new Date(),
    expires_at: expiresAt,
    status: CartStatus.ACTIVE,
    items: [],
    subtotal: 0,
    total_items: 0,
    currency: 'USD'
  };
  
  return await saveCart(cart);
}
```

#### 4.1.2 Add Item to Cart

**Trigger**: User adds a product to cart

**Logic**:
```typescript
async function addItemToCart(
  cartId: string,
  productId: string,
  variantId: string | null,
  quantity: number = 1  // Default quantity is 1 if not specified
): Promise<CartItem> {
  // Validate inputs
  if (quantity < 1 || quantity > 99) {
    throw new ValidationError('Quantity must be between 1 and 99');
  }
  
  // Get cart
  const cart = await getCartById(cartId);
  if (!cart || cart.status !== 'ACTIVE') {
    throw new NotFoundError('Active cart not found');
  }
  
  // Check cart item limit
  if (cart.total_items >= 50) {
    throw new BusinessRuleError('Cart cannot exceed 50 unique items');
  }
  
  // Get product details and validate
  const product = await productService.getProduct(productId);
  if (!product || !product.is_active) {
    throw new NotFoundError('Product not found or inactive');
  }
  
  // Validate variant if specified
  if (variantId) {
    const variant = await productService.getVariant(variantId);
    if (!variant || variant.product_id !== productId) {
      throw new ValidationError('Invalid product variant');
    }
  }
  
  // Check inventory
  const availableStock = await inventoryService.checkStock(productId, variantId);
  if (availableStock < quantity) {
    throw new BusinessRuleError(`Insufficient stock. Available: ${availableStock}`);
  }
  
  // Get current price
  const currentPrice = await pricingService.getPrice(productId, variantId);
  
  // Check for existing item (same product and variant)
  const existingItem = cart.items.find(
    item => item.product_id === productId && item.variant_id === variantId
  );
  
  if (existingItem) {
    // Merge: Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > 99) {
      throw new BusinessRuleError('Item quantity cannot exceed 99');
    }
    
    // Check inventory for new quantity
    if (availableStock < newQuantity) {
      throw new BusinessRuleError(`Insufficient stock for quantity ${newQuantity}`);
    }
    
    existingItem.quantity = newQuantity;
    existingItem.subtotal = existingItem.price_at_addition * newQuantity;
    existingItem.current_price = currentPrice;
    existingItem.updated_at = new Date();
    
    await updateCartItem(existingItem);
    await recalculateCart(cartId);
    
    return existingItem;
  }
  
  // Create new cart item with price snapshot
  const cartItem: CartItem = {
    id: generateUUID(),
    cart_id: cartId,
    product_id: productId,
    variant_id: variantId,
    quantity: quantity,
    price_at_addition: currentPrice,  // Snapshot current price
    current_price: currentPrice,
    subtotal: currentPrice * quantity,
    added_at: new Date(),
    updated_at: new Date()
  };
  
  await saveCartItem(cartItem);
  await recalculateCart(cartId);
  
  return cartItem;
}
```

#### 4.1.3 Update Item Quantity

**Trigger**: User modifies item quantity

**Logic**:
```typescript
async function updateCartItemQuantity(
  cartId: string,
  itemId: string,
  newQuantity: number
): Promise<CartItem> {
  // Validate quantity
  if (newQuantity < 1 || newQuantity > 99) {
    throw new ValidationError('Quantity must be between 1 and 99');
  }
  
  // Get cart and item
  const cart = await getCartById(cartId);
  if (!cart || cart.status !== 'ACTIVE') {
    throw new NotFoundError('Active cart not found');
  }
  
  const item = await getCartItemById(itemId);
  if (!item || item.cart_id !== cartId) {
    throw new NotFoundError('Cart item not found');
  }
  
  // Check inventory
  const availableStock = await inventoryService.checkStock(
    item.product_id,
    item.variant_id
  );
  if (availableStock < newQuantity) {
    throw new BusinessRuleError(`Insufficient stock. Available: ${availableStock}`);
  }
  
  // Get current price and update price snapshot
  const currentPrice = await pricingService.getPrice(
    item.product_id,
    item.variant_id
  );
  
  // Update item with automatic price refresh
  item.quantity = newQuantity;
  item.price_at_addition = currentPrice;  // Refresh price snapshot on quantity update
  item.current_price = currentPrice;
  item.subtotal = currentPrice * newQuantity;
  item.updated_at = new Date();
  
  await updateCartItem(item);
  await recalculateCart(cartId);  // Automatic recalculation trigger
  
  return item;
}
```

#### 4.1.4 Remove Item from Cart

**Trigger**: User removes an item

**Logic**:
```typescript
async function removeCartItem(cartId: string, itemId: string): Promise<void> {
  // Get cart
  const cart = await getCartById(cartId);
  if (!cart || cart.status !== 'ACTIVE') {
    throw new NotFoundError('Active cart not found');
  }
  
  // Verify item belongs to cart
  const item = await getCartItemById(itemId);
  if (!item || item.cart_id !== cartId) {
    throw new NotFoundError('Cart item not found');
  }
  
  // Delete item
  await deleteCartItem(itemId);
  
  // Recalculate cart totals
  await recalculateCart(cartId);
}
```

#### 4.1.5 Clear Cart

**Trigger**: User clears entire cart or cart is converted to order

**Logic**:
```typescript
async function clearCart(cartId: string): Promise<void> {
  const cart = await getCartById(cartId);
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }
  
  // Delete all items
  await deleteAllCartItems(cartId);
  
  // Reset cart totals
  cart.subtotal = 0;
  cart.total_items = 0;
  cart.updated_at = new Date();
  
  await updateCart(cart);
}
```

### 4.2 Cart Validation Rules

#### 4.2.1 Inventory Validation

**When**: Before adding/updating items

**Rules**:
- Product must be active and available
- Requested quantity must not exceed available stock
- Variant (if specified) must belong to the product
- Out-of-stock items cannot be added

**Implementation**:
```typescript
async function validateInventory(
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<ValidationResult> {
  const product = await productService.getProduct(productId);
  
  if (!product || !product.is_active) {
    return {
      valid: false,
      error: 'Product is not available'
    };
  }
  
  const stock = await inventoryService.checkStock(productId, variantId);
  
  if (stock < quantity) {
    return {
      valid: false,
      error: `Insufficient stock. Available: ${stock}`,
      available_quantity: stock
    };
  }
  
  return { valid: true };
}
```

#### 4.2.2 Price Validation

**When**: During checkout or on user request

**Rules**:
- Compare `price_at_addition` with `current_price`
- Notify user if prices have changed
- Allow user to accept new prices or cancel

**Implementation**:
```typescript
async function validateCartPrices(cartId: string): Promise<PriceValidationResult> {
  const cart = await getCartById(cartId);
  const priceChanges: PriceChange[] = [];
  
  for (const item of cart.items) {
    const currentPrice = await pricingService.getPrice(
      item.product_id,
      item.variant_id
    );
    
    if (currentPrice !== item.price_at_addition) {
      priceChanges.push({
        item_id: item.id,
        product_id: item.product_id,
        old_price: item.price_at_addition,
        new_price: currentPrice,
        difference: currentPrice - item.price_at_addition
      });
      
      // Update current_price for display
      item.current_price = currentPrice;
      await updateCartItem(item);
    }
  }
  
  return {
    has_changes: priceChanges.length > 0,
    changes: priceChanges,
    requires_confirmation: priceChanges.length > 0
  };
}
```

### 4.3 Cart Calculation Rules

#### 4.3.1 Subtotal Calculation

**Automatic Recalculation Triggers**:
- When an item is added to the cart (POST operation)
- When an item quantity is updated (PUT operation)
- When an item is removed from the cart (DELETE operation)
- When cart prices are refreshed

**Formula**:
```
Cart Subtotal = Σ (item.price_at_addition × item.quantity) for all items
Total Items = Σ (item.quantity) for all items
```

**Implementation**:
```typescript
async function recalculateCart(cartId: string): Promise<void> {
  const cart = await getCartById(cartId);
  const items = await getCartItems(cartId);
  
  let subtotal = 0;
  let totalItems = 0;
  
  for (const item of items) {
    // Recalculate item subtotal
    item.subtotal = item.price_at_addition * item.quantity;
    await updateCartItem(item);
    
    subtotal += item.subtotal;
    totalItems += item.quantity;
  }
  
  // Update cart totals
  cart.subtotal = subtotal;
  cart.total_items = totalItems;
  cart.updated_at = new Date();
  
  await updateCart(cart);
}
```

#### 4.3.2 Empty Cart Handling

**Business Rule**: When a cart becomes empty (all items removed), the system must:
1. Set `subtotal` to 0
2. Set `total_items` to 0
3. Set `isEmpty` flag to true in API responses
4. Maintain cart status as ACTIVE (cart entity persists)
5. UI should redirect user to shopping/browse page with appropriate messaging

**Implementation**:
```typescript
async function handleEmptyCart(cartId: string): Promise<void> {
  const cart = await getCartById(cartId);
  const items = await getCartItems(cartId);
  
  if (items.length === 0) {
    cart.subtotal = 0;
    cart.total_items = 0;
    cart.updated_at = new Date();
    // Status remains ACTIVE - cart is not deleted
    
    await updateCart(cart);
    
    // Emit event for UI handling
    eventEmitter.emit('cart:empty', {
      cart_id: cartId,
      user_id: cart.user_id,
      session_id: cart.session_id,
      timestamp: new Date()
    });
  }
}
```

**UI Behavior on Empty Cart**:
- Display message: "Your cart is empty. Start shopping!"
- Show "Continue Shopping" button
- Redirect to product catalog or homepage
- Optionally show recommended products

### 4.4 Cart Lifecycle Management

#### 4.4.1 Cart Expiration

**Rules**:
- Guest carts: Expire after 24 hours of inactivity
- User carts: Expire after 30 days of inactivity
- Expired carts are marked as ABANDONED
- Abandoned carts are archived after 90 days

**Implementation**:
```typescript
async function expireInactiveCarts(): Promise<void> {
  const now = new Date();
  
  // Find expired carts
  const expiredCarts = await findCartsWhere({
    expires_at: { $lt: now },
    status: CartStatus.ACTIVE
  });
  
  for (const cart of expiredCarts) {
    cart.status = CartStatus.ABANDONED;
    cart.updated_at = now;
    await updateCart(cart);
    
    // Emit analytics event
    analyticsService.trackCartAbandonment(cart);
  }
}
```

#### 4.4.2 Cart Conversion

**Trigger**: User completes checkout

**Logic**:
```typescript
async function convertCartToOrder(cartId: string, orderId: string): Promise<void> {
  const cart = await getCartById(cartId);
  
  if (!cart || cart.status !== 'ACTIVE') {
    throw new BusinessRuleError('Cannot convert inactive cart');
  }
  
  // Update cart status
  cart.status = CartStatus.CONVERTED;
  cart.updated_at = new Date();
  
  await updateCart(cart);
  
  // Create new empty cart for user
  if (cart.user_id) {
    await createCart(cart.user_id, cart.session_id);
  }
}
```

#### 4.4.3 Guest to User Cart Migration

**Trigger**: Guest user logs in or creates account

**Logic**:
```typescript
async function migrateGuestCart(sessionId: string, userId: string): Promise<ShoppingCart> {
  // Get guest cart
  const guestCart = await findCartBySessionId(sessionId);
  
  if (!guestCart || guestCart.status !== 'ACTIVE') {
    // No guest cart, return or create user cart
    return await createCart(userId, sessionId);
  }
  
  // Get or create user cart
  let userCart = await findCartByUserId(userId);
  
  if (!userCart) {
    // Convert guest cart to user cart
    guestCart.user_id = userId;
    guestCart.expires_at = addDays(new Date(), 30);
    guestCart.updated_at = new Date();
    await updateCart(guestCart);
    return guestCart;
  }
  
  // Merge guest cart items into user cart
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      item => item.product_id === guestItem.product_id && 
              item.variant_id === guestItem.variant_id
    );
    
    if (existingItem) {
      // Merge quantities
      const newQuantity = Math.min(existingItem.quantity + guestItem.quantity, 99);
      await updateCartItemQuantity(userCart.id, existingItem.id, newQuantity);
    } else {
      // Add guest item to user cart
      guestItem.cart_id = userCart.id;
      await saveCartItem(guestItem);
    }
  }
  
  // Mark guest cart as converted
  guestCart.status = CartStatus.CONVERTED;
  await updateCart(guestCart);
  
  // Recalculate user cart
  await recalculateCart(userCart.id);
  
  return userCart;
}
```

## 5. API Endpoints

### 5.1 Get Cart

**Endpoint**: `GET /api/v1/cart`

**Description**: Retrieve the current user's active shopping cart

**Authentication**: Optional (supports both authenticated and guest users)

**Headers**:
```
Authorization: Bearer <token>  (optional for authenticated users)
X-Session-ID: <session_id>    (required for guest users)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid-123",
    "user_id": "user-uuid-456",
    "session_id": "session-abc-789",
    "status": "ACTIVE",
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T14:30:00Z",
    "expires_at": "2025-02-19T10:00:00Z",
    "subtotal": 149.98,
    "total_items": 3,
    "currency": "USD",
    "isEmpty": false,
    "items": [
      {
        "id": "item-uuid-001",
        "product_id": "prod-uuid-111",
        "variant_id": null,
        "product_name": "Wireless Mouse",
        "product_image": "https://cdn.example.com/mouse.jpg",
        "quantity": 2,
        "price_at_addition": 24.99,
        "current_price": 24.99,
        "subtotal": 49.98,
        "price_changed": false,
        "added_at": "2025-01-20T10:15:00Z"
      },
      {
        "id": "item-uuid-002",
        "product_id": "prod-uuid-222",
        "variant_id": "var-uuid-333",
        "product_name": "USB-C Cable",
        "variant_name": "2m - Black",
        "product_image": "https://cdn.example.com/cable.jpg",
        "quantity": 1,
        "price_at_addition": 12.99,
        "current_price": 14.99,
        "subtotal": 12.99,
        "price_changed": true,
        "price_difference": 2.00,
        "added_at": "2025-01-20T11:00:00Z"
      }
    ]
  }
}
```

**Response** (200 OK - Empty Cart):
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid-123",
    "user_id": "user-uuid-456",
    "session_id": "session-abc-789",
    "status": "ACTIVE",
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T15:00:00Z",
    "expires_at": "2025-02-19T10:00:00Z",
    "subtotal": 0,
    "total_items": 0,
    "currency": "USD",
    "isEmpty": true,
    "items": []
  },
  "message": "Your cart is empty"
}
```

### 5.2 Add Item to Cart

**Endpoint**: `POST /api/v1/cart/items`

**Description**: Add a product to the shopping cart with optional quantity (defaults to 1)

**Authentication**: Optional

**Headers**:
```
Authorization: Bearer <token>  (optional)
X-Session-ID: <session_id>    (required for guests)
Content-Type: application/json
```

**Request Body**:
```json
{
  "product_id": "prod-uuid-111",
  "variant_id": "var-uuid-222",  // optional
  "quantity": 2                   // optional, defaults to 1 if not provided
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_id": "cart-uuid-123",
    "item": {
      "id": "item-uuid-003",
      "product_id": "prod-uuid-111",
      "variant_id": "var-uuid-222",
      "quantity": 2,
      "price_at_addition": 24.99,
      "current_price": 24.99,
      "subtotal": 49.98,
      "added_at": "2025-01-20T15:30:00Z"
    },
    "cart_summary": {
      "subtotal": 199.96,
      "total_items": 5
    }
  }
}
```

**Error Responses**:

- **400 Bad Request** (Invalid quantity):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be between 1 and 99"
  }
}
```

- **404 Not Found** (Product not found):
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found or inactive"
  }
}
```

- **409 Conflict** (Insufficient stock):
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock. Available: 3",
    "available_quantity": 3
  }
}
```

- **422 Unprocessable Entity** (Cart limit exceeded):
```json
{
  "success": false,
  "error": {
    "code": "CART_LIMIT_EXCEEDED",
    "message": "Cart cannot exceed 50 unique items"
  }
}
```

### 5.3 Update Cart Item

**Endpoint**: `PUT /api/v1/cart/items/:item_id`

**Description**: Update the quantity of a cart item (triggers automatic price refresh and recalculation)

**Authentication**: Optional

**Headers**:
```
Authorization: Bearer <token>  (optional)
X-Session-ID: <session_id>    (required for guests)
Content-Type: application/json
```

**Request Body**:
```json
{
  "quantity": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "item": {
      "id": "item-uuid-001",
      "product_id": "prod-uuid-111",
      "quantity": 5,
      "price_at_addition": 24.99,
      "current_price": 24.99,
      "subtotal": 124.95,
      "updated_at": "2025-01-20T16:00:00Z"
    },
    "cart_summary": {
      "subtotal": 274.93,
      "total_items": 8
    },
    "price_updated": true,
    "message": "Price has been refreshed to current market price"
  }
}
```

**Error Responses**:

- **400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be between 1 and 99"
  }
}
```

- **404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Cart item not found"
  }
}
```

- **409 Conflict**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for quantity 5. Available: 3",
    "available_quantity": 3
  }
}
```

### 5.4 Remove Cart Item

**Endpoint**: `DELETE /api/v1/cart/items/:item_id`

**Description**: Remove an item from the cart

**Authentication**: Optional

**Headers**:
```
Authorization: Bearer <token>  (optional)
X-Session-ID: <session_id>    (required for guests)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart_summary": {
      "subtotal": 149.98,
      "total_items": 3
    }
  }
}
```

**Response** (200 OK - Last Item Removed, Cart Now Empty):
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart_summary": {
      "subtotal": 0,
      "total_items": 0,
      "isEmpty": true
    }
  },
  "redirect": {
    "suggested_action": "continue_shopping",
    "message": "Your cart is empty. Start shopping!"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Cart item not found"
  }
}
```

### 5.5 Clear Cart

**Endpoint**: `DELETE /api/v1/cart`

**Description**: Remove all items from the cart

**Authentication**: Optional

**Headers**:
```
Authorization: Bearer <token>  (optional)
X-Session-ID: <session_id>    (required for guests)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "cart_id": "cart-uuid-123",
    "subtotal": 0,
    "total_items": 0,
    "isEmpty": true
  }
}
```

### 5.6 Validate Cart

**Endpoint**: `POST /api/v1/cart/validate`

**Description**: Validate cart items (inventory, prices) before checkout

**Authentication**: Optional

**Headers**:
```
Authorization: Bearer <token>  (optional)
X-Session-ID: <session_id>    (required for guests)
```

**Response** (200 OK - Valid Cart):
```json
{
  "success": true,
  "valid": true,
  "message": "Cart is valid and ready for checkout",
  "data": {
    "cart_id": "cart-uuid-123",
    "subtotal": 149.98,
    "total_items": 3
  }
}
```

**Response** (200 OK - Invalid Cart):
```json
{
  "success": true,
  "valid": false,
  "message": "Cart validation failed",
  "errors": [
    {
      "item_id": "item-uuid-001",
      "product_id": "prod-uuid-111",
      "error_type": "INSUFFICIENT_STOCK",
      "message": "Insufficient stock. Available: 1",
      "requested_quantity": 2,
      "available_quantity": 1
    },
    {
      "item_id": "item-uuid-002",
      "product_id": "prod-uuid-222",
      "error_type": "PRICE_CHANGED",
      "message": "Price has changed",
      "old_price": 12.99,
      "new_price": 14.99,
      "difference": 2.00
    }
  ],
  "requires_action": true
}
```

## 6. Error Handling

### 6.1 Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional context
  },
  "timestamp": "2025-01-20T16:30:00Z",
  "request_id": "req-uuid-789"
}
```

### 6.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CART_NOT_FOUND` | 404 | Cart does not exist |
| `ITEM_NOT_FOUND` | 404 | Cart item does not exist |
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist or is inactive |
| `INVALID_QUANTITY` | 400 | Quantity is out of valid range (1-99) |
| `INSUFFICIENT_STOCK` | 409 | Requested quantity exceeds available stock |
| `CART_LIMIT_EXCEEDED` | 422 | Cart has reached maximum item limit (50) |
| `CART_EXPIRED` | 410 | Cart has expired |
| `INVALID_VARIANT` | 400 | Product variant is invalid |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User does not have access to this cart |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

### 6.3 Error Handling Strategy

#### 6.3.1 Inventory Errors

**Scenario**: Product out of stock or insufficient quantity

**Handling**:
1. Return 409 Conflict with available quantity
2. Client can offer to adjust quantity
3. Log inventory discrepancy for investigation

#### 6.3.2 Price Change Errors

**Scenario**: Price changed between cart addition and checkout

**Handling**:
1. Display price comparison to user
2. Require explicit user confirmation
3. Update `price_at_addition` only after confirmation
4. Log price change event

#### 6.3.3 Concurrent Modification

**Scenario**: Multiple requests modifying same cart simultaneously

**Handling**:
1. Use optimistic locking with version field
2. Return 409 Conflict if version mismatch
3. Client should retry with latest cart state

**Implementation**:
```typescript
async function updateCartWithLocking(
  cartId: string,
  expectedVersion: number,
  updates: Partial<ShoppingCart>
): Promise<ShoppingCart> {
  const cart = await getCartById(cartId);
  
  if (cart.version !== expectedVersion) {
    throw new ConflictError('Cart has been modified. Please refresh and try again.');
  }
  
  cart.version += 1;
  Object.assign(cart, updates);
  
  return await updateCart(cart);
}
```

## 7. Integration Points

### 7.1 Product Service Integration

**Purpose**: Fetch product details, pricing, and availability

**Endpoints Used**:
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/products/:id/variants/:variant_id` - Get variant details
- `GET /api/v1/products/:id/price` - Get current price

**Error Handling**:
- If product service is unavailable, return cached product data
- If product not found, prevent cart operations
- Implement circuit breaker pattern for resilience

### 7.2 Inventory Service Integration

**Purpose**: Validate stock availability

**Endpoints Used**:
- `GET /api/v1/inventory/check` - Check stock availability
- `POST /api/v1/inventory/reserve` - Reserve inventory for checkout

**Error Handling**:
- If inventory service is unavailable, allow cart operations but flag for validation
- Implement retry logic with exponential backoff
- Cache recent inventory checks (TTL: 60 seconds)

### 7.3 Pricing Service Integration

**Purpose**: Calculate discounts and promotional pricing

**Endpoints Used**:
- `POST /api/v1/pricing/calculate` - Calculate final price with discounts
- `GET /api/v1/pricing/promotions` - Get active promotions

**Error Handling**:
- If pricing service is unavailable, use base product prices
- Log pricing calculation failures for investigation

### 7.4 User Service Integration

**Purpose**: Authenticate users and fetch user profiles

**Endpoints Used**:
- `GET /api/v1/users/:id` - Get user profile
- `POST /api/v1/auth/validate` - Validate authentication token

**Error Handling**:
- If user service is unavailable, allow guest cart operations
- Implement token caching to reduce authentication calls

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes**:
- Primary keys on all tables
- Foreign key indexes for joins
- Composite index on `(cart_id, product_id, variant_id)` for duplicate detection
- Index on `expires_at` for expiration queries
- Index on `user_id` and `session_id` for cart lookups

**Query Optimization**:
- Use `SELECT` with specific columns instead of `SELECT *`
- Implement pagination for cart item lists (if needed)
- Use database connection pooling
- Implement read replicas for GET operations

### 8.2 Caching Strategy

**Redis Cache**:
- Cache active carts (TTL: 1 hour)
- Cache product details (TTL: 5 minutes)
- Cache inventory status (TTL: 1 minute)
- Invalidate cache on cart modifications

**Cache Keys**:
```
cart:{cart_id}              -> Full cart object
cart:user:{user_id}         -> User's active cart ID
cart:session:{session_id}   -> Guest cart ID
product:{product_id}        -> Product details
inventory:{product_id}      -> Stock availability
```

**Implementation**:
```typescript
async function getCachedCart(cartId: string): Promise<ShoppingCart | null> {
  const cacheKey = `cart:${cartId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const cart = await getCartFromDB(cartId);
  
  if (cart) {
    await redis.setex(cacheKey, 3600, JSON.stringify(cart));
  }
  
  return cart;
}

async function invalidateCartCache(cartId: string): Promise<void> {
  await redis.del(`cart:${cartId}`);
}
```

### 8.3 API Rate Limiting

**Limits**:
- Authenticated users: 100 requests per minute
- Guest users: 50 requests per minute
- Cart modification operations: 20 requests per minute

**Implementation**:
```typescript
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => req.user ? 100 : 50,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/cart', rateLimiter);
```

## 9. Security Considerations

### 9.1 Authentication & Authorization

**Cart Access Control**:
- Authenticated users can only access their own carts
- Guest users can only access carts with matching session ID
- Admin users can access any cart (for support purposes)

**Implementation**:
```typescript
async function authorizeCartAccess(
  cartId: string,
  userId: string | null,
  sessionId: string
): Promise<boolean> {
  const cart = await getCartById(cartId);
  
  if (!cart) {
    return false;
  }
  
  // Check user ownership
  if (userId && cart.user_id === userId) {
    return true;
  }
  
  // Check session ownership for guest carts
  if (!cart.user_id && cart.session_id === sessionId) {
    return true;
  }
  
  return false;
}
```

### 9.2 Input Validation

**Validation Rules**:
- Product IDs must be valid UUIDs
- Quantity must be integer between 1 and 99
- Session IDs must be alphanumeric, max 255 characters
- Sanitize all user inputs to prevent injection attacks

**Implementation**:
```typescript
const addItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  variant_id: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).max(99).default(1)
});

function validateAddItemRequest(req: Request): ValidationResult {
  return addItemSchema.validate(req.body);
}
```

### 9.3 SQL Injection Prevention

**Strategy**:
- Use parameterized queries exclusively
- Never concatenate user input into SQL strings
- Use ORM (e.g., TypeORM, Sequelize) with built-in protections

**Example**:
```typescript
// GOOD: Parameterized query
const cart = await db.query(
  'SELECT * FROM shopping_carts WHERE id = $1',
  [cartId]
);

// BAD: String concatenation (vulnerable to SQL injection)
// const cart = await db.query(
//   `SELECT * FROM shopping_carts WHERE id = '${cartId}'`
// );
```

### 9.4 Session Security

**Session Management**:
- Use secure, HTTP-only cookies for session IDs
- Implement CSRF protection for state-changing operations
- Rotate session IDs after authentication
- Set appropriate session timeouts

**Configuration**:
```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // Not accessible via JavaScript
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'strict' // CSRF protection
  }
}));
```

## 10. Monitoring & Logging

### 10.1 Logging Strategy

**Log Levels**:
- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Business rule violations, validation failures
- **INFO**: Successful operations, cart lifecycle events
- **DEBUG**: Detailed execution flow (development only)

**Log Format**:
```json
{
  "timestamp": "2025-01-20T16:45:00Z",
  "level": "INFO",
  "service": "cart-service",
  "operation": "add_item_to_cart",
  "cart_id": "cart-uuid-123",
  "user_id": "user-uuid-456",
  "product_id": "prod-uuid-789",
  "quantity": 2,
  "duration_ms": 45,
  "status": "success"
}
```

**Events to Log**:
- Cart creation
- Item addition/removal/update
- Cart validation
- Cart expiration
- Cart conversion to order
- Price changes detected
- Inventory validation failures
- Authentication failures
- API errors

### 10.2 Metrics & Monitoring

**Key Metrics**:
- Cart creation rate
- Cart abandonment rate
- Average cart value
- Average items per cart
- Cart conversion rate
- API response times
- Error rates by endpoint
- Cache hit/miss rates

**Monitoring Tools**:
- Application Performance Monitoring (APM): New Relic, Datadog
- Log Aggregation: ELK Stack, Splunk
- Metrics: Prometheus + Grafana
- Alerting: PagerDuty, Opsgenie

**Alerts**:
- Error rate > 5% for 5 minutes
- API response time > 500ms (p95) for 5 minutes
- Cart service unavailable
- Database connection pool exhausted
- Cache service unavailable

## 11. Testing Strategy

### 11.1 Unit Tests

**Coverage Target**: 80%+

**Test Cases**:
- Cart creation logic
- Item addition with various scenarios
- Quantity validation
- Price calculation
- Cart expiration logic
- Guest-to-user migration

**Example**:
```typescript
describe('addItemToCart', () => {
  it('should add item with default quantity 1', async () => {
    const cart = await createCart('user-123', 'session-456');
    const item = await addItemToCart(cart.id, 'prod-789', null);
    
    expect(item.quantity).toBe(1);
    expect(item.price_at_addition).toBeGreaterThan(0);
  });
  
  it('should merge duplicate items', async () => {
    const cart = await createCart('user-123', 'session-456');
    await addItemToCart(cart.id, 'prod-789', null, 2);
    await addItemToCart(cart.id, 'prod-789', null, 3);
    
    const items = await getCartItems(cart.id);
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
  });
  
  it('should throw error for invalid quantity', async () => {
    const cart = await createCart('user-123', 'session-456');
    
    await expect(
      addItemToCart(cart.id, 'prod-789', null, 100)
    ).rejects.toThrow('Quantity must be between 1 and 99');
  });
});
```

### 11.2 Integration Tests

**Test Cases**:
- End-to-end cart workflows
- API endpoint functionality
- Database operations
- External service integrations
- Error handling scenarios

**Example**:
```typescript
describe('Cart API Integration', () => {
  it('should complete full cart workflow', async () => {
    // Create cart
    const createResponse = await request(app)
      .post('/api/v1/cart/items')
      .set('X-Session-ID', 'test-session')
      .send({ product_id: 'prod-123', quantity: 2 })
      .expect(201);
    
    const cartId = createResponse.body.data.cart_id;
    
    // Get cart
    const getResponse = await request(app)
      .get('/api/v1/cart')
      .set('X-Session-ID', 'test-session')
      .expect(200);
    
    expect(getResponse.body.data.total_items).toBe(2);
    
    // Update item
    const itemId = getResponse.body.data.items[0].id;
    await request(app)
      .put(`/api/v1/cart/items/${itemId}`)
      .set('X-Session-ID', 'test-session')
      .send({ quantity: 5 })
      .expect(200);
    
    // Remove item
    await request(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set('X-Session-ID', 'test-session')
      .expect(200);
    
    // Verify empty cart
    const finalResponse = await request(app)
      .get('/api/v1/cart')
      .set('X-Session-ID', 'test-session')
      .expect(200);
    
    expect(finalResponse.body.data.isEmpty).toBe(true);
  });
});
```

### 11.3 Load Testing

**Scenarios**:
- 1000 concurrent users adding items to cart
- 500 concurrent cart retrievals
- Peak load simulation (Black Friday scenario)

**Tools**: Apache JMeter, k6, Artillery

**Performance Targets**:
- API response time < 200ms (p95)
- Support 10,000 requests per minute
- Zero data loss under load

## 12. Deployment

### 12.1 Environment Configuration

**Environment Variables**:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=cart_service
DB_PASSWORD=<secure_password>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<secure_password>

# Service URLs
PRODUCT_SERVICE_URL=http://product-service:3001
INVENTORY_SERVICE_URL=http://inventory-service:3002
PRICING_SERVICE_URL=http://pricing-service:3003

# Security
SESSION_SECRET=<random_secret>
JWT_SECRET=<random_secret>

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### 12.2 Database Migration

**Migration Script** (using Flyway or similar):
```sql
-- V1__create_shopping_carts.sql
CREATE TABLE shopping_carts (
  -- schema as defined in section 3.2.1
);

-- V2__create_cart_items.sql
CREATE TABLE cart_items (
  -- schema as defined in section 3.2.2
);

-- V3__add_indexes.sql
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
-- additional indexes...
```

### 12.3 Rollback Strategy

**Approach**:
- Maintain backward compatibility for at least one version
- Use feature flags for new functionality
- Database migrations must be reversible
- Keep previous Docker image available for quick rollback

**Rollback Procedure**:
1. Identify issue and decide to rollback
2. Scale down new version pods
3. Scale up previous version pods
4. Verify service health
5. Rollback database migrations if necessary
6. Monitor for issues

## 13. Appendix

### 13.1 Glossary

- **Cart**: A temporary collection of products a user intends to purchase
- **Cart Item**: An individual product entry within a cart
- **Session**: A temporary identifier for guest users
- **Price Snapshot**: The product price captured at the time of cart addition
- **Cart Abandonment**: When a user leaves items in cart without completing purchase
- **Cart Conversion**: When a cart is successfully converted to an order

### 13.2 References

- REST API Design Best Practices
- PostgreSQL Performance Tuning Guide
- Redis Caching Strategies
- OWASP Security Guidelines
- Microservices Design Patterns

### 13.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2025-01-15 | Engineering Team | Initial draft |
| 1.1 | 2025-01-17 | Engineering Team | Added security section |
| 1.2 | 2025-01-19 | Engineering Team | Added monitoring and testing |
| 1.3 | 2025-01-20 | Engineering Team | Added deployment section |
| 1.4 | 2025-01-22 | Engineering Team | Added price snapshot mechanism and API refinements |
| 1.5 | 2025-01-24 | Engineering Team | Enhanced RCA compliance: explicit price snapshot documentation, automatic recalculation triggers, empty cart handling with UI redirection, removed out-of-scope features |

---

**Document Status**: Approved for Implementation
**Next Review Date**: 2025-02-24