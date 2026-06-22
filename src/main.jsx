import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster
              position="top-right"
              containerStyle={{ zIndex: 80 }}
              toastOptions={{
                duration: 2500,
                style: {
                  borderRadius: '14px',
                  background: '#0f172a',
                  color: '#fff',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px'
                },
                success: { iconTheme: { primary: '#ff3131', secondary: '#fff' } }
              }}
            />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
