import type { LoadedMetric } from '../hooks/useAllMetrics'
import type { PillarId } from '../config/pillars'
import { formatValue } from './format'

export interface SummaryLine {
  pillar: PillarId
  label: string
  text: string
}

function comparison(value: number, median: number): string {
  if (value === median) return 'igual à mediana estadual'
  const ratio = value / median
  if (ratio >= 2) return `${ratio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes a mediana estadual`
  return value > median ? 'acima da mediana estadual' : 'abaixo da mediana estadual'
}

export function summarize(cod: string, loaded: LoadedMetric[]): SummaryLine[] {
  return loaded.map(({ layer, metric }) => {
    const value = metric.values[cod]
    if (value === undefined) {
      return { pillar: layer.pillar, label: layer.label, text: `${layer.label}: sem dados em ${metric.year}.` }
    }
    const shown = `${formatValue(value, layer.format)} ${metric.unit}`
    const rank = `${metric.rank[cod]}º de ${metric.n}`
    return { pillar: layer.pillar, label: layer.label, text: `${layer.label}: ${shown}, ${rank}, ${comparison(value, metric.state_median)} (${formatValue(metric.state_median, layer.format)}).` }
  })
}
