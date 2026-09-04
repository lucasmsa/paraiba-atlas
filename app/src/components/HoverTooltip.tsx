import type { Metric, MunicipioIndexEntry } from '../data/contract'
import type { ChoroplethLayer } from '../config/layers'
import type { HoverInfo } from '../map/useMunicipioInteraction'
import { formatValue } from '../utils/format'

interface Props {
  hover: HoverInfo
  entry: MunicipioIndexEntry
  metric: Metric | null
  layer: ChoroplethLayer | null
}

export function HoverTooltip({ hover, entry, metric, layer }: Props) {
  const value = metric?.values[hover.cod]
  return (
    <div className="cordel-bloco cordel-sombra-leve pointer-events-none absolute z-10 px-3 py-2" style={{ left: hover.x + 14, top: hover.y + 14 }}>
      <p className="cordel-titulo text-[16px] text-tinta">{entry.nome}</p>
      <p className="text-sm text-tinta-fraca">{entry.meso_nome}</p>
      {metric && layer && (
        <p className="mt-1 text-base text-tinta">
          {value === undefined ? 'sem dados' : `${formatValue(value, layer.format)} ${metric.unit}`}
        </p>
      )}
    </div>
  )
}
