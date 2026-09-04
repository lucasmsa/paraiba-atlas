import type { CompareUnit } from '../hooks/useCompare'

interface Props {
  mesos: { cod: string; nome: string }[]
  has: (unit: CompareUnit) => boolean
  isFull: boolean
  onToggle: (unit: CompareUnit) => void
}

export function MesoPicker({ mesos, has, isFull, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-display text-[12px] uppercase leading-none text-tinta">Mesorregiões</span>
      {mesos.map((meso) => {
        const unit: CompareUnit = { kind: 'meso', cod: meso.cod }
        const active = has(unit)
        return (
          <button
            key={meso.cod}
            type="button"
            onClick={() => onToggle(unit)}
            disabled={!active && isFull}
            aria-pressed={active}
            className="cursor-pointer border-2 border-tinta px-2 py-0.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: active ? 'var(--color-tinta)' : 'transparent', color: active ? 'var(--color-papel)' : 'var(--color-tinta)' }}
          >
            {meso.nome}
          </button>
        )
      })}
    </div>
  )
}
