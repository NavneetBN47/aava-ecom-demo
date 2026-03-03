# Low Level Design Document
## E-Commerce Platform - Shopping Cart Module

**Version:** 1.4  
**Date:** 2024-01-15  
**Status:** Approved  
**Owner:** Backend Development Team

---

## 1. Document Control

### 1.1 Version History
| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-01 | John Doe | Initial draft |
| 1.1 | 2024-01-05 | Jane Smith | Added caching strategy |
| 1.2 | 2024-01-10 | Mike Johnson | Updated database schema |
| 1.3 | 2024-01-12 | Sarah Williams | Added security considerations |
| 1.4 | 2024-01-15 | John Doe | Final review and approval |

### 1.2 Approvals
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | John Doe | ✓ | 2024-01-15 |
| Architect | Jane Smith | ✓ | 2024-01-15 |
| Product Owner | Mike Johnson | ✓ | 2024-01-15 |

---

## 2. Introduction

### 2.1 Purpose
This document provides the low-level design specifications for the Shopping Cart module of the E-Commerce Platform. It details the technical implementation, data structures, APIs, and integration points required to build a scalable and performant shopping cart system.

### 2.2 Scope
The Shopping Cart module encompasses:
- Cart creation and management
- Item addition, removal, and quantity updates
- Cart persistence across sessions
- Price calculation and discount application
- Integration with inventory and pricing services
- Cart abandonment tracking

### 2.3 References
- High Level Design Document v2.1
- API Design Standards v1.5
- Database Design Guidelines v3.0
- Security Best Practices v2.0

---

## 3. System Architecture

### 3.1 Component Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Shopping Cart Service                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Cart Manager │  │ Price Engine │  │ Validator    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Redis      │    │  PostgreSQL  │    │  RabbitMQ    │
│   Cache      │    │   Database   │    │  Message Q   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 3.2 Technology Stack
- **Programming Language:** Python 3.11
- **Framework:** FastAPI 0.104.1
- **Database:** PostgreSQL 15.3
- **Cache:** Redis 7.2
- **Message Queue:** RabbitMQ 3.12
- **Container:** Docker 24.0
- **Orchestration:** Kubernetes 1.28

---

## 4. Data Design

### 4.1 Database Schema

#### 4.1.1 carts Table
```sql
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status)
);
```

#### 4.1.2 cart_items Table
```sql
CREATE TABLE cart_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);
```

#### 4.1.3 cart_discounts Table
```sql
CREATE TABLE cart_discounts (
    discount_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    coupon_code VARCHAR(50),
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_discount FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    INDEX idx_cart_id (cart_id)
);
```

### 4.2 Data Models

#### 4.2.1 Cart Model
```python
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class CartItem(BaseModel):
    item_id: UUID
    product_id: UUID
    product_name: str
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    discount_amount: Decimal = Field(ge=0, default=0)
    subtotal: Decimal = Field(ge=0)
    added_at: datetime
    updated_at: datetime

    @validator('subtotal')
    def calculate_subtotal(cls, v, values):
        if 'quantity' in values and 'unit_price' in values:
            return (values['quantity'] * values['unit_price']) - values.get('discount_amount', 0)
        return v

class CartDiscount(BaseModel):
    discount_id: UUID
    coupon_code: Optional[str]
    discount_type: str  # 'percentage', 'fixed', 'shipping'
    discount_value: Decimal = Field(ge=0)
    applied_at: datetime

class Cart(BaseModel):
    cart_id: UUID
    user_id: UUID
    session_id: Optional[str]
    status: str = 'active'  # 'active', 'abandoned', 'converted', 'expired'
    items: List[CartItem] = []
    discounts: List[CartDiscount] = []
    total_amount: Decimal = Field(ge=0)
    currency: str = 'USD'
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]

    @validator('total_amount')
    def calculate_total(cls, v, values):
        if 'items' in values and 'discounts' in values:
            items_total = sum(item.subtotal for item in values['items'])
            discount_total = sum(d.discount_value for d in values['discounts'])
            return max(items_total - discount_total, 0)
        return v
```

### 4.3 Cache Structure

#### 4.3.1 Redis Key Patterns
```
cart:{cart_id}                    # Cart object (TTL: 24 hours)
cart:user:{user_id}               # User's active cart ID (TTL: 24 hours)
cart:session:{session_id}         # Session's cart ID (TTL: 24 hours)
cart:items:{cart_id}              # Cart items list (TTL: 24 hours)
product:price:{product_id}        # Product price cache (TTL: 1 hour)
product:inventory:{product_id}    # Product inventory (TTL: 5 minutes)
```

#### 4.3.2 Cache Data Structure
```python
# Cart cache structure (JSON)
{
    "cart_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "items": [
        {
            "item_id": "770e8400-e29b-41d4-a716-446655440002",
            "product_id": "880e8400-e29b-41d4-a716-446655440003",
            "quantity": 2,
            "unit_price": 29.99,
            "subtotal": 59.98
        }
    ],
    "total_amount": 59.98,
    "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## 5. API Design

### 5.1 RESTful Endpoints

#### 5.1.1 Create Cart
```
POST /api/v1/cart
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "session_id": "sess_abc123xyz"
}

