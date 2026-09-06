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

const OFFSET = 14
const ESTIMATED = { width: 210, height: 92 }

export function HoverTooltip({ hover, entry, metric, layer }: Props) {
  const value = metric?.values[hover.cod]
  // Flip rather than overflow: near an edge the tooltip would be clipped by the
  // sidebar or run off the map entirely.
  const flipX = hover.x + OFFSET + ESTIMATED.width > window.innerWidth - 400
  const flipY = hover.y + OFFSET + ESTIMATED.height > window.innerHeight
  return (
    <div
      className="cordel-bloco cordel-sombra-leve pointer-events-none absolute z-10 max-w-[210px] px-3 py-2"
      style={{
        left: flipX ? hover.x - OFFSET - ESTIMATED.width : hover.x + OFFSET,
        top: flipY ? hover.y - OFFSET - ESTIMATED.height : hover.y + OFFSET,
      }}
    >
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
