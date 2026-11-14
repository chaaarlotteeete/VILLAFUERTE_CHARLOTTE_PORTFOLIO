import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export async function fetchProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Profile | null
}
