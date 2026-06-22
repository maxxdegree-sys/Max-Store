import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [] },
  reducers: {
    toggleWishlist(state, { payload }) {
      const i = state.items.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.items.splice(i, 1);
      else state.items.push(payload);
    },
    removeFromWishlist(state, { payload }) {
      state.items = state.items.filter((x) => x.id !== payload);
    },
    clearWishlist(state) { state.items = []; },
    // Replace the whole list (used when hydrating from the signed-in account).
    setWishlist(state, { payload }) {
      if (Array.isArray(payload)) state.items = payload;
    }
  }
});

export const { toggleWishlist, removeFromWishlist, clearWishlist, setWishlist } = wishlistSlice.actions;
export const selectWishlist      = (s) => s.wishlist.items;
export const selectWishlistCount = (s) => s.wishlist.items.length;
export const isInWishlist        = (id) => (s) => s.wishlist.items.some((x) => x.id === id);

export default wishlistSlice.reducer;
