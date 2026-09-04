import type { ClassEntry, ClassLabel } from '../data/classes'
import { OTHER_VALUE, primaryLabel, secondaryLabel } from '../utils/classes'

interface Props {
  entries: ClassEntry[]
  colors: Record<string, string>
  labels: Record<string, ClassLabel>
}

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function ClassLegend({ entries, colors, labels }: Props) {
  const otherCount = entries.find((entry) => entry.value === OTHER_VALUE)?.count ?? 0
  return (
    <ol className="flex flex-col gap-2" aria-label="Legenda">
      {entries.map((entry) => {
        const label = labels[entry.value]
        const secondary = secondaryLabel(entry.value, label)
        return (
          <li key={entry.value} className="flex items-start gap-2.5 text-base text-tinta">
            <span className="mt-1 inline-block h-4 w-7 shrink-0 border border-tinta/40" style={{ background: colors[entry.value] }} />
            <span className="flex-1 leading-snug">
              <span className="flex items-baseline justify-between gap-2">
                <span>{primaryLabel(entry.value, label, otherCount)}</span>
                <span className="shrink-0 text-sm tabular-nums text-tinta-fraca">{percent.format(entry.share * 100)}%</span>
              </span>
              {secondary && <span className="block text-sm text-tinta-fraca">{secondary}</span>}
              {label?.explicacao && <span className="mt-0.5 block text-sm leading-snug text-tinta-fraca">{label.explicacao}</span>}
              {label?.confirmado === false && label.ressalva && (
                <span className="mt-0.5 block text-sm leading-snug text-tinta-fraca italic">Correspondência incerta: {label.ressalva}</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
