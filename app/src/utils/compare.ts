import type { Metric } from '../data/contract'
import type { CompareUnit } from '../hooks/useCompare'

export type CellTone = 'best' | 'worst' | 'plain'

export function unitValue(metric: Metric, unit: CompareUnit): number | undefined {
  return unit.kind === 'meso' ? metric.meso[unit.cod] : metric.values[unit.cod]
}

export function cellTones(metric: Metric, units: CompareUnit[]): CellTone[] {
  const values = units.map((unit) => unitValue(metric, unit))
  const present = values.filter((v): v is number => v !== undefined)
  if (metric.higher_is === 'neutral' || present.length < 2) return values.map(() => 'plain')
  const max = Math.max(...present)
  const min = Math.min(...present)
  if (max === min) return values.map(() => 'plain')
  const bestValue = metric.higher_is === 'better' ? max : min
  const worstValue = metric.higher_is === 'better' ? min : max
  return values.map((v) => (v === bestValue ? 'best' : v === worstValue ? 'worst' : 'plain'))
}
