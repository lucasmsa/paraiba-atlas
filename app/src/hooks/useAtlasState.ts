import { useCallback, useEffect, useState } from 'react'
import type { PillarId } from '../config/pillars'
import { isFillLayer, isPointLayer, layerById } from '../config/layers'

export interface AtlasState {
  pillar: PillarId | null
  fillLayerId: string | null
  pointLayerId: string | null
  selectedCod: string | null
}

const PARAM = { pillar: 'pilar', fill: 'camada', points: 'pontos', selected: 'mun' } as const

function readUrl(): AtlasState {
  const params = new URLSearchParams(window.location.search)
  const fill = layerById(params.get(PARAM.fill))
  const points = layerById(params.get(PARAM.points))
  const pillar = (params.get(PARAM.pillar) as PillarId | null) ?? fill?.pillar ?? points?.pillar ?? null
  return {
    pillar,
    fillLayerId: isFillLayer(fill) ? fill.id : null,
    pointLayerId: isPointLayer(points) ? points.id : null,
    selectedCod: params.get(PARAM.selected),
  }
}

function writeUrl(state: AtlasState) {
  const params = new URLSearchParams()
  if (state.pillar) params.set(PARAM.pillar, state.pillar)
  if (state.fillLayerId) params.set(PARAM.fill, state.fillLayerId)
  if (state.pointLayerId) params.set(PARAM.points, state.pointLayerId)
  if (state.selectedCod) params.set(PARAM.selected, state.selectedCod)
  const query = params.toString()
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
      if (isPointLayer(layer)) return { ...current, pointLayerId: current.pointLayerId === layerId ? null : layerId }
      return { ...current, fillLayerId: current.fillLayerId === layerId ? null : layerId }
    })
  }, [])

  const selectMunicipio = useCallback((cod: string | null) => {
    setState((current) => ({ ...current, selectedCod: cod }))
  }, [])

  return { state, selectPillar, toggleLayer, selectMunicipio }
}
