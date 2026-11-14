import { supabase } from '@/lib/supabase'
import type { Resume } from '@/types/database'

export async function fetchPublishedResume() {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('is_published', true)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Resume | null
}
