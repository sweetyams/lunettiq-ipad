/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: "#0A153D",
        green: "#005D23", 
        offWhite: "#F5F2EC",
        warmGrey: "#E8E4DE",
        charcoal: "#2B2B2B",
        midGrey: "#6B6B6B",
        white: "#FFFFFF",
        error: "#C53030",
        warning: "#D4A017",
        blue: "#2D4A8A",
      },
      spacing: {
        xs: "4px",
        sm: "8px", 
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px", 
        lg: "14px",
        full: "9999px",
      },
      fontSize: {
        displayLg: ["34px", { lineHeight: "40px", fontWeight: "700" }],
        displayMd: ["28px", { lineHeight: "34px", fontWeight: "700" }],
        headline: ["22px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "24px", fontWeight: "400" }],
        bodyStrong: ["17px", { lineHeight: "24px", fontWeight: "500" }],
        caption: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        captionStrong: ["14px", { lineHeight: "20px", fontWeight: "500" }],
      },
      fontFamily: {
        display: ["Helvetica Now Display", "system-ui", "sans-serif"],
        text: ["Helvetica Now Text", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};