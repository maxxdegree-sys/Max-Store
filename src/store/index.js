import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import wishlistReducer from './wishlistSlice';
import authReducer from './authSlice';
import productsReducer from './productsSlice';
import reviewsReducer from './reviewsSlice';
import complaintsReducer from './complaintsSlice';
import adminUsersReducer from './adminUsersSlice';
import activityReducer from './activitySlice';
import accountsReducer from './accountsSlice';
import blogReducer from './blogSlice';
import settingsReducer from './settingsSlice';
import uiReducer from './uiSlice';

const loadState = (key) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : undefined;
  } catch { return undefined; }
};

// Only cart and wishlist are persisted locally. Catalog, reviews, blog,
// complaints, etc. always come fresh from the API so the database stays the
// single source of truth (no stale seed data surviving across sessions).
const persistedCart       = loadState('maxx-cart')       || loadState('alrafiq-cart');
const persistedWishlist   = loadState('maxx-wishlist')   || loadState('alrafiq-wishlist');

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    auth: authReducer,
    products: productsReducer,
    reviews: reviewsReducer,
    complaints: complaintsReducer,
    adminUsers: adminUsersReducer,
    activity: activityReducer,
    accounts: accountsReducer,
    blog: blogReducer,
    settings: settingsReducer,
    ui: uiReducer
  },
  preloadedState: {
    ...(persistedCart       ? { cart:       persistedCart       } : {}),
    ...(persistedWishlist   ? { wishlist:   persistedWishlist   } : {})
  }
});

store.subscribe(() => {
  const { cart, wishlist } = store.getState();
  const cartJson = JSON.stringify(cart);
  const wishJson = JSON.stringify(wishlist);
  try {
    if (localStorage.getItem('maxx-cart') !== cartJson) {
      localStorage.setItem('maxx-cart', cartJson);
    }
    if (localStorage.getItem('maxx-wishlist') !== wishJson) {
      localStorage.setItem('maxx-wishlist', wishJson);
    }
  } catch { /* quota / private mode */ }
});
