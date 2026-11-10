import type { Book } from "../../data/books";
import { supabase } from "../supabase";

export type BookRow = {
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
  sort_order: number;
  deleted_at: string | null;
};

const columns =
  "id, title, original_title, author, original_author, photo_url, price_per_week, pledge, available, available_from, sort_order, deleted_at";

export function mapBookRow(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title ?? undefined,
    author: row.author,
    originalAuthor: row.original_author ?? undefined,
    photo: row.photo_url ?? "",
    pricePerWeek: row.price_per_week,
    pledge: row.pledge,
    available: row.available,
    availableFrom: row.available_from,
    sortOrder: row.sort_order,
    deletedAt: row.deleted_at,
  };
}

/** The shape the admin form edits; the rest is managed by the database. */
export type BookInput = Omit<Book, "id" | "deletedAt">;

function toRow(book: BookInput) {
  return {
    title: book.title.trim(),
    original_title: book.originalTitle?.trim() || null,
    author: book.author.trim(),
    original_author: book.originalAuthor?.trim() || null,
    photo_url: book.photo.trim() || null,
    price_per_week: book.pricePerWeek ?? null,
    pledge: book.pledge ?? null,
    available: book.available,
    // Only kept while the book is out; an available book has no return date.
    available_from: book.available ? null : book.availableFrom || null,
    sort_order: book.sortOrder ?? 0,
  };
}

/**
 * A paused Supabase project does not refuse the connection, it just never
 * answers — so without a deadline the catalogue spins forever.
 */
const REQUEST_TIMEOUT_MS = 8000;

function client() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

/**
 * Trashed books are also hidden by row-level security for everyone but the
 * admin; the filter keeps them out of the public list for the admin too.
 */
export async function getBooks({ includeTrashed = false } = {}) {
  const query = client().from("books").select(columns);

  return (includeTrashed ? query : query.is("deleted_at", null))
    .order("sort_order", { ascending: true })
    .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
    .returns<BookRow[]>();
}

export async function createBook(book: BookInput) {
  const { error } = await client().from("books").insert(toRow(book));
  if (error) throw error;
}

export async function updateBook(id: string, book: BookInput) {
  const { error } = await client()
    .from("books")
    .update(toRow(book))
    .eq("id", id);
  if (error) throw error;
}

/** Moves a book to the trash; the row stays, hidden from the public list. */
export async function trashBook(id: string) {
  const { error } = await client()
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreBook(id: string) {
  const { error } = await client()
    .from("books")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

/** Permanent — the row is gone for good. */
export async function deleteBook(id: string) {
  const { error } = await client().from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function emptyTrash() {
  const { error } = await client()
    .from("books")
    .delete()
    .not("deleted_at", "is", null);
  if (error) throw error;
}
