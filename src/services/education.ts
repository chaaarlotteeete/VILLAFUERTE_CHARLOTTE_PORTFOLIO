import { supabase } from '@/lib/supabase'
import type { Education } from '@/types/database'

export type EducationWithRelations = Education & {
  education_levels?: { name: string; slug: string } | null
  education_tracks?: { name: string; slug: string } | null
  education_strands?: { name: string; slug: string } | null
}

export async function fetchEducation() {
  const { data, error } = await supabase
    .from('education')
    .select(
      `
      *,
      education_levels ( name, slug ),
      education_tracks ( name, slug ),
      education_strands ( name, slug )
    `,
    )
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as EducationWithRelations[]
}
