# LLD Changes Documentation

## Story Information

**Story Key:** SCRUM-1140  
**Story Title:** Shopping Cart Management  
**Story Type:** Story  
**Project:** My Scrum Space (SCRUM)  
**Status:** To Do  
**Assignee:** Not detected from available source analysis  
**Story Points:** Not detected from available source analysis  
**Priority:** Not detected from available source analysis  

## Story Summary

As a customer, I want to add products to my shopping cart and manage quantities so that I can prepare my order for checkout.

## Acceptance Criteria Addressed

1. Given the customer is viewing a product, When they click 'Add to Cart', Then the product is added to their shopping cart with quantity 1.
2. Given the customer has items in their cart, When they view the cart, Then all added products are displayed with name, price, quantity, and subtotal.
3. Given the customer is in the shopping cart, When they update the quantity of an item, Then the subtotal and total are recalculated automatically.
4. Given the customer wants to remove an item, When they click 'Remove', Then the item is deleted from the cart and totals are updated.
5. Given the shopping cart is empty, When the customer views the cart, Then a message 'Your cart is empty' is displayed with a link to continue shopping.

## Modified Sections

### 1. Project Overview (Section 1)
- **Change:** Updated module list
- **Details:** Added "ShoppingCartManagement" to the existing "ProductManagement" module

### 2. System Architecture - Class Diagram (Section 2.1)
- **Change:** Added new classes and relationships
- **Details:** 
  - Added ShoppingCartController class with cart management endpoints
  - Added ShoppingCartService class with business logic for cart operations
  - Added ShoppingCartRepository interface for cart data access
  - Added CartItemRepository interface for cart item data access
  - Added ShoppingCart entity class
  - Added CartItem entity class
  - Established relationships between new cart components and existing product components

### 3. Entity Relationship Diagram (Section 2.2)
- **Change:** Added new database tables and relationships
- **Details:**
  - Added SHOPPING_CARTS table with customer_id, total_amount, and timestamps
  - Added CART_ITEMS table with cart_id, product_id, product details, quantity, and subtotal
  - Established one-to-many relationship between SHOPPING_CARTS and CART_ITEMS
  - Established relationship between PRODUCTS and CART_ITEMS

### 4. Sequence Diagrams (Section 3)
- **Change:** Added five new sequence diagrams
- **Details:**
  - Added "Add Product to Cart" sequence diagram (3.8)
  - Added "View Shopping Cart" sequence diagram (3.9)
  - Added "Update Cart Item Quantity" sequence diagram (3.10)
  - Added "Remove Item from Cart" sequence diagram (3.11)

### 5. API Endpoints Summary (Section 4)
- **Change:** Added new section for Shopping Cart Management Endpoints
- **Details:**
  - POST /api/cart/{customerId}/add?productId={productId} - Add product to cart
  - GET /api/cart/{customerId} - View shopping cart
  - PUT /api/cart/{customerId}/update?productId={productId}&quantity={quantity} - Update quantity
  - DELETE /api/cart/{customerId}/remove?productId={productId} - Remove item

### 6. Database Schema (Section 5)
- **Change:** Added two new database tables
- **Details:**
  - Added shopping_carts table with indexes
  - Added cart_items table with foreign keys, unique constraints, and indexes

### 7. Design Patterns Used (Section 7)
- **Change:** Added new design pattern
- **Details:** Added "Aggregate Pattern" - ShoppingCart acts as an aggregate root containing CartItems

### 8. Key Features (Section 8)
- **Change:** Added new subsection for Shopping Cart Management
- **Details:** Documented all shopping cart features including add, view, update, remove, empty cart handling, and automatic calculations

## Added Components

### Controllers
- **ShoppingCartController:** REST controller managing shopping cart HTTP endpoints

### Services
- **ShoppingCartService:** Business logic layer for cart operations including add, view, update, remove, and total calculation

### Repositories
- **ShoppingCartRepository:** Data access interface for shopping cart persistence
- **CartItemRepository:** Data access interface for cart item persistence

### Entities
- **ShoppingCart:** Entity representing a customer's shopping cart with items and total amount
- **CartItem:** Entity representing individual items in a cart with product details, quantity, and subtotal

### Database Tables
- **shopping_carts:** Stores customer cart information
- **cart_items:** Stores individual items within carts

## Updated Flows

### Add to Cart Flow
- Customer adds product to cart
- System retrieves product details
- System checks if cart exists for customer
- System checks if product already in cart
- System creates or updates cart item with quantity 1 or increments existing quantity
- System recalculates subtotal and total
- System persists changes
- System returns updated cart

### View Cart Flow
- Customer requests to view cart
- System retrieves cart by customer ID
- System checks if cart exists and has items
- System returns cart with all items or empty cart message

### Update Quantity Flow
- Customer updates item quantity
- System retrieves cart and cart item
- System updates quantity
- System recalculates subtotal and total
- System persists changes
- System returns updated cart

### Remove Item Flow
- Customer removes item from cart
- System retrieves cart and cart item
- System deletes cart item
- System recalculates total
- System persists changes
- System returns updated cart

## Integrations

### ShoppingCartService Integration with ProductService
- ShoppingCartService depends on ProductService to retrieve product details when adding items to cart
- Ensures product exists and retrieves current price and name for cart item

### Database Referential Integrity
- cart_items.cart_id references shopping_carts.id with CASCADE delete
- cart_items.product_id references products.id
- Ensures data consistency across tables

## Diagram Updates

### Class Diagram
- Added 6 new classes: ShoppingCartController, ShoppingCartService, ShoppingCartRepository, CartItemRepository, ShoppingCart, CartItem
- Added 7 new relationships showing dependencies and associations
- Integrated cart components with existing product management components

### Entity Relationship Diagram
- Added 2 new tables: SHOPPING_CARTS, CART_ITEMS
- Added 2 new relationships: SHOPPING_CARTS to CART_ITEMS (one-to-many), PRODUCTS to CART_ITEMS (one-to-many)

### Sequence Diagrams
- Added 4 new sequence diagrams covering all cart operations
- Each diagram shows complete interaction flow from client through all layers to database

## Traceability to Acceptance Criteria

| Acceptance Criteria | Implementation |
|---------------------|----------------|
| AC1: Add product to cart with quantity 1 | Implemented in "Add Product to Cart" flow (Section 3.8) and POST /api/cart/{customerId}/add endpoint |
| AC2: View cart with all product details | Implemented in "View Shopping Cart" flow (Section 3.9) and GET /api/cart/{customerId} endpoint |
| AC3: Update quantity with automatic recalculation | Implemented in "Update Cart Item Quantity" flow (Section 3.10) and PUT /api/cart/{customerId}/update endpoint |
| AC4: Remove item with total updates | Implemented in "Remove Item from Cart" flow (Section 3.11) and DELETE /api/cart/{customerId}/remove endpoint |
| AC5: Empty cart message | Implemented in "View Shopping Cart" flow (Section 3.9) with conditional logic for empty cart |

## Summary

This update adds complete shopping cart management functionality to the existing e-commerce product management system. The implementation includes 4 new REST endpoints, 6 new classes, 2 new database tables, and 4 new sequence diagrams. All acceptance criteria from the user story have been addressed with deterministic, traceable implementations. The design maintains consistency with existing patterns and integrates seamlessly with the product management module.