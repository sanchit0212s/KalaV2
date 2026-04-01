import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./index.html",
    "../theme-kala-shopify/**/*.liquid",
  ],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        prose: ['"Lora"', "Georgia", "serif"],
      },
      colors: {
        parchment:    "hsl(var(--parchment))",
        cream:        "hsl(var(--cream))",
        linen:        "hsl(var(--linen))",
        "warm-tan":   "hsl(var(--warm-tan))",
        obsidian:     "hsl(var(--obsidian))",
        charcoal:     "hsl(var(--charcoal))",
        slate:        "hsl(var(--slate))",
        "temple-gold":  "hsl(var(--temple-gold))",
        "bright-gold":  "hsl(var(--bright-gold))",
        "shimmer-gold": "hsl(var(--shimmer-gold))",
        saffron:        "hsl(var(--saffron))",
        vermilion:      "hsl(var(--vermilion))",
        sindoor:        "hsl(var(--sindoor))",
        espresso:    "hsl(var(--espresso))",
        mahogany:    "hsl(var(--mahogany))",
        walnut:      "hsl(var(--walnut))",
        surface:     "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        "surface-3": "hsl(var(--surface-3))",
        "on-surface": "hsl(var(--on-surface))",
        "on-surface-muted": "hsl(var(--on-surface-muted))",
        "on-surface-faint": "hsl(var(--on-surface-faint))",
        accent:      "hsl(var(--accent))",
        "accent-hover": "hsl(var(--accent-hover))",
        border:      "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
      },
      borderRadius: { lg: "8px", md: "6px", sm: "4px" },
      transitionDuration: { "400": "400ms" },
      keyframes: {
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breathe": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "flame": {
          "0%, 100%": { transform: "scaleY(1) scaleX(1)", opacity: "1" },
          "25%": { transform: "scaleY(1.15) scaleX(0.9)", opacity: "0.85" },
          "50%": { transform: "scaleY(0.9) scaleX(1.1)", opacity: "1" },
          "75%": { transform: "scaleY(1.1) scaleX(0.95)", opacity: "0.9" },
        },
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "holy-shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "marquee": "marquee 30s linear infinite",
        "flame": "flame 2s ease-in-out infinite",
        "reveal-up": "reveal-up 0.6s ease-out forwards",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
        "holy-shimmer": "holy-shimmer 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
