/** @type {import('tailwindcss').Config} */
module.exports = {
  content: require('fast-glob').sync([
    "./src/*.js",
    "./**/*.html"
  ]),
  theme: {
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
};
