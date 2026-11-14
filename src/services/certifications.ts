import { supabase } from '@/lib/supabase'
import type { Certification } from '@/types/database'

export async function fetchCertifications() {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('display_order', { ascending: true })
    .order('issued_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as Certification[]).filter(
    (item) => item.is_visible !== false,
  )
}
