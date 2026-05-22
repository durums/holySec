/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ops-black': '#0a0a0a',
        'ops-slate': '#0f172a',
        'ops-cyan': '#06b6d4',
        'ops-cyan-dark': '#0891b2',
        'ops-border': '#1e293b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
