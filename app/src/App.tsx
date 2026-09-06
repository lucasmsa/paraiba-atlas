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
import { useIsCompact } from './hooks/useIsCompact'
import { SheetHandle } from './components/SheetHandle'
import { useAtlasMap, useMapBreakpoint } from './map/useAtlasMap'
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
  const compact = useIsCompact()
  const [sheetOpen, setSheetOpen] = useState(false)
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
  useMapBreakpoint(mapRef, ready, compact)

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

  const activeLabels = [fillLayer?.label, overlayLayer?.label].filter(Boolean)
  const sheetSummary = activeLabels.length ? activeLabels.join(' + ') : pillar ? `${pillar.label}: escolha uma camada` : 'Escolha um pilar'

  const openPanels = [
    selectedUnit && selectedEntry ? (
      <MunicipioPanel
        key="municipio"
        entry={selectedEntry}
        summary={summary}
        isCompared={compare.has(selectedUnit)}
        compareFull={compare.isFull}
        onToggleCompare={() => compare.toggle(selectedUnit)}
        onClose={() => selectMunicipio(null)}
      />
    ) : null,
    points && pointSelection.selected ? (
      <PointDetail key="ponto" layer={points} properties={pointSelection.selected} onClose={pointSelection.clear} />
    ) : null,
    compare.units.length > 0 && allMetrics && municipios ? (
      <CompareTable
        key="comparar"
        units={compare.units}
        unitNames={compare.units.map((u) => unitName(u, municipios, mesos))}
        loaded={allMetrics}
        onRemove={compare.toggle}
        onClear={compare.clear}
      />
    ) : null,
  ].filter(Boolean)

  /** One rail, stacked: panels share the height instead of covering each other. */
  const panelRail = openPanels.length > 0 && (
    <div
      className={
        compact
          ? 'pointer-events-none absolute inset-x-3 bottom-3 top-3 z-20 flex flex-col justify-end gap-3'
          : 'pointer-events-none absolute bottom-6 left-6 top-6 z-20 flex w-[380px] flex-col gap-4'
      }
    >
      {openPanels.map((panel) => (
        <div
          key={(panel as { key: string }).key}
          className={`pointer-events-auto flex min-h-0 flex-col ${compact ? 'max-h-[46%] shrink' : 'flex-1'}`}
        >
          {panel}
        </div>
      ))}
    </div>
  )

  const sidebar = (
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
      compact={compact}
    />
  )

  return (
    <main className={`relative h-full w-full overflow-hidden bg-papel-fundo ${compact ? 'flex flex-col' : ''}`}>
      {/* Compact stacks the map above the sheet so the map box really shrinks; MapLibre
          watches its container, so no padding or resize plumbing is needed. */}
      <div className={compact ? 'relative min-h-0 flex-1' : 'absolute inset-0'}>
        <MapCanvas containerRef={containerRef} />
        {!compact && hover && hoverEntry && <HoverTooltip hover={hover} entry={hoverEntry} metric={metric} layer={choropleth} />}
        {panelRail}
      </div>

      {compact ? (
        <div className="flex shrink-0 flex-col border-t-[3px] border-tinta bg-papel" style={{ maxHeight: sheetOpen ? '58vh' : undefined }}>
          <SheetHandle open={sheetOpen} summary={sheetSummary} onToggle={() => setSheetOpen((v) => !v)} />
          {sheetOpen && <div className="min-h-0 flex-1 overflow-y-auto">{sidebar}</div>}
        </div>
      ) : (
        <div className="absolute inset-y-0 right-0 z-10 w-[380px] border-l-[3px] border-tinta">{sidebar}</div>
      )}

      {sobreOpen && <Sobre onClose={() => setSobreOpen(false)} />}
    </main>
  )
}
