import { createSlice } from '@reduxjs/toolkit';
import { testimonials as seedTestimonials } from '../data/banners';

// Storefront defaults — used before the API responds (and as an offline fallback).
const defaultSite = {
  announcements: [
    { icon: 'Sparkles', text: '🎉 Flash Sale Live — Up to 50% OFF on premium products' },
    { icon: 'Truck',    text: 'Free Delivery across Pakistan on every order' },
    { icon: 'Mail',     text: 'Questions? Email support@maxxdegree.com' }
  ],
  flashSale: { enabled: true, title: '⚡ Flash Sale Live Now', endsAt: '' },
  homepage: {
    sectionLimit: 8,
    bestSellersMode: 'manual',
    sections: {
      featured: { enabled: true },
      trending: { enabled: true },
      newArrivals: { enabled: true },
      bestSellers: { enabled: true }
    }
  },
  testimonials: seedTestimonials,
  about: { customers: '50K+', products: '1.2K+', rating: '4.8' }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { site: defaultSite },
  reducers: {
    setSiteSettings(state, { payload }) {
      if (payload && typeof payload === 'object') {
        state.site = { ...defaultSite, ...payload };
      }
    }
  }
});

export const { setSiteSettings } = settingsSlice.actions;

export const selectAnnouncements = (s) =>
  (Array.isArray(s.settings.site.announcements) && s.settings.site.announcements.length)
    ? s.settings.site.announcements : defaultSite.announcements;
export const selectTestimonials = (s) =>
  (Array.isArray(s.settings.site.testimonials) && s.settings.site.testimonials.length)
    ? s.settings.site.testimonials : defaultSite.testimonials;
export const selectFlashSaleConfig = (s) => s.settings.site.flashSale || defaultSite.flashSale;
export const selectHomepageConfig = (s) => ({ ...defaultSite.homepage, ...(s.settings.site.homepage || {}) });
export const selectAboutStats = (s) => s.settings.site.about || defaultSite.about;

export default settingsSlice.reducer;
