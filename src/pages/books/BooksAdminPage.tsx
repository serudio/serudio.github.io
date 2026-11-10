import AddIcon from "@mui/icons-material/Add";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import BookFormDialog from "../../components/books/BookFormDialog";
import BookTable from "../../components/books/BookTable";
import Seo from "../../components/Seo";
import type { Book } from "../../data/books";
import { useBooks } from "../../hooks/useBooks";
import {
  createBook,
  deleteBook,
  emptyTrash,
  restoreBook,
  trashBook,
  updateBook,
  type BookInput,
} from "../../lib/books/db";
import { BOOKS_ADMIN_PATH, BOOKS_PATH } from "./paths";

export default function BooksAdminPage() {
  const { t } = useTranslation();
  const { email, signOut } = useAuth();
  const { books, loading, refresh } = useBooks({ includeTrashed: true });

  const [tab, setTab] = useState<"catalogue" | "trash">("catalogue");
  const [editing, setEditing] = useState<Book | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const live = books.filter((book) => !book.deletedAt);
  const trashed = books.filter((book) => book.deletedAt);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      await refresh();
      setDialogOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (values: BookInput) =>
    run(() => (editing ? updateBook(editing.id, values) : createBook(values)));

  const openDialog = (book: Book | null) => {
    setEditing(book);
    setError(null);
    setDialogOpen(true);
  };

  const confirmAnd = (message: string, action: () => Promise<void>) => {
    if (window.confirm(message)) void run(action);
  };

  return (
    <Container maxWidth="lg">
      <Seo title={t("books.admin.title")} path={BOOKS_ADMIN_PATH} noIndex />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, mb: 2 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1">
            {t("books.admin.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("books.admin.signedInAs", { email })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog(null)}
        >
          {t("books.admin.add")}
        </Button>
        <Button component={RouterLink} to={BOOKS_PATH}>
          {t("books.admin.viewSite")}
        </Button>
        <Button color="inherit" onClick={() => void signOut()}>
          {t("auth.signOut")}
        </Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, next: "catalogue" | "trash") => setTab(next)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label={t("books.admin.tabBooks", { count: live.length })}
          value="catalogue"
        />
        <Tab
          value="trash"
          label={
            <Badge badgeContent={trashed.length} color="default">
              <Box sx={{ pr: trashed.length ? 2 : 0 }}>
                {t("books.admin.tabTrash")}
              </Box>
            </Badge>
          }
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tab === "catalogue" ? (
        <BookTable
          books={live}
          variant="catalogue"
          emptyText={t("books.admin.emptyCatalogue")}
          onEdit={openDialog}
          onTrash={(book) =>
            void run(async () => {
              await trashBook(book.id);
            })
          }
        />
      ) : (
        <Stack spacing={2}>
          {trashed.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                color="error"
                startIcon={<DeleteSweepIcon />}
                disabled={saving}
                onClick={() =>
                  confirmAnd(
                    t("books.admin.confirmEmptyTrash", {
                      count: trashed.length,
                    }),
                    emptyTrash,
                  )
                }
              >
                {t("books.admin.emptyTrashButton")}
              </Button>
            </Box>
          )}
          <BookTable
            books={trashed}
            variant="trash"
            emptyText={t("books.admin.emptyTrash")}
            onRestore={(book) =>
              void run(async () => {
                await restoreBook(book.id);
              })
            }
            onDeleteForever={(book) =>
              confirmAnd(
                t("books.admin.confirmDeleteForever", { title: book.title }),
                () => deleteBook(book.id),
              )
            }
          />
        </Stack>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <BookFormDialog
        open={dialogOpen}
        book={editing}
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
