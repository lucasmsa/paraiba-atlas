import { useCallback, useEffect, useState } from 'react'

export type CompareUnit = { kind: 'municipio'; cod: string } | { kind: 'meso'; cod: string }

const PARAM = 'comparar'
const MAX_UNITS = 6

function parse(raw: string | null): CompareUnit[] {
  if (!raw) return []
  return raw
    .split(',')
    .filter(Boolean)
    .map((token) => (token.startsWith('m') ? { kind: 'meso' as const, cod: token.slice(1) } : { kind: 'municipio' as const, cod: token }))
}

const serialize = (units: CompareUnit[]) => units.map((u) => (u.kind === 'meso' ? `m${u.cod}` : u.cod)).join(',')
const same = (a: CompareUnit, b: CompareUnit) => a.kind === b.kind && a.cod === b.cod

export function useCompare() {
  const [units, setUnits] = useState<CompareUnit[]>(() => parse(new URLSearchParams(window.location.search).get(PARAM)))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (units.length) params.set(PARAM, serialize(units))
    else params.delete(PARAM)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [units])

  const toggle = useCallback((unit: CompareUnit) => {
    setUnits((current) => {
      if (current.some((u) => same(u, unit))) return current.filter((u) => !same(u, unit))
      if (current.length >= MAX_UNITS) return current
      return [...current, unit]
    })
  }, [])

  const clear = useCallback(() => setUnits([]), [])
  const has = useCallback((unit: CompareUnit) => units.some((u) => same(u, unit)), [units])

  return { units, toggle, clear, has, isFull: units.length >= MAX_UNITS }
}
