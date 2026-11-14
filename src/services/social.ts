import { supabase } from '@/lib/supabase'
import type { SocialLink } from '@/types/database'

export async function fetchSocialLinks() {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as SocialLink[]
}
