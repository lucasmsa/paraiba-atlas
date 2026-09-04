export type MunicipioCode = string

export interface ManifestLayer {
  source: string
  source_url: string
  year: number
  year_note?: string
  rows: number
  path?: string
  refreshed_at?: string
  editorial?: boolean
}

export interface Manifest {
  generated_at: string
  layers: Record<string, ManifestLayer>
}

export interface Metric {
  id: string
  label: string
  unit: string
  year: number
  source: string
  source_url: string
  n: number
  higher_is: 'better' | 'worse' | 'neutral'
  state_median: number
  state_total: number | null
  breaks: number[]
  values: Record<MunicipioCode, number>
  rank: Record<MunicipioCode, number>
  percentile: Record<MunicipioCode, number>
  meso: Record<string, number>
  meso_method: 'sum' | 'pop_weighted_mean'
  /** Caveat the pipeline attaches when the number is easy to misread. Rendered verbatim. */
  note?: string
}

export interface MunicipioIndexEntry {
  nome: string
  meso: string
  meso_nome: string
}

export type MunicipioIndex = Record<MunicipioCode, MunicipioIndexEntry>

export const dataUrl = (relative: string) => `${import.meta.env.BASE_URL}data/${relative}`
