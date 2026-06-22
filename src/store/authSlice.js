import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAdmin: false,
    permissions: [],   // admin permission keys for the logged-in admin
    impersonator: null, // original (super admin) user while "viewing as" someone
    adminReady: false, // true once we've attempted to restore an admin session from the token
    loading: false,
    error: null
  },
  reducers: {
    setAdminReady(state, { payload }) { state.adminReady = payload !== false; },
    setUser(state, { payload }) {
      state.user = payload;
      state.isAdmin = !!payload?.isAdmin;
      state.permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
    },
    // Super admin enters another user's account.
    impersonate(state, { payload }) {
      state.impersonator = payload.impersonator;
      state.user = payload.user;
      state.isAdmin = !!payload.user?.isAdmin;
      state.permissions = Array.isArray(payload.user?.permissions) ? payload.user.permissions : [];
    },
    // Return to the super admin's own account.
    stopImpersonate(state) {
      if (state.impersonator) {
        const o = state.impersonator;
        state.user = o;
        state.isAdmin = !!o?.isAdmin;
        state.permissions = Array.isArray(o?.permissions) ? o.permissions : [];
        state.impersonator = null;
      }
    },
    logout(state) {
      state.user = null;
      state.isAdmin = false;
      state.permissions = [];
      state.impersonator = null;
    },
    // Storefront sign-out — clears customer user only; admin session (token) stays intact.
    logoutCustomer(state) {
      if (!state.user || state.user.kind === 'customer') state.user = null;
    },
    // Admin sign-out — clears admin user/permissions; customer token may still exist.
    logoutAdmin(state) {
      state.isAdmin = false;
      state.permissions = [];
      state.impersonator = null;
      if (state.user?.isAdmin) state.user = null;
    },
    setLoading(state, { payload }) { state.loading = payload; },
    setError(state, { payload })   { state.error   = payload; }
  }
});

export const { setUser, setAdminReady, impersonate, stopImpersonate, logout, logoutCustomer, logoutAdmin, setLoading, setError } = authSlice.actions;
export const selectUser = (s) => s.auth.user;
export const selectIsAdmin = (s) => s.auth.isAdmin;
export const selectIsCustomer = (s) => s.auth.user?.kind === 'customer';
export const selectPermissions = (s) => s.auth.permissions;
export const selectImpersonator = (s) => s.auth.impersonator;
export const selectAdminReady = (s) => s.auth.adminReady;
export default authSlice.reducer;
