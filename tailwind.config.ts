import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        parchment: "#FBF6F1",
        ivory: "#F6F0E8",
        sand: "#EDE3D4",
        blush: "#F3D8D2",
        // Accents
        petalPink: "#F9C0BB",
        terracotta: "#C4704A",
        oxidizedRose: "#9E6B6B",
        clay: "#C98972",
        rosewood: "#8E5A56",
        // Neutrals
        stone: "#C7B7A7",
        pine: "#617368",
        sage: "#7A9E87",
        slate: "#2C2930",
        charcoal: "#38333C",
      },
      boxShadow: {
        paper: "0 20px 60px rgba(52, 42, 41, 0.08)",
        whisper: "0 8px 30px rgba(52, 42, 41, 0.06)",
        card: "0 2px 12px rgba(52, 42, 41, 0.07)",
      },
      backgroundImage: {
        "warm-gradient":
          "linear-gradient(135deg, #FBF6F1 0%, #F6EDE0 50%, #F0E4D4 100%)",
        "blush-haze":
          "radial-gradient(ellipse at top left, rgba(249,192,187,0.35) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(237,227,212,0.5) 0%, transparent 50%), linear-gradient(135deg, #FBF6F1 0%, #F4E8DC 100%)",
        "hero-glow":
          "radial-gradient(circle at top left, rgba(243, 216, 210, 0.85), transparent 35%), radial-gradient(circle at 80% 20%, rgba(201, 137, 114, 0.22), transparent 28%), linear-gradient(135deg, #fbf6f1 0%, #f4ebe2 100%)",
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
