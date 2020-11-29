/* eslint-disable @typescript-eslint/no-var-requires */
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [tailwindcss("./tailwind.config.js"), autoprefixer()]
};
