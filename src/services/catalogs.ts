import { supabase } from '@/lib/supabase'
import type {
  AwardCategory,
  DegreeOption,
  EducationLevel,
  EducationStrand,
  EducationTrack,
  HobbyCategory,
  HobbyOption,
} from '@/types/database'

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function fetchEducationLevels() {
  const { data, error } = await supabase
    .from('education_levels')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as EducationLevel[]
}

export async function fetchDegreeOptions(levelId?: string | null) {
  let query = supabase
    .from('degree_options')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  if (levelId) query = query.eq('education_level_id', levelId)
  const { data, error } = await query
  await assertNoError(error)
  return (data ?? []) as DegreeOption[]
}

export async function createDegreeOption(
  educationLevelId: string,
  name: string,
) {
  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('degree_options')
    .insert({
      education_level_id: educationLevelId,
      name: name.trim(),
      slug,
      is_custom: true,
      display_order: 500,
    })
    .select('*')
    .single()
  await assertNoError(error)
  return data as DegreeOption
}

export async function fetchEducationTracks() {
  const { data, error } = await supabase
    .from('education_tracks')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as EducationTrack[]
}

export async function fetchEducationStrands(trackId?: string | null) {
  let query = supabase
    .from('education_strands')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  if (trackId) query = query.eq('track_id', trackId)
  const { data, error } = await query
  await assertNoError(error)
  return (data ?? []) as EducationStrand[]
}

export async function fetchHobbyCategories() {
  const { data, error } = await supabase
    .from('hobby_categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as HobbyCategory[]
}

export async function createHobbyCategory(name: string) {
  const base = slugify(name) || 'custom'
  const slug = `${base}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('hobby_categories')
    .insert({
      name: name.trim(),
      slug,
      is_custom: true,
      display_order: 500,
    })
    .select('*')
    .single()
  await assertNoError(error)
  return data as HobbyCategory
}

export async function fetchHobbyOptions(categoryId?: string | null) {
  let query = supabase
    .from('hobby_options')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  if (categoryId) query = query.eq('hobby_category_id', categoryId)
  const { data, error } = await query
  await assertNoError(error)
  return (data ?? []) as HobbyOption[]
}

export async function createHobbyOption(categoryId: string, name: string) {
  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('hobby_options')
    .insert({
      hobby_category_id: categoryId,
      name: name.trim(),
      slug,
      is_custom: true,
      display_order: 500,
    })
    .select('*')
    .single()
  await assertNoError(error)
  return data as HobbyOption
}

export async function fetchAwardCategories() {
  const { data, error } = await supabase
    .from('award_categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as AwardCategory[]
}

export async function createAwardCategory(name: string) {
  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('award_categories')
    .insert({
      name: name.trim(),
      slug,
      is_custom: true,
      display_order: 500,
    })
    .select('*')
    .single()
  await assertNoError(error)
  return data as AwardCategory
}
