import { supabase } from '@/lib/supabase'
import type { Education } from '@/types/database'

export async function fetchEducation() {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Education[]
}
