import { createSlice } from '@reduxjs/toolkit';
import { adminUsers as seed } from '../data/adminUsers';

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState: { items: seed },
  reducers: {
    addAdminUser: {
      reducer(state, { payload }) { state.items.push(payload); },
      prepare(input) {
        return {
          payload: {
            id: 'u-' + Date.now(),
            name: (input.name || '').trim(),
            email: (input.email || '').trim(),
            role: input.role || 'Custom',
            permissions: Array.isArray(input.permissions) ? input.permissions : ['dashboard'],
            status: 'active',
            department: (input.department || '').trim(),
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: null,
            lastLogout: null
          }
        };
      }
    },
    updateAdminUser(state, { payload }) {
      const u = state.items.find((x) => x.id === payload.id);
      if (u) Object.assign(u, payload);
    },
    setUserPermissions(state, { payload }) {
      const u = state.items.find((x) => x.id === payload.id);
      if (u) { u.permissions = payload.permissions; if (payload.role) u.role = payload.role; }
    },
    suspendUser(state, { payload }) {
      const u = state.items.find((x) => x.id === payload);
      if (u) u.status = u.status === 'active' ? 'suspended' : 'active';
    },
    removeAdminUser(state, { payload }) {
      state.items = state.items.filter((x) => x.id !== payload);
    },
    recordLogin(state, { payload }) {
      const u = state.items.find((x) => x.email?.toLowerCase() === String(payload.email).toLowerCase());
      if (u) u.lastLogin = payload.at;
    },
    recordLogout(state, { payload }) {
      const u = state.items.find((x) => x.email?.toLowerCase() === String(payload.email).toLowerCase());
      if (u) u.lastLogout = payload.at;
    }
  }
});

export const {
  addAdminUser, updateAdminUser, setUserPermissions, suspendUser,
  removeAdminUser, recordLogin, recordLogout
} = adminUsersSlice.actions;

export const selectAdminUsers = (s) => s.adminUsers.items;
export const selectAdminUserByEmail = (email) => (s) =>
  s.adminUsers.items.find((u) => u.email?.toLowerCase() === String(email || '').toLowerCase());

export default adminUsersSlice.reducer;
