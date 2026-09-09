export interface Project {
  title: string
  description: string
  url: string
  featured?: boolean
  badge?: string
}

export const projects: Project[] = [
  {
    title: 'Todo Cloud',
    description: 'Менеджер завдань у вигляді хмари',
    url: 'https://serudio.github.io/todo-cloud',
    featured: true,
    badge: 'Основний',
  },
  {
    title: 'Book Rent',
    description: 'Сервіс оренди та каталогізації книг',
    url: 'https://serudio.github.io/books',
  },
]
