import { PILLARS, type PillarId } from '../config/pillars'

interface Props {
  active: PillarId | null
  onSelect: (pillar: PillarId) => void
}

export function PillarTabs({ active, onSelect }: Props) {
  return (
    <nav className="grid grid-cols-3 gap-2" aria-label="Pilares">
      {PILLARS.map((pillar) => {
        const isActive = pillar.id === active
        return (
          <button
            key={pillar.id}
            type="button"
            onClick={() => onSelect(pillar.id)}
            aria-pressed={isActive}
            className="cordel-aba cordel-sombra-leve cursor-pointer border-[3px] border-tinta px-2 py-2.5 text-center font-display text-base uppercase leading-none transition-colors"
            style={{ background: isActive ? pillar.accent : 'var(--color-papel)', color: isActive ? 'var(--color-papel)' : pillar.accent }}
          >
            {pillar.label}
          </button>
        )
      })}
    </nav>
  )
}
