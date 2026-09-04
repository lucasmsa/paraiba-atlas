import { useEffect } from 'react'
import type { DataDrivenPropertyValueSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { LineLayer } from '../config/layers'
import { dataUrl } from '../data/contract'

export const LINE_SOURCE = 'atlas-lines'
export const LINE_LAYER = 'atlas-lines-stroke'
export const LINE_POINTS = 'atlas-lines-points'
export const LINE_LABELS = 'atlas-lines-label'

function colorExpression(layer: LineLayer): DataDrivenPropertyValueSpecification<string> {
  const entries = Object.entries(layer.styles)
  if (!layer.classField || entries.length === 0) return layer.fallback.color
  const pairs = entries.flatMap(([value, style]) => [value, style.color])
  return ['match', ['to-string', ['get', layer.classField]], ...pairs, layer.fallback.color] as DataDrivenPropertyValueSpecification<string>
}

function widthExpression(layer: LineLayer): DataDrivenPropertyValueSpecification<number> {
  const entries = Object.entries(layer.styles)
  if (!layer.classField || entries.length === 0) return layer.fallback.width
  const pairs = entries.flatMap(([value, style]) => [value, style.width])
  return ['match', ['to-string', ['get', layer.classField]], ...pairs, layer.fallback.width] as DataDrivenPropertyValueSpecification<number>
}

function removeIfPresent(map: MapLibreMap) {
  for (const id of [LINE_LABELS, LINE_POINTS, LINE_LAYER]) if (map.getLayer(id)) map.removeLayer(id)
  if (map.getSource(LINE_SOURCE)) map.removeSource(LINE_SOURCE)
}

export function useLineLayer(mapRef: React.RefObject<MapLibreMap | null>, ready: boolean, layer: LineLayer | null) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    removeIfPresent(map)
    if (!layer) return

    map.addSource(LINE_SOURCE, { type: 'geojson', data: dataUrl(layer.geoPath) })
    map.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: LINE_SOURCE,
      filter: ['!=', ['geometry-type'], 'Point'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': colorExpression(layer), 'line-width': widthExpression(layer), 'line-opacity': 0.9 },
    })
    map.addLayer({
      id: LINE_POINTS,
      type: 'circle',
      source: LINE_SOURCE,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-radius': 3.4, 'circle-color': layer.fallback.color, 'circle-stroke-color': '#f3e8d2', 'circle-stroke-width': 1 },
    })
    if (layer.labelField) {
      map.addLayer({
        id: LINE_LABELS,
        type: 'symbol',
        source: LINE_SOURCE,
        minzoom: 8,
        layout: {
          'text-field': ['coalesce', ['get', layer.labelField], ''],
          'text-size': 11,
          'symbol-placement': 'line-center',
          'text-font': ['Noto Sans Bold'],
          'text-optional': true,
        },
        paint: { 'text-color': '#17120e', 'text-halo-color': 'rgba(243,232,210,0.92)', 'text-halo-width': 1.3 },
      })
    }
    return () => removeIfPresent(map)
  }, [mapRef, ready, layer])
}
