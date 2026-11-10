import type { Book } from "../../data/books";

/** Case- and accent-insensitive, so "prokrastinacia" also finds Ukrainian titles. */
function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Every term must appear somewhere in the book, in any order. */
export function matchesQuery(book: Book, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = normalize(
    [book.title, book.originalTitle, book.author, book.originalAuthor]
      .filter(Boolean)
      .join(" "),
  );

  return terms.every((term) => haystack.includes(term));
}
