import { useEffect, useState } from 'react'
import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import { LAYERS } from './constants'

export interface HoverInfo {
  cod: string
  x: number
  y: number
}

export function useMunicipioInteraction(
  mapRef: React.RefObject<MapLibreMap | null>,
  ready: boolean,
  selectedCod: string | null,
  onSelect: (cod: string | null) => void,
) {
  const [hover, setHover] = useState<HoverInfo | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const targets = [LAYERS.fill, LAYERS.noData]

    const onMove = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      map.getCanvas().style.cursor = 'pointer'
      setHover({ cod: String(feature.properties.cod), x: event.point.x, y: event.point.y })
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
      setHover(null)
    }
    const onClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      onSelect(feature ? String(feature.properties.cod) : null)
    }

    targets.forEach((layer) => {
      map.on('mousemove', layer, onMove)
      map.on('mouseleave', layer, onLeave)
      map.on('click', layer, onClick)
    })
    return () => {
      targets.forEach((layer) => {
        map.off('mousemove', layer, onMove)
        map.off('mouseleave', layer, onLeave)
        map.off('click', layer, onClick)
      })
    }
  }, [mapRef, ready, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.setFilter(LAYERS.selected, ['==', ['get', 'cod'], selectedCod ?? ''])
  }, [mapRef, ready, selectedCod])

  return hover
}
