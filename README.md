# Flip3D

> Free 3D File Converter, Viewer & Repair Tools — runs 100% in your browser.

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/three.js-0.184-orange)](https://threejs.org/)
[![Tailwind v4](https://img.shields.io/badge/tailwind-v4-38bdf8)](https://tailwindcss.com/)

## What is this

Flip3D is a 3D file Swiss army knife built for 3D printing enthusiasts, CAD engineers and Web3D developers. Convert, view, repair and optimize STL / OBJ / GLB / 3MF / STEP / FBX **without uploading anything** — all processing happens in your browser via WebAssembly.

## Differentiating features (roadmap)

- 🔄 Convert between 20+ 3D formats (client-side WASM)
- 👁️ Universal 3D viewer (STL/OBJ/GLB/3MF/STEP)
- 🛠️ STL repair (manifold + holes)
- 🖨️ G-code simulator
- ⚙️ **Bambu 3MF ↔ Prusa 3MF** (unique compatibility tool)
- 📐 Engineering reference charts
- 🪞 Image → 3D lithophane
- 🧩 Embeddable iframe widgets

## Tech stack

- **Next.js 16** (App Router, webpack dev mode)
- **React 19**
- **Tailwind v4**
- **three.js 0.184** — main 3D renderer
- **TypeScript**
- **Cloudflare Pages** — deployment

## Development

```bash
# Install dependencies
npm install

# Start dev server (uses webpack, not Turbopack)
npm run dev

# Production build
npm run build
npm start
```

⚠️ **Important**: This project intentionally uses `next dev --webpack` (not Turbopack) due to a known Turbopack bug in recent Next.js versions. Keep the `--webpack` flag in `package.json`.

## Project structure

```
app/                      # Next.js App Router pages
├── layout.tsx            # Root layout + global metadata/SEO
├── page.tsx              # Homepage (Dropzone + StlViewer demo)
├── globals.css           # Tailwind v4 entry
components/               # React components
├── Dropzone.tsx          # Drag-and-drop file input
└── StlViewer.tsx         # three.js STL renderer
lib/                      # Pure functions (converters, parsers)
public/                   # Static assets
```

## Project documents

This project has accompanying research/strategy docs in the parent directory:

- `../RESEARCH.md` — Competitor research (10 sites analyzed)
- `../STRATEGY.md` — Strategy distillation
- `../PROPOSAL.md` — Fusion strategy proposal
- `../PLAN.md` — 12-week execution plan

## License

TBD
