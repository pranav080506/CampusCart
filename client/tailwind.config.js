/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#176B4D',
          dark: '#0F4D36',
          light: '#E8F5EE',
          hover: '#13573E',
          accent: '#22A074',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          page: '#F8F8F8',
          subtle: '#F3F4F6',
          border: '#EAEAEA',
          dark: {
            page: '#121212',
            card: '#1E1E1E',
            border: '#2A2A2A',
            subtle: '#262626',
          }
        },
        ink: {
          primary: '#171717',
          secondary: '#707070',
          muted: '#9CA3AF',
        },
        status: {
          warning: '#D97706',
          error: '#DC2626',
          success: '#176B4D',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'badge': '0 1px 2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
