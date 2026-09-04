import { useCallback, useMemo, useState } from 'react'
import { Sidebar, type ActiveCard } from './components/Sidebar'
import { MapCanvas } from './components/MapCanvas'
import { HoverTooltip } from './components/HoverTooltip'
import { MunicipioPanel } from './components/MunicipioPanel'
import { PointDetail } from './components/PointDetail'
import { CompareTable } from './components/CompareTable'
import { Sobre } from './components/Sobre'
import { LAYERS, layerById } from './config/layers'
import { PILLARS } from './config/pillars'
import type { Metric, MunicipioIndex } from './data/contract'
import { useAtlasState } from './hooks/useAtlasState'
import { useJson } from './hooks/useJson'
import { useManifest } from './hooks/useManifest'
import { useAllMetrics } from './hooks/useAllMetrics'
import { useCategoricalClasses } from './hooks/useCategoricalClasses'
import { usePointSelection } from './hooks/usePointSelection'
import { useCompare, type CompareUnit } from './hooks/useCompare'
import { useAtlasMap } from './map/useAtlasMap'
import { useChoroplethLayer } from './map/useChoroplethLayer'
import { useCategoricalLayer } from './map/useCategoricalLayer'
import { usePointLayer } from './map/usePointLayer'
import { useLineLayer } from './map/useLineLayer'
import { useMunicipioInteraction } from './map/useMunicipioInteraction'
import { summarize } from './utils/summary'

function mesoList(index: MunicipioIndex) {
  const seen = new Map<string, string>()
  Object.values(index).forEach((entry) => seen.set(entry.meso, entry.meso_nome))
  return [...seen.entries()].map(([cod, nome]) => ({ cod, nome })).sort((a, b) => a.nome.localeCompare(b.nome))
}

function unitName(unit: CompareUnit, index: MunicipioIndex, mesos: { cod: string; nome: string }[]) {
  if (unit.kind === 'meso') return mesos.find((m) => m.cod === unit.cod)?.nome ?? unit.cod
  return index[unit.cod]?.nome ?? unit.cod
}

export function App() {
  const { state, selectPillar, toggleLayer, selectMunicipio } = useAtlasState()
  const compare = useCompare()
  const [sobreOpen, setSobreOpen] = useState(false)
  const pillar = PILLARS.find((p) => p.id === state.pillar) ?? null
  const fillLayer = layerById(state.fillLayerId)
  const overlayLayer = layerById(state.overlayLayerId)
  const choropleth = fillLayer?.kind === 'choropleth' ? fillLayer : null
  const categorical = fillLayer?.kind === 'categorical' ? fillLayer : null
  const points = overlayLayer?.kind === 'points' ? overlayLayer : null
  const lines = overlayLayer?.kind === 'lines' ? overlayLayer : null
  const pillarLayers = useMemo(() => LAYERS.filter((layer) => layer.pillar === pillar?.id), [pillar])

  const manifest = useManifest()
  const index = useJson<MunicipioIndex>('geo/municipios_index.json')
  const metricState = useJson<Metric>(choropleth?.path ?? null)
  const metric = metricState.status === 'ready' ? metricState.data : null
  const { entries, colors, labels } = useCategoricalClasses(categorical)
  const allMetrics = useAllMetrics(Boolean(state.selectedCod) || compare.units.length > 0)

  const { containerRef, mapRef, ready } = useAtlasMap()
  useChoroplethLayer(mapRef, ready, metric, pillar?.ramp ?? [])
  useCategoricalLayer(mapRef, ready, categorical, entries, colors)
  usePointLayer(mapRef, ready, points)
  useLineLayer(mapRef, ready, lines)
  const pointSelection = usePointSelection(mapRef, ready, Boolean(points))
  const onSelect = useCallback((cod: string | null) => selectMunicipio(cod), [selectMunicipio])
  const hover = useMunicipioInteraction(mapRef, ready, state.selectedCod, onSelect)

  const municipios = index.status === 'ready' ? index.data : null
  const mesos = useMemo(() => (municipios ? mesoList(municipios) : []), [municipios])
  const hoverEntry = hover && municipios ? municipios[hover.cod] : null
  const selectedEntry = state.selectedCod && municipios ? municipios[state.selectedCod] : null
  const selectedUnit: CompareUnit | null = state.selectedCod ? { kind: 'municipio', cod: state.selectedCod } : null
  const summary = state.selectedCod && allMetrics ? summarize(state.selectedCod, allMetrics) : null

  const activeIds = [fillLayer?.id, overlayLayer?.id].filter((id): id is string => Boolean(id))
  const cards: ActiveCard[] = [fillLayer, overlayLayer]
    .filter((layer) => layer !== null && layer.pillar === pillar?.id)
    .map((layer) => ({
      layer: layer!,
      metric: layer!.kind === 'choropleth' ? metric : null,
      entries: layer!.kind === 'categorical' ? entries : null,
      colors,
      labels,
      provenance: manifest?.[layer!.id] ?? null,
    }))

  return (
    <main className="relative h-full w-full overflow-hidden bg-papel-fundo">
      <MapCanvas containerRef={containerRef} />
      {hover && hoverEntry && <HoverTooltip hover={hover} entry={hoverEntry} metric={metric} layer={choropleth} />}
      <div className="absolute bottom-6 left-6 z-10 flex max-w-[calc(100%-420px)] items-end gap-4">
        {selectedUnit && selectedEntry && (
          <div className="w-80 shrink-0">
            <MunicipioPanel
              entry={selectedEntry}
              summary={summary}
              isCompared={compare.has(selectedUnit)}
              compareFull={compare.isFull}
              onToggleCompare={() => compare.toggle(selectedUnit)}
              onClose={() => selectMunicipio(null)}
            />
          </div>
        )}
        {points && pointSelection.selected && (
          <div className="w-80 shrink-0">
            <PointDetail layer={points} properties={pointSelection.selected} onClose={pointSelection.clear} />
          </div>
        )}
        {compare.units.length > 0 && allMetrics && municipios && (
          <CompareTable
            units={compare.units}
            unitNames={compare.units.map((u) => unitName(u, municipios, mesos))}
            loaded={allMetrics}
            onRemove={compare.toggle}
            onClear={compare.clear}
          />
        )}
      </div>
      <div className="absolute inset-y-0 right-0 z-10 w-[380px] border-l-[3px] border-tinta">
        <Sidebar
          pillar={pillar}
          layers={pillarLayers}
          activeIds={activeIds}
          cards={cards}
          mesos={mesos}
          compare={compare}
          onSelectPillar={selectPillar}
          onToggleLayer={toggleLayer}
          onOpenSobre={() => setSobreOpen(true)}
        />
      </div>
      {sobreOpen && <Sobre onClose={() => setSobreOpen(false)} />}
    </main>
  )
}
