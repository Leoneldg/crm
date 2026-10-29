import type { Config } from "tailwindcss";

const v = (nombre: string) => `rgb(var(${nombre}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Petróleo: acción principal.
        brand: { DEFAULT: v("--brand"), light: v("--brand-light"), soft: v("--brand-soft") },
        ink: { DEFAULT: v("--ink"), soft: v("--ink-soft"), mute: v("--ink-mute") },
        surface: v("--surface"),
        bg: v("--bg"),
        line: { DEFAULT: v("--line"), strong: v("--line-strong") },
        coral: { DEFAULT: v("--coral"), soft: v("--coral-soft") },
        aviso: { DEFAULT: v("--aviso"), soft: v("--aviso-soft") },
        verde: { DEFAULT: v("--verde"), soft: v("--verde-soft") },
      },
      fontFamily: {
        sans: ["var(--font-cuerpo)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
