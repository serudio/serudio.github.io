import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";

// US gallons -> liters (3.78541) times km per mile (1.60934), collapsed
// to the classic 235.215 constant used for MPG -> L/100km conversion.
const MPG_TO_L100KM_CONSTANT = 235.215;
const DEFAULT_MPG = 24;
const QUICK_PICKS = [18, 20, 21, 24, 27, 30, 33, 35, 38, 40];

function toLitersPer100Km(mpg: number): string {
  if (!mpg || mpg <= 0) return "0.00";
  return (MPG_TO_L100KM_CONSTANT / mpg).toFixed(2);
}

export default function FuelCalculator() {
  const [mpg, setMpg] = useState<string>(String(DEFAULT_MPG));

  const result = useMemo(() => toLitersPer100Km(parseFloat(mpg)), [mpg]);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          fontWeight: 600,
        }}
      >
        <LocalGasStationIcon fontSize="small" color="secondary" />
        Конвертер витрати пального
      </Typography>

      <TextField
        type="number"
        fullWidth
        value={mpg}
        onChange={(e) => setMpg(e.target.value)}
        placeholder="Введіть значення..."
        slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
        InputProps={{
          endAdornment: <InputAdornment position="end">US MPG</InputAdornment>,
        }}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "baseline",
          gap: 1,
          pt: 1.5,
          borderTop: "1px dashed",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Typography variant="h6" color="info.main" fontWeight={700}>
          {result}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          L/100 km
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "text.secondary",
          fontWeight: 700,
          display: "block",
          mb: 1.5,
        }}
      >
        Швидкий пошук (популярні MPG)
      </Typography>

      <Grid container spacing={1}>
        {QUICK_PICKS.map((value) => (
          <Grid item xs={6} key={value}>
            <ButtonBase
              onClick={() => setMpg(String(value))}
              sx={{
                width: "100%",
                justifyContent: "space-between",
                px: 1.75,
                py: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(99, 102, 241, 0.06)",
                },
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {value} MPG
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color="secondary.main"
              >
                {toLitersPer100Km(value)} L
              </Typography>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
