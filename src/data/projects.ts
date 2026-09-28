import { SITE_URL } from '../config/site'

export interface Project {
  /** i18n key for the project title. */
  titleKey: string
  /** i18n key for the one-line description. */
  descriptionKey: string
  url: string
  featured?: boolean
  /** i18n key for the small badge label, e.g. "Main". */
  badgeKey?: string
}

/**
 * Both projects are separate repos that GitHub Pages serves under this
 * same origin, so their URLs are built from SITE_URL rather than
 * hardcoded — a custom domain will carry them along with everything else
 * (see CLAUDE.md, section "Domain").
 *
 * The trailing slashes matter: GitHub Pages 301-redirects /books to
 * /books/, so linking without one sends every visitor — and every
 * crawler — through a needless redirect before reaching the page.
 */
export const projects: Project[] = [
  {
    titleKey: 'projects.todoCloud.title',
    descriptionKey: 'projects.todoCloud.description',
    url: `${SITE_URL}/todo-cloud/`,
    featured: true,
    badgeKey: 'projects.todoCloud.badge',
  },
  {
    titleKey: 'projects.bookRent.title',
    descriptionKey: 'projects.bookRent.description',
    url: `${SITE_URL}/books/`,
  },
  // Shortcuts into Todo Cloud's own sections. These use hash routes
  // because that app routes by fragment (GitHub Pages has no SPA
  // rewrite, so /todo-cloud/lists is a hard 404) — they work as links,
  // but search engines strip the fragment and fold them back into
  // /todo-cloud/, which is also what that app's canonical tag says. So
  // they're navigation for visitors, not extra indexable pages, and
  // deliberately absent from the sitemap.
  {
    titleKey: 'projects.todoCloudLists.title',
    descriptionKey: 'projects.todoCloudLists.description',
    url: `${SITE_URL}/todo-cloud/#/lists`,
  },
  {
    titleKey: 'projects.todoCloudPoints.title',
    descriptionKey: 'projects.todoCloudPoints.description',
    url: `${SITE_URL}/todo-cloud/#/points`,
  },
]
