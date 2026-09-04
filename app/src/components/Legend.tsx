import type { Metric } from '../data/contract'
import type { ChoroplethLayer } from '../config/layers'
import { formatValue } from '../utils/format'
import { NO_DATA_COLOR } from '../utils/choropleth'

interface Props {
  metric: Metric
  ramp: string[]
  format: ChoroplethLayer['format']
}

function rangeLabel(index: number, breaks: number[], format: ChoroplethLayer['format']): string {
  if (index === 0) return `até ${formatValue(breaks[0], format)}`
  if (index === breaks.length) return `acima de ${formatValue(breaks[index - 1], format)}`
  return `${formatValue(breaks[index - 1], format)} a ${formatValue(breaks[index], format)}`
}

export function Legend({ metric, ramp, format }: Props) {
  return (
    <ol className="flex flex-col gap-1" aria-label="Legenda">
      {ramp.map((color, index) => (
        <li key={color} className="flex items-center gap-2.5 text-base text-tinta">
          <span className="inline-block h-4 w-7 border border-tinta/40" style={{ background: color }} />
          {rangeLabel(index, metric.breaks, format)}
        </li>
      ))}
      <li className="flex items-center gap-2.5 text-base text-tinta">
        <span
          className="inline-block h-4 w-7 border border-tinta/40"
          style={{ background: `repeating-linear-gradient(135deg, ${NO_DATA_COLOR} 0 3px, #8b857c 3px 4px)` }}
        />
        sem dados
      </li>
    </ol>
  )
}
