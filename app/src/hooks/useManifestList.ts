import { useMemo } from 'react'
import { LAYERS } from '../config/layers'
import type { ManifestLayer } from '../data/contract'
import { PILLARS, type PillarId } from '../config/pillars'
import { useManifest } from './useManifest'

export interface SourceRow {
  pillar: PillarId
  pillarLabel: string
  label: string
  entry: ManifestLayer
}

export function useSourceRows(): SourceRow[] | null {
  const manifest = useManifest()

  return useMemo(() => {
    if (!manifest) return null
    return LAYERS.flatMap((layer) => {
      const entry = manifest[layer.id]
      if (!entry) return []
      const pillar = PILLARS.find((p) => p.id === layer.pillar)!
      return [{ pillar: layer.pillar, pillarLabel: pillar.label, label: layer.label, entry }]
    })
  }, [manifest])
}
