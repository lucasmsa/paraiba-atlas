import type { MunicipioIndexEntry } from '../data/contract'
import type { SummaryLine } from '../utils/summary'
import { PILLARS } from '../config/pillars'

interface Props {
  entry: MunicipioIndexEntry
  summary: SummaryLine[] | null
  isCompared: boolean
  compareFull: boolean
  onToggleCompare: () => void
  onClose: () => void
}

export function MunicipioPanel({ entry, summary, isCompared, compareFull, onToggleCompare, onClose }: Props) {
  return (
    <aside className="cordel-bloco cordel-sombra flex max-h-[58vh] flex-col gap-3 overflow-y-auto p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="cordel-titulo text-[24px] text-tinta">{entry.nome}</h2>
          <p className="mt-0.5 text-base text-tinta-fraca">{entry.meso_nome}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer px-2 text-xl leading-none text-tinta-fraca hover:text-tinta">
          ×
        </button>
      </header>
      <button
        type="button"
        onClick={onToggleCompare}
        disabled={!isCompared && compareFull}
        className="cordel-bloco cursor-pointer self-start px-3 py-1.5 text-base text-tinta hover:cordel-sombra-leve disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCompared ? 'Remover da comparação' : 'Comparar'}
      </button>
      {summary &&
        PILLARS.map((pillar) => {
          const lines = summary.filter((line) => line.pillar === pillar.id)
          if (lines.length === 0) return null
          return (
            <section key={pillar.id} className="flex flex-col gap-1">
              <h3 className="font-display text-[13px] uppercase leading-none" style={{ color: pillar.accent }}>
                {pillar.label}
              </h3>
              <ul className="flex flex-col gap-1 text-base leading-snug text-tinta">
                {lines.map((line) => (
                  <li key={line.label}>{line.text}</li>
                ))}
              </ul>
            </section>
          )
        })}
    </aside>
  )
}
