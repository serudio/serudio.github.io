import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import uk from './locales/uk.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['uk', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Default language: Ukrainian for Ukrainian-speaking visitors, English
 * for everyone else. There's no server here to do IP/geo lookups (and a
 * client-side geo-IP call would mean a third-party network request for
 * every visitor just to pick a language) — so detection is based on the
 * browser's own language setting (`navigator.language`), which is the
 * standard, privacy-preserving proxy for this and needs no network call.
 * A visitor's explicit choice via <LanguageSwitcher /> always wins after
 * that, remembered in localStorage.
 *
 * If real geo-targeting (e.g. defaulting to Ukrainian for anyone
 * browsing from Ukraine regardless of browser language) turns out to
 * matter, that needs a geo-IP service and is a separate, explicit
 * decision — flag it before adding one.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
      en: { translation: en },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // 'uk-UA' -> 'uk', 'en-GB' -> 'en', etc.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'serudio_lang',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
