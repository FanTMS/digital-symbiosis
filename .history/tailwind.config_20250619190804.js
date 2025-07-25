/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F9FE',
          100: '#CCF3FD',
          200: '#99E7FB',
          300: '#66DBF9',
          400: '#33CFF7',
          500: '#0BBBEF', // Primary color
          600: '#0896BF',
          700: '#06708F',
          800: '#044B60',
          900: '#022530',
        },
        blue: {
          50: '#E6F9FE',
          100: '#CCF3FD',
          200: '#99E7FB',
          300: '#66DBF9',
          400: '#33CFF7',
          500: '#0BBBEF',
          600: '#0896BF',
          700: '#06708F',
          800: '#044B60',
          900: '#022530',
        },
        secondary: {
          50: '#F4F6F9',
          100: '#E9EDF2',
          200: '#D3DCE6',
          300: '#BDCAD9',
          400: '#A7B9CC',
          500: '#91A7C0',
          600: '#74869A',
          700: '#576473',
          800: '#3A424D',
          900: '#1D2126',
        },
        accent: {
          50: '#FFF0ED',
          100: '#FFE1DB',
          200: '#FFC3B7',
          300: '#FFA593',
          400: '#FF876F',
          500: '#FF7A5A', // Accent color
          600: '#CC6248',
          700: '#994936',
          800: '#663124',
          900: '#331812',
        },
        success: {
          50: '#E6F9F1',
          100: '#CCF3E3',
          200: '#99E7C7',
          300: '#66DBAB',
          400: '#33CF8F',
          500: '#00C373',
          600: '#009C5C',
          700: '#007545',
          800: '#004E2E',
          900: '#002717',
        },
        warning: {
          50: '#FFF8E6',
          100: '#FFF1CC',
          200: '#FFE399',
          300: '#FFD566',
          400: '#FFC733',
          500: '#FFBA00',
          600: '#CC9500',
          700: '#997000',
          800: '#664B00',
          900: '#332500',
        },
        error: {
          50: '#FCE6E6',
          100: '#F9CCCC',
          200: '#F39999',
          300: '#ED6666',
          400: '#E73333',
          500: '#E10000',
          600: '#B40000',
          700: '#870000',
          800: '#5A0000',
          900: '#2D0000',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        card: '0 8px 24px rgba(34,197,246,0.15)',
      },
    },
  },
  plugins: [],
};