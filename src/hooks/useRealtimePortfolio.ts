import { useCallback, useEffect, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'
import {
  fetchPortfolioData,
  type PortfolioData,
} from '@/services/portfolio'

const POLL_INTERVAL_MS = 45_000

export function useRealtimePortfolio() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silentRef = useRef(false)
  const mountedRef = useRef(true)

  const load = useCallback(async (silent = false) => {
    silentRef.current = silent
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await fetchPortfolioData()
      if (!mountedRef.current) return
      setData(result)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load portfolio')
      if (!silent) setData(null)
    } finally {
      if (mountedRef.current && !silentRef.current) setLoading(false)
    }
  }, [])

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void load(true)
    }, 350)
  }, [load])

  useEffect(() => {
    mountedRef.current = true
    void load(false)
    return () => {
      mountedRef.current = false
    }
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('public-portfolio-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => scheduleReload(),
      )

    channel.subscribe((status) => {
      if (!mountedRef.current) return
      setLive(status === 'SUBSCRIBED')
    })

    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleReload()
    }
    const onFocus = () => scheduleReload()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') scheduleReload()
    }, POLL_INTERVAL_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(pollId)
      void supabase.removeChannel(channel)
    }
  }, [scheduleReload])

  return {
    data,
    error,
    loading,
    live,
    reload: () => void load(false),
  }
}
