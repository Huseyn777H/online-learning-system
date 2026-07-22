/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#4f46e5",
          dark: "#4338ca",
          light: "#e0e7ff",
        },
        accent: {
          DEFAULT: "#0ea5e9",
          dark: "#0284c7",
          light: "#e0f2fe",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
        },
      },
      backgroundImage: {
        // A single layered value: two Tailwind bg-image utilities can't be combined on
        // one element (both set the CSS `background-image` property, so the second
        // simply overrides the first) — the mesh highlights and base gradient must be
        // one comma-separated value to actually render together.
        "brand-gradient":
          "radial-gradient(at 20% 20%, rgba(255,255,255,0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255,255,255,0.14) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(14,165,233,0.35) 0px, transparent 50%), linear-gradient(135deg, #4f46e5 0%, #4338ca 45%, #0ea5e9 100%)",
      },
      boxShadow: {
        soft: "0 2px 8px 0 rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)",
        "card-hover": "0 1px 2px 0 rgba(15,23,42,0.04), 0 16px 32px -12px rgba(79,70,229,0.22)",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
