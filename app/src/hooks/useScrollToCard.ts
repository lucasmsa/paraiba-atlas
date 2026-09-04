import { useEffect, useRef } from 'react'

/** With a dozen layers in a pillar, a freshly opened card lands below the fold. */
export function useScrollToCard(cardKey: string | null) {
  const ref = useRef<HTMLDivElement>(null)
  const previous = useRef<string | null>(null)

  useEffect(() => {
    if (!cardKey || cardKey === previous.current) {
      previous.current = cardKey
      return
    }
    previous.current = cardKey
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [cardKey])

  return ref
}
