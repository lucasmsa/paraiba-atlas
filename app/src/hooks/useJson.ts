import { useEffect, useState } from 'react'
import { dataUrl } from '../data/contract'

export type Loadable<T> = { status: 'idle' } | { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string }

export function useJson<T>(relativePath: string | null): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: 'idle' })

  useEffect(() => {
    if (!relativePath) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    fetch(dataUrl(relativePath))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${relativePath}`)
        return response.json() as Promise<T>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [relativePath])

  return state
}
