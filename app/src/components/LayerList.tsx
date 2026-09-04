import type { AtlasLayer } from '../config/layers'

interface Props {
  layers: AtlasLayer[]
  activeIds: string[]
  onToggle: (id: string) => void
}

const KIND_LABEL: Record<AtlasLayer['kind'], string> = { choropleth: 'por município', categorical: 'áreas', points: 'pontos' }

export function LayerList({ layers, activeIds, onToggle }: Props) {
  if (layers.length === 0) {
    return <p className="text-base leading-relaxed text-tinta-fraca">Nenhuma camada pronta neste pilar ainda.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {layers.map((layer) => {
        const isActive = activeIds.includes(layer.id)
        return (
          <li key={layer.id}>
            <button
              type="button"
              onClick={() => onToggle(layer.id)}
              aria-pressed={isActive}
              className={`cordel-bloco flex w-full cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-left text-base transition-shadow ${isActive ? 'cordel-sombra-leve' : ''}`}
            >
              <span>{layer.label}</span>
              <span className="text-sm text-tinta-fraca">{KIND_LABEL[layer.kind]}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
