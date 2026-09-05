import { useEffect, useState } from 'react'

/** Matches Tailwind's md breakpoint: below it the sidebar cannot sit beside the map. */
const COMPACT = '(max-width: 767px)'

export function useIsCompact(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia(COMPACT).matches)

  useEffect(() => {
    const query = window.matchMedia(COMPACT)
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return compact
}
