module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      maxWidth: {
        "24": "6rem"
      },

      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        }
      },

      animation: {
        wiggle: "wiggle 250ms ease-in-out 3"
      },

      transitionDelay: {
        "50": "0ms",
        "100": "0ms",
        "200": "25ms",
        "300": "25ms",
        "400": "50ms",
        "500": "50ms",
        "600": "75ms",
        "700": "75ms",
        "800": "100ms",
        "900": "100ms"
      },

      colors: {
        primary: {
          "50": "#f3fbfb",
          "100": "#e6f6f8",
          "200": "#c1eaed",
          "300": "#9cdde1",
          "400": "#52c3cb",
          "500": "#08a9b5",
          "600": "#0798a3",
          "700": "#067f88",
          "800": "#05656d",
          "900": "#034448"
        }
      }
    }
  },
  variants: {
    extend: {
      zIndex: ["hover"]
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
