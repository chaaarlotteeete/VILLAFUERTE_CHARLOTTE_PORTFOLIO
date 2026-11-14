import { supabase } from '@/lib/supabase'

export async function fetchIsAdmin(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}
