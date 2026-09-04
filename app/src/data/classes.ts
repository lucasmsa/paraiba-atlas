export interface ClassEntry {
  value: string
  count: number
  area_km2: number
  share: number
}

export interface ClassLabel {
  sibcs?: string
  legenda_1972?: string
  faixa?: string
  nome?: string
  explicacao?: string
  definicao?: string
  confirmado?: boolean
  ressalva?: string
  fonte?: string
}

/** Class files carry one array per field, plus `labels` and free-form notes the pipeline attaches. */
export interface ClassesFile {
  [field: string]: ClassEntry[] | Record<string, ClassLabel> | Record<string, Record<string, ClassLabel>> | string | undefined
  labels?: Record<string, ClassLabel> | Record<string, Record<string, ClassLabel>>
}

export function classEntries(file: ClassesFile, field: string): ClassEntry[] {
  const value = file[field]
  return Array.isArray(value) ? value : []
}

export function classLabels(file: ClassesFile, field: string): Record<string, ClassLabel> {
  const labels = file.labels
  if (!labels) return {}
  const nested = labels[field]
  if (nested && typeof nested === 'object' && !('explicacao' in nested)) return nested as Record<string, ClassLabel>
  return labels as Record<string, ClassLabel>
}
