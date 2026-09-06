import type { MunicipioIndexEntry } from '../data/contract'
import type { SummaryRow } from '../utils/summary'
import { PILLARS } from '../config/pillars'
import { Panel } from './Panel'

interface Props {
  entry: MunicipioIndexEntry
  summary: SummaryRow[] | null
  isCompared: boolean
  compareFull: boolean
  onToggleCompare: () => void
  onClose: () => void
}

const TONE: Record<NonNullable<SummaryRow['standing']>['tone'], string> = {
  above: 'text-emerald-900',
  below: 'text-rose-900',
  level: 'text-tinta-fraca',
}

export function MunicipioPanel({ entry, summary, isCompared, compareFull, onToggleCompare, onClose }: Props) {
  return (
    <Panel
      title={entry.nome}
      subtitle={entry.meso_nome}
      onClose={onClose}
      closeLabel={`Fechar ${entry.nome}`}
      actions={
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={!isCompared && compareFull}
          className="w-full cursor-pointer border-2 border-tinta bg-papel px-3 py-2 text-base text-tinta transition-shadow hover:cordel-sombra-leve disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCompared ? 'Remover da comparação' : compareFull ? 'Comparação cheia (6)' : 'Comparar'}
        </button>
      }
    >
      {!summary && <p className="text-base text-tinta-fraca">Carregando…</p>}
      {summary &&
        PILLARS.map((pillar) => {
          const rows = summary.filter((row) => row.pillar === pillar.id)
          if (rows.length === 0) return null
          return (
            <section key={pillar.id} className="mb-3 flex flex-col gap-1 last:mb-0">
              <h3 className="font-display text-[12px] uppercase leading-none" style={{ color: pillar.accent }}>
                {pillar.label}
              </h3>
              <dl className="flex flex-col">
                {rows.map((row) => (
                  <div key={row.label} className="border-b border-tinta/15 py-1.5 last:border-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-base leading-snug text-tinta">{row.label}</dt>
                      <dd className="shrink-0 text-base font-semibold tabular-nums text-tinta">{row.value}</dd>
                    </div>
                    {(row.rank || row.standing) && (
                      <p className="mt-0.5 flex items-baseline gap-2 text-sm">
                        {row.rank && <span className="tabular-nums text-tinta-fraca">{row.rank}</span>}
                        {row.standing && <span className={TONE[row.standing.tone]}>{row.standing.text}</span>}
                      </p>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          )
        })}
    </Panel>
  )
}
