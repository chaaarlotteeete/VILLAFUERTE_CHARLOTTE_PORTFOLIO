import { useCallback, useEffect, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'
import {
  fetchPortfolioData,
  type PortfolioData,
} from '@/services/portfolio'

const REALTIME_TABLES = [
  'profiles',
  'projects',
  'project_technologies',
  'technologies',
  'skills',
  'experiences',
  'education',
  'hobbies',
  'hobby_media',
  'certifications',
  'awards',
  'award_categories',
  'training_records',
  'resumes',
  'social_links',
  'site_settings',
  'page_sections',
  'section_content',
  'specialization_cards',
  'navigation_items',
  'skill_categories',
] as const

export function useRealtimePortfolio() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silentRef = useRef(false)

  const load = useCallback(async (silent = false) => {
    silentRef.current = silent
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await fetchPortfolioData()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio')
      if (!silent) setData(null)
    } finally {
      if (!silentRef.current) setLoading(false)
    }
  }, [])

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void load(true)
    }, 350)
  }, [load])

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    const channel = supabase.channel('public-portfolio-realtime')

    for (const table of REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => scheduleReload(),
      )
    }

    channel.subscribe((status) => {
      setLive(status === 'SUBSCRIBED')
    })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
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
