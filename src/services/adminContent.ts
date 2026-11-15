import { supabase } from '@/lib/supabase'
import type {
  Certification,
  ContactMessage,
  Education,
  Experience,
  Profile,
  Resume,
  SiteSetting,
  Skill,
  SocialLink,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function upsertProfile(input: TablesInsert<'profiles'> & { id?: string }) {
  if (input.id) {
    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Profile
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Profile
}

export async function fetchAdminSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category')
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as Skill[]
}

export async function saveSkill(input: TablesInsert<'skills'> & { id?: string }) {
  if (input.id) {
    const { data, error } = await supabase
      .from('skills')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Skill
  }
  const { data, error } = await supabase.from('skills').insert(input).select('*').single()
  await assertNoError(error)
  return data as Skill
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  await assertNoError(error)
}

export async function fetchAdminExperiences() {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .order('display_order')
    .order('start_date', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Experience[]
}

export async function saveExperience(
  input: TablesInsert<'experiences'> & { id?: string },
) {
  if (input.id) {
    const { data, error } = await supabase
      .from('experiences')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Experience
  }
  const { data, error } = await supabase
    .from('experiences')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Experience
}

export async function deleteExperience(id: string) {
  const { error } = await supabase.from('experiences').delete().eq('id', id)
  await assertNoError(error)
}

export async function fetchAdminEducation() {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .order('display_order')
    .order('start_date', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Education[]
}

export async function saveEducation(input: TablesInsert<'education'> & { id?: string }) {
  const { id, ...payload } = input
  if (id) {
    const { data, error } = await supabase
      .from('education')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Education
  }
  const { data, error } = await supabase
    .from('education')
    .insert(payload)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Education
}

export async function deleteEducation(id: string) {
  const { error } = await supabase.from('education').delete().eq('id', id)
  await assertNoError(error)
}

export async function reorderEducation(orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('education').update({ display_order: index }).eq('id', id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function fetchAdminCertifications() {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('display_order')
    .order('issued_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Certification[]
}

export async function saveCertification(
  input: TablesInsert<'certifications'> & { id?: string },
) {
  if (input.id) {
    const { data, error } = await supabase
      .from('certifications')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Certification
  }
  const { data, error } = await supabase
    .from('certifications')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Certification
}

export async function deleteCertification(id: string) {
  const { error } = await supabase.from('certifications').delete().eq('id', id)
  await assertNoError(error)
}

export async function reorderCertifications(orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('certifications')
        .update({ display_order: index })
        .eq('id', id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function fetchAdminResumes() {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('uploaded_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as Resume[]
}

export async function saveResume(input: TablesInsert<'resumes'> & { id?: string }) {
  if (input.is_published) {
    const { error: unpublishError } = await supabase
      .from('resumes')
      .update({ is_published: false })
      .neq('id', input.id ?? '00000000-0000-0000-0000-000000000000')
    await assertNoError(unpublishError)
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('resumes')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as Resume
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as Resume
}

export async function deleteResume(id: string) {
  const { error } = await supabase.from('resumes').delete().eq('id', id)
  await assertNoError(error)
}

export async function fetchAdminMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  await assertNoError(error)
  return (data ?? []) as ContactMessage[]
}

export async function updateMessageRead(id: string, is_read: boolean) {
  const { error } = await supabase
    .from('contact_messages')
    .update({ is_read })
    .eq('id', id)
  await assertNoError(error)
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  await assertNoError(error)
}

export async function fetchAdminSocialLinks() {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as SocialLink[]
}

export async function saveSocialLink(
  input: TablesInsert<'social_links'> & { id?: string },
) {
  if (input.id) {
    const { data, error } = await supabase
      .from('social_links')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as SocialLink
  }
  const { data, error } = await supabase
    .from('social_links')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as SocialLink
}

export async function deleteSocialLink(id: string) {
  const { error } = await supabase.from('social_links').delete().eq('id', id)
  await assertNoError(error)
}

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').order('key')
  await assertNoError(error)
  return (data ?? []) as SiteSetting[]
}

export async function saveSiteSetting(
  key: string,
  value: Exclude<TablesUpdate<'site_settings'>['value'], null | undefined>,
) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select('*')
    .single()
  await assertNoError(error)
  return data as SiteSetting
}
