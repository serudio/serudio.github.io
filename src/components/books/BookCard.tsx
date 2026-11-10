import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import type { Book } from "../../data/books";
import { currency, pledgeFor, priceFor } from "../../data/booksPricing";
import { formatDate } from "../../lib/date";

export default function BookCard({
  book,
  listView,
}: {
  book: Book;
  listView: boolean;
}) {
  const { t, i18n } = useTranslation();
  const rented = !book.available;
  const backOn = rented ? formatDate(book.availableFrom, i18n.language) : null;
  // Dimmed, but the chip saying when it is back stays at full strength —
  // that is the one thing a visitor looking at a rented book wants.
  const dimmed = rented ? { opacity: 0.55 } : null;

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: listView ? "row" : "column",
        width: "100%",
        height: "100%",
        transition: "box-shadow 150ms, transform 150ms",
        bgcolor: rented ? "action.hover" : "background.paper",
        "&:hover": rented
          ? undefined
          : {
              boxShadow: listView ? 2 : 4,
              transform: listView ? "none" : "translateY(-2px)",
            },
      }}
    >
      <CardMedia
        component="img"
        image={book.photo}
        alt={t("books.coverAlt", { title: book.title })}
        loading="lazy"
        sx={{
          height: listView ? 112 : 260,
          objectFit: "contain",
          bgcolor: "grey.100",
          p: 1.5,
          width: listView ? 200 : "100%",
          filter: rented ? "grayscale(1)" : "none",
          ...dimmed,
        }}
      />
      <CardContent
        sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1 }}
      >
        <Box sx={{ flexGrow: 1, ...dimmed }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.3 }}
          >
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {book.author}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Chip
            size="small"
            color="info"
            label={t("books.perPeriod", { price: priceFor(book), currency })}
            sx={dimmed ?? undefined}
          />
          <Chip
            size="small"
            variant="outlined"
            icon={<SavingsOutlinedIcon />}
            label={t("books.pledge", { pledge: pledgeFor(book), currency })}
            sx={dimmed ?? undefined}
          />
          {rented && (
            <Chip
              size="small"
              variant="outlined"
              color="warning"
              label={
                backOn
                  ? t("books.availableFrom", { date: backOn })
                  : t("books.rented")
              }
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
