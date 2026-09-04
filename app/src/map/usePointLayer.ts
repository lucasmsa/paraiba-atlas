import { useEffect } from 'react'
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { PointLayer } from '../config/layers'
import { dataUrl } from '../data/contract'

export const POINT_SOURCE = 'atlas-points'
export const POINT_LAYER = 'atlas-points-circle'
export const POINT_LABELS = 'atlas-points-label'

const MIN_RADIUS = 3

function radiusExpression(layer: PointLayer): ExpressionSpecification | number {
  if (!layer.sizeField) return 5
  const [low, high] = layer.sizeDomain ?? [0, 1]
  const value: ExpressionSpecification = ['sqrt', ['max', ['coalesce', ['to-number', ['get', layer.sizeField]], 0], 0]]
  return ['interpolate', ['linear'], value, Math.sqrt(low), MIN_RADIUS, Math.sqrt(high), layer.maxRadius ?? 12]
}

export function usePointLayer(mapRef: React.RefObject<MapLibreMap | null>, ready: boolean, layer: PointLayer | null) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (map.getLayer(POINT_LABELS)) map.removeLayer(POINT_LABELS)
    if (map.getLayer(POINT_LAYER)) map.removeLayer(POINT_LAYER)
    if (map.getSource(POINT_SOURCE)) map.removeSource(POINT_SOURCE)
    if (!layer) return

    map.addSource(POINT_SOURCE, { type: 'geojson', data: dataUrl(layer.geoPath) })
    map.addLayer({
      id: POINT_LAYER,
      type: 'circle',
      source: POINT_SOURCE,
      paint: {
        'circle-radius': radiusExpression(layer),
        'circle-color': layer.color,
        'circle-opacity': 0.72,
        'circle-stroke-color': '#f3e8d2',
        'circle-stroke-width': 1,
      },
    })
    map.addLayer({
      id: POINT_LABELS,
      type: 'symbol',
      source: POINT_SOURCE,
      minzoom: 8,
      layout: { 'text-field': ['get', layer.labelField], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'], 'text-optional': true },
      paint: { 'text-color': '#17120e', 'text-halo-color': 'rgba(243,232,210,0.92)', 'text-halo-width': 1.3 },
    })
  }, [mapRef, ready, layer])
}
