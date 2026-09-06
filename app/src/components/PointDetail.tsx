import type { PointLayer } from '../config/layers'
import type { PointProperties } from '../hooks/usePointSelection'
import type { SeriePoint } from '../utils/sparkline'
import { Sparkline } from './Sparkline'
import { Panel } from './Panel'

interface Props {
  layer: PointLayer
  properties: PointProperties
  onClose: () => void
}

const isPresent = (value: string | number | null | undefined) =>
  value !== null && value !== undefined && value !== '' && value !== 'None'

/** MapLibre serializes nested feature properties to strings, so a series arrives as JSON text. */
function parseSerie(raw: unknown): SeriePoint[] | null {
  if (Array.isArray(raw)) return raw as SeriePoint[]
  if (typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SeriePoint[]) : null
  } catch {
    return null
  }
}

export function PointDetail({ layer, properties, onClose }: Props) {
  const rows = (layer.detailFields ?? []).filter((row) => isPresent(properties[row.field]))
  const footnote = layer.footnoteField ? properties[layer.footnoteField] : null
  const serie = layer.serieField ? parseSerie(properties[layer.serieField]) : null
  const name = properties[layer.labelField]
  const title = isPresent(name) ? String(name) : `${layer.label} sem nome`
  const subtitle = isPresent(name) ? layer.label : 'Registro sem nome na fonte'

  return (
    <Panel title={title} subtitle={subtitle} onClose={onClose} closeLabel={`Fechar ${title}`}>
      <div className="flex flex-col gap-3">
        {rows.length > 0 && (
          <dl className="flex flex-col">
            {rows.map((row) => (
              <div key={row.field} className="flex items-baseline justify-between gap-3 border-b border-tinta/15 py-1 last:border-0">
                <dt className="text-base text-tinta-fraca">{row.label}</dt>
                <dd className="text-right text-base tabular-nums text-tinta">{String(properties[row.field])}</dd>
              </div>
            ))}
          </dl>
        )}
        {serie && serie.length > 0 && <Sparkline serie={serie} color={layer.color} />}
        {isPresent(footnote) && <p className="text-sm leading-snug text-tinta-fraca">{String(footnote)}</p>}
        {isPresent(properties.url) && (
          <a href={String(properties.url)} target="_blank" rel="noreferrer" className="cursor-pointer text-base underline decoration-tinta-fraca underline-offset-2 hover:decoration-tinta">
            Ficha completa
          </a>
        )}
      </div>
    </Panel>
  )
}
