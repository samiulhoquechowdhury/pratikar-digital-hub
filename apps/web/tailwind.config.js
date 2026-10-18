const preset = require("@pratikar/config/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  // packages/ui is compiled from source by Next, so its class names have to be
  // scanned here too or shared components ship without their styles.
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // The storefront's corners, Coursera's: cards a little rounded,
      // controls a little less — shared components follow here without
      // changing the admin panel's.
      borderRadius: {
        card: "0.75rem",
        control: "0.375rem",
      },
    },
  },
};
