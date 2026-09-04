import { useEffect } from 'react'
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { PointLayer } from '../config/layers'
import { dataUrl } from '../data/contract'

export const POINT_SOURCE = 'atlas-points'
export const POINT_LAYER = 'atlas-points-circle'
export const POINT_LABELS = 'atlas-points-label'

function radiusExpression(layer: PointLayer): ExpressionSpecification | number {
  if (!layer.sizeField) return 5
  return ['interpolate', ['linear'], ['sqrt', ['coalesce', ['to-number', ['get', layer.sizeField]], 0]], 0, 3, 40, 14]
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
        'circle-opacity': 0.85,
        'circle-stroke-color': '#fbf7ef',
        'circle-stroke-width': 1.2,
      },
    })
    map.addLayer({
      id: POINT_LABELS,
      type: 'symbol',
      source: POINT_SOURCE,
      minzoom: 8,
      layout: { 'text-field': ['get', layer.labelField], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'], 'text-optional': true },
      paint: { 'text-color': '#1c1a17', 'text-halo-color': 'rgba(250,246,238,0.9)', 'text-halo-width': 1.2 },
    })
  }, [mapRef, ready, layer])
}
