import { useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Metric } from '../data/contract'
import { fillColorExpression, hasValue } from '../utils/choropleth'
import { LAYERS, SOURCES } from './constants'

function applyFeatureState(map: MapLibreMap, metric: Metric) {
  map.removeFeatureState({ source: SOURCES.municipios })
  Object.entries(metric.values).forEach(([cod, value]) => {
    map.setFeatureState({ source: SOURCES.municipios, id: cod }, { value })
  })
}

function whenSourceLoaded(map: MapLibreMap, source: string, callback: () => void): () => void {
  if (map.isSourceLoaded(source)) {
    callback()
    return () => {}
  }
  const handler = () => {
    if (map.isSourceLoaded(source)) {
      map.off('sourcedata', handler)
      callback()
    }
  }
  map.on('sourcedata', handler)
  return () => map.off('sourcedata', handler)
}

export function useChoroplethLayer(mapRef: React.RefObject<MapLibreMap | null>, ready: boolean, metric: Metric | null, ramp: string[]) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (!metric) {
      map.setLayoutProperty(LAYERS.fill, 'visibility', 'none')
      map.setLayoutProperty(LAYERS.noData, 'visibility', 'none')
      return
    }
    return whenSourceLoaded(map, SOURCES.municipios, () => {
      applyFeatureState(map, metric)
      map.setPaintProperty(LAYERS.fill, 'fill-color', fillColorExpression(metric, ramp))
      map.setPaintProperty(LAYERS.fill, 'fill-opacity', ['case', hasValue, 0.78, 0])
      map.setPaintProperty(LAYERS.noData, 'fill-opacity', ['case', hasValue, 0, 0.9])
      map.setLayoutProperty(LAYERS.fill, 'visibility', 'visible')
      map.setLayoutProperty(LAYERS.noData, 'visibility', 'visible')
    })
  }, [mapRef, ready, metric, ramp])
}
