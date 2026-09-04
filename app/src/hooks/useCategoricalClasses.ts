import { useMemo } from 'react'
import type { CategoricalLayer } from '../config/layers'
import { classEntries, classLabels, type ClassesFile, type ClassEntry, type ClassLabel } from '../data/classes'
import { classColors, withOtherBucket } from '../utils/classes'
import { useJson } from './useJson'

export interface CategoricalData {
  entries: ClassEntry[] | null
  colors: Record<string, string>
  labels: Record<string, ClassLabel>
}

export function useCategoricalClasses(layer: CategoricalLayer | null): CategoricalData {
  const state = useJson<ClassesFile>(layer?.classesPath ?? null)
  const file = state.status === 'ready' ? state.data : null

  return useMemo(() => {
    if (!layer || !file) return { entries: null, colors: {}, labels: {} }
    const entries = withOtherBucket(classEntries(file, layer.classesKey), layer.maxClasses)
    return { entries, colors: classColors(layer, entries), labels: classLabels(file, layer.classesKey) }
  }, [layer, file])
}
