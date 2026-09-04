import type { AtlasLayer } from '../config/layers'
import type { Pillar, PillarId } from '../config/pillars'
import type { ManifestLayer, Metric } from '../data/contract'
import type { ClassEntry, ClassLabel } from '../data/classes'
import type { useCompare } from '../hooks/useCompare'
import { PillarTabs } from './PillarTabs'
import { LayerList } from './LayerList'
import { LayerCard } from './LayerCard'
import { MesoPicker } from './MesoPicker'
import { useScrollToCard } from '../hooks/useScrollToCard'

export interface ActiveCard {
  layer: AtlasLayer
  metric: Metric | null
  entries: ClassEntry[] | null
  colors: Record<string, string>
  labels: Record<string, ClassLabel>
  provenance: ManifestLayer | null
}

interface Props {
  pillar: Pillar | null
  layers: AtlasLayer[]
  activeIds: string[]
  cards: ActiveCard[]
  mesos: { cod: string; nome: string }[]
  compare: ReturnType<typeof useCompare>
  onSelectPillar: (id: PillarId) => void
  onToggleLayer: (id: string) => void
  onOpenSobre: () => void
}

export function Sidebar({ pillar, layers, activeIds, cards, mesos, compare, onSelectPillar, onToggleLayer, onOpenSobre }: Props) {
  const cardsRef = useScrollToCard(cards.map((card) => card.layer.id).join(',') || null)

  return (
    <div className="cordel-papel flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-col gap-2">
        <h1 className="cordel-titulo text-[34px] text-tinta">Atlas da Paraíba</h1>
        <p className="text-base leading-snug text-tinta">
          Da Mata ao Sertão, o estado muda de chuva, de rocha e de vida. Este atlas lê a Paraíba em três pilares.
        </p>
      </header>
      <PillarTabs active={pillar?.id ?? null} onSelect={onSelectPillar} />
      {pillar && <LayerList layers={layers} activeIds={activeIds} onToggle={onToggleLayer} />}
      {pillar && cards.length > 0 && (
        <div ref={cardsRef} className="flex scroll-mt-4 flex-col gap-5">
          {cards.map((card) => (
            <LayerCard
              key={card.layer.id}
              layer={card.layer}
              metric={card.metric}
              entries={card.entries}
              colors={card.colors}
              labels={card.labels}
              provenance={card.provenance}
              ramp={pillar.ramp}
            />
          ))}
        </div>
      )}
      <footer className="mt-auto flex flex-col gap-2 border-t-[3px] border-tinta pt-4">
        <MesoPicker mesos={mesos} has={compare.has} isFull={compare.isFull} onToggle={compare.toggle} />
        <p className="text-sm leading-snug text-tinta-fraca">
          Clique em um município no mapa e use "Comparar" para colocá-lo lado a lado. Até seis unidades.
        </p>
        <button type="button" onClick={onOpenSobre} className="cursor-pointer self-start text-sm text-tinta underline underline-offset-2 hover:decoration-2">
          Sobre o atlas e as fontes
        </button>
      </footer>
    </div>
  )
}