Response (201 Created):
{
    "cart_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "active",
    "items": [],
    "total_amount": 0.00,
    "currency": "USD",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-16T10:30:00Z"
}
```

#### 5.1.2 Get Cart
```
GET /api/v1/cart/{cart_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "cart_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "active",
    "items": [
        {
            "item_id": "770e8400-e29b-41d4-a716-446655440002",
            "product_id": "880e8400-e29b-41d4-a716-446655440003",
            "product_name": "Wireless Mouse",
            "quantity": 2,
            "unit_price": 29.99,
            "discount_amount": 0.00,
            "subtotal": 59.98
        }
    ],
    "discounts": [],
    "total_amount": 59.98,
    "currency": "USD",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z",
    "expires_at": "2024-01-16T10:30:00Z"
}
```

#### 5.1.3 Add Item to Cart
```
POST /api/v1/cart/{cart_id}/items
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "quantity": 2
}

Response (201 Created):
{
    "item_id": "770e8400-e29b-41d4-a716-446655440002",
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "product_name": "Wireless Mouse",
    "quantity": 2,
    "unit_price": 29.99,
    "discount_amount": 0.00,
    "subtotal": 59.98,
    "added_at": "2024-01-15T10:35:00Z"
}
```

#### 5.1.4 Update Item Quantity
```
PUT /api/v1/cart/{cart_id}/items/{item_id}
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
    "quantity": 3
}

Response (200 OK):
{
    "item_id": "770e8400-e29b-41d4-a716-446655440002",
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "product_name": "Wireless Mouse",
    "quantity": 3,
    "unit_price": 29.99,
    "discount_amount": 0.00,
    "subtotal": 89.97,
    "updated_at": "2024-01-15T10:40:00Z"
}
```

#### 5.1.5 Remove Item from Cart
```
DELETE /api/v1/cart/{cart_id}/items/{item_id}
Authorization: Bearer {token}

Response (204 No Content)
```

#### 5.1.6 Apply Discount
```
POST /api/v1/cart/{cart_id}/discounts
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
    "coupon_code": "SAVE10"
}

Response (200 OK):
{
    "discount_id": "990e8400-e29b-41d4-a716-446655440004",
    "coupon_code": "SAVE10",
    "discount_type": "percentage",
    "discount_value": 8.99,
    "applied_at": "2024-01-15T10:45:00Z",
    "new_total": 80.98
}
```

#### 5.1.7 Clear Cart
```
DELETE /api/v1/cart/{cart_id}
Authorization: Bearer {token}

Response (204 No Content)
```

### 5.2 Error Responses

```python
# Standard error response format
{
    "error": {
        "code": "CART_NOT_FOUND",
        "message": "Cart with ID 550e8400-e29b-41d4-a716-446655440000 not found",
        "details": {},
        "timestamp": "2024-01-15T10:50:00Z"
    }
}

# Error codes
CODE_MAP = {
    "CART_NOT_FOUND": 404,
    "ITEM_NOT_FOUND": 404,
    "INVALID_QUANTITY": 400,
    "PRODUCT_OUT_OF_STOCK": 409,
    "INVALID_COUPON": 400,
    "CART_EXPIRED": 410,
    "UNAUTHORIZED": 401,
    "INTERNAL_ERROR": 500
}
```

---

## 6. Component Design

### 6.1 Cart Manager

```python
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
import asyncio

