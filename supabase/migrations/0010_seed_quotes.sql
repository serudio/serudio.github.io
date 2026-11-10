-- Seed quotes.
--
-- Generated from src/data/quotes.ts, which is also the bundled fallback
-- the site shows when Supabase cannot be reached — keeping both from one
-- source means the live table and the offline snapshot cannot drift.
--
-- LANGUAGE RULE: text_uk is Ukrainian, text_en is English, never Russian.
-- Some of these were Russian originally and were translated into
-- Ukrainian when added; the Russian wording is deliberately not kept.
--
-- Idempotent: re-running updates the existing row for a slug rather than
-- failing or duplicating, so this is safe against a partly-seeded table.
insert into public.quotes (slug, text_uk, text_en, author, source, categories, sort_order)
values
  ('shchastia-tilky-koly-nym-dilyshsia', 'Щастя є тільки тоді, коли ним ділишся.', 'Happiness is only real when shared.', null, null, array['motivational', 'wisdom']::text[], 0),
  ('krytyka-marna', 'Критика марна, бо вона ставить людину в позицію оборонця і спонукає її шукати для себе виправдання. Критика небезпечна, бо вона ранить дороге для людини почуття власної гідності, завдає удару її уявленню про власну значущість, породжує в ній почуття образи та обурення.', 'Criticism is futile because it puts a person on the defensive and usually makes them strive to justify themselves. Criticism is dangerous because it wounds their precious pride, hurts their sense of importance, and arouses resentment.', 'Дейл Карнегі', null, array['wisdom']::text[], 10),
  ('viina-z-samym-soboiu', 'Коли людина починає війну з самою собою, вона вже чогось та варта.', 'When a man begins a war with himself, he is worth something.', 'Браунінг', null, array['motivational', 'wisdom']::text[], 20),
  ('snih-na-dakhu-susida', 'Не докоряй сусідові за сніг на його даху, коли в тебе самого поріг не прибраний.', 'Do not complain about the snow on your neighbour''s roof when your own doorstep is unclean.', 'Конфуцій', null, array['wisdom']::text[], 30),
  ('ridko-dumaiemo-pro-te-shcho-maiemo', 'Ми рідко думаємо про те, що маємо, але завжди про те, чого нам бракує.', 'We seldom think of what we have, but always of what we lack.', 'Артур Шопенгауер', null, array['wisdom']::text[], 40),
  ('robyty-te-shcho-pid-rukoiu', 'Наша головна справа — не вдивлятися в те, що ледь мріє в туманній далині, а робити те, що лежить безпосередньо під рукою.', 'Our main business is not to see what lies dimly at a distance, but to do what lies clearly at hand.', null, null, array['motivational', 'stoicism']::text[], 50),
  ('shmatochky-inshykh-osobystostei', 'Я використовую шматочки й частинки інших особистостей, щоб сформувати власну.', 'I use bits and pieces of others'' personalities to form my own.', 'Курт Кобейн', null, array['wisdom']::text[], 60),
  ('hordynia-peredvisnyk-padinnia', 'Гординя — передвісник падіння.', 'Pride comes before a fall.', null, null, array['wisdom']::text[], 70),
  ('khto-ne-vmiie-borotys-z-tryvohoiu', 'Людина, яка не вміє боротися з тривогою, помирає молодою.', 'A person who does not know how to fight worry dies young.', 'Дейл Карнегі', null, array['motivational', 'wisdom']::text[], 80),
  ('zhyttia-nadto-korotke-shchob-buty-dribiazkovym', 'Життя надто коротке, щоб бути дріб’язковим.', 'Life is too short to be little.', null, null, array['motivational']::text[], 90),
  ('zhyttia-take-iakym-ioho-robliat-dumky', 'Наше життя таке, яким його роблять наші думки.', 'Our life is what our thoughts make it.', 'Марк Аврелій', null, array['stoicism', 'wisdom']::text[], 100),
  ('ne-ryzykuiuchy-ryzykuiemo-bilshe', 'Проблема в тому, що, не ризикуючи, ми ризикуємо в сто разів більше.', 'The problem is that by not taking risks, we risk a hundred times more.', 'Марк Аврелій', null, array['motivational', 'stoicism']::text[], 110),
  ('vox-populi-vox-dei', 'Vox populi, vox Dei — голос народу, голос Божий.', 'Vox populi, vox Dei — the voice of the people is the voice of God.', null, null, array['latin', 'wisdom']::text[], 120),
  ('tempora-mutantur', 'Tempora mutantur — часи змінюються.', 'Tempora mutantur — times change.', null, null, array['latin']::text[], 130),
  ('porcus-ex-grege-diaboli', 'Porcus ex grege diaboli — свиня зі стада диявола.', 'Porcus ex grege diaboli — a pig from the devil''s herd.', null, null, array['latin', 'humor']::text[], 140),
  ('de-ne-mozhna-liubyty-proity-povz', 'Де вже не можна любити, там треба пройти повз.', 'Where one can no longer love, there one should pass by.', 'Фрідріх Ніцше', null, array['love', 'wisdom']::text[], 150),
  ('vbyvaiut-ne-hnivom-a-smikhom', 'Вбивають не гнівом, а сміхом.', 'One kills not by anger but by laughter.', 'Фрідріх Ніцше', null, array['wisdom', 'humor']::text[], 160),
  ('iak-malo-znaiete-iak-huchno-sudyte', 'Як мало знаєте. Як гучно судите.', 'How little you know. How loudly you judge.', null, null, array['wisdom']::text[], 170),
  ('zhyvit-odnym-dnem', 'Живіть одним днем.', 'Live one day at a time.', null, null, array['stoicism', 'motivational']::text[], 180),
  ('robliu-te-choho-ne-vmiiu', 'Я завжди роблю те, чого не вмію, щоб навчитися це робити.', 'I am always doing that which I cannot do, in order that I may learn how to do it.', 'Пабло Пікассо', null, array['motivational']::text[], 190),
  ('khloptsi-berezhit-svoikh-divchat', 'Хлопці, бережіть своїх дівчат.', 'Lads, take care of your girls.', null, null, array['love']::text[], 200),
  ('shchob-zhyty-dali-treba-rozliutytysia', 'Інколи, щоб жити далі, треба добряче розлютитися.', 'Sometimes, to keep living, you have to get properly angry.', null, null, array['motivational']::text[], 210),
  ('nemaie-mezhi-liudskii-durosti', 'Немає межі людській дурості.', 'There is no limit to human stupidity.', null, null, array['demotivational', 'humor']::text[], 220),
  ('zakokhuiutsia-i-sluhaiut-lainianu-muzyku', 'Коли люди закохуються, вони починають слухати лайняну музику.', 'When people fall in love, they start listening to shitty music.', null, null, array['love', 'humor', 'demotivational']::text[], 230),
  ('dity-iak-perdizh', 'Діти як пердьож: чужий смердить, а свій не чути.', 'Kids are like farts — other people''s stink, your own you don''t notice.', null, null, array['humor', 'demotivational']::text[], 240),
  ('khytrozadykh-nikhto-ne-liubyt', 'Хитрозадих ніхто не любить.', 'Nobody likes a smartass.', null, null, array['humor', 'demotivational']::text[], 250),
  ('radiatsiia-vbyvaie-tilky-tykh-khto-boitsia', 'Радіація вбиває тільки тих, хто її боїться.', 'Radiation only kills those who are afraid of it.', null, null, array['humor', 'demotivational']::text[], 260),
  ('vypyty-shchob-ne-bulo-nudno-z-durniamy', 'Але розумній людині інколи доводиться випити, щоб не було так нудно з дурнями.', 'But an intelligent man is sometimes forced to be drunk to spend time with fools.', 'Ернест Гемінґвей', 'По кому подзвін', array['humor', 'demotivational']::text[], 270),
  ('alkohol-trokhy-hirchyt', 'Алкоголь трохи гірчить — день минув, і день убитий.', 'Alcohol tastes a little bitter — the day has passed, and the day is killed.', null, null, array['demotivational']::text[], 280)
on conflict (slug) do update set
  text_uk = excluded.text_uk,
  text_en = excluded.text_en,
  author = excluded.author,
  source = excluded.source,
  categories = excluded.categories,
  sort_order = excluded.sort_order;
