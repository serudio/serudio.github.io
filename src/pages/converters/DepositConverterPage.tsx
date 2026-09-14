import { useTranslation } from 'react-i18next'
import ConverterPageLayout from '../../components/converters/ConverterPageLayout'
import DepositCalculator from '../../components/converters/DepositCalculator'
import type { ConverterPageProps } from '../../data/converters'

export default function DepositConverterPage({ titleKey, seoDescriptionKey, slug }: ConverterPageProps) {
  const { t } = useTranslation()

  return (
    <ConverterPageLayout title={t(titleKey)} seoDescription={t(seoDescriptionKey)} path={`/converters/${slug}`}>
      <DepositCalculator />
    </ConverterPageLayout>
  )
}
