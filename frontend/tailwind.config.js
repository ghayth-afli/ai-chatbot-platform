module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        volt: "#C8FF00",
        plasma: "#7B5CFF",
        spark: "#FF4D6D",
        ice: "#00D4E8",
        ink: "#0D0D12",
        paper: "#F5F3EF",
        surface: "#1A1825",
        muted: "#6B6878",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        "dm-sans": ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"],
        arabic: ["Noto Kufi Arabic", "sans-serif"],
      },
      opacity: {
        glass: "0.04",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
      },
    },
  },
  plugins: [],
};
