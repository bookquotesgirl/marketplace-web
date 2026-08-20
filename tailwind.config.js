/** Kitman brand tokens — mirrors the design in kitman-html. Extend as needed. */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { light: '#0e9c60', DEFAULT: '#0b7a4b', dark: '#075c38', deep: '#043b24' },
        gold: { light: '#ffce4d', DEFAULT: '#f5b301', dark: '#c98f00' },
        crimson: { light: '#f04455', DEFAULT: '#d81e2c', dark: '#a8121e' },
        cream: '#fbf6ec',
        ink: '#0f172a',
        telebirr: '#0a7d3e',
        cbeBirr: '#5b2d8e',
        arifpay: '#1560d4',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        ethiopic: ['Noto Sans Ethiopic', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(15,23,42,0.12)',
        card: '0 10px 30px -12px rgba(15,23,42,0.18)',
        glow: '0 8px 30px -8px rgba(11,122,75,0.45)',
      },
    },
  },
  plugins: [],
};
