# serudio.github.io

Personal GitHub Pages site — React + TypeScript + MUI.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [MUI](https://mui.com/) (Material UI) for components/theming
- React Router for `/`, `/converters`, `/converters/<slug>`, and `/privacy`
- `react-helmet-async` for per-route SEO tags
- Deployed via GitHub Actions to GitHub Pages

Read [CLAUDE.md](./CLAUDE.md) before adding a page or feature — it has
the SEO / AdSense / custom-domain checklist that's easy to miss otherwise.

## Adding a converter

Add one entry to `src/data/converters.ts` (slug, name, title, description,
a lazy-loaded `Page` component) and a page component under
`src/pages/converters/` that wraps its widget in
`<ConverterPageLayout>`. The `/converters` index, its route, and the
sitemap all pick it up automatically — see `src/pages/converters/FuelConverterPage.tsx`
for a working example.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and deploys `dist/` to GitHub Pages.

**One-time setup:** in the repo's **Settings → Pages**, set "Build and
deployment → Source" to **GitHub Actions** (it currently serves the raw
`main` branch, which no longer applies now that the site is built).

Static files that must be served as-is (AdSense verification, `ads.txt`,
the logo, and a plain-HTML privacy fallback) live in `public/` and are
copied into the build output unchanged.