class CartManager:
    """
    Core component responsible for cart lifecycle management.
    """
    
    def __init__(self, db_service, cache_service, event_bus):
        self.db = db_service
        self.cache = cache_service
        self.event_bus = event_bus
        self.cart_ttl = 86400  # 24 hours
    
    async def create_cart(self, user_id: UUID, session_id: Optional[str] = None) -> Cart:
        """
        Create a new shopping cart for a user.
        
        Args:
            user_id: User identifier
            session_id: Optional session identifier for guest users
            
        Returns:
            Cart: Newly created cart object
            
        Raises:
            DatabaseError: If cart creation fails
        """
        cart_data = {
            'user_id': user_id,
            'session_id': session_id,
            'status': 'active',
            'total_amount': Decimal('0.00'),
            'currency': 'USD'
        }
        
        # Create cart in database
        cart = await self.db.create_cart(cart_data)
        
        # Cache the cart
        await self.cache.set(
            f"cart:{cart.cart_id}",
            cart.dict(),
            ttl=self.cart_ttl
        )
        
        # Set user/session mapping
        await self.cache.set(
            f"cart:user:{user_id}",
            str(cart.cart_id),
            ttl=self.cart_ttl
        )
        
        # Publish cart created event
        await self.event_bus.publish('cart.created', {
            'cart_id': str(cart.cart_id),
            'user_id': str(user_id),
            'timestamp': cart.created_at.isoformat()
        })
        
        return cart
    
    async def get_cart(self, cart_id: UUID) -> Optional[Cart]:
        """
        Retrieve cart by ID with cache-aside pattern.
        
        Args:
            cart_id: Cart identifier
            
        Returns:
            Cart object if found, None otherwise
        """
        # Try cache first
        cached_cart = await self.cache.get(f"cart:{cart_id}")
        if cached_cart:
            return Cart(**cached_cart)
        
        # Fallback to database
        cart = await self.db.get_cart(cart_id)
        if cart:
            # Populate cache
            await self.cache.set(
                f"cart:{cart_id}",
                cart.dict(),
                ttl=self.cart_ttl
            )
        
        return cart
    
    async def add_item(self, cart_id: UUID, product_id: UUID, quantity: int) -> CartItem:
        """
        Add item to cart with inventory validation.
        
        Args:
            cart_id: Cart identifier
            product_id: Product identifier
            quantity: Quantity to add
            
        Returns:
            CartItem: Added cart item
            
        Raises:
            CartNotFoundError: If cart doesn't exist
            ProductOutOfStockError: If insufficient inventory
            InvalidQuantityError: If quantity is invalid
        """
        # Validate cart exists
        cart = await self.get_cart(cart_id)
        if not cart:
            raise CartNotFoundError(f"Cart {cart_id} not found")
        
        # Validate quantity
        if quantity <= 0:
            raise InvalidQuantityError("Quantity must be positive")
        
        # Check inventory
        available = await self._check_inventory(product_id)
        if available < quantity:
            raise ProductOutOfStockError(
                f"Only {available} units available for product {product_id}"
            )
        
        # Get product price
        price = await self._get_product_price(product_id)
        
        # Check if item already exists in cart
        existing_item = await self.db.get_cart_item(cart_id, product_id)
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            item = await self.update_item_quantity(
                cart_id,
                existing_item.item_id,
                new_quantity
            )
        else:
            # Create new item
            item_data = {
                'cart_id': cart_id,
                'product_id': product_id,
                'quantity': quantity,
                'unit_price': price,
                'subtotal': price * quantity
            }
            item = await self.db.create_cart_item(item_data)
        
        # Invalidate cart cache
        await self.cache.delete(f"cart:{cart_id}")
        
        # Publish item added event
        await self.event_bus.publish('cart.item_added', {
            'cart_id': str(cart_id),
            'product_id': str(product_id),
            'quantity': quantity,
            'timestamp': item.added_at.isoformat()
        })
        
        return item
    
    async def update_item_quantity(
        self,
        cart_id: UUID,
        item_id: UUID,
        quantity: int
    ) -> CartItem:
        """
        Update quantity of an existing cart item.
        
        Args:
            cart_id: Cart identifier
            item_id: Cart item identifier
            quantity: New quantity
            
        Returns:
            CartItem: Updated cart item
            
        Raises:
            ItemNotFoundError: If item doesn't exist
            InvalidQuantityError: If quantity is invalid
            ProductOutOfStockError: If insufficient inventory
        """
        # Validate quantity
        if quantity <= 0:
            raise InvalidQuantityError("Quantity must be positive")
        
        # Get existing item
        item = await self.db.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart_id:
            raise ItemNotFoundError(f"Item {item_id} not found in cart {cart_id}")
        
        # Check inventory
        available = await self._check_inventory(item.product_id)
        if available < quantity:
            raise ProductOutOfStockError(
                f"Only {available} units available"
            )
        
        # Update item
        item.quantity = quantity
        item.subtotal = item.unit_price * quantity
        updated_item = await self.db.update_cart_item(item)
        
        # Invalidate cart cache
        await self.cache.delete(f"cart:{cart_id}")
        
        # Publish item updated event
        await self.event_bus.publish('cart.item_updated', {
            'cart_id': str(cart_id),
            'item_id': str(item_id),
            'quantity': quantity,
            'timestamp': updated_item.updated_at.isoformat()
        })
        
        return updated_item
    
    async def remove_item(self, cart_id: UUID, item_id: UUID) -> None:
        """
        Remove item from cart.
        
        Args:
            cart_id: Cart identifier
            item_id: Cart item identifier
            
        Raises:
            ItemNotFoundError: If item doesn't exist
        """
        # Verify item exists and belongs to cart
        item = await self.db.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart_id:
            raise ItemNotFoundError(f"Item {item_id} not found in cart {cart_id}")
        
        # Delete item
        await self.db.delete_cart_item(item_id)
        
        # Invalidate cart cache
        await self.cache.delete(f"cart:{cart_id}")
        
        # Publish item removed event
        await self.event_bus.publish('cart.item_removed', {
            'cart_id': str(cart_id),
            'item_id': str(item_id),
            'product_id': str(item.product_id),
            'timestamp': datetime.utcnow().isoformat()
        })
    
    async def clear_cart(self, cart_id: UUID) -> None:
        """
        Remove all items from cart.
        
        Args:
            cart_id: Cart identifier
        """
        await self.db.delete_all_cart_items(cart_id)
        await self.cache.delete(f"cart:{cart_id}")
        
        await self.event_bus.publish('cart.cleared', {
            'cart_id': str(cart_id),
            'timestamp': datetime.utcnow().isoformat()
        })
    
    async def _check_inventory(self, product_id: UUID) -> int:
        """
        Check product inventory availability.
        
        Args:
            product_id: Product identifier
            
        Returns:
            int: Available quantity
        """
        # Try cache first
        cached_inventory = await self.cache.get(f"product:inventory:{product_id}")
        if cached_inventory is not None:
            return int(cached_inventory)
        
        # Call inventory service
        inventory = await self.inventory_service.get_available_quantity(product_id)
        
        # Cache for 5 minutes
        await self.cache.set(
            f"product:inventory:{product_id}",
            inventory,
            ttl=300
        )
        
        return inventory
    
    async def _get_product_price(self, product_id: UUID) -> Decimal:
        """
        Get current product price.
        
        Args:
            product_id: Product identifier
            
        Returns:
            Decimal: Product price
        """
        # Try cache first
        cached_price = await self.cache.get(f"product:price:{product_id}")
        if cached_price is not None:
            return Decimal(cached_price)
        
        # Call pricing service
        price = await self.pricing_service.get_price(product_id)
        
        # Cache for 1 hour
        await self.cache.set(
            f"product:price:{product_id}",
            str(price),
            ttl=3600
        )
        
        return price
