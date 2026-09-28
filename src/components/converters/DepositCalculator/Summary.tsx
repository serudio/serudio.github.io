import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Table,
  TableBody,
  ButtonBase,
} from "@mui/material";
import { DepositResult } from "../../../lib/deposit";
import { useTranslation } from "react-i18next";
import { SummaryRow } from "./SummaryRow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Props = {
  result: DepositResult | null;
  period: "monthly" | "quarterly" | "semiannually" | "annually";
  amount: string;
  inflation: string;
};

export const Summary: React.FC<Props> = ({
  result,
  period,
  amount,
  inflation,
}) => {
  const { t, i18n } = useTranslation();

  // Years the visitor has folded away. Holding the collapsed ones (rather
  // than the expanded ones) keeps "everything open" as the default when
  // the term changes and new years appear.
  const [collapsedYears, setCollapsedYears] = useState<number[]>([]);

  // The year rows stick below the column header, so they need its
  // height. It isn't a constant — "Amount before" wraps to two lines on
  // a narrow screen — so measure the real element rather than guessing,
  // and keep measuring as the table is resized. A callback ref (not
  // useRef) because the whole table unmounts whenever the inputs stop
  // describing a valid deposit.
  const [headEl, setHeadEl] = useState<HTMLTableSectionElement | null>(null);
  const [headHeight, setHeadHeight] = useState(0);

  useEffect(() => {
    if (!headEl) return;

    const measure = () => setHeadHeight(headEl.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(headEl);
    return () => observer.disconnect();
  }, [headEl]);

  const hasTax = result !== null && result.tax > 0;
  const hasTopUps =
    result !== null && result.totalContributed > parseFloat(amount);

  // Group digits the way the current language does (uk uses spaces,
  // en uses commas) rather than hardcoding one convention.
  const money = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [i18n.language],
  );

  // Over a term longer than a year, a flat run of "quarter 7, quarter 8"
  // gives no sense of where you are, so break the rows into years. With
  // annual capitalization every row is already a year — nothing to group.
  const groupByYear =
    result !== null &&
    result.periodsPerYear > 1 &&
    result.schedule.length > result.periodsPerYear;

  // With inflation at 0 the real figures are just copies of the nominal
  // ones, so the extra rows would be noise.
  const hasInflation = result !== null && parseFloat(inflation) !== 0;

  const yearGroups = result?.years ?? [];
  // Checked against the years that currently exist, so entries left over
  // from a longer term can't make the button lie.
  const allCollapsed =
    yearGroups.length > 0 &&
    yearGroups.every((group) => collapsedYears.includes(group.year));

  const toggleYear = (year: number) =>
    setCollapsedYears((previous) =>
      previous.includes(year)
        ? previous.filter((value) => value !== year)
        : [...previous, year],
    );

  const toggleAllYears = () =>
    setCollapsedYears(
      allCollapsed ? [] : yearGroups.map((group) => group.year),
    );

  if (!result) {
    return (
      <Box sx={{ pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "right" }}
        >
          {t("depositCalculator.noResult")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <>
        <Box sx={{ pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
          <Stack spacing={1}>
            {hasTopUps && (
              <SummaryRow
                label={t("depositCalculator.totalContributed")}
                value={money.format(result.totalContributed)}
              />
            )}
            <SummaryRow
              label={t("depositCalculator.grossInterest")}
              value={money.format(result.grossInterest)}
            />
            {hasTax && (
              <SummaryRow
                label={t("depositCalculator.taxWithheld")}
                value={`-${money.format(result.tax)}`}
              />
            )}
            <SummaryRow
              label={t("depositCalculator.effectiveRate")}
              value={`${result.effectiveAnnualRatePercent.toFixed(2)} %`}
            />
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              mt: 2,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("depositCalculator.finalAmount")}
            </Typography>
            <Typography variant="h6" color="info.main" fontWeight={700}>
              {money.format(result.finalAmount)}
            </Typography>
          </Box>

          {hasInflation && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px dashed",
                borderColor: "divider",
              }}
            >
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
                {t("depositCalculator.realHeading")}
              </Typography>

              <Stack spacing={1}>
                <SummaryRow
                  label={t("depositCalculator.realContributed")}
                  value={money.format(result.realTotalContributed)}
                />
                <SummaryRow
                  label={t("depositCalculator.realInterest")}
                  value={money.format(result.realNetInterest)}
                  // A deposit that loses to inflation is the whole
                  // point of this block, so don't let a negative gain
                  // read like just another number.
                  negative={result.realNetInterest < 0}
                />
                <SummaryRow
                  label={t("depositCalculator.realRate")}
                  value={`${result.realEffectiveAnnualRatePercent.toFixed(2)} %`}
                  negative={result.realEffectiveAnnualRatePercent < 0}
                />
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("depositCalculator.realFinalAmount")}
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={
                    result.realNetInterest < 0 ? "error.main" : "success.main"
                  }
                >
                  {money.format(result.realFinalAmount)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mt: 4,
            mb: 1,
          }}
        >
          <Typography variant="subtitle2">
            {t("depositCalculator.schedule.heading")}
          </Typography>
          {groupByYear && (
            <Button size="small" onClick={toggleAllYears}>
              {t(
                allCollapsed
                  ? "depositCalculator.schedule.expandAll"
                  : "depositCalculator.schedule.collapseAll",
              )}
            </Button>
          )}
        </Box>

        <TableContainer
          sx={{ maxHeight: 430, border: "1px solid", borderColor: "divider" }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              "& .MuiTableCell-root": { px: 1, fontSize: "0.75rem" },
              "& .MuiTableBody-root .MuiTableCell-root": {
                whiteSpace: "nowrap",
              },
            }}
          >
            <TableHead ref={setHeadEl}>
              <TableRow>
                <TableCell>
                  {t(`depositCalculator.schedule.period.${period}`)}
                </TableCell>
                <TableCell align="right">
                  {t("depositCalculator.schedule.opening")}
                </TableCell>
                {hasTopUps && (
                  <TableCell align="right">
                    {t("depositCalculator.schedule.topUp")}
                  </TableCell>
                )}
                <TableCell align="right">
                  {t("depositCalculator.schedule.income")}
                </TableCell>
                {hasTax && (
                  <TableCell align="right">
                    {t("depositCalculator.schedule.netIncome")}
                  </TableCell>
                )}
                <TableCell align="right">
                  {t("depositCalculator.schedule.closing")}
                </TableCell>
              </TableRow>
            </TableHead>
            {yearGroups.map((yearGroup) => {
              const collapsed =
                groupByYear && collapsedYears.includes(yearGroup.year);

              return (
                <TableBody key={yearGroup.year}>
                  {groupByYear && (
                    <TableRow
                      sx={{
                        "& .MuiTableCell-root": {
                          position: "sticky",
                          top: headHeight,
                          zIndex: 1,
                        },
                        // The label cell pins sideways as well as down, so
                        // it has to outrank the numeric cells it slides
                        // under. It sets this on itself too, but a rule
                        // scoped to the row beats a cell's own sx on
                        // specificity — hence :first-of-type here.
                        "& .MuiTableCell-root:first-of-type": {
                          left: 0,
                          zIndex: 2,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          bgcolor: "background.default",
                          color: "text.secondary",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          p: "0 !important",
                        }}
                      >
                        {/* The cell spans the full table width, so on a
                              narrow screen its label would scroll out of
                              sight just as the sideways scroll makes the
                              year context most useful — pin it instead. */}
                        <ButtonBase
                          onClick={() => toggleYear(yearGroup.year)}
                          aria-expanded={!collapsed}
                          sx={{
                            position: "sticky",
                            left: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.25,
                            px: 0.5,
                            py: 0.75,
                            font: "inherit",
                            letterSpacing: "inherit",
                            textTransform: "inherit",
                            borderRadius: 1,
                          }}
                        >
                          {collapsed ? (
                            <ChevronRightIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                          {t("depositCalculator.schedule.year", {
                            year: yearGroup.year,
                          })}
                        </ButtonBase>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          bgcolor: "background.default",
                          fontWeight: 700,
                        }}
                      >
                        {money.format(yearGroup.openingBalance)}
                      </TableCell>
                      {hasTopUps && (
                        <TableCell
                          align="right"
                          sx={{
                            bgcolor: "background.default",
                            fontWeight: 700,
                          }}
                        >
                          {money.format(yearGroup.topUp)}
                        </TableCell>
                      )}
                      <TableCell
                        align="right"
                        sx={{
                          bgcolor: "background.default",
                          fontWeight: 700,
                        }}
                      >
                        {money.format(yearGroup.grossInterest)}
                      </TableCell>
                      {hasTax && (
                        <TableCell
                          align="right"
                          sx={{
                            bgcolor: "background.default",
                            fontWeight: 700,
                          }}
                        >
                          {money.format(yearGroup.netInterest)}
                        </TableCell>
                      )}
                      <TableCell
                        align="right"
                        sx={{
                          bgcolor: "background.default",
                          fontWeight: 700,
                        }}
                      >
                        {money.format(yearGroup.closingBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                  {!collapsed &&
                    yearGroup.rows.map((row) => (
                      <TableRow key={row.index} hover>
                        <TableCell>
                          {groupByYear ? row.indexInYear : row.index}
                          {row.fraction < 1 && "*"}
                        </TableCell>
                        <TableCell align="right">
                          {money.format(row.openingBalance)}
                        </TableCell>
                        {hasTopUps && (
                          <TableCell align="right">
                            {money.format(row.topUp)}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          {money.format(row.grossInterest)}
                        </TableCell>
                        {hasTax && (
                          <TableCell align="right">
                            {money.format(row.netInterest)}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {money.format(row.closingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              );
            })}
          </Table>
        </TableContainer>

        {result.schedule.some((row) => row.fraction < 1) && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            {t("depositCalculator.schedule.partialPeriodNote")}
          </Typography>
        )}
      </>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 3 }}
      >
        {t("depositCalculator.disclaimer")}
      </Typography>
    </Box>
  );
};
