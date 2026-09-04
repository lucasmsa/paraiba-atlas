import { useJson } from './useJson'
import type { Manifest, ManifestLayer } from '../data/contract'

export function useManifest(): Record<string, ManifestLayer> | null {
  const state = useJson<Manifest>('manifest.json')
  return state.status === 'ready' ? state.data.layers : null
}
