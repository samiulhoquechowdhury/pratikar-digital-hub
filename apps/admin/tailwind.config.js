const preset = require("@pratikar/config/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  // packages/ui is compiled from source by Next, so its class names have to be
  // scanned here too or shared components ship without their styles.
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
};
