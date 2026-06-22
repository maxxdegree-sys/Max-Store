import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    searchOpen: false,
    cartDrawerOpen: false,
    notifications: []
  },
  reducers: {
    toggleMobileMenu(s, { payload }) { s.mobileMenuOpen = payload ?? !s.mobileMenuOpen; },
    toggleSearch(s, { payload })     { s.searchOpen     = payload ?? !s.searchOpen; },
    toggleCartDrawer(s) { s.cartDrawerOpen = !s.cartDrawerOpen; },
    setCartDrawerOpen(s, { payload }) { s.cartDrawerOpen = !!payload; },
    closeCartDrawer(s) { s.cartDrawerOpen = false; },
    pushNotification(s, { payload }) {
      s.notifications.unshift({ id: Date.now(), ...payload });
      s.notifications = s.notifications.slice(0, 10);
    },
    clearNotifications(s) { s.notifications = []; }
  }
});

export const { toggleMobileMenu, toggleSearch, toggleCartDrawer, setCartDrawerOpen, closeCartDrawer, pushNotification, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