```

### 6.2 Price Engine

```python
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

class PriceEngine:
    """
    Component responsible for price calculations and discount application.
    """
    
    def __init__(self, db_service, discount_service):
        self.db = db_service
        self.discount_service = discount_service
    
    async def calculate_cart_total(self, cart_id: UUID) -> Decimal:
        """
        Calculate total cart amount including all discounts.
        
        Args:
            cart_id: Cart identifier
            
        Returns:
            Decimal: Total cart amount
        """
        # Get cart items
        items = await self.db.get_cart_items(cart_id)
        
        # Calculate items subtotal
        items_total = sum(item.subtotal for item in items)
        
        # Get applied discounts
        discounts = await self.db.get_cart_discounts(cart_id)
        
        # Calculate discount total
        discount_total = Decimal('0.00')
        for discount in discounts:
            if discount.discount_type == 'percentage':
                discount_total += items_total * (discount.discount_value / 100)
            elif discount.discount_type == 'fixed':
                discount_total += discount.discount_value
        
        # Calculate final total
        total = max(items_total - discount_total, Decimal('0.00'))
        
        # Update cart total
        await self.db.update_cart_total(cart_id, total)
        
        return total
    
    async def apply_coupon(
        self,
        cart_id: UUID,
        coupon_code: str
    ) -> CartDiscount:
        """
        Apply coupon code to cart.
        
        Args:
            cart_id: Cart identifier
            coupon_code: Coupon code to apply
            
        Returns:
            CartDiscount: Applied discount details
            
        Raises:
            InvalidCouponError: If coupon is invalid or expired
        """
        # Validate coupon
        coupon = await self.discount_service.validate_coupon(coupon_code)
        if not coupon:
            raise InvalidCouponError(f"Invalid coupon code: {coupon_code}")
        
        # Check if coupon already applied
        existing = await self.db.get_cart_discount_by_coupon(cart_id, coupon_code)
        if existing:
            raise InvalidCouponError("Coupon already applied")
        
        # Calculate discount amount
        cart_total = await self.calculate_cart_total(cart_id)
        
        if coupon.discount_type == 'percentage':
            discount_value = cart_total * (coupon.discount_percentage / 100)
        else:
            discount_value = coupon.discount_amount
        
        # Create discount record
        discount_data = {
            'cart_id': cart_id,
            'coupon_code': coupon_code,
            'discount_type': coupon.discount_type,
            'discount_value': discount_value
        }
        discount = await self.db.create_cart_discount(discount_data)
        
        # Recalculate cart total
        await self.calculate_cart_total(cart_id)
        
        return discount
    
    async def remove_discount(
        self,
        cart_id: UUID,
        discount_id: UUID
    ) -> None:
        """
        Remove discount from cart.
        
        Args:
            cart_id: Cart identifier
            discount_id: Discount identifier
        """
        await self.db.delete_cart_discount(discount_id)
        await self.calculate_cart_total(cart_id)
```

### 6.3 Cart Validator

```python
from typing import List
from uuid import UUID

