// tailwind.config.js
module.exports = {
  darkMode: "class", // 추가 필요!
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        vitroCore: ["VitroCore", "sans-serif"],
        vitroPride: ["VitroPride", "sans-serif"],
      },
      colors: {
        "vscode-light": "#f3f3f3",
        "dark-navy": "#102a43",
      },
    },
  },
  plugins: [],
};
