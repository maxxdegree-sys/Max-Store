/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Poppins', 'Inter', 'sans-serif']
      },
      colors: {
        // Maxx red — sampled from official logo
        brand: {
          50:  '#fff0f0',
          100: '#ffe0e0',
          200: '#ffc2c2',
          300: '#ff8a8a',
          400: '#ff5252',
          500: '#ff3131',  // primary red (logo main color)
          600: '#e62626',
          700: '#c41e1e',
          800: '#9e1818',
          900: '#7a1212',
          950: '#450a0a'
        },
        ink: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155',
          900: '#0f172a'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(69, 10, 10, 0.08)',
        glow: '0 10px 40px -10px rgba(255, 49, 49, 0.55)',
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #e62626 0%, #ff3131 50%, #ff5252 100%)',
        'hero-radial': 'radial-gradient(circle at 20% 20%, rgba(255,49,49,0.18), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,82,82,0.20), transparent 45%)'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        ping2: {
          '75%, 100%': { transform: 'scale(1.6)', opacity: '0' }
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        ping2: 'ping2 1.6s cubic-bezier(0,0,0.2,1) infinite'
      }
    }
  },
  plugins: []
};
