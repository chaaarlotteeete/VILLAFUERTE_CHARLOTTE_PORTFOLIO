import { supabase } from '@/lib/supabase'
import type { Hobby, HobbyMedia } from '@/types/database'

export type PublicHobby = Hobby & {
  hobby_media: HobbyMedia[]
}

export async function fetchVisibleHobbies() {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*, hobby_media (*)')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as PublicHobby[]).map((hobby) => ({
    ...hobby,
    hobby_media: [...(hobby.hobby_media ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    ),
  }))
}
