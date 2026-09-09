# serudio.github.io

Personal GitHub Pages site — React + TypeScript + MUI.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [MUI](https://mui.com/) (Material UI) for components/theming
- React Router for the `/` and `/privacy` routes
- Deployed via GitHub Actions to GitHub Pages

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
