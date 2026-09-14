import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import {
  COMPOUNDING_OPTIONS,
  calculateDeposit,
  type Compounding,
  type TermUnit,
} from '../../lib/deposit'

const TERM_UNITS: TermUnit[] = ['months', 'years']

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

  const result = useMemo(
    () =>
      calculateDeposit({
        amount: parseFloat(amount),
        annualRatePercent: parseFloat(rate),
        term: parseFloat(term),
        termUnit,
        compounding,
        taxPercent: parseFloat(tax),
      }),
    [amount, rate, term, termUnit, compounding, tax],
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

  return (
    <>
      <TextField
        type="number"
        fullWidth
        value={amount}
        label={t('depositCalculator.amount')}
        onChange={(e) => setAmount(e.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
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
          InputProps={{ endAdornment: percentAdornment }}
        />
        <TextField
          type="number"
          fullWidth
          value={term}
          label={t('depositCalculator.term')}
          onChange={(e) => setTerm(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
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
          InputProps={{ endAdornment: percentAdornment }}
        />
      </Stack>

      {result === null ? (
        <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
            {t('depositCalculator.noResult')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Stack spacing={1}>
            <ResultRow label={t('depositCalculator.grossInterest')} value={money.format(result.grossInterest)} />
            {result.tax > 0 && (
              <ResultRow label={t('depositCalculator.taxWithheld')} value={`-${money.format(result.tax)}`} />
            )}
            <ResultRow
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
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('depositCalculator.disclaimer')}
      </Typography>
    </>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
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
