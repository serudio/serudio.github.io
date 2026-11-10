/**
 * Rewrites the fallback catalogue in src/data/books.ts from the live table.
 * That list is what visitors see when Supabase is unreachable, so it is worth
 * re-running (npm run fallback:sync) after the catalogue changes noticeably.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [name, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();
    if (name && value && !process.env[name]) {
      process.env[name] = value.replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");

type Row = {
  id: string;
  title: string;
  original_title: string | null;
  author: string;
  original_author: string | null;
  photo_url: string | null;
  price_per_week: number | null;
  pledge: number | null;
  available: boolean;
  available_from: string | null;
};

const response = await fetch(
  `${url}/rest/v1/books?select=*&deleted_at=is.null&order=sort_order.asc`,
  { headers: { apikey: key } },
);
if (!response.ok) throw new Error(`Supabase answered ${response.status}`);

const rows: Row[] = await response.json();
if (rows.length === 0) throw new Error("Refusing to write an empty fallback list");

const entry = (row: Row) => {
  const lines = [
    `    id: ${JSON.stringify(row.id)},`,
    `    title: ${JSON.stringify(row.title)},`,
    row.original_title && `    originalTitle: ${JSON.stringify(row.original_title)},`,
    `    author: ${JSON.stringify(row.author)},`,
    row.original_author && `    originalAuthor: ${JSON.stringify(row.original_author)},`,
    `    pricePerWeek: ${row.price_per_week ?? "null"},`,
    `    pledge: ${row.pledge ?? "null"},`,
    `    photo: ${JSON.stringify(row.photo_url ?? "")},`,
    `    available: ${row.available},`,
    row.available_from && `    availableFrom: ${JSON.stringify(row.available_from)},`,
  ].filter(Boolean);
  return `  {\n${lines.join("\n")}\n  },`;
};

const source = readFileSync("src/data/books.ts", "utf8");
const marker = "export const fallbackBooks: Book[] = [";
const start = source.indexOf(marker);
if (start === -1) throw new Error("Could not find fallbackBooks in src/data/books.ts");

const head = source.slice(0, start + marker.length);
writeFileSync(
  "src/data/books.ts",
  `${head}\n${rows.map(entry).join("\n")}\n];\n`,
);

console.log(`Wrote ${rows.length} books into the fallback list.`);
