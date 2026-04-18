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
        ivory: "#F6F0E8",
        blush: "#F3D8D2",
        clay: "#C98972",
        parchment: "#FBF6F1",
        petalPink: "#F9C0BB",
        slate: "#2C2930",
        rosewood: "#8E5A56",
        stone: "#C7B7A7",
        pine: "#617368",
        sage: "#7A9E87",
        terracotta: "#C4704A",
        oxidizedRose: "#9E6B6B",
      },
      boxShadow: {
        paper: "0 20px 60px rgba(52, 42, 41, 0.08)",
        whisper: "0 8px 30px rgba(52, 42, 41, 0.06)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(243, 216, 210, 0.85), transparent 35%), radial-gradient(circle at 80% 20%, rgba(201, 137, 114, 0.22), transparent 28%), linear-gradient(135deg, #fbf6f1 0%, #f4ebe2 100%)",
        "paper-grain":
          "linear-gradient(120deg, rgba(255,255,255,0.5), rgba(255,255,255,0)), linear-gradient(180deg, rgba(142,90,86,0.03), rgba(142,90,86,0))",
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
