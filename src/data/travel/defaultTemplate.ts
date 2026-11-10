/**
 * The starter packing list a new account begins with.
 *
 * Deliberately generic. This file is committed to a public repository,
 * so it carries no names, no medication and no household specifics —
 * anything personal belongs in your own account, imported privately,
 * never here. Editing your list after importing it changes only your
 * rows; this template stays as the starting point for everyone.
 */
export interface TemplateCategory {
  /** Stable key: also the i18n key suffix under travel.categories.*. */
  key: string
  /** Fallback name, used when a translation is missing. */
  name: string
  color: string
  items: string[]
}

export interface DefaultTemplate {
  categories: TemplateCategory[]
  /** Things to do before leaving, not things to pack. */
  notes: string[]
}

export const defaultTemplate: DefaultTemplate = {
  categories: [
    {
      key: 'documents',
      name: 'Документи',
      color: '#6366f1',
      items: [
        'Паспорт',
        'Посвідчення водія',
        'Страховка',
        'Квитки',
        'Зелена карта',
        'Готівка',
        'Банківська картка',
        'Завантажені офлайн-карти',
      ],
    },
    {
      key: 'electronics',
      name: 'Електроніка',
      color: '#38bdf8',
      items: [
        'Телефон і зарядка',
        'Ноутбук і зарядка',
        'Навушники',
        'Павербанк',
        'Перехідники та кабелі',
        'Електронна книга',
      ],
    },
    {
      key: 'toiletries',
      name: 'Гігієна',
      color: '#a855f7',
      items: [
        'Зубна щітка і паста',
        'Шампунь',
        'Гель для душу',
        'Дезодорант',
        'Гребінець',
        'Сонцезахисний крем',
        'Вологі серветки',
        'Туалетний папір',
      ],
    },
    {
      key: 'clothes',
      name: 'Одяг і взуття',
      color: '#f59e0b',
      items: [
        'Шкарпетки',
        'Білизна',
        'Футболки',
        'Штани',
        'Светр',
        'Куртка',
        'Піжама',
        'Зручне взуття',
        'Головний убір',
      ],
    },
    {
      key: 'firstAid',
      name: 'Аптечка',
      color: '#ef4444',
      items: [
        'Ліки за рецептом',
        'Знеболювальне',
        'Пластир',
        'Еластичний бинт',
        'Антисептик',
        'Засіб від алергії',
        'Термометр',
      ],
    },
  ],
  notes: [
    'Вимкнути воду',
    'Полити квіти',
    'Винести сміття',
    'Перевірити вікна і двері',
    'Зарядити всі пристрої',
  ],
}
