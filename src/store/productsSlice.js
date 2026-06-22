import { createSlice, createSelector } from '@reduxjs/toolkit';
import { products as seed } from '../data/products';
import { productsByTag, topBySold } from '../utils/productSort';

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: seed,
    recentlyViewed: [],
    compare: []
  },
  reducers: {
    addRecentlyViewed(state, { payload }) {
      state.recentlyViewed = [payload, ...state.recentlyViewed.filter((p) => p.id !== payload.id)].slice(0, 8);
    },
    toggleCompare(state, { payload }) {
      const i = state.compare.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.compare.splice(i, 1);
      else if (state.compare.length < 4) state.compare.push(payload);
    },
    addProduct(state, { payload }) {
      state.items.unshift({ ...payload, id: payload.id || Date.now() });
    },
    updateProduct(state, { payload }) {
      const i = state.items.findIndex((p) => p.id === payload.id);
      if (i >= 0) state.items[i] = { ...state.items[i], ...payload };
    },
    deleteProduct(state, { payload }) {
      state.items = state.items.filter((p) => p.id !== payload);
    },
    setProducts(state, { payload }) {
      if (Array.isArray(payload)) state.items = payload;
    }
  }
});

export const { addRecentlyViewed, toggleCompare, addProduct, updateProduct, deleteProduct, setProducts } = productsSlice.actions;
export const selectAllProducts    = (s) => s.products.items;
export const selectRecentlyViewed = (s) => s.products.recentlyViewed;
export const selectCompare        = (s) => s.products.compare;
export const selectProductBySlug  = (slug) => (s) => s.products.items.find((p) => p.slug === slug);
export const selectProductsByCategory = (cat) => (s) => s.products.items.filter((p) => p.category === cat);
export const selectProductById   = (id) => (s) => s.products.items.find((p) => p.id === id);
export const selectProductsByTag  = (tag) => (s) => s.products.items.filter((p) => p.tags?.includes(tag));

const selectItems = (s) => s.products.items;
const selectHomepage = (s) => s.settings?.site?.homepage || {};
const sectionLimit = (hp) => Math.min(24, Math.max(4, Number(hp.sectionLimit) || 8));

export const selectFeatured = createSelector([selectItems, selectHomepage], (items, hp) =>
  productsByTag(items, 'featured', { limit: sectionLimit(hp) })
);
export const selectTrending = createSelector([selectItems, selectHomepage], (items, hp) =>
  productsByTag(items, 'trending', { limit: sectionLimit(hp) })
);
export const selectNewArrivals = createSelector([selectItems, selectHomepage], (items, hp) =>
  productsByTag(items, 'new-arrival', { limit: sectionLimit(hp) })
);
export const selectBestSellers = createSelector([selectItems, selectHomepage], (items, hp) => {
  const limit = sectionLimit(hp);
  if (hp.bestSellersMode === 'auto') return topBySold(items, limit);
  return productsByTag(items, 'best-seller', { limit });
});
export const selectFlashSale = createSelector([selectItems, selectHomepage], (items, hp) =>
  productsByTag(items, 'flash-sale', { limit: Math.min(12, sectionLimit(hp) + 2) })
);

export const selectCategoryCounts = createSelector([selectItems], (items) => {
  const m = {};
  items.forEach((p) => { if (p.category) m[p.category] = (m[p.category] || 0) + 1; });
  return m;
});

export default productsSlice.reducer;
