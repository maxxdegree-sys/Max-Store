import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { writeFileSync } from 'fs';
import path from 'path';

function buildFirebaseConfig(env) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

function firebaseConfigPlugin() {
  let root = process.cwd();
  return {
    name: 'firebase-config',
    configResolved(config) { root = config.root; },
    buildStart() {
      const env = loadEnv('production', root, '');
      const out = path.join(root, 'public', 'firebase-config.js');
      writeFileSync(out, 'self.FIREBASE_CONFIG = ' + JSON.stringify(buildFirebaseConfig(env)) + ';\n');
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/firebase-config.js' || req.url?.startsWith('/firebase-config.js?')) {
          const env = loadEnv(server.config.mode, root, '');
          res.setHeader('Content-Type', 'application/javascript');
          res.end('self.FIREBASE_CONFIG = ' + JSON.stringify(buildFirebaseConfig(env)) + ';\n');
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    firebaseConfigPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'Maxx',
        short_name: 'Maxx',
        description: 'Premium Online Shopping in Kharian, Pakistan',
        theme_color: '#ff3131',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        globIgnores: ['**/Admin*.js', '**/Vendor*.js', '**/charts-*.js'],
        importScripts: [
          '/firebase-config.js',
          'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
          'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js',
          '/fcm-background.js'
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging'],
          motion: ['framer-motion'],
          charts: ['recharts']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true }
    }
  }
});
