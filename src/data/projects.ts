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

export const projects: Project[] = [
  {
    titleKey: 'projects.todoCloud.title',
    descriptionKey: 'projects.todoCloud.description',
    url: 'https://serudio.github.io/todo-cloud',
    featured: true,
    badgeKey: 'projects.todoCloud.badge',
  },
  {
    titleKey: 'projects.bookRent.title',
    descriptionKey: 'projects.bookRent.description',
    url: 'https://serudio.github.io/books',
  },
]
