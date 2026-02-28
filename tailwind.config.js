/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#fff4f0",
          100: "#ffe4d6",
          200: "#ffbfa0",
          300: "#ff9566",
          400: "#ff6e35",
          500: "#FF5A1F",
          600: "#e84000",
          700: "#c23500",
          800: "#9c2a00",
          900: "#7a2100",
        },
        dark: "#1a1a2e",
        surface: "#f8f7f4",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 2px 20px rgba(0,0,0,0.08)",
        "primary": "0 4px 24px rgba(255,90,31,0.35)",
        "bottom-nav": "0 -4px 24px rgba(0,0,0,0.08)",
      },
      animation: {
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-dot": "bounceDot 1.4s infinite ease-in-out",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
}
