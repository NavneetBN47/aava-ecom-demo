## 9. Business Logic Rules

### Minimum Procurement Threshold Logic
- When adding a product to cart, check if the product has a `minimumProcurementThreshold` value
- If threshold exists and is greater than 0, set initial cart item quantity to this threshold value
- If no threshold exists or threshold is 0, default quantity to 1
- Threshold applies to both subscription and one-time purchase types

### Purchase Type Quantity Logic
- **Subscription purchases:** After initial threshold quantity is set, allow quantity increments based on subscription rules
- **One-time purchases:** After initial threshold quantity is set, allow standard quantity increments
- Purchase type is stored with each cart item for proper quantity management

### Inventory Validation Rules
- Before adding item to cart: validate requested quantity <= product stock quantity
- Before updating cart item quantity: validate new quantity <= product stock quantity
- If validation fails, throw `InsufficientInventoryException` with user-friendly error message
- Validation prevents overselling and maintains inventory integrity

### Cart Total Calculation Rules
- Cart item subtotal = quantity × unit price
- Cart total = sum of all cart item subtotals
- Recalculate totals automatically on:
  - Adding new item to cart
  - Updating cart item quantity
  - Removing item from cart
- Update cart `updated_at` timestamp on every total recalculation

## 10. Error Handling

### Custom Exceptions

#### ProductNotFoundException
- **Thrown when:** Product with specified ID is not found
- **HTTP Status:** 404 Not Found
- **Response:** {"error": "Product not found", "productId": <id>}

#### CartItemNotFoundException
- **Thrown when:** Cart item with specified ID is not found
- **HTTP Status:** 404 Not Found
- **Response:** {"error": "Cart item not found", "cartItemId": <id>}

#### InsufficientInventoryException
- **Thrown when:** Requested quantity exceeds available stock
- **HTTP Status:** 400 Bad Request
- **Response:** {"error": "Insufficient inventory", "productId": <id>, "requestedQuantity": <qty>, "availableQuantity": <stock>}

#### InvalidQuantityException
- **Thrown when:** Quantity is less than minimum procurement threshold or invalid
- **HTTP Status:** 400 Bad Request
- **Response:** {"error": "Invalid quantity", "minimumRequired": <threshold>}

### Error Response Structure

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient inventory for product",
  "details": {
    "productId": 123,
    "productName": "Sample Product",
    "requestedQuantity": 50,
    "availableQuantity": 30
  },
  "path": "/api/cart/items/456"
}
```

## 11. Validation Rules

### Product Validation
- `name`: Required, max length 255 characters
- `price`: Required, must be positive, max 2 decimal places
- `category`: Required, max length 100 characters
- `stockQuantity`: Required, must be non-negative integer
- `minimumProcurementThreshold`: Optional, must be positive integer if provided

### Cart Item Validation
- `quantity`: Required, must be positive integer
- `quantity`: Must be >= minimum procurement threshold if threshold exists
- `quantity`: Must be <= available stock quantity
- `purchaseType`: Required, must be one of ["subscription", "one-time"]
- `productId`: Required, must reference existing product

### Cart Validation
- `customerId`: Required, must be valid customer identifier
- Cart can only have one active instance per customer
- Cart items must reference valid products
- Cart totals must be recalculated and consistent

## 12. Service Layer Details

### ProductService Methods
- `getAllProducts()`: Retrieve all products from database
- `getProductById(Long id)`: Retrieve single product, throw exception if not found
- `createProduct(Product product)`: Validate and persist new product
- `updateProduct(Long id, Product product)`: Update existing product, throw exception if not found
- `deleteProduct(Long id)`: Delete product, throw exception if not found
- `getProductsByCategory(String category)`: Filter products by category
- `searchProducts(String keyword)`: Search products by name (case-insensitive)

### CartService Methods
- `addItemToCart(Long customerId, Long productId, String purchaseType)`: 
  - Validate product exists
  - Apply minimum procurement threshold logic
  - Determine initial quantity based on purchase type
  - Validate inventory availability
  - Create or retrieve customer cart
  - Create cart item with calculated values
  - Recalculate cart totals
  - Return created cart item

- `getCart(Long customerId)`:
  - Retrieve cart by customer ID
  - If cart not found or empty, return empty cart response with message
  - Fetch all cart items for the cart
  - Enrich cart items with product details
  - Calculate and verify totals
  - Return complete cart with items

- `updateCartItemQuantity(Long cartItemId, Integer quantity)`:
  - Validate cart item exists
  - Validate new quantity against inventory
  - Validate quantity meets minimum threshold if applicable
  - Update cart item quantity
  - Recalculate cart item subtotal
  - Recalculate cart total
  - Update cart timestamp
  - Return updated cart item

- `removeCartItem(Long cartItemId)`:
  - Validate cart item exists
  - Get associated cart ID
  - Delete cart item
  - Recalculate cart total
  - Update cart timestamp
  - If cart becomes empty, optionally delete cart or keep with zero total

- `calculateCartTotals(Long cartId)`:
  - Fetch all cart items for cart
  - Sum all cart item subtotals
  - Update cart total amount
  - Update cart updated_at timestamp
  - Return calculated total

- `validateInventory(Long productId, Integer quantity)`:
  - Fetch product by ID
  - Compare requested quantity with stock quantity
  - Return true if sufficient inventory
  - Throw InsufficientInventoryException if insufficient

- `applyMinimumProcurementThreshold(Product product, String purchaseType)`:
  - Check if product has minimum procurement threshold
  - If threshold exists and > 0, return threshold value
  - Otherwise return default quantity of 1
  - Apply same logic for both subscription and one-time purchases

- `determinePurchaseTypeQuantity(Product product, String purchaseType, Integer currentQuantity)`:
  - Validate purchase type is valid
  - Apply purchase-type-specific quantity increment rules
  - For subscription: apply subscription quantity rules
  - For one-time: apply standard quantity rules
  - Return calculated quantity

## 13. Repository Layer Details

### ProductRepository
- Extends `JpaRepository<Product, Long>`
- Custom query methods:
  - `findByCategory(String category)`: Find products by category
  - `findByNameContainingIgnoreCase(String keyword)`: Search products by name

### CartRepository
- Extends `JpaRepository<ShoppingCart, Long>`
- Custom query methods:
  - `findByCustomerId(Long customerId)`: Find cart by customer ID
  - Ensures one cart per customer through unique constraint

### CartItemRepository
- Extends `JpaRepository<CartItem, Long>`
- Custom query methods:
  - `findCartItemsByCartId(Long cartId)`: Find all items in a cart
  - `deleteCartItemById(Long cartItemId)`: Delete specific cart item
  - Supports cascade delete when cart is deleted

## 14. Controller Layer Details

### ProductController
- Base path: `/api/products`
- Handles all product management endpoints
- Returns appropriate HTTP status codes
- Implements exception handling for product operations

### CartController
- Base path: `/api/cart`
- Handles all shopping cart endpoints
- Request mappings:
  - `POST /api/cart/items`: Add item to cart
  - `GET /api/cart`: View cart (requires customerId query parameter)
  - `PUT /api/cart/items/{cartItemId}`: Update item quantity
  - `DELETE /api/cart/items/{cartItemId}`: Remove item from cart
- Returns appropriate HTTP status codes:
  - 200 OK: Successful retrieval or update
  - 201 Created: Item successfully added to cart
  - 204 No Content: Item successfully removed
  - 400 Bad Request: Validation errors (inventory, quantity)
  - 404 Not Found: Cart item or product not found
- Implements exception handling for cart operations
- Validates request payloads
- Returns enriched responses with product details

## 15. Data Models

### Product Entity
- Represents products in the e-commerce system
- Fields:
  - `id`: Primary key, auto-generated
  - `name`: Product name (required)
  - `description`: Product description (optional)
  - `price`: Product price (required, positive)
  - `category`: Product category (required)
  - `stockQuantity`: Available inventory (required, non-negative)
  - `minimumProcurementThreshold`: Minimum order quantity (optional)
  - `createdAt`: Timestamp of product creation
- Annotations: `@Entity`, `@Table(name="products")`

### ShoppingCart Entity
- Represents customer shopping carts
- Fields:
  - `cartId`: Primary key, auto-generated
  - `customerId`: Foreign key to customer (unique)
  - `totalAmount`: Calculated total of all items
  - `createdAt`: Cart creation timestamp
  - `updatedAt`: Last modification timestamp
  - `items`: One-to-many relationship with CartItem
- Annotations: `@Entity`, `@Table(name="shopping_carts")`
- Relationships: `@OneToMany(mappedBy="cartId", cascade=CascadeType.ALL)`

### CartItem Entity
- Represents individual items in shopping cart
- Fields:
  - `cartItemId`: Primary key, auto-generated
  - `cartId`: Foreign key to shopping cart
  - `productId`: Foreign key to product
  - `quantity`: Number of units (required, positive)
  - `unitPrice`: Price per unit at time of adding
  - `subtotal`: Calculated as quantity × unitPrice
  - `minimumProcurementThreshold`: Copied from product at time of adding
  - `purchaseType`: "subscription" or "one-time"
  - `addedAt`: Timestamp when item was added to cart
- Annotations: `@Entity`, `@Table(name="cart_items")`
- Relationships: 
  - `@ManyToOne` with ShoppingCart
  - `@ManyToOne` with Product

## 16. Transaction Management

### Product Operations
- All write operations (create, update, delete) are transactional
- Use `@Transactional` annotation at service layer
- Rollback on any exception

### Cart Operations
- Cart modifications are transactional
- Adding item to cart: Single transaction for cart item creation and total update
- Updating quantity: Single transaction for item update and total recalculation
- Removing item: Single transaction for item deletion and total recalculation
- Ensures data consistency across cart and cart_items tables
- Isolation level: READ_COMMITTED (default)

## 17. Performance Considerations

### Database Indexing
- Products table: Indexes on `category` and `name` for fast filtering and search
- Shopping carts table: Index on `customer_id` for fast cart retrieval
- Cart items table: Indexes on `cart_id` and `product_id` for fast joins

### Query Optimization
- Use JPA fetch strategies to avoid N+1 query problems
- Eager fetch cart items when retrieving cart for display
- Use pagination for product listing endpoints
- Implement caching for frequently accessed products

### Scalability
- Stateless service design for horizontal scaling
- Database connection pooling
- Consider Redis for cart session management in high-traffic scenarios
- Implement rate limiting on cart modification endpoints

## 18. Security Considerations

### Authentication & Authorization
- Implement JWT-based authentication (to be added)
- Ensure customers can only access their own carts
- Validate customer ID from authenticated session

### Input Validation
- Validate all user inputs at controller layer
- Sanitize product search keywords to prevent SQL injection
- Validate quantity ranges to prevent integer overflow
- Validate price values to prevent negative or excessive amounts

### Data Protection
- Use HTTPS for all API communications
- Implement CORS policies for frontend integration
- Log security-relevant events (cart modifications, inventory changes)

## 19. Testing Strategy

### Unit Tests
- Test all service layer methods with mocked repositories
- Test business logic: threshold application, quantity validation, total calculation
- Test exception scenarios: product not found, insufficient inventory

### Integration Tests
- Test complete API flows from controller to database
- Test transaction rollback scenarios
- Test concurrent cart modifications

### Test Coverage Goals
- Service layer: 90%+ coverage
- Controller layer: 85%+ coverage
- Repository layer: Custom queries tested

## 20. Future Enhancements

### Product Management
- Product image management
- Product reviews and ratings
- Product variants (size, color)
- Inventory alerts and notifications

### Shopping Cart
- Save cart for later functionality
- Cart expiration and cleanup
- Merge carts on user login
- Apply discount codes and promotions
- Gift wrapping options
- Estimated delivery dates
- Cart sharing functionality

### Performance
- Implement Redis caching for cart data
- Add GraphQL support for flexible queries
- Implement event-driven architecture for cart updates
- Add real-time cart synchronization across devices