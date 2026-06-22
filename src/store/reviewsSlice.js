import { createSlice } from '@reduxjs/toolkit';
import { reviews as seed } from '../data/reviews';

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: seed,
    helpfulVoted: []
  },
  reducers: {
    // Replace all locally-held reviews for a product with the DB result
    // (camelCase, already filtered to approved). Keeps existing selectors working.
    setProductReviews(state, { payload }) {
      const { productId, reviews = [] } = payload;
      state.items = state.items.filter((r) => r.productId !== productId);
      reviews.forEach((r) => state.items.push(r));
    },
    submitReview(state, { payload }) {
      const id = 'r' + Date.now();
      state.items.unshift({
        id,
        productId: payload.productId,
        userName: payload.userName || 'Anonymous',
        userEmail: payload.userEmail || '',
        rating: Math.max(1, Math.min(5, payload.rating || 5)),
        title: payload.title || '',
        comment: payload.comment || '',
        date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        helpful: 0,
        verified: false
      });
    },
    addAdminReview(state, { payload }) {
      // Admin-added review — defaults to approved + verified
      state.items.unshift({
        id: 'r' + Date.now() + Math.floor(Math.random() * 1000),
        productId: payload.productId,
        userName: payload.userName || 'Customer',
        userEmail: payload.userEmail || '',
        rating: Math.max(1, Math.min(5, payload.rating || 5)),
        title: payload.title || '',
        comment: payload.comment || '',
        date: payload.date || new Date().toISOString().slice(0, 10),
        status: payload.status || 'approved',
        helpful: payload.helpful || 0,
        verified: payload.verified !== undefined ? !!payload.verified : true
      });
    },
    bulkImportReviews(state, { payload }) {
      // payload = { rows: [...], defaultStatus: 'approved'|'pending' }
      const { rows = [], defaultStatus = 'approved' } = payload;
      const now = Date.now();
      const valid = rows.filter((r) => r && r.productId && r.comment && r.rating);
      valid.forEach((r, i) => {
        state.items.unshift({
          id: 'r' + (now + i),
          productId: String(r.productId).trim(),
          userName: (r.userName || 'Customer').trim(),
          userEmail: (r.userEmail || '').trim(),
          rating: Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5)),
          title: (r.title || '').trim(),
          comment: String(r.comment).trim(),
          date: (r.date || new Date().toISOString().slice(0, 10)).trim(),
          status: (r.status || defaultStatus).trim(),
          helpful: parseInt(r.helpful, 10) || 0,
          verified: String(r.verified).toLowerCase() === 'true' || r.verified === true
        });
      });
    },
    approveReview(state, { payload }) {
      const r = state.items.find((x) => x.id === payload);
      if (r) r.status = 'approved';
    },
    rejectReview(state, { payload }) {
      const r = state.items.find((x) => x.id === payload);
      if (r) r.status = 'rejected';
    },
    deleteReview(state, { payload }) {
      state.items = state.items.filter((x) => x.id !== payload);
    },
    bulkDeleteByStatus(state, { payload }) {
      // Useful admin convenience — wipe all rejected at once
      state.items = state.items.filter((r) => r.status !== payload);
    },
    markHelpful(state, { payload }) {
      if (state.helpfulVoted.includes(payload)) return;
      const r = state.items.find((x) => x.id === payload);
      if (r) { r.helpful += 1; state.helpfulVoted.push(payload); }
    },
    toggleVerified(state, { payload }) {
      const r = state.items.find((x) => x.id === payload);
      if (r) r.verified = !r.verified;
    }
  }
});

export const {
  setProductReviews, submitReview, addAdminReview, bulkImportReviews,
  approveReview, rejectReview, deleteReview, bulkDeleteByStatus,
  markHelpful, toggleVerified
} = reviewsSlice.actions;

// Map a DB review row (snake_case) to the camelCase shape the UI uses.
export const mapDbReview = (row) => ({
  id: row.id,
  productId: row.product_id ?? row.productId,
  userName: row.user_name ?? row.userName ?? 'Anonymous',
  userEmail: row.user_email ?? row.userEmail ?? '',
  rating: Number(row.rating) || 5,
  title: row.title || '',
  comment: row.comment || '',
  date: String(row.date || row.created_at || '').slice(0, 10),
  status: row.status || 'approved',
  helpful: Number(row.helpful) || 0,
  verified: !!row.verified
});

// Selectors
export const selectAllReviews = (s) => s.reviews.items;
export const selectHelpfulVoted = (s) => s.reviews.helpfulVoted;

export const selectReviewsByStatus = (status) => (s) =>
  s.reviews.items.filter((r) => r.status === status);

export const selectApprovedReviews = (productId) => (s) =>
  s.reviews.items.filter((r) => r.productId === productId && r.status === 'approved');

export const selectAvgRating = (productId) => (s) => {
  const list = s.reviews.items.filter((r) => r.productId === productId && r.status === 'approved');
  if (!list.length) return 0;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
};

export const selectRatingBreakdown = (productId) => (s) => {
  const list = s.reviews.items.filter((r) => r.productId === productId && r.status === 'approved');
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  list.forEach((r) => { buckets[r.rating] = (buckets[r.rating] || 0) + 1; });
  return { buckets, total: list.length };
};

export default reviewsSlice.reducer;
