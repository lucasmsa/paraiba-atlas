import { useEffect, useState } from 'react'
import { LAYERS, type ChoroplethLayer } from '../config/layers'
import { dataUrl, type Metric } from '../data/contract'

export interface LoadedMetric {
  layer: ChoroplethLayer
  metric: Metric
}

const choroplethLayers = LAYERS.filter((layer): layer is ChoroplethLayer => layer.kind === 'choropleth')

export function useAllMetrics(enabled: boolean): LoadedMetric[] | null {
  const [loaded, setLoaded] = useState<LoadedMetric[] | null>(null)

  useEffect(() => {
    if (!enabled || loaded) return
    let cancelled = false
    Promise.all(
      choroplethLayers.map((layer) =>
        fetch(dataUrl(layer.path))
          .then((response) => response.json() as Promise<Metric>)
          .then((metric) => ({ layer, metric })),
      ),
    ).then((result) => {
      if (!cancelled) setLoaded(result)
    })
    return () => {
      cancelled = true
    }
  }, [enabled, loaded])

  return loaded
}
