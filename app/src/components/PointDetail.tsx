import type { PointLayer } from '../config/layers'
import type { PointProperties } from '../hooks/usePointSelection'
import type { SeriePoint } from '../utils/sparkline'
import { Sparkline } from './Sparkline'

interface Props {
  layer: PointLayer
  properties: PointProperties
  onClose: () => void
}

const isPresent = (value: string | number | null | undefined) => value !== null && value !== undefined && value !== '' && value !== 'None'

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
  return (
    <aside className="cordel-bloco cordel-sombra flex flex-col gap-2 p-4">
      <header className="flex items-start justify-between gap-3">
        <h2 className="cordel-titulo text-[20px] text-tinta">{String(properties[layer.labelField] ?? 'Sem nome')}</h2>
        <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer px-2 text-xl leading-none text-tinta-fraca hover:text-tinta">
          ×
        </button>
      </header>
      {rows.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base text-tinta">
          {rows.map((row) => (
            <div key={row.field} className="contents">
              <dt className="text-tinta-fraca">{row.label}</dt>
              <dd className="leading-snug">{String(properties[row.field])}</dd>
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
    </aside>
  )
}
