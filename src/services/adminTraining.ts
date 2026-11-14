import { supabase } from '@/lib/supabase'
import type { TablesInsert, TrainingRecord } from '@/types/database'

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchAdminTraining() {
  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .order('display_order')
    .order('start_date', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as TrainingRecord[]
}

export async function saveTraining(
  input: TablesInsert<'training_records'> & { id?: string },
) {
  if (input.id) {
    const { id, ...updates } = input
    const { data, error } = await supabase
      .from('training_records')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as TrainingRecord
  }
  const { data, error } = await supabase
    .from('training_records')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as TrainingRecord
}

export async function deleteTraining(id: string) {
  const { error } = await supabase.from('training_records').delete().eq('id', id)
  await assertNoError(error)
}

export async function reorderTraining(items: TrainingRecord[]) {
  const previous = items.map((item) => ({ ...item }))
  try {
    await Promise.all(
      items.map((item, index) =>
        supabase
          .from('training_records')
          .update({ display_order: index })
          .eq('id', item.id),
      ),
    )
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Failed to save training order')
  }
  return previous
}
