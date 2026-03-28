/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7efe5",
        ink: "#1f2933",
        coral: "#ef8354",
        moss: "#3c6e71",
        blush: "#fce3d2",
        sand: "#fffaf4"
      },
      boxShadow: {
        card: "0 20px 45px rgba(31, 41, 51, 0.12)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.4s ease-out"
      }
    }
  },
  plugins: []
};

