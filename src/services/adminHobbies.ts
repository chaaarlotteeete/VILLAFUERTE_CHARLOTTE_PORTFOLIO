import { supabase } from '@/lib/supabase'
import type {
  Hobby,
  HobbyMedia,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export type HobbyDetail = Hobby & {
  hobby_media: HobbyMedia[]
}

export interface AdminHobbyPayload {
  hobby: TablesInsert<'hobbies'> | (TablesUpdate<'hobbies'> & { id?: string })
  media: Array<Omit<TablesInsert<'hobby_media'>, 'hobby_id'>>
}

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchAdminHobbies() {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*')
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Hobby[]
}

export async function fetchAdminHobbyById(id: string) {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*, hobby_media (*)')
    .eq('id', id)
    .maybeSingle()
  await assertNoError(error)
  if (!data) return null
  const hobby = data as unknown as HobbyDetail
  hobby.hobby_media = [...(hobby.hobby_media ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  )
  return hobby
}

export async function saveAdminHobby(payload: AdminHobbyPayload) {
  const { hobby, media } = payload
  const hobbyId = 'id' in hobby && hobby.id ? hobby.id : null

  let saved: Hobby

  if (hobbyId) {
    const { id: _id, ...updates } = hobby as TablesUpdate<'hobbies'> & {
      id: string
    }
    const { data, error } = await supabase
      .from('hobbies')
      .update(updates)
      .eq('id', hobbyId)
      .select('*')
      .single()
    await assertNoError(error)
    saved = data as Hobby
  } else {
    const { data, error } = await supabase
      .from('hobbies')
      .insert(hobby as TablesInsert<'hobbies'>)
      .select('*')
      .single()
    await assertNoError(error)
    saved = data as Hobby
  }

  const { error: deleteError } = await supabase
    .from('hobby_media')
    .delete()
    .eq('hobby_id', saved.id)
  await assertNoError(deleteError)

  if (media.length > 0) {
    const { error: insertError } = await supabase.from('hobby_media').insert(
      media.map((item, index) => ({
        ...item,
        hobby_id: saved.id,
        display_order: item.display_order ?? index,
      })),
    )
    await assertNoError(insertError)
  }

  return saved
}

export async function updateHobbyFlags(
  id: string,
  flags: TablesUpdate<'hobbies'>,
) {
  const { data, error } = await supabase
    .from('hobbies')
    .update(flags)
    .eq('id', id)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Hobby
}

export async function deleteHobby(id: string) {
  const { error } = await supabase.from('hobbies').delete().eq('id', id)
  await assertNoError(error)
}
