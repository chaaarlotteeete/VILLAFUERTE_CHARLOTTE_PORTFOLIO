import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1)
  }, [])

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (!active) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        setData(null)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, ...deps])

  return { data, error, loading, reload }
}
