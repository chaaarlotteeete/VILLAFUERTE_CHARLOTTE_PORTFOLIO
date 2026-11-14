import { supabase } from '@/lib/supabase'
import type { Award, TablesInsert, TablesUpdate } from '@/types/database'

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchAdminAwards() {
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .order('display_order')
    .order('received_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Award[]
}

export async function fetchVisibleAwards() {
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
    .order('received_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Award[]
}

export async function saveAward(
  input: TablesInsert<'awards'> & { id?: string },
) {
  if (input.id) {
    const { id, ...updates } = input
    const { data, error } = await supabase
      .from('awards')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Award
  }
  const { data, error } = await supabase
    .from('awards')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Award
}

export async function updateAwardFlags(
  id: string,
  flags: TablesUpdate<'awards'>,
) {
  const { data, error } = await supabase
    .from('awards')
    .update(flags)
    .eq('id', id)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Award
}

export async function deleteAward(id: string) {
  const { error } = await supabase.from('awards').delete().eq('id', id)
  await assertNoError(error)
}

export async function reorderAwards(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('awards').update({ display_order: index }).eq('id', id),
    ),
  )
}

export async function fetchEducationAwardIds(educationId: string) {
  const { data, error } = await supabase
    .from('education_awards')
    .select('award_id')
    .eq('education_id', educationId)
  await assertNoError(error)
  return (data ?? []).map((row) => row.award_id as string)
}

export async function setEducationAwards(
  educationId: string,
  awardIds: string[],
) {
  const { error: deleteError } = await supabase
    .from('education_awards')
    .delete()
    .eq('education_id', educationId)
  await assertNoError(deleteError)

  if (awardIds.length === 0) return

  const { error } = await supabase.from('education_awards').insert(
    awardIds.map((award_id) => ({
      education_id: educationId,
      award_id,
    })),
  )
  await assertNoError(error)
}
