import { createSlice } from '@reduxjs/toolkit';

// Audit trail of admin actions + login/logout events.
const seed = [
  { id: 'a1', userId: 'u-exec',    userName: 'Store Owner',    action: 'login',  detail: 'Logged in',                 ts: '2026-05-17 09:02' },
  { id: 'a2', userId: 'u-products',userName: 'Imran (Catalog)',action: 'product',detail: 'Added "Espresso Maker"',    ts: '2026-05-16 14:21' },
  { id: 'a3', userId: 'u-support', userName: 'Ayesha (Support)',action: 'complaint', detail: 'Resolved ticket AR-2026-0003', ts: '2026-05-16 11:05' },
  { id: 'a4', userId: 'u-support', userName: 'Ayesha (Support)',action: 'logout', detail: 'Logged out',                ts: '2026-05-17 18:30' }
];

const activitySlice = createSlice({
  name: 'activity',
  initialState: { items: seed },
  reducers: {
    logActivity: {
      reducer(state, { payload }) {
        state.items.unshift(payload);
        state.items = state.items.slice(0, 500); // keep last 500
      },
      prepare(input) {
        const now = new Date();
        const ts = now.toISOString().slice(0, 16).replace('T', ' ');
        return {
          payload: {
            id: 'a' + Date.now(),
            userId: input.userId || 'unknown',
            userName: input.userName || 'Unknown',
            action: input.action || 'action',
            detail: input.detail || '',
            ts
          }
        };
      }
    },
    clearActivity(state) { state.items = []; }
  }
});

export const { logActivity, clearActivity } = activitySlice.actions;
export const selectActivity = (s) => s.activity.items;
export default activitySlice.reducer;
