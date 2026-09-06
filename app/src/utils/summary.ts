import type { LoadedMetric } from '../hooks/useAllMetrics'
import type { PillarId } from '../config/pillars'
import { formatValue } from './format'

export interface SummaryRow {
  pillar: PillarId
  label: string
  value: string
  rank: string | null
  /** Where it sits against the state median, as a short tag rather than a sentence. */
  standing: { text: string; tone: 'above' | 'below' | 'level' } | null
}

function standingOf(value: number, median: number): SummaryRow['standing'] {
  if (median === 0) return null
  if (value === median) return { text: 'na mediana', tone: 'level' }
  const ratio = value / median
  if (ratio >= 2) return { text: `${ratio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× a mediana`, tone: 'above' }
  if (ratio <= 0.5) return { text: `${(1 / ratio).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× abaixo`, tone: 'below' }
  return value > median ? { text: 'acima da mediana', tone: 'above' } : { text: 'abaixo da mediana', tone: 'below' }
}

export function summarize(cod: string, loaded: LoadedMetric[]): SummaryRow[] {
  return loaded.map(({ layer, metric }) => {
    const value = metric.values[cod]
    if (value === undefined) {
      return { pillar: layer.pillar, label: layer.label, value: 'sem dados', rank: null, standing: null }
    }
    return {
      pillar: layer.pillar,
      label: layer.label,
      value: formatValue(value, layer.format),
      rank: `${metric.rank[cod]}º/${metric.n}`,
      standing: standingOf(value, metric.state_median),
    }
  })
}
