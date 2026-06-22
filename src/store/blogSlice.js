import { createSlice } from '@reduxjs/toolkit';
import { posts as seed } from '../data/blog';

// Normalise a post so admin-created and seed posts share one shape.
const norm = (p) => ({
  status: 'published',
  category: '',
  faqs: [],
  seo: {},
  content: '',
  sections: [],
  tags: [],
  author: 'Maxx Editorial',
  readTime: 5,
  ...p
});

const blogSlice = createSlice({
  name: 'blog',
  initialState: { items: seed.map(norm) },
  reducers: {
    setPosts(state, { payload }) {
      if (Array.isArray(payload) && payload.length) state.items = payload.map(norm);
    },
    addPost(state, { payload }) {
      state.items.unshift(norm({ ...payload, date: payload.date || new Date().toISOString().slice(0, 10) }));
    },
    updatePost(state, { payload }) {
      const i = state.items.findIndex((p) => p.slug === payload.slug);
      if (i >= 0) state.items[i] = { ...state.items[i], ...payload, updatedAt: new Date().toISOString().slice(0, 10) };
    },
    setPostStatus(state, { payload }) {
      const p = state.items.find((x) => x.slug === payload.slug);
      if (p) p.status = payload.status;
    },
    deletePost(state, { payload }) {
      state.items = state.items.filter((p) => p.slug !== payload);
    }
  }
});

export const { setPosts, addPost, updatePost, setPostStatus, deletePost } = blogSlice.actions;

export const selectBlogPosts = (s) => s.blog.items;
export const selectPublishedPosts = (s) => s.blog.items.filter((p) => (p.status || 'published') === 'published');
export const selectPostBySlug = (slug) => (s) => s.blog.items.find((p) => p.slug === slug);
export const selectBlogTags = (s) => [...new Set(s.blog.items.filter((p) => (p.status || 'published') === 'published').flatMap((p) => p.tags || []))];

export default blogSlice.reducer;
