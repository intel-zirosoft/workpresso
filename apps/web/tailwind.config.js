/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7FA1C3", // Soft Dusty Blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F2C18D", // Warm Peach (Accent)
          foreground: "#2C394B",
        },
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#2C394B", // Deep Navy
          muted: "#A5AEBA",   // Soft Slate
        },
        success: "#A1C398",   // Pastel Sage
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#A5AEBA",
          foreground: "#2C394B",
        },
        accent: {
          DEFAULT: "#F2C18D",
          foreground: "#2C394B",
        },
      },
      fontFamily: {
        headings: ["var(--font-fredoka)", "sans-serif"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      borderRadius: {
        sm: "12px",
        md: "24px",
        lg: "24px",
        pill: "100px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(127, 161, 195, 0.12)",
        float: "0 16px 32px rgba(127, 161, 195, 0.16)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
}
