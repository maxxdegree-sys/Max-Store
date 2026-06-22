import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],          // [{ id, slug, title, price, image, qty, variant }]
  coupon: null,       // { code, percent }
  shipping: 0
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, { payload }) {
      const existing = state.items.find(
        (i) => i.id === payload.id && i.variant === payload.variant
      );
      if (existing) existing.qty += payload.qty || 1;
      else state.items.push({ ...payload, qty: payload.qty || 1 });
    },
    removeFromCart(state, { payload }) {
      state.items = state.items.filter((i) => i.id !== payload);
    },
    updateQty(state, { payload }) {
      const item = state.items.find((i) => i.id === payload.id);
      if (item) item.qty = Math.max(1, payload.qty);
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
    },
    applyCoupon(state, { payload }) {
      state.coupon = payload;
    },
    setShipping(state, { payload }) {
      state.shipping = payload;
    }
  }
});

export const { addToCart, removeFromCart, updateQty, clearCart, applyCoupon, setShipping } = cartSlice.actions;

// Selectors
export const selectCartItems    = (s) => s.cart.items;
export const selectCartCount    = (s) => s.cart.items.reduce((n, i) => n + i.qty, 0);
export const selectCartSubtotal = (s) => s.cart.items.reduce((n, i) => n + i.price * i.qty, 0);
export const selectCartDiscount = (s) => {
  const sub = selectCartSubtotal(s);
  const c = s.cart.coupon;
  if (!c) return 0;
  if (c.percent > 0) return Math.round((sub * c.percent) / 100);
  if (c.fixedAmount > 0) return Math.min(c.fixedAmount, sub);
  return c.discount || 0;
};
export const selectCartCoupon    = (s) => s.cart.coupon;
export const selectCartTotal    = (s) => selectCartSubtotal(s) - selectCartDiscount(s) + s.cart.shipping;

export default cartSlice.reducer;
