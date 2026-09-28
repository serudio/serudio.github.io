import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  COMPOUNDING_OPTIONS,
  calculateDeposit,
  type Compounding,
  type TermUnit,
} from "../../../lib/deposit";
import { Summary } from "./Summary";
import { DEFAULTS, TERM_UNITS } from "./constants";
import { SavedForm } from "./types";
import { periodKey, readSavedForm, saveForm } from "./utils";
import { stopWheelEdit } from "../../../lib/dom";

// The converter widget itself. Rendered inside a page's
// <ConverterPageLayout> (see src/pages/converters/), which owns the page
// chrome (Seo, <h1>, back link, ad slot) — this component only owns the
// interactive form.
export default function DepositCalculator() {
  const { t } = useTranslation();
  // Read once, on mount — later writes go through saveForm below.
  const [saved] = useState(readSavedForm);
  const [amount, setAmount] = useState(saved.amount);
  const [rate, setRate] = useState(saved.rate);
  const [term, setTerm] = useState(saved.term);
  const [termUnit, setTermUnit] = useState<TermUnit>(saved.termUnit);
  const [compounding, setCompounding] = useState<Compounding>(
    saved.compounding,
  );
  const [tax, setTax] = useState(saved.tax);
  const [topUp, setTopUp] = useState(saved.topUp);
  const [inflation, setInflation] = useState(saved.inflation);

  const form = useMemo(
    () => ({
      amount,
      rate,
      term,
      termUnit,
      compounding,
      tax,
      topUp,
      inflation,
    }),
    [amount, rate, term, termUnit, compounding, tax, topUp, inflation],
  );

  useEffect(() => {
    saveForm(form);
  }, [form]);

  const isDefault = (Object.keys(DEFAULTS) as (keyof SavedForm)[]).every(
    (key) => form[key] === DEFAULTS[key],
  );

  const reset = () => {
    setAmount(DEFAULTS.amount);
    setRate(DEFAULTS.rate);
    setTerm(DEFAULTS.term);
    setTermUnit(DEFAULTS.termUnit);
    setCompounding(DEFAULTS.compounding);
    setTax(DEFAULTS.tax);
    setTopUp(DEFAULTS.topUp);
    setInflation(DEFAULTS.inflation);
    // No need to clear storage: the effect above rewrites it from the
    // restored defaults on the next render.
  };

  const result = useMemo(
    () =>
      calculateDeposit({
        amount: parseFloat(amount),
        annualRatePercent: parseFloat(rate),
        term: parseFloat(term),
        termUnit,
        compounding,
        taxPercent: parseFloat(tax),
        topUp: parseFloat(topUp),
        inflationPercent: parseFloat(inflation),
      }),
    [amount, rate, term, termUnit, compounding, tax, topUp, inflation],
  );

  const percentAdornment = <InputAdornment position="end">%</InputAdornment>;
  const period = periodKey(compounding);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button
          size="small"
          color="inherit"
          onClick={reset}
          disabled={isDefault}
          startIcon={<RestartAltIcon fontSize="small" />}
        >
          {t("depositCalculator.reset")}
        </Button>
      </Box>
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={amount}
            label={t("depositCalculator.amount")}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onWheel={stopWheelEdit}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            value={rate}
            label={t("depositCalculator.rate")}
            onChange={(e) => setRate(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onWheel={stopWheelEdit}
            InputProps={{ endAdornment: percentAdornment }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={term}
            label={t("depositCalculator.term")}
            onChange={(e) => setTerm(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onWheel={stopWheelEdit}
          />
          <TextField
            fullWidth
            size="small"
            select
            value={termUnit}
            label={t("depositCalculator.termUnit")}
            onChange={(e) => setTermUnit(e.target.value as TermUnit)}
          >
            {TERM_UNITS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {t(`depositCalculator.termUnits.${unit}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <TextField
            fullWidth
            size="small"
            select
            value={compounding}
            label={t("depositCalculator.compounding")}
            onChange={(e) => setCompounding(e.target.value as Compounding)}
          >
            {COMPOUNDING_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`depositCalculator.compoundingOptions.${option}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={topUp}
            label={t("depositCalculator.topUp")}
            helperText={t(`depositCalculator.topUpFrequency.${period}`)}
            onChange={(e) => setTopUp(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onWheel={stopWheelEdit}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            type="number"
            value={tax}
            label={t("depositCalculator.tax")}
            onChange={(e) => setTax(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 100, step: "any" } }}
            onWheel={stopWheelEdit}
            InputProps={{ endAdornment: percentAdornment }}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            value={inflation}
            label={t("depositCalculator.inflation")}
            helperText={t("depositCalculator.inflationHint")}
            onChange={(e) => setInflation(e.target.value)}
            slotProps={{ htmlInput: { step: "any" } }}
            onWheel={stopWheelEdit}
            InputProps={{ endAdornment: percentAdornment }}
          />
        </Stack>
      </Box>
      <Summary
        result={result}
        period={period}
        amount={amount}
        inflation={inflation}
      />
    </Box>
  );
}
