import { useEffect, useState } from 'react'
import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import { POINT_LAYER } from '../map/usePointLayer'

export type PointProperties = Record<string, string | number | null>

export function usePointSelection(mapRef: React.RefObject<MapLibreMap | null>, ready: boolean, active: boolean) {
  const [selected, setSelected] = useState<PointProperties | null>(null)

  useEffect(() => {
    if (!active) setSelected(null)
  }, [active])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !active) return

    const onClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (feature) setSelected(feature.properties as PointProperties)
    }
    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', POINT_LAYER, onClick)
    map.on('mouseenter', POINT_LAYER, onEnter)
    map.on('mouseleave', POINT_LAYER, onLeave)
    return () => {
      map.off('click', POINT_LAYER, onClick)
      map.off('mouseenter', POINT_LAYER, onEnter)
      map.off('mouseleave', POINT_LAYER, onLeave)
    }
  }, [mapRef, ready, active])

  return { selected, clear: () => setSelected(null) }
}
