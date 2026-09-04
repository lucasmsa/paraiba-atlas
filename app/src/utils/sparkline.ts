export interface SeriePoint {
  mes: string
  volume_hm3: number | null
  percentual: number | null
}

export interface SparkPath {
  line: string
  area: string
  last: { x: number; y: number } | null
  filled: number
}

/** Months without a reading break the line rather than interpolating across a gap. */
export function sparkPath(serie: SeriePoint[], width: number, height: number): SparkPath | null {
  const filled = serie.filter((point) => point.percentual !== null).length
  if (filled < 2) return null

  const step = serie.length > 1 ? width / (serie.length - 1) : width
  const yFor = (percent: number) => height - (Math.min(percent, 100) / 100) * height

  const segments: string[] = []
  let current: string[] = []
  let last: { x: number; y: number } | null = null

  serie.forEach((point, index) => {
    if (point.percentual === null) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
      return
    }
    const x = index * step
    const y = yFor(point.percentual)
    current.push(`${current.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    last = { x, y }
  })
  if (current.length > 1) segments.push(current.join(' '))
  if (segments.length === 0) return null

  const first = serie.findIndex((point) => point.percentual !== null)
  const lastIndex = serie.length - 1 - [...serie].reverse().findIndex((point) => point.percentual !== null)
  const area = `M${(first * step).toFixed(1)},${height} ${segments.join(' ').replace(/^M/, 'L')} L${(lastIndex * step).toFixed(1)},${height} Z`

  return { line: segments.join(' '), area, last, filled }
}
