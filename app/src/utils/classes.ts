import type { CategoricalLayer } from '../config/layers'
import type { ClassEntry, ClassLabel } from '../data/classes'

export const OTHER_VALUE = '__outras__'
export const OTHER_COLOR = '#b9b1a4'

const ORDERED_PALETTE = ['#8a4b12', '#b5762a', '#d9a441', '#7d8a3c', '#3f7a6b', '#2f6f8f', '#6a5a94', '#93487a', '#a83b3b', '#5c4630', '#7a7f6b', '#c08a5e']

export function withOtherBucket(all: ClassEntry[], maxClasses: number | undefined): ClassEntry[] {
  if (!maxClasses || all.length <= maxClasses) return all
  const kept = all.slice(0, maxClasses)
  const rest = all.slice(maxClasses)
  const merged: ClassEntry = {
    value: OTHER_VALUE,
    count: rest.reduce((sum, entry) => sum + entry.count, 0),
    area_km2: rest.reduce((sum, entry) => sum + entry.area_km2, 0),
    share: rest.reduce((sum, entry) => sum + entry.share, 0),
  }
  return [...kept, merged]
}

export function classColors(layer: CategoricalLayer, entries: ClassEntry[]): Record<string, string> {
  const colors: Record<string, string> = {}
  let index = 0
  entries.forEach((entry) => {
    if (entry.value === OTHER_VALUE) {
      colors[entry.value] = OTHER_COLOR
      return
    }
    colors[entry.value] = layer.colors?.[entry.value] ?? ORDERED_PALETTE[index++ % ORDERED_PALETTE.length]
  })
  return colors
}

/** Prefer the modern name, keep the raw code visible so the map and the source still line up. */
export function primaryLabel(value: string, label: ClassLabel | undefined, otherCount: number): string {
  if (value === OTHER_VALUE) return `outras ${otherCount} classes`
  if (!label) return value
  return label.sibcs ?? label.nome ?? label.faixa ?? value
}

export function explanationOf(label: ClassLabel | undefined): string | null {
  return label?.explicacao ?? label?.definicao ?? null
}

export function secondaryLabel(value: string, label: ClassLabel | undefined): string | null {
  if (value === OTHER_VALUE || !label) return null
  const parts = [label.legenda_1972 ? `1972: ${label.legenda_1972}` : null, label.sibcs || label.nome ? value : null].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
