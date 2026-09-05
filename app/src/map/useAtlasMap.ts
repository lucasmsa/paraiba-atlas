import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre resolves its worker through a runtime URL the bundler cannot see, so the
// file is never emitted and the map silently fails to draw in a production build.
// The worker and its shared chunk are copied into public/maplibre by a prebuild step,
// which keeps them siblings so the worker's own relative import resolves.
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre/maplibre-gl-worker.mjs`)
import { dataUrl } from '../data/contract'
import { BASE_STYLE, COMPACT_CAMERA, HATCH_IMAGE, LAYERS, OPENING_CAMERA, PARAIBA_BOUNDS, SOURCES, TERRAIN_TILES } from './constants'
import { hatchImage } from './hatch'

const TERRAIN_GRACE_MS = 6000
const COMPACT_WIDTH = 768

/** Padding must leave room for whatever chrome overlays the map, or the fit zooms to nothing. */
const isCompactViewport = () => window.innerWidth < COMPACT_WIDTH

function openingCamera() {
  return isCompactViewport() ? COMPACT_CAMERA : OPENING_CAMERA
}

function fitPadding() {
  if (window.innerWidth < COMPACT_WIDTH) return { top: 62, bottom: 96, left: 8, right: 8 }
  return { top: 40, bottom: 40, left: 40, right: 400 }
}

/**
 * The elevation tiles are third-party and stall often enough to matter. A pending DEM
 * blocks the whole render and aborted tiles emit no error event, so relief is enabled
 * only once its data actually arrives, and abandoned if it does not.
 */
function enableTerrainWhenReady(map: MapLibreMap) {
  const give_up = window.setTimeout(() => {
    map.off('sourcedata', onData)
    if (map.getLayer(LAYERS.hillshade)) map.setLayoutProperty(LAYERS.hillshade, 'visibility', 'none')
  }, TERRAIN_GRACE_MS)

  function onData(event: { sourceId?: string; isSourceLoaded?: boolean }) {
    if (event.sourceId !== SOURCES.terrain || !event.isSourceLoaded) return
    map.off('sourcedata', onData)
    window.clearTimeout(give_up)
    map.setTerrain({ source: SOURCES.terrain, exaggeration: 1.6 })
  }

  map.on('sourcedata', onData)
}

function addAtlasSourcesAndLayers(map: MapLibreMap) {
  const dem = { type: 'raster-dem' as const, tiles: [TERRAIN_TILES], encoding: 'terrarium' as const, tileSize: 256, maxzoom: 14 }
  map.addSource(SOURCES.terrain, dem)
  map.addSource(SOURCES.hillshadeDem, dem)
  map.addSource(SOURCES.municipios, { type: 'geojson', data: dataUrl('geo/municipios.geojson'), promoteId: 'cod' })
  map.addSource(SOURCES.mesorregioes, { type: 'geojson', data: dataUrl('geo/mesorregioes.geojson'), promoteId: 'cod' })
  map.addSource(SOURCES.mesoLabels, { type: 'geojson', data: dataUrl('geo/mesorregioes_labels.geojson') })
  map.addSource(SOURCES.mask, { type: 'geojson', data: dataUrl('geo/mask.geojson') })
  map.addImage(HATCH_IMAGE, hatchImage())

  map.addLayer({ id: LAYERS.hillshade, type: 'hillshade', source: SOURCES.hillshadeDem, paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#4a3b2a' } })
  map.addLayer({ id: LAYERS.mask, type: 'fill', source: SOURCES.mask, paint: { 'fill-color': '#efe9df', 'fill-opacity': 0.72 } })
  map.addLayer({ id: LAYERS.fill, type: 'fill', source: SOURCES.municipios, layout: { visibility: 'none' }, paint: { 'fill-color': '#000', 'fill-opacity': 0.78 } })
  map.addLayer({ id: LAYERS.noData, type: 'fill', source: SOURCES.municipios, layout: { visibility: 'none' }, paint: { 'fill-pattern': HATCH_IMAGE, 'fill-opacity': 0.9 } })
  map.addLayer({ id: LAYERS.muniOutline, type: 'line', source: SOURCES.municipios, paint: { 'line-color': '#5c534a', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.2, 10, 0.9], 'line-opacity': 0.55 } })
  map.addLayer({ id: LAYERS.selected, type: 'line', source: SOURCES.municipios, filter: ['==', ['get', 'cod'], ''], paint: { 'line-color': '#111', 'line-width': 2.5 } })
  map.addLayer({ id: LAYERS.mesoOutline, type: 'line', source: SOURCES.mesorregioes, paint: { 'line-color': '#1c1a17', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.4, 10, 2.4] } })
  map.addLayer({
    id: LAYERS.mesoLabel,
    type: 'symbol',
    source: SOURCES.mesoLabels,
    layout: { 'text-field': ['get', 'nome'], 'text-size': 15, 'text-letter-spacing': 0.08, 'text-transform': 'uppercase', 'text-font': ['Noto Sans Bold'] },
    paint: { 'text-color': '#1c1a17', 'text-halo-color': 'rgba(250,246,238,0.9)', 'text-halo-width': 1.6 },
  })
}

export function useAtlasMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: BASE_STYLE,
      bounds: PARAIBA_BOUNDS,
      fitBoundsOptions: { padding: fitPadding() },
      maxPitch: 70,
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('load', () => {
      addAtlasSourcesAndLayers(map)
      enableTerrainWhenReady(map)
      map.easeTo({ ...openingCamera(), duration: 1800 })
      setReady(true)
    })
    mapRef.current = map
    if (import.meta.env.DEV) Object.assign(window, { __atlasMap: map })
    return () => {
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [])

  return { containerRef, mapRef, ready }
}

/** Crossing the breakpoint invalidates both the fit and the opening tilt. */
export function useMapBreakpoint(mapRef: React.RefObject<MapLibreMap | null>, ready: boolean, compact: boolean) {
  const previous = useRef(compact)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || previous.current === compact) return
    previous.current = compact
    map.resize()
    map.easeTo({ ...openingCamera(), duration: 0 })
    map.fitBounds(PARAIBA_BOUNDS, { padding: fitPadding(), duration: 400 })
  }, [mapRef, ready, compact])
}
