/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pardos-brown': '#8B1A1A',
        'pardos-yellow': '#F2B10C',
        'pardos-orange': '#F67C1F',
        'pardos-purple': '#4C1F2F',
        'pardos-rust': '#B34726',
        'pardos-dark': '#262626',
        'pardos-cream': '#FFF3E0',
        'pardos-gray': '#E0E0E0',
        'pardos-olive': '#6C7A3F',
      },
      fontFamily: {
        'spartan': ['League Spartan', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'pacifico': ['Pacifico', 'cursive'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'in': 'fade-in 0.2s ease-out',
        'zoom-in-95': 'zoom-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
