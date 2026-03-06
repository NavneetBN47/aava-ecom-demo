## 11. Entity Relationships

### Product Entity
- Standalone entity representing products in the catalog
- Can be referenced by multiple CartItem entities through productId foreign key
- Maintains referential integrity with cart_items table

### ShoppingCart Entity
- One-to-Many relationship with CartItem (one cart contains many items)
- Each cart is associated with a single user through userId
- Cascade delete: removing cart removes all associated cart items

### CartItem Entity
- Many-to-One relationship with ShoppingCart (many items belong to one cart)
- Many-to-One relationship with Product (many cart items can reference one product)
- Links products to shopping carts with quantity and pricing information
- Foreign key constraints ensure data integrity

## 12. Error Handling

### Product Management Errors
- **ProductNotFoundException (404):** When product ID doesn't exist
- **InvalidProductDataException (400):** When product data fails validation
- **DuplicateProductException (409):** When product name already exists in category

### Shopping Cart Errors
- **CartNotFoundException (404):** When cart doesn't exist for user
- **CartItemNotFoundException (404):** When cart item ID doesn't exist
- **InvalidQuantityException (400):** When quantity is zero or negative
- **ProductOutOfStockException (400):** When requested quantity exceeds available stock
- **EmptyCartException (200):** When viewing empty cart, return success with message