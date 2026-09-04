import type { LoadedMetric } from '../hooks/useAllMetrics'
import type { CompareUnit } from '../hooks/useCompare'
import { PILLARS } from '../config/pillars'
import { cellTones, unitValue, type CellTone } from '../utils/compare'
import { formatValue } from '../utils/format'

interface Props {
  units: CompareUnit[]
  unitNames: string[]
  loaded: LoadedMetric[]
  onRemove: (unit: CompareUnit) => void
  onClear: () => void
}

const TONE_STYLE: Record<CellTone, string> = {
  best: 'bg-emerald-100 text-emerald-950 font-semibold',
  worst: 'bg-rose-100 text-rose-950 font-semibold',
  plain: 'text-tinta',
}

export function CompareTable({ units, unitNames, loaded, onRemove, onClear }: Props) {
  return (
    <section className="cordel-bloco cordel-sombra flex max-h-[calc(100vh-6rem)] flex-col gap-3 p-4" aria-label="Comparação">
      <header className="flex shrink-0 items-baseline justify-between gap-4">
        <h2 className="cordel-titulo text-[20px] text-tinta">Comparar</h2>
        <button
          type="button"
          onClick={onClear}
          aria-label="Fechar comparação"
          className="cursor-pointer px-2 text-xl leading-none text-tinta-fraca hover:text-tinta"
        >
          ×
        </button>
      </header>
      {units.some((unit) => unit.kind === 'meso') && (
        <p className="shrink-0 text-sm leading-snug text-tinta-fraca">
          Nas mesorregiões, contagens são somadas e taxas e índices entram como média ponderada pela população de cada município.
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-base">
          <thead className="sticky top-0 z-10 bg-papel">
            <tr>
              <th className="py-1 pr-3 text-left font-display text-[12px] uppercase leading-none text-tinta">Indicador</th>
              {units.map((unit, i) => (
                <th key={`${unit.kind}${unit.cod}`} className="px-2 py-1 text-right align-bottom">
                  <button type="button" onClick={() => onRemove(unit)} title="Remover" className="cursor-pointer text-left leading-tight text-tinta hover:text-tinta-fraca">
                    {unitNames[i]}
                    {unit.kind === 'meso' && <span className="block text-xs font-normal uppercase tracking-wider text-tinta-fraca">mesorregião</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loaded.map(({ layer, metric }) => {
              const tones = cellTones(metric, units)
              const pillar = PILLARS.find((p) => p.id === layer.pillar)!
              return (
                <tr key={layer.id} className="border-t-2 border-tinta/25">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-tinta">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: pillar.accent }} />
                    {layer.label}
                    <span className="block text-xs text-tinta-fraca">{metric.unit}</span>
                  </th>
                  {units.map((unit, i) => {
                    const value = unitValue(metric, unit)
                    return (
                      <td key={`${unit.kind}${unit.cod}`} className={`px-2 py-1.5 text-right tabular-nums ${TONE_STYLE[tones[i]]}`}>
                        {value === undefined ? <span className="text-tinta-fraca">sem dados</span> : formatValue(value, layer.format)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