class CartValidator:
    """
    Component responsible for cart validation and business rules.
    """
    
    def __init__(self, db_service, inventory_service):
        self.db = db_service
        self.inventory_service = inventory_service
        self.max_items_per_cart = 100
        self.max_quantity_per_item = 99
    
    async def validate_cart(self, cart_id: UUID) -> dict:
        """
        Validate entire cart for checkout readiness.
        
        Args:
            cart_id: Cart identifier
            
        Returns:
            dict: Validation result with errors if any
        """
        errors = []
        warnings = []
        
        # Get cart and items
        cart = await self.db.get_cart(cart_id)
        if not cart:
            return {
                'valid': False,
                'errors': ['Cart not found'],
                'warnings': []
            }
        
        items = await self.db.get_cart_items(cart_id)
        
        # Check if cart is empty
        if not items:
            errors.append('Cart is empty')
        
        # Check max items limit
        if len(items) > self.max_items_per_cart:
            errors.append(f'Cart exceeds maximum of {self.max_items_per_cart} items')
        
        # Validate each item
        for item in items:
            # Check quantity limits
            if item.quantity > self.max_quantity_per_item:
                errors.append(
                    f'Item {item.product_id} exceeds maximum quantity of {self.max_quantity_per_item}'
                )
            
            # Check inventory availability
            available = await self.inventory_service.get_available_quantity(
                item.product_id
            )
            if available < item.quantity:
                errors.append(
                    f'Insufficient inventory for product {item.product_id}. '
                    f'Available: {available}, Requested: {item.quantity}'
                )
            elif available < item.quantity * 1.5:
                warnings.append(
                    f'Low inventory for product {item.product_id}'
                )
            
            # Validate product is still active
            product = await self.db.get_product(item.product_id)
            if not product or not product.is_active:
                errors.append(
                    f'Product {item.product_id} is no longer available'
                )
            
            # Check price changes
            current_price = await self.pricing_service.get_price(item.product_id)
            if current_price != item.unit_price:
                warnings.append(
                    f'Price changed for product {item.product_id}. '
                    f'Old: {item.unit_price}, New: {current_price}'
                )
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    async def validate_item_addition(
        self,
        cart_id: UUID,
        product_id: UUID,
        quantity: int
    ) -> dict:
        """
        Validate if item can be added to cart.
        
        Args:
            cart_id: Cart identifier
            product_id: Product identifier
            quantity: Quantity to add
            
        Returns:
            dict: Validation result
        """
        errors = []
        
        # Check quantity
        if quantity <= 0:
            errors.append('Quantity must be positive')
        elif quantity > self.max_quantity_per_item:
            errors.append(f'Quantity exceeds maximum of {self.max_quantity_per_item}')
        
        # Check product exists and is active
        product = await self.db.get_product(product_id)
        if not product:
            errors.append('Product not found')
        elif not product.is_active:
            errors.append('Product is not available')
        
        # Check inventory
        if product:
            available = await self.inventory_service.get_available_quantity(product_id)
            if available < quantity:
                errors.append(
                    f'Insufficient inventory. Available: {available}'
                )
        
        # Check cart item count
        items = await self.db.get_cart_items(cart_id)
        if len(items) >= self.max_items_per_cart:
            errors.append(f'Cart has reached maximum of {self.max_items_per_cart} items')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
