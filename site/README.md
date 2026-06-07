# Showcase site

A modern, responsive React + TypeScript + Tailwind landing page for the
Harrier × OpenClaw local semantic memory-search repo. Static, GitHub
Pages-ready, no backend.

## Stack

- [Vite](https://vitejs.dev) 6 (React + TypeScript)
- [Tailwind CSS](https://tailwindcss.com) v4 (`@tailwindcss/vite`)
- [Vitest](https://vitest.dev) + Testing Library for component tests
- ESLint (flat config) with the TypeScript + React Hooks presets

## Local development

```bash
cd site
npm ci            # or: npm install
npm run dev       # http://localhost:5173/harrier-openclaw-memory-search/
```

## Scripts

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server with HMR                   |
| `npm run build`     | Type-check (`tsc -b`) + production build   |
| `npm run preview`   | Serve the built `dist/` locally            |
| `npm run typecheck` | Type-check only, no emit                   |
| `npm run lint`      | ESLint over `src`                          |
| `npm run test`      | Vitest component tests (jsdom)             |

## GitHub Pages deployment

The Vite `base` is `/harrier-openclaw-memory-search/` to match the project
repository path on GitHub Pages. Override it for a custom domain or local
root hosting:

```bash
BASE_PATH=/ npm run build
```

### Option A — automated (recommended)

A workflow at [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
builds `site/` and publishes `site/dist` on every push to `main` that touches
`site/**`. Enable it once:

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The action builds and deploys automatically.

### Option B — manual

```bash
cd site
npm ci
npm run build
# publish the contents of site/dist to the gh-pages branch with your
# preferred tool, e.g. `npx gh-pages -d dist`
```

> The visual language is inspired by modern developer-tool design. This
> project is not affiliated with or endorsed by any third party.
