import type { Metric } from '../data/contract'
import type { ChoroplethLayer } from '../config/layers'
import { formatValue } from '../utils/format'
import { NO_DATA_COLOR } from '../utils/choropleth'

interface Props {
  metric: Metric
  ramp: string[]
  format: ChoroplethLayer['format']
}

function rangeLabel(index: number, metric: Metric, format: ChoroplethLayer['format']): string {
  const { breaks, min } = metric
  // A first edge sitting on the minimum means that bucket holds exactly one value,
  // and "up to zero" reads as a range when it is really a category.
  if (index === 0) {
    return breaks[0] === min ? formatValue(min, format) : `até ${formatValue(breaks[0], format)}`
  }
  if (index === breaks.length) return `acima de ${formatValue(breaks[index - 1], format)}`
  return `${formatValue(breaks[index - 1], format)} a ${formatValue(breaks[index], format)}`
}

export function Legend({ metric, ramp, format }: Props) {
  return (
    <ol className="flex flex-col gap-1" aria-label="Legenda">
      {ramp.slice(0, metric.breaks.length + 1).map((color, index) => (
        <li key={color} className="flex items-center gap-2.5 text-base text-tinta">
          <span className="inline-block h-4 w-7 border border-tinta/40" style={{ background: color }} />
          {rangeLabel(index, metric, format)}
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