```

---

## 7. Integration Points

### 7.1 External Services

#### 7.1.1 Inventory Service
```python
class InventoryServiceClient:
    """
    Client for inventory service integration.
    """
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = 5  # seconds
    
    async def get_available_quantity(self, product_id: UUID) -> int:
        """
        Get available inventory for a product.
        
        Args:
            product_id: Product identifier
            
        Returns:
            int: Available quantity
        """
        url = f"{self.base_url}/api/v1/inventory/{product_id}"
        headers = {'X-API-Key': self.api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data['available_quantity']
    
    async def reserve_inventory(
        self,
        product_id: UUID,
        quantity: int,
        reservation_id: UUID
    ) -> bool:
        """
        Reserve inventory for checkout.
        
        Args:
            product_id: Product identifier
            quantity: Quantity to reserve
            reservation_id: Unique reservation identifier
            
        Returns:
            bool: True if reservation successful
        """
        url = f"{self.base_url}/api/v1/inventory/reserve"
        headers = {'X-API-Key': self.api_key}
        payload = {
            'product_id': str(product_id),
            'quantity': quantity,
            'reservation_id': str(reservation_id)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            return response.status_code == 200
```

#### 7.1.2 Pricing Service
```python
class PricingServiceClient:
    """
    Client for pricing service integration.
    """
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = 5
    
    async def get_price(self, product_id: UUID) -> Decimal:
        """
        Get current price for a product.
        
        Args:
            product_id: Product identifier
            
        Returns:
            Decimal: Product price
        """
        url = f"{self.base_url}/api/v1/pricing/{product_id}"
        headers = {'X-API-Key': self.api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return Decimal(str(data['price']))
    
    async def get_bulk_prices(
        self,
        product_ids: List[UUID]
    ) -> dict[UUID, Decimal]:
        """
        Get prices for multiple products.
        
        Args:
            product_ids: List of product identifiers
            
        Returns:
            dict: Mapping of product_id to price
        """
        url = f"{self.base_url}/api/v1/pricing/bulk"
        headers = {'X-API-Key': self.api_key}
        payload = {'product_ids': [str(pid) for pid in product_ids]}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return {
                UUID(pid): Decimal(str(price))
                for pid, price in data['prices'].items()
            }
```

### 7.2 Event Publishing

```python
from typing import Dict, Any
import json

class EventBus:
    """
    Event bus for publishing cart events to message queue.
    """
    
    def __init__(self, rabbitmq_connection):
        self.connection = rabbitmq_connection
        self.exchange = 'cart_events'
    
    async def publish(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Publish event to message queue.
        
        Args:
            event_type: Type of event (e.g., 'cart.created')
            payload: Event payload
        """
        message = {
            'event_type': event_type,
            'payload': payload,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        await self.connection.publish(
            exchange=self.exchange,
            routing_key=event_type,
            body=json.dumps(message)
        )

# Event types
EVENT_TYPES = [
    'cart.created',
    'cart.updated',
    'cart.cleared',
    'cart.abandoned',
    'cart.converted',
    'cart.item_added',
    'cart.item_removed',
    'cart.item_updated',
    'cart.discount_applied',
    'cart.discount_removed'
]
```

---

## 8. Performance Optimization

### 8.1 Caching Strategy

```python
class CacheStrategy:
    """
    Implements multi-level caching for cart operations.
    """
    
    # Cache TTLs (in seconds)
    CART_TTL = 86400  # 24 hours
    PRODUCT_PRICE_TTL = 3600  # 1 hour
    PRODUCT_INVENTORY_TTL = 300  # 5 minutes
    USER_CART_MAPPING_TTL = 86400  # 24 hours
    
    # Cache key patterns
    CART_KEY = "cart:{cart_id}"
    USER_CART_KEY = "cart:user:{user_id}"
    SESSION_CART_KEY = "cart:session:{session_id}"
    PRODUCT_PRICE_KEY = "product:price:{product_id}"
    PRODUCT_INVENTORY_KEY = "product:inventory:{product_id}"
    
    @staticmethod
    def get_cart_key(cart_id: UUID) -> str:
        return f"cart:{cart_id}"
    
    @staticmethod
    def get_user_cart_key(user_id: UUID) -> str:
        return f"cart:user:{user_id}"
    
    @staticmethod
    async def invalidate_cart_cache(cache_service, cart_id: UUID) -> None:
        """
        Invalidate all cache entries related to a cart.
        """
        keys_to_delete = [
            f"cart:{cart_id}",
            f"cart:items:{cart_id}"
        ]
        await cache_service.delete_many(keys_to_delete)
```

### 8.2 Database Optimization

```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_carts_user_status 
    ON carts(user_id, status) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_carts_expires_at 
    ON carts(expires_at) 
    WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_cart_items_cart_product 
    ON cart_items(cart_id, product_id);

CREATE INDEX CONCURRENTLY idx_cart_items_updated_at 
    ON cart_items(updated_at DESC);

-- Partitioning for cart_items (by month)
CREATE TABLE cart_items_y2024m01 PARTITION OF cart_items
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE cart_items_y2024m02 PARTITION OF cart_items
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Materialized view for cart analytics
CREATE MATERIALIZED VIEW cart_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_carts,
    COUNT(*) FILTER (WHERE status = 'converted') as converted_carts,
    COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_carts,
    AVG(total_amount) as avg_cart_value
FROM carts
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX ON cart_analytics(date);
```

### 8.3 Query Optimization

```python
class OptimizedQueries:
    """
    Optimized database queries for cart operations.
    """
    
    @staticmethod
    async def get_cart_with_items(db, cart_id: UUID) -> Optional[Cart]:
        """
        Fetch cart with all items in a single query using JOIN.
        """
        query = """
            SELECT 
                c.*,
                json_agg(
                    json_build_object(
                        'item_id', ci.item_id,
                        'product_id', ci.product_id,
                        'quantity', ci.quantity,
                        'unit_price', ci.unit_price,
                        'subtotal', ci.subtotal
                    )
                ) FILTER (WHERE ci.item_id IS NOT NULL) as items
            FROM carts c
            LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
            WHERE c.cart_id = $1
            GROUP BY c.cart_id
        """
        result = await db.fetchrow(query, cart_id)
        return Cart(**result) if result else None
    
    @staticmethod
    async def bulk_update_prices(db, price_updates: List[dict]) -> None:
        """
        Bulk update item prices using UNNEST.
        """
        query = """
            UPDATE cart_items ci
            SET 
                unit_price = u.new_price,
                subtotal = quantity * u.new_price,
                updated_at = CURRENT_TIMESTAMP
            FROM (
                SELECT 
                    UNNEST($1::uuid[]) as item_id,
                    UNNEST($2::decimal[]) as new_price
            ) u
            WHERE ci.item_id = u.item_id
        """
        item_ids = [u['item_id'] for u in price_updates]
        new_prices = [u['new_price'] for u in price_updates]
        await db.execute(query, item_ids, new_prices)
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

class SecurityManager:
    """
    Handles authentication and authorization for cart operations.
    """
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    async def verify_token(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        """
        Verify JWT token and extract user information.
        
        Args:
            credentials: HTTP authorization credentials
            
        Returns:
            dict: Decoded token payload
            
        Raises:
            HTTPException: If token is invalid
        """
        try:
            payload = jwt.decode(
                credentials.credentials,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    
    async def verify_cart_ownership(
        self,
        cart_id: UUID,
        user_id: UUID,
        db_service
    ) -> bool:
        """
        Verify that user owns the cart.
        
        Args:
            cart_id: Cart identifier
            user_id: User identifier
            db_service: Database service
            
        Returns:
            bool: True if user owns cart
            
        Raises:
            HTTPException: If user doesn't own cart
        """
        cart = await db_service.get_cart(cart_id)
        if not cart or cart.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this cart"
            )
        return True
```

### 9.2 Input Validation

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID

class AddItemRequest(BaseModel):
    """Request model for adding item to cart."""
    
    product_id: UUID = Field(..., description="Product identifier")
    quantity: int = Field(..., gt=0, le=99, description="Quantity to add")
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        if v > 99:
            raise ValueError('Quantity cannot exceed 99')
        return v

class UpdateQuantityRequest(BaseModel):
    """Request model for updating item quantity."""
    
    quantity: int = Field(..., gt=0, le=99)
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        if v > 99:
            raise ValueError('Quantity cannot exceed 99')
        return v

class ApplyCouponRequest(BaseModel):
    """Request model for applying coupon."""
    
    coupon_code: str = Field(..., min_length=3, max_length=50)
    
    @validator('coupon_code')
    def validate_coupon_code(cls, v):
        # Only allow alphanumeric and hyphens
        if not v.replace('-', '').isalnum():
            raise ValueError('Invalid coupon code format')
        return v.upper()
```

### 9.3 Rate Limiting

```python
from fastapi import Request
from datetime import datetime, timedelta
import asyncio

class RateLimiter:
    """
    Implements rate limiting for cart operations.
    """
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.limits = {
            'add_item': (10, 60),  # 10 requests per 60 seconds
            'update_item': (20, 60),
            'remove_item': (20, 60),
            'get_cart': (100, 60)
        }
    
    async def check_rate_limit(
        self,
        user_id: UUID,
        operation: str,
        request: Request
    ) -> bool:
        """
        Check if request is within rate limit.
        
        Args:
            user_id: User identifier
            operation: Operation name
            request: FastAPI request object
            
        Returns:
            bool: True if within limit
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        if operation not in self.limits:
            return True
        
        max_requests, window = self.limits[operation]
        key = f"ratelimit:{user_id}:{operation}"
        
        # Increment counter
        current = await self.redis.incr(key)
        
        if current == 1:
            # Set expiry on first request
            await self.redis.expire(key, window)
        
        if current > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {operation}"
            )
        
        return True
```

---

## 10. Error Handling

### 10.1 Custom Exceptions

```python
class CartException(Exception):
    """Base exception for cart operations."""
    pass

class CartNotFoundError(CartException):
    """Raised when cart is not found."""
    pass

class ItemNotFoundError(CartException):
    """Raised when cart item is not found."""
    pass

class InvalidQuantityError(CartException):
    """Raised when quantity is invalid."""
    pass

class ProductOutOfStockError(CartException):
    """Raised when product is out of stock."""
    pass

class InvalidCouponError(CartException):
    """Raised when coupon is invalid."""
    pass

class CartExpiredError(CartException):
    """Raised when cart has expired."""
    pass
```

### 10.2 Error Handler

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app: FastAPI):
    """
    Register global error handlers for the application.
    """
    
    @app.exception_handler(CartNotFoundError)
    async def cart_not_found_handler(request: Request, exc: CartNotFoundError):
        logger.warning(f"Cart not found: {exc}")
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "code": "CART_NOT_FOUND",
                    "message": str(exc),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    
    @app.exception_handler(ProductOutOfStockError)
    async def out_of_stock_handler(request: Request, exc: ProductOutOfStockError):
        logger.warning(f"Product out of stock: {exc}")
        return JSONResponse(
            status_code=409,
            content={
                "error": {
                    "code": "PRODUCT_OUT_OF_STOCK",
                    "message": str(exc),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    
    @app.exception_handler(InvalidCouponError)
    async def invalid_coupon_handler(request: Request, exc: InvalidCouponError):
        logger.warning(f"Invalid coupon: {exc}")
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "INVALID_COUPON",
                    "message": str(exc),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An internal error occurred",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```python
import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4
from decimal import Decimal

@pytest.mark.asyncio
class TestCartManager:
    """Unit tests for CartManager component."""
    
    async def test_create_cart_success(self):
        """Test successful cart creation."""
        # Arrange
        user_id = uuid4()
        mock_db = AsyncMock()
        mock_cache = AsyncMock()
        mock_event_bus = AsyncMock()
        
        cart_manager = CartManager(mock_db, mock_cache, mock_event_bus)
        
        expected_cart = Cart(
            cart_id=uuid4(),
            user_id=user_id,
            status='active',
            items=[],
            total_amount=Decimal('0.00')
        )
        mock_db.create_cart.return_value = expected_cart
        
        # Act
        result = await cart_manager.create_cart(user_id)
        
        # Assert
        assert result.user_id == user_id
        assert result.status == 'active'
        mock_db.create_cart.assert_called_once()
        mock_cache.set.assert_called()
        mock_event_bus.publish.assert_called_with(
            'cart.created',
            {'cart_id': str(result.cart_id), 'user_id': str(user_id)}
        )
    
    async def test_add_item_success(self):
        """Test successful item addition to cart."""
        # Arrange
        cart_id = uuid4()
        product_id = uuid4()
        quantity = 2
        
        mock_db = AsyncMock()
        mock_cache = AsyncMock()
        mock_event_bus = AsyncMock()
        
        cart_manager = CartManager(mock_db, mock_cache, mock_event_bus)
        cart_manager._check_inventory = AsyncMock(return_value=10)
        cart_manager._get_product_price = AsyncMock(return_value=Decimal('29.99'))
        
        mock_cart = Cart(
            cart_id=cart_id,
            user_id=uuid4(),
            status='active',
            items=[],
            total_amount=Decimal('0.00')
        )
        mock_db.get_cart.return_value = mock_cart
        mock_db.get_cart_item.return_value = None
        
        expected_item = CartItem(
            item_id=uuid4(),
            product_id=product_id,
            quantity=quantity,
            unit_price=Decimal('29.99'),
            subtotal=Decimal('59.98')
        )
        mock_db.create_cart_item.return_value = expected_item
        
        # Act
        result = await cart_manager.add_item(cart_id, product_id, quantity)
        
        # Assert
        assert result.product_id == product_id
        assert result.quantity == quantity
        assert result.subtotal == Decimal('59.98')
        mock_db.create_cart_item.assert_called_once()
    
    async def test_add_item_out_of_stock(self):
        """Test adding item when out of stock."""
        # Arrange
        cart_id = uuid4()
        product_id = uuid4()
        quantity = 10
        
        mock_db = AsyncMock()
        mock_cache = AsyncMock()
        mock_event_bus = AsyncMock()
        
        cart_manager = CartManager(mock_db, mock_cache, mock_event_bus)
        cart_manager._check_inventory = AsyncMock(return_value=5)  # Only 5 available
        
        mock_cart = Cart(
            cart_id=cart_id,
            user_id=uuid4(),
            status='active',
            items=[],
            total_amount=Decimal('0.00')
        )
        mock_db.get_cart.return_value = mock_cart
        
        # Act & Assert
        with pytest.raises(ProductOutOfStockError):
            await cart_manager.add_item(cart_id, product_id, quantity)
```

### 11.2 Integration Tests

```python
import pytest
from httpx import AsyncClient
from uuid import uuid4

@pytest.mark.asyncio
class TestCartAPI:
    """Integration tests for Cart API endpoints."""
    
    async def test_create_and_get_cart(self, client: AsyncClient, auth_token: str):
        """Test cart creation and retrieval flow."""
        # Create cart
        response = await client.post(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"user_id": str(uuid4())}
        )
        assert response.status_code == 201
        cart_data = response.json()
        cart_id = cart_data['cart_id']
        
        # Get cart
        response = await client.get(
            f"/api/v1/cart/{cart_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json()['cart_id'] == cart_id
    
    async def test_add_item_to_cart(self, client: AsyncClient, auth_token: str):
        """Test adding item to cart."""
        # Create cart first
        cart_response = await client.post(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"user_id": str(uuid4())}
        )
        cart_id = cart_response.json()['cart_id']
        
        # Add item
        response = await client.post(
            f"/api/v1/cart/{cart_id}/items",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": str(uuid4()),
                "quantity": 2
            }
        )
        assert response.status_code == 201
        item_data = response.json()
        assert item_data['quantity'] == 2
```

---

## 12. Deployment

### 12.1 Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 12.2 Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-service
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cart-service
  template:
    metadata:
      labels:
        app: cart-service
    spec:
      containers:
      - name: cart-service
        image: cart-service:1.4
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cart-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: cart-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: cart-service
  namespace: ecommerce
spec:
  selector:
    app: cart-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
```

---

## 13. Monitoring & Logging

### 13.1 Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
cart_operations = Counter(
    'cart_operations_total',
    'Total cart operations',
    ['operation', 'status']
)

cart_operation_duration = Histogram(
    'cart_operation_duration_seconds',
    'Cart operation duration',
    ['operation']
)

active_carts = Gauge(
    'active_carts_total',
    'Number of active carts'
)

cart_value = Histogram(
    'cart_value_dollars',
    'Cart value distribution'
)

# Usage in code
async def add_item_with_metrics(cart_id, product_id, quantity):
    with cart_operation_duration.labels(operation='add_item').time():
        try:
            result = await cart_manager.add_item(cart_id, product_id, quantity)
            cart_operations.labels(operation='add_item', status='success').inc()
            return result
        except Exception as e:
            cart_operations.labels(operation='add_item', status='error').inc()
            raise
```

### 13.2 Logging Configuration

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if hasattr(record, 'cart_id'):
            log_data['cart_id'] = record.cart_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler()
    ]
)

for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())

logger = logging.getLogger(__name__)
```

---

## 14. Appendices

### 14.1 Glossary

| Term | Definition |
|------|------------|
| Cart | A temporary container for products a user intends to purchase |
| Cart Item | A product added to a cart with specific quantity |
| Session | A temporary identifier for guest users |
| Coupon | A code that provides discounts on cart total |
| Abandonment | When a user leaves items in cart without completing purchase |
| Conversion | When a cart is successfully checked out |

### 14.2 References

1. FastAPI Documentation: https://fastapi.tiangolo.com/
2. PostgreSQL Documentation: https://www.postgresql.org/docs/
3. Redis Documentation: https://redis.io/documentation
4. Pydantic Documentation: https://docs.pydantic.dev/
5. Docker Documentation: https://docs.docker.com/
6. Kubernetes Documentation: https://kubernetes.io/docs/

---

**Document End**