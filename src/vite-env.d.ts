/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_SITE_NAME: string
  readonly VITE_DEFAULT_TITLE: string
  readonly VITE_DEFAULT_DESCRIPTION: string
  readonly VITE_ADSENSE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
