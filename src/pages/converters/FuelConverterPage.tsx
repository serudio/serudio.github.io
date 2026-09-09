import { useTranslation } from 'react-i18next'
import ConverterPageLayout from '../../components/converters/ConverterPageLayout'
import FuelCalculator from '../../components/converters/FuelCalculator'
import type { ConverterPageProps } from '../../data/converters'

export default function FuelConverterPage({ titleKey, seoDescriptionKey, slug }: ConverterPageProps) {
  const { t } = useTranslation()

  return (
    <ConverterPageLayout title={t(titleKey)} seoDescription={t(seoDescriptionKey)} path={`/converters/${slug}`}>
      <FuelCalculator />
    </ConverterPageLayout>
  )
}
