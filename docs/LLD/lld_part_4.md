## 11. Cart UI Components

### 11.1 CartItem Component

```jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { updateCartItem, removeCartItem } from '../store/cartSlice';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      dispatch(updateCartItem({
        itemId: item.id,
        quantity: newQuantity
      }));
    }
  };

  const handleRemove = () => {
    dispatch(removeCartItem(item.id));
  };

  return (
    <div className="cart-item">
      <img src={item.image_url} alt={item.product_name} />
      <div className="item-details">
        <h3>{item.product_name}</h3>
        <p className="price">${item.price_at_addition.toFixed(2)}</p>
      </div>
      <div className="quantity-controls">
        <button onClick={() => handleQuantityChange(item.quantity - 1)}>
          -
        </button>
        <span>{item.quantity}</span>
        <button onClick={() => handleQuantityChange(item.quantity + 1)}>
          +
        </button>
      </div>
      <div className="item-total">
        ${item.subtotal.toFixed(2)}
      </div>
      <button onClick={handleRemove} className="remove-btn">
        Remove
      </button>
    </div>
  );
};

export default CartItem;
```

### 11.2 Cart Redux Slice

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartAPI from '../api/cartAPI';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async () => {
    const response = await cartAPI.getCart();
    return response.data;
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }) => {
    const response = await cartAPI.addItem(productId, quantity);
    return response.data;
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }) => {
    const response = await cartAPI.updateItem(itemId, quantity);
    return response.data;
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (itemId) => {
    await cartAPI.removeItem(itemId);
    return itemId;
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    totalItems: 0,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalAmount = action.payload.total_amount;
        state.totalItems = action.payload.total_items;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addToCart.fulfilled, (state) => {
        // Refetch cart after adding item
        state.loading = true;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalAmount = state.items.reduce((sum, item) => sum + item.subtotal, 0);
      });
  }
});

export default cartSlice.reducer;
```

## 12. Appendix

### 12.1 Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=dbuser
DB_PASSWORD=dbpassword

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS S3 (for product images)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=ecommerce-products
```

### 12.2 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Database indexes created
- [ ] Redis cache configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring setup (e.g., New Relic, DataDog)
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Backup strategy implemented
- [ ] Load balancer configured
- [ ] CDN setup for static assets
- [ ] Security headers configured
- [ ] CORS policies set
- [ ] API documentation published

### 12.3 Monitoring Metrics

Key metrics to monitor:

1. **Application Metrics**
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate
   - Active users

2. **Database Metrics**
   - Query execution time
   - Connection pool usage
   - Slow query log
   - Database size

3. **Business Metrics**
   - Cart abandonment rate
   - Conversion rate
   - Average order value
   - Products added to cart

4. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network throughput

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Author**: Engineering Team  
**Status**: Approved