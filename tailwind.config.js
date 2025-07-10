// tailwind.config.js
module.exports = {
  darkMode: 'class', // 추가 필요!
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#102a43',
      },
    },
  },
  plugins: [],
}
