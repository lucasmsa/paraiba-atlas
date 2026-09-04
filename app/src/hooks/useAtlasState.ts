import { useCallback, useEffect, useState } from 'react'
import type { PillarId } from '../config/pillars'
import { isFillLayer, isOverlayLayer, layerById } from '../config/layers'

export interface AtlasState {
  pillar: PillarId | null
  fillLayerId: string | null
  /** One overlay at a time, points or lines, so the legend never carries more than two encodings. */
  overlayLayerId: string | null
  selectedCod: string | null
}

const PARAM = { pillar: 'pilar', fill: 'camada', overlay: 'sobreposto', selected: 'mun' } as const

function readUrl(): AtlasState {
  const params = new URLSearchParams(window.location.search)
  const fill = layerById(params.get(PARAM.fill))
  const overlay = layerById(params.get(PARAM.overlay))
  const pillar = (params.get(PARAM.pillar) as PillarId | null) ?? fill?.pillar ?? overlay?.pillar ?? null
  return {
    pillar,
    fillLayerId: isFillLayer(fill) ? fill.id : null,
    overlayLayerId: isOverlayLayer(overlay) ? overlay.id : null,
    selectedCod: params.get(PARAM.selected),
  }
}

function writeUrl(state: AtlasState) {
  const params = new URLSearchParams(window.location.search)
  const next = new URLSearchParams()
  const compare = params.get('comparar')
  if (state.pillar) next.set(PARAM.pillar, state.pillar)
  if (state.fillLayerId) next.set(PARAM.fill, state.fillLayerId)
  if (state.overlayLayerId) next.set(PARAM.overlay, state.overlayLayerId)
  if (state.selectedCod) next.set(PARAM.selected, state.selectedCod)
  if (compare) next.set('comparar', compare)
  const query = next.toString()
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
}

export function useAtlasState() {
  const [state, setState] = useState<AtlasState>(readUrl)

  useEffect(() => writeUrl(state), [state])

  const selectPillar = useCallback((pillar: PillarId) => {
    setState((current) => ({ ...current, pillar: current.pillar === pillar ? null : pillar }))
  }, [])

  const toggleLayer = useCallback((layerId: string) => {
    const layer = layerById(layerId)
    if (!layer) return
    setState((current) => {
      if (isOverlayLayer(layer)) return { ...current, overlayLayerId: current.overlayLayerId === layerId ? null : layerId }
      return { ...current, fillLayerId: current.fillLayerId === layerId ? null : layerId }
    })
  }, [])

  const selectMunicipio = useCallback((cod: string | null) => {
    setState((current) => ({ ...current, selectedCod: cod }))
  }, [])

  return { state, selectPillar, toggleLayer, selectMunicipio }
}
