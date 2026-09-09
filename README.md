# serudio.github.io

Personal GitHub Pages site — React + TypeScript + MUI.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [MUI](https://mui.com/) (Material UI) for components/theming
- React Router for `/`, `/converters`, `/converters/<slug>`, and `/privacy`
- `react-helmet-async` for per-route SEO tags
- `i18next` + `react-i18next` for Ukrainian/English (see "Internationalization" below)
- Deployed via GitHub Actions to GitHub Pages

Read [CLAUDE.md](./CLAUDE.md) before adding a page or feature — it has
the SEO / AdSense / i18n / custom-domain checklist that's easy to miss
otherwise.

## Adding a converter

Add one entry to `src/data/converters.ts` (slug, `nameKey`/`descriptionKey`/
`titleKey`/`seoDescriptionKey`, a lazy-loaded `Page` component), matching
translation keys under `converters.<slug>.*` in both locale files, and a
page component under `src/pages/converters/` that wraps its widget in
`<ConverterPageLayout>`. The `/converters` index, its route, and the
sitemap all pick it up automatically — see `src/pages/converters/FuelConverterPage.tsx`
for a working example.

## Internationalization

Ukrainian and English, via i18next. Every string lives in
`src/i18n/locales/uk.json` / `en.json` — add new keys to both. Default
language is picked from the browser's own language setting (Ukrainian
for `uk*`, English otherwise); a visitor's explicit choice via the
header's language toggle is remembered in `localStorage`. See
CLAUDE.md's "Internationalization" section for what this does and
doesn't cover (in particular: static files and crawlers only ever see
the Ukrainian version).

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
