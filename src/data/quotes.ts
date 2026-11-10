/**
 * Quotes.
 *
 * LANGUAGE RULE: `uk` is Ukrainian and `en` is English. Nothing in this
 * file, in the database, or in the admin form is ever stored in Russian.
 * Several of the originals below were Russian and were translated into
 * Ukrainian when they were added; the Russian wording is not kept.
 *
 * This list is also the bundled fallback, standing in whenever Supabase
 * cannot be reached — the free-tier project pauses after a week idle and
 * then never answers. Same arrangement as src/data/books.ts, and it is
 * what scripts/generate-route-pages.ts falls back to when the build has
 * no database credentials.
 */
import type { QuoteCategory } from './quoteCategories'

export interface Quote {
  id: string
  /** URL slug: /quotes/<slug>. Stable once published — links get shared. */
  slug: string
  /** Ukrainian text. Required, and never Russian. */
  uk: string
  /** English text. Optional: a quote may not have been translated yet. */
  en?: string
  author?: string
  /** Where it is from, when that is worth showing (a book, a play). */
  source?: string
  categories: QuoteCategory['slug'][]
}

export const fallbackQuotes: Quote[] = [
  {
    id: 'q-happiness-shared',
    slug: 'shchastia-tilky-koly-nym-dilyshsia',
    uk: 'Щастя є тільки тоді, коли ним ділишся.',
    en: 'Happiness is only real when shared.',
    categories: ['motivational', 'wisdom'],
  },
  {
    id: 'q-criticism',
    slug: 'krytyka-marna',
    uk: 'Критика марна, бо вона ставить людину в позицію оборонця і спонукає її шукати для себе виправдання. Критика небезпечна, бо вона ранить дороге для людини почуття власної гідності, завдає удару її уявленню про власну значущість, породжує в ній почуття образи та обурення.',
    en: 'Criticism is futile because it puts a person on the defensive and usually makes them strive to justify themselves. Criticism is dangerous because it wounds their precious pride, hurts their sense of importance, and arouses resentment.',
    author: 'Дейл Карнегі',
    categories: ['wisdom'],
  },
  {
    id: 'q-war-with-self',
    slug: 'viina-z-samym-soboiu',
    uk: 'Коли людина починає війну з самою собою, вона вже чогось та варта.',
    en: 'When a man begins a war with himself, he is worth something.',
    author: 'Браунінг',
    categories: ['motivational', 'wisdom'],
  },
  {
    id: 'q-neighbours-roof',
    slug: 'snih-na-dakhu-susida',
    uk: 'Не докоряй сусідові за сніг на його даху, коли в тебе самого поріг не прибраний.',
    en: "Do not complain about the snow on your neighbour's roof when your own doorstep is unclean.",
    author: 'Конфуцій',
    categories: ['wisdom'],
  },
  {
    id: 'q-what-we-lack',
    slug: 'ridko-dumaiemo-pro-te-shcho-maiemo',
    uk: 'Ми рідко думаємо про те, що маємо, але завжди про те, чого нам бракує.',
    en: 'We seldom think of what we have, but always of what we lack.',
    author: 'Артур Шопенгауер',
    categories: ['wisdom'],
  },
  {
    id: 'q-what-lies-at-hand',
    slug: 'robyty-te-shcho-pid-rukoiu',
    uk: 'Наша головна справа — не вдивлятися в те, що ледь мріє в туманній далині, а робити те, що лежить безпосередньо під рукою.',
    en: 'Our main business is not to see what lies dimly at a distance, but to do what lies clearly at hand.',
    categories: ['motivational', 'stoicism'],
  },
  {
    id: 'q-bits-and-pieces',
    slug: 'shmatochky-inshykh-osobystostei',
    uk: 'Я використовую шматочки й частинки інших особистостей, щоб сформувати власну.',
    en: "I use bits and pieces of others' personalities to form my own.",
    author: 'Курт Кобейн',
    categories: ['wisdom'],
  },
  {
    id: 'q-pride-before-fall',
    slug: 'hordynia-peredvisnyk-padinnia',
    uk: 'Гординя — передвісник падіння.',
    en: 'Pride comes before a fall.',
    categories: ['wisdom'],
  },
  {
    id: 'q-worry-dies-young',
    slug: 'khto-ne-vmiie-borotys-z-tryvohoiu',
    uk: 'Людина, яка не вміє боротися з тривогою, помирає молодою.',
    en: 'A person who does not know how to fight worry dies young.',
    author: 'Дейл Карнегі',
    categories: ['motivational', 'wisdom'],
  },
  {
    id: 'q-too-short-to-be-little',
    slug: 'zhyttia-nadto-korotke-shchob-buty-dribiazkovym',
    uk: 'Життя надто коротке, щоб бути дріб’язковим.',
    en: 'Life is too short to be little.',
    categories: ['motivational'],
  },
  {
    id: 'q-thoughts-make-life',
    slug: 'zhyttia-take-iakym-ioho-robliat-dumky',
    uk: 'Наше життя таке, яким його роблять наші думки.',
    en: 'Our life is what our thoughts make it.',
    author: 'Марк Аврелій',
    categories: ['stoicism', 'wisdom'],
  },
  {
    id: 'q-not-risking',
    slug: 'ne-ryzykuiuchy-ryzykuiemo-bilshe',
    uk: 'Проблема в тому, що, не ризикуючи, ми ризикуємо в сто разів більше.',
    en: 'The problem is that by not taking risks, we risk a hundred times more.',
    author: 'Марк Аврелій',
    categories: ['motivational', 'stoicism'],
  },
  {
    id: 'q-vox-populi',
    slug: 'vox-populi-vox-dei',
    uk: 'Vox populi, vox Dei — голос народу, голос Божий.',
    en: 'Vox populi, vox Dei — the voice of the people is the voice of God.',
    categories: ['latin', 'wisdom'],
  },
  {
    id: 'q-tempora-mutantur',
    slug: 'tempora-mutantur',
    uk: 'Tempora mutantur — часи змінюються.',
    en: 'Tempora mutantur — times change.',
    categories: ['latin'],
  },
  {
    id: 'q-porcus',
    slug: 'porcus-ex-grege-diaboli',
    uk: 'Porcus ex grege diaboli — свиня зі стада диявола.',
    en: "Porcus ex grege diaboli — a pig from the devil's herd.",
    categories: ['latin', 'humor'],
  },
  {
    id: 'q-pass-by',
    slug: 'de-ne-mozhna-liubyty-proity-povz',
    uk: 'Де вже не можна любити, там треба пройти повз.',
    en: 'Where one can no longer love, there one should pass by.',
    author: 'Фрідріх Ніцше',
    categories: ['love', 'wisdom'],
  },
  {
    id: 'q-kill-with-laughter',
    slug: 'vbyvaiut-ne-hnivom-a-smikhom',
    uk: 'Вбивають не гнівом, а сміхом.',
    en: 'One kills not by anger but by laughter.',
    author: 'Фрідріх Ніцше',
    categories: ['wisdom', 'humor'],
  },
  {
    id: 'q-how-loudly-you-judge',
    slug: 'iak-malo-znaiete-iak-huchno-sudyte',
    uk: 'Як мало знаєте. Як гучно судите.',
    en: 'How little you know. How loudly you judge.',
    categories: ['wisdom'],
  },
  {
    id: 'q-one-day-at-a-time',
    slug: 'zhyvit-odnym-dnem',
    uk: 'Живіть одним днем.',
    en: 'Live one day at a time.',
    categories: ['stoicism', 'motivational'],
  },
  {
    id: 'q-picasso',
    slug: 'robliu-te-choho-ne-vmiiu',
    uk: 'Я завжди роблю те, чого не вмію, щоб навчитися це робити.',
    en: 'I am always doing that which I cannot do, in order that I may learn how to do it.',
    author: 'Пабло Пікассо',
    categories: ['motivational'],
  },
  {
    id: 'q-take-care-of-your-girls',
    slug: 'khloptsi-berezhit-svoikh-divchat',
    uk: 'Хлопці, бережіть своїх дівчат.',
    en: 'Lads, take care of your girls.',
    categories: ['love'],
  },
  {
    id: 'q-get-angry-to-keep-living',
    slug: 'shchob-zhyty-dali-treba-rozliutytysia',
    uk: 'Інколи, щоб жити далі, треба добряче розлютитися.',
    en: 'Sometimes, to keep living, you have to get properly angry.',
    categories: ['motivational'],
  },

  // --- demotivational: held back unless the category is chosen ---
  {
    id: 'q-no-limit-to-stupidity',
    slug: 'nemaie-mezhi-liudskii-durosti',
    uk: 'Немає межі людській дурості.',
    en: 'There is no limit to human stupidity.',
    categories: ['demotivational', 'humor'],
  },
  {
    id: 'q-love-and-bad-music',
    slug: 'zakokhuiutsia-i-sluhaiut-lainianu-muzyku',
    uk: 'Коли люди закохуються, вони починають слухати лайняну музику.',
    en: 'When people fall in love, they start listening to shitty music.',
    categories: ['love', 'humor', 'demotivational'],
  },
  {
    id: 'q-kids-are-like-farts',
    slug: 'dity-iak-perdizh',
    uk: 'Діти як пердьож: чужий смердить, а свій не чути.',
    en: "Kids are like farts — other people's stink, your own you don't notice.",
    categories: ['humor', 'demotivational'],
  },
  {
    id: 'q-nobody-likes-a-smartass',
    slug: 'khytrozadykh-nikhto-ne-liubyt',
    uk: 'Хитрозадих ніхто не любить.',
    en: 'Nobody likes a smartass.',
    categories: ['humor', 'demotivational'],
  },
  {
    id: 'q-radiation',
    slug: 'radiatsiia-vbyvaie-tilky-tykh-khto-boitsia',
    uk: 'Радіація вбиває тільки тих, хто її боїться.',
    en: 'Radiation only kills those who are afraid of it.',
    categories: ['humor', 'demotivational'],
  },
  {
    id: 'q-hemingway-drink',
    slug: 'vypyty-shchob-ne-bulo-nudno-z-durniamy',
    uk: 'Але розумній людині інколи доводиться випити, щоб не було так нудно з дурнями.',
    en: 'But an intelligent man is sometimes forced to be drunk to spend time with fools.',
    author: 'Ернест Гемінґвей',
    source: 'По кому подзвін',
    categories: ['humor', 'demotivational'],
  },
  {
    id: 'q-alcohol-bitter',
    slug: 'alkohol-trokhy-hirchyt',
    uk: 'Алкоголь трохи гірчить — день минув, і день убитий.',
    en: 'Alcohol tastes a little bitter — the day has passed, and the day is killed.',
    categories: ['demotivational'],
  },
]
