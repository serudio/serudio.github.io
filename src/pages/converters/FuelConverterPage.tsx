import ConverterPageLayout from '../../components/converters/ConverterPageLayout'
import FuelCalculator from '../../components/converters/FuelCalculator'
import type { ConverterPageProps } from '../../data/converters'

export default function FuelConverterPage({ title, seoDescription, slug }: ConverterPageProps) {
  return (
    <ConverterPageLayout title={title} seoDescription={seoDescription} path={`/converters/${slug}`}>
      <FuelCalculator />
    </ConverterPageLayout>
  )
}
