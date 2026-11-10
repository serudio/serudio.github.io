import PlaceIcon from "@mui/icons-material/Place";
import TelegramIcon from "@mui/icons-material/Telegram";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { contact } from "../../data/booksContact";
import { currency, rentalTerms } from "../../data/booksPricing";

export default function BooksInfoDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const rates = [
    { label: t("books.info.perTwoWeeks"), value: rentalTerms.perWeek },
    { label: t("books.info.perExtraDay"), value: rentalTerms.perExtraDay },
    { label: t("books.info.pledge"), value: rentalTerms.pledge },
  ];

  return (
    <Drawer open={open} anchor="right" onClose={onClose}>
      <Box sx={{ width: 250, p: 2 }}>
        <Typography sx={{ mb: 1 }}>{contact.intro}</Typography>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t("books.info.pricing")}
        </Typography>
        <Box sx={{ gap: 1, display: "flex", flexDirection: "column", mb: 2 }}>
          {rates.map((rate) => (
            <Box
              key={rate.label}
              sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "secondary.main" }}
              >
                {rate.value} {currency}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {rate.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Card sx={{ p: 1.5, borderRadius: 2 }}>
          <List>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <TelegramIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Telegram"
                secondary={
                  <Link
                    href={`https://t.me/${contact.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {contact.telegram}
                  </Link>
                }
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PlaceIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={contact.city}
                secondary={
                  <Link href={contact.mapUrl} target="_blank" rel="noreferrer">
                    {contact.address}
                  </Link>
                }
              />
            </ListItem>
          </List>
        </Card>
      </Box>
    </Drawer>
  );
}
