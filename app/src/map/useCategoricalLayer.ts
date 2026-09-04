import { useEffect } from 'react'
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { CategoricalLayer } from '../config/layers'
import type { ClassEntry } from '../data/classes'
import { dataUrl } from '../data/contract'
import { OTHER_COLOR, OTHER_VALUE } from '../utils/classes'
import { LAYERS } from './constants'

export const CATEGORICAL_SOURCE = 'atlas-categorical'
export const CATEGORICAL_FILL = 'atlas-categorical-fill'
export const CATEGORICAL_OUTLINE = 'atlas-categorical-outline'

function fillColor(field: string, entries: ClassEntry[], colors: Record<string, string>): ExpressionSpecification {
  const named = entries.filter((entry) => entry.value !== OTHER_VALUE)
  if (named.length === 0) return ['literal', OTHER_COLOR] as unknown as ExpressionSpecification
  const pairs = named.flatMap((entry) => [entry.value, colors[entry.value]])
  return ['match', ['to-string', ['get', field]], ...pairs, OTHER_COLOR] as ExpressionSpecification
}

function removeIfPresent(map: MapLibreMap) {
  if (map.getLayer(CATEGORICAL_OUTLINE)) map.removeLayer(CATEGORICAL_OUTLINE)
  if (map.getLayer(CATEGORICAL_FILL)) map.removeLayer(CATEGORICAL_FILL)
  if (map.getSource(CATEGORICAL_SOURCE)) map.removeSource(CATEGORICAL_SOURCE)
}

export function useCategoricalLayer(
  mapRef: React.RefObject<MapLibreMap | null>,
  ready: boolean,
  layer: CategoricalLayer | null,
  entries: ClassEntry[] | null,
  colors: Record<string, string>,
) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    removeIfPresent(map)
    if (!layer || !entries) return

    map.addSource(CATEGORICAL_SOURCE, { type: 'geojson', data: dataUrl(layer.geoPath) })
    map.addLayer(
      { id: CATEGORICAL_FILL, type: 'fill', source: CATEGORICAL_SOURCE, paint: { 'fill-color': fillColor(layer.classField, entries, colors), 'fill-opacity': 0.72 } },
      LAYERS.muniOutline,
    )
    map.addLayer(
      { id: CATEGORICAL_OUTLINE, type: 'line', source: CATEGORICAL_SOURCE, paint: { 'line-color': '#3d3630', 'line-width': 0.3, 'line-opacity': 0.45 } },
      LAYERS.muniOutline,
    )
    return () => removeIfPresent(map)
  }, [mapRef, ready, layer, entries, colors])
}
