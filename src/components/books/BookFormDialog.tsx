import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import { useTranslation } from "react-i18next";

import type { Book } from "../../data/books";
import { currency, rentalTerms } from "../../data/booksPricing";
import type { BookInput } from "../../lib/books/db";

const emptyBook: BookInput = {
  title: "",
  originalTitle: "",
  author: "",
  originalAuthor: "",
  photo: "",
  pricePerWeek: null,
  pledge: null,
  available: true,
  availableFrom: "",
  sortOrder: 0,
};

/** An empty field means "use the standard rate", which is null — not zero. */
function toAmount(raw: string) {
  const trimmed = raw.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function toInput(book: Book | null): BookInput {
  if (!book) return emptyBook;

  // `id` is assigned by the database, so it is not part of the form.
  const { id, ...rest } = book;
  void id;
  return { ...emptyBook, ...rest, availableFrom: book.availableFrom ?? "" };
}

type Props = {
  open: boolean;
  /** The book being edited, or null to add a new one. */
  book: Book | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: BookInput) => void;
};

function BookForm({ book, saving, onClose, onSubmit }: Omit<Props, "open">) {
  const { t } = useTranslation();
  const [values, setValues] = useState<BookInput>(() => toInput(book));

  const set = <K extends keyof BookInput>(key: K, value: BookInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const valid = values.title.trim() && values.author.trim();

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSubmit(values);
        }}
      >
        <DialogTitle>
          {t(book ? "books.admin.formEdit" : "books.admin.formAdd")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("books.admin.fieldTitle")}
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              required
              autoFocus
              fullWidth
            />
            {/* <TextField
              label={t("books.admin.fieldOriginalTitle")}
              value={values.originalTitle ?? ""}
              onChange={(event) => set("originalTitle", event.target.value)}
              fullWidth
            /> */}
            <TextField
              label={t("books.admin.fieldAuthor")}
              value={values.author}
              onChange={(event) => set("author", event.target.value)}
              required
              fullWidth
            />
            {/* <TextField
              label={t("books.admin.fieldOriginalAuthor")}
              value={values.originalAuthor ?? ""}
              onChange={(event) => set("originalAuthor", event.target.value)}
              fullWidth
            /> */}
            <TextField
              label={t("books.admin.fieldPhoto")}
              value={values.photo}
              onChange={(event) => set("photo", event.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("books.admin.fieldPrice")}
                type="number"
                value={values.pricePerWeek ?? ""}
                onChange={(event) =>
                  set("pricePerWeek", toAmount(event.target.value))
                }
                placeholder={String(rentalTerms.perWeek)}
                helperText={t("books.admin.standardHint", {
                  value: rentalTerms.perWeek,
                  currency,
                })}
                fullWidth
              />
              <TextField
                label={t("books.admin.fieldPledge")}
                type="number"
                value={values.pledge ?? ""}
                onChange={(event) =>
                  set("pledge", toAmount(event.target.value))
                }
                placeholder={String(rentalTerms.pledge)}
                helperText={t("books.admin.standardHint", {
                  value: rentalTerms.pledge,
                  currency,
                })}
                fullWidth
              />
              <TextField
                label={t("books.admin.fieldOrder")}
                type="number"
                value={values.sortOrder ?? 0}
                onChange={(event) =>
                  set("sortOrder", Number(event.target.value))
                }
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={values.available}
                  onChange={(event) => set("available", event.target.checked)}
                />
              }
              label={t("books.admin.fieldAvailable")}
            />
            {!values.available && (
              <TextField
                label={t("books.admin.fieldAvailableFrom")}
                type="date"
                value={values.availableFrom ?? ""}
                onChange={(event) => set("availableFrom", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={t("books.admin.availableFromHint")}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            {t("books.admin.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={!valid || saving}>
            {t(saving ? "books.admin.saving" : "books.admin.save")}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

/**
 * Remounts the form on every open so the fields always start from the book
 * being edited — no effect needed to reset them.
 */
export default function BookFormDialog({ open, ...formProps }: Props) {
  return (
    <Dialog open={open} onClose={formProps.onClose} fullWidth maxWidth="sm">
      {open && <BookForm key={formProps.book?.id ?? "new"} {...formProps} />}
    </Dialog>
  );
}
