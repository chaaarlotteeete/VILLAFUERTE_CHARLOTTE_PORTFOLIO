import { supabase } from '@/lib/supabase'
import type { Experience } from '@/types/database'

export async function fetchExperiences() {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Experience[]
}
