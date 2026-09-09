import { useTranslation } from 'react-i18next'
import ConverterPageLayout from '../../components/converters/ConverterPageLayout'
import KeyboardLayoutCalculator from '../../components/converters/KeyboardLayoutCalculator'
import type { ConverterPageProps } from '../../data/converters'

export default function KeyboardLayoutConverterPage({ titleKey, seoDescriptionKey, slug }: ConverterPageProps) {
  const { t } = useTranslation()

  return (
    <ConverterPageLayout title={t(titleKey)} seoDescription={t(seoDescriptionKey)} path={`/converters/${slug}`}>
      <KeyboardLayoutCalculator />
    </ConverterPageLayout>
  )
}
