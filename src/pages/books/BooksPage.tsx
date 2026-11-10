import ClearIcon from "@mui/icons-material/Close";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import SearchIcon from "@mui/icons-material/Search";
import TelegramIcon from "@mui/icons-material/Telegram";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import BookCard from "../../components/books/BookCard";
import BooksInfoDrawer from "../../components/books/BooksInfoDrawer";
import Seo from "../../components/Seo";
import { contact } from "../../data/booksContact";
import { useBooks } from "../../hooks/useBooks";
import { matchesQuery } from "../../lib/books/search";
import { BOOKS_PATH, BOOKS_ADMIN_PATH } from "./paths";

const gridSx = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
    lg: "repeat(4, 1fr)",
  },
} as const;

const listSx = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
} as const;

export default function BooksPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { books, loading, failed } = useBooks();
  const [listView, setListView] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => books.filter((book) => matchesQuery(book, query)),
    [books, query],
  );
  const searching = query.trim().length > 0;

  return (
    <Container maxWidth="lg" component="section">
      <Seo
        title={t("books.seoTitle")}
        description={t("books.seoDescription")}
        path={BOOKS_PATH}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, mb: 2 }}
      >
        <Typography variant="h5" component="h1" sx={{ flexShrink: 0 }}>
          {t("books.title")}
        </Typography>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("books.searchPlaceholder")}
          aria-label={t("books.searchLabel")}
          size="small"
          fullWidth
          type="search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searching ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={t("books.clearSearch")}
                    onClick={() => setQuery("")}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{ maxWidth: { sm: 480 } }}
        />
        <IconButton
          aria-label={t("books.toggleView")}
          onClick={() => setListView((prev) => !prev)}
        >
          <FormatListBulletedIcon color={listView ? "action" : "disabled"} />
        </IconButton>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: "center", flexWrap: "wrap", mb: 3 }}
      >
        <Typography color="text.secondary">
          {loading
            ? t("books.loading")
            : searching
              ? t("books.found", {
                  count: visible.length,
                  total: books.length,
                })
              : t("books.summary", { count: books.length })}
        </Typography>

        <Card sx={{ display: "flex", alignItems: "center", p: 0.5 }}>
          <TelegramIcon color="primary" fontSize="small" />
          <Link
            href={`https://t.me/${contact.telegram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            sx={{ ml: 0.5, fontSize: "0.875rem", textDecoration: "none" }}
          >
            {contact.telegram}
          </Link>
        </Card>

        <Button size="small" onClick={() => setInfoOpen(true)}>
          {t("books.info.open")}
        </Button>

        {isAdmin && (
          <Button size="small" component={RouterLink} to={BOOKS_ADMIN_PATH}>
            {t("books.admin.link")}
          </Button>
        )}
      </Stack>

      {failed && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t("books.unreachable")}
        </Alert>
      )}

      {!loading && visible.length === 0 ? (
        <Typography color="text.secondary">
          {t("books.nothingFound", { query: query.trim() })}
        </Typography>
      ) : (
        <Box sx={listView ? listSx : gridSx}>
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} variant="rounded" height={400} />
              ))
            : visible.map((book) => (
                <BookCard key={book.id} book={book} listView={listView} />
              ))}
        </Box>
      )}

      <BooksInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Container>
  );
}
