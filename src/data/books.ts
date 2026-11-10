export type Book = {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  originalAuthor?: string;
  /** Price per week; null falls back to the standard rate. */
  pricePerWeek: number | null;
  /** Refundable deposit; null falls back to the standard pledge. */
  pledge: number | null;
  photo: string;
  available: boolean;
  /** ISO date (YYYY-MM-DD) the book comes back; only meaningful while rented. */
  availableFrom?: string | null;
  /** Position in the catalogue; lower comes first. */
  sortOrder?: number;
  /** Set when the book is in the trash; null when it is live. */
  deletedAt?: string | null;
};

/** Shown when Supabase is not configured, and while the real catalogue loads. */
export const fallbackBooks: Book[] = [
  {
    id: "fa3dce57-c3a2-4f2e-ad36-8f95eb3a6132",
    title: "Дорослі діти емоційно незрілих батьків",
    author: "Ліндсі К. Гібсон",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/3c637tq3oirt2-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "b6635e19-037e-4a43-b13f-9ad8486cdcdc",
    title: "Чоловіки з Марса, жінки з Венери",
    author: "Джон Грей",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/xuroea2fq8tk1-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "d1d4e0b9-66a3-4971-9c99-9b9f3159ccce",
    title: "Марсіанські хроніки",
    author: "Рей Бредбері",
    pricePerWeek: null,
    pledge: null,
    photo: "https://static.yakaboo.ua/media/cloudflare/product/webp/600x840/i/m/img168_37.jpg",
    available: true,
  },
  {
    id: "7996aee8-2447-46df-99d6-0abd7561d309",
    title: "Самостійна дитина: як навчити дітей упорядковувати власне життя",
    author: "Уільям Стіксруд, Нед Джонсон -",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/blpnsa2k2x8u3-UA/image;s=1020x1020;q=70",
    available: true,
  },
  {
    id: "6ec36a0e-5e9d-4af1-82ac-d0ae19c8b14c",
    title: "Спіймай дзен життя. Японські практики, що ведуть до спокою та радості",
    author: "Шунмьо Масуно",
    pricePerWeek: 0,
    pledge: 0,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/n7p4y0b3nize-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "d5f990a2-98a8-42dd-8464-cbd31cd18462",
    title: "Сім’я. Бізнес-проєкт ХХІ століття",
    author: "Валентина Хамайко, Андрій Оністрат",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/2pkx8l63qzwp3-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "d167bd04-bb4d-42b3-8766-f22a9948238f",
    title: "Ніколи не йдіть на компроміс. Техніка ефективних переговорів",
    author: "Тел Рез, Кріс Восс",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/9tfgd7i8bm6k2-UA/image;s=1020x1020;q=70",
    available: true,
  },
  {
    id: "e1b3d050-06a6-4438-8b39-79f4c3a53a1c",
    title: "Прокрастинація",
    author: "Джейн Б. Бурка, Ленора М. Юен",
    pricePerWeek: 50,
    pledge: 200,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/gxcdfbx4xyw9-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "0510406e-7daa-4a3e-9ce4-be8b26ce33de",
    title: "Квіти для Елджернона",
    author: "Деніел Кіз",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/zq66g7spsceo1-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "0a785327-a5c2-4cd6-aff2-fa79517da7de",
    title: "Досить істерик! Комплексний підхід до гармонійного виховання дитини",
    author: "Деніел Сігел, Тіна Брайсон",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/js4b77djdvpp2-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "c4fc7a88-842b-40fc-aabf-f82f8a281de4",
    title: "Філософ, якому бракувало мудрості",
    author: "Лоран Гунель",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/95aw9ia71619-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "fbfad33e-363a-4c22-a4a2-6ad69eef914d",
    title: "Як не стати овочем",
    author: "Оксана Мороз",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/6kin23qife9z-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "dcacf189-4e44-435d-a3c5-762006576d7d",
    title: "Тримайтеся за своїх дітей. Чому батьки повинні бути важливішими за однолітків",
    author: "Габор Мате, Гордон Ньюфелд",
    pricePerWeek: null,
    pledge: 400,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/8n2i196xga8s2-UA/image;s=1020x1020;q=70",
    available: true,
  },
  {
    id: "654d59d9-aa4d-4610-b8e4-677b8ce9b604",
    title: "Простими словами. Як розібратися у своїй поведінці",
    author: "Марк Лівін, Ілля Полудьонний",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/yveeei09hpo52-UA/image;s=1025x717;q=70",
    available: true,
  },
  {
    id: "5a656e68-6773-4016-9340-aa85c7b53a3e",
    title: "Ми - це наш мозок",
    author: "Дік Свааб",
    pricePerWeek: null,
    pledge: 200,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/hyqjtj4a6an03-UA/image;s=1000x700",
    available: false,
  },
  {
    id: "de9ffcc9-1e29-4bc3-98b9-d5c2dca0f745",
    title: "Простими словами. Як розібратися у своїх емоціях",
    author: "Марк Лівін, Ілля Полудьонний",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/az3grd4dggh73-UA/image;s=1025x717;q=70",
    available: true,
  },
  {
    id: "a45ce918-8fb2-4fcb-9f45-19cb40eda50f",
    title: "Як ми псуємо наших дітей і як припинити це робити",
    author: "Наталя Царенко",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/mbov285pnxw4-UA/image;s=1025x717;q=70",
    available: true,
  },
  {
    id: "aa129292-30bc-4552-9d6c-0ce4db2490a2",
    title: "Путівник по Галактиці для космотуристів",
    author: "Дуглас Адамс",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/z1ilw8w6j97p3-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "df126381-84cd-47be-8386-39eec17ac747",
    title: "Рекреації",
    author: "Юрій Андрухович",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/d406j3ybzuor-UA/image;s=1000x700",
    available: false,
  },
  {
    id: "fa73b26f-c78b-40ed-8c8e-1cd402614599",
    title: "Тут клює. Відверті історії українського бізнесмена",
    author: "Дмитро Томчук",
    pricePerWeek: null,
    pledge: 400,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/rvuylusxya5q2-UA/image;s=1000x700",
    available: true,
  },
  {
    id: "b725ed23-fb6e-4056-824f-bc5fba01150c",
    title: "Свобода від виховання",
    author: "Діма Зіцер",
    pricePerWeek: null,
    pledge: null,
    photo: "https://ireland.apollo.olxcdn.com/v1/files/l4y9hei4wjmq-UA/image;s=1000x700",
    available: true,
  },
];
