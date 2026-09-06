import type { LngLatBoundsLike } from 'maplibre-gl'

export const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron'
export const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
export const PARAIBA_BOUNDS: LngLatBoundsLike = [
  [-38.9, -8.4],
  [-34.7, -5.9],
]
/** Room to see the neighbours for context, but never the planet. */
export const PAN_LIMIT: LngLatBoundsLike = [
  [-41.5, -10.6],
  [-32.2, -3.6],
]
export const MIN_ZOOM = 5.4
export const MAX_ZOOM = 14
/** João Pessoa, the reference everyone in the state orients by. */
export const JOAO_PESSOA: [number, number] = [-34.861, -7.115]
export const OPENING_CAMERA = { pitch: 48, bearing: -12 }
/** A tall narrow screen loses too much height to a tilted view, so compact opens flatter. */
export const COMPACT_CAMERA = { pitch: 22, bearing: 0 }

export const SOURCES = { municipios: 'municipios', mesorregioes: 'mesorregioes', terrain: 'terrain', hillshadeDem: 'hillshade-dem', mask: 'mask', mesoLabels: 'meso-labels' } as const
export const LAYERS = {
  hillshade: 'atlas-hillshade',
  mask: 'atlas-mask',
  fill: 'atlas-municipios-fill',
  noData: 'atlas-municipios-nodata',
  muniOutline: 'atlas-municipios-outline',
  mesoOutline: 'atlas-mesorregioes-outline',
  mesoLabel: 'atlas-mesorregioes-label',
  selected: 'atlas-municipio-selected',
} as const
export const HATCH_IMAGE = 'atlas-hatch'
