import { useMemo, useState, type WheelEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import {
  COMPOUNDING_OPTIONS,
  calculateDeposit,
  type Compounding,
  type TermUnit,
} from '../../lib/deposit'

const TERM_UNITS: TermUnit[] = ['months', 'years']

/**
 * A focused <input type="number"> treats the wheel as "nudge the value",
 * so scrolling the page with the pointer over a field silently edits the
 * deposit — easy to do here, since the breakdown table sits below the
 * form. Drop focus instead and let the page scroll.
 */
function stopWheelEdit(event: WheelEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (document.activeElement === target) target.blur()
}

/**
 * What one schedule row covers, for labelling. Without capitalization
 * the schedule falls back to months (see UNCAPITALIZED_PERIODS_PER_YEAR
 * in lib/deposit.ts), so 'end' is labelled monthly too.
 */
function periodKey(compounding: Compounding): 'monthly' | 'quarterly' | 'annually' {
  return compounding === 'end' ? 'monthly' : compounding
}

// The converter widget itself. Rendered inside a page's
// <ConverterPageLayout> (see src/pages/converters/), which owns the page
// chrome (Seo, <h1>, back link, ad slot) — this component only owns the
// interactive form.
export default function DepositCalculator() {
  const { t, i18n } = useTranslation()
  const [amount, setAmount] = useState('100000')
  const [rate, setRate] = useState('14')
  const [term, setTerm] = useState('12')
  const [termUnit, setTermUnit] = useState<TermUnit>('months')
  const [compounding, setCompounding] = useState<Compounding>('monthly')
  const [tax, setTax] = useState('0')
  const [topUp, setTopUp] = useState('0')

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
      }),
    [amount, rate, term, termUnit, compounding, tax, topUp],
  )

  // Group digits the way the current language does (uk uses spaces,
  // en uses commas) rather than hardcoding one convention.
  const money = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [i18n.language],
  )

  const percentAdornment = <InputAdornment position="end">%</InputAdornment>
  const period = periodKey(compounding)
  const hasTax = result !== null && result.tax > 0
  const hasTopUps = result !== null && result.totalContributed > parseFloat(amount)

  return (
    <>
      <TextField
        type="number"
        fullWidth
        value={amount}
        label={t('depositCalculator.amount')}
        onChange={(e) => setAmount(e.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
        onWheel={stopWheelEdit}
        sx={{ mb: 2 }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="number"
          fullWidth
          value={rate}
          label={t('depositCalculator.rate')}
          onChange={(e) => setRate(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          onWheel={stopWheelEdit}
          InputProps={{ endAdornment: percentAdornment }}
        />
        <TextField
          type="number"
          fullWidth
          value={term}
          label={t('depositCalculator.term')}
          onChange={(e) => setTerm(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          onWheel={stopWheelEdit}
        />
        <TextField
          select
          fullWidth
          value={termUnit}
          label={t('depositCalculator.termUnit')}
          onChange={(e) => setTermUnit(e.target.value as TermUnit)}
        >
          {TERM_UNITS.map((unit) => (
            <MenuItem key={unit} value={unit}>
              {t(`depositCalculator.termUnits.${unit}`)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          fullWidth
          value={compounding}
          label={t('depositCalculator.compounding')}
          onChange={(e) => setCompounding(e.target.value as Compounding)}
        >
          {COMPOUNDING_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {t(`depositCalculator.compoundingOptions.${option}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="number"
          fullWidth
          value={tax}
          label={t('depositCalculator.tax')}
          onChange={(e) => setTax(e.target.value)}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 'any' } }}
          onWheel={stopWheelEdit}
          InputProps={{ endAdornment: percentAdornment }}
        />
      </Stack>

      <TextField
        type="number"
        fullWidth
        value={topUp}
        label={t('depositCalculator.topUp')}
        helperText={t(`depositCalculator.topUpFrequency.${period}`)}
        onChange={(e) => setTopUp(e.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
        onWheel={stopWheelEdit}
        sx={{ mb: 3 }}
      />

      {result === null ? (
        <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
            {t('depositCalculator.noResult')}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Stack spacing={1}>
              {hasTopUps && (
                <SummaryRow
                  label={t('depositCalculator.totalContributed')}
                  value={money.format(result.totalContributed)}
                />
              )}
              <SummaryRow
                label={t('depositCalculator.grossInterest')}
                value={money.format(result.grossInterest)}
              />
              {hasTax && (
                <SummaryRow
                  label={t('depositCalculator.taxWithheld')}
                  value={`-${money.format(result.tax)}`}
                />
              )}
              <SummaryRow
                label={t('depositCalculator.effectiveRate')}
                value={`${result.effectiveAnnualRatePercent.toFixed(2)} %`}
              />
            </Stack>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('depositCalculator.finalAmount')}
              </Typography>
              <Typography variant="h6" color="info.main" fontWeight={700}>
                {money.format(result.finalAmount)}
              </Typography>
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>
            {t('depositCalculator.schedule.heading')}
          </Typography>

          <TableContainer sx={{ maxHeight: 380, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                // Six columns have to fit a narrow card, so trade cell
                // padding for column count; the container still scrolls
                // sideways if a very large amount overflows anyway.
                '& .MuiTableCell-root': { px: 1, py: 0.75, fontSize: '0.75rem' },
                '& .MuiTableBody-root .MuiTableCell-root': { whiteSpace: 'nowrap' },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>{t(`depositCalculator.schedule.period.${period}`)}</TableCell>
                  <TableCell align="right">{t('depositCalculator.schedule.opening')}</TableCell>
                  {hasTopUps && <TableCell align="right">{t('depositCalculator.schedule.topUp')}</TableCell>}
                  <TableCell align="right">{t('depositCalculator.schedule.income')}</TableCell>
                  {hasTax && <TableCell align="right">{t('depositCalculator.schedule.netIncome')}</TableCell>}
                  <TableCell align="right">{t('depositCalculator.schedule.closing')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.schedule.map((row) => (
                  <TableRow key={row.index} hover>
                    <TableCell>
                      {row.index}
                      {row.fraction < 1 && '*'}
                    </TableCell>
                    <TableCell align="right">{money.format(row.openingBalance)}</TableCell>
                    {hasTopUps && <TableCell align="right">{money.format(row.topUp)}</TableCell>}
                    <TableCell align="right">{money.format(row.grossInterest)}</TableCell>
                    {hasTax && <TableCell align="right">{money.format(row.netInterest)}</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {money.format(row.closingBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {result.schedule.some((row) => row.fraction < 1) && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {t('depositCalculator.schedule.partialPeriodNote')}
            </Typography>
          )}
        </>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('depositCalculator.disclaimer')}
      </Typography>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  )
}
