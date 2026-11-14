import type { SupabaseClient } from '@supabase/supabase-js'

import {
  ABOUT_CONTENT_DEFAULTS,
  CONTACT_CONTENT_DEFAULTS,
  DEFAULT_FOOTER_NAV,
  DEFAULT_HEADER_NAV,
  DEFAULT_SKILL_FILTERS,
  DEFAULT_SPECIALIZATION_CARDS,
  FLOATING_ACTIONS_DEFAULTS,
  FOOTER_CONTENT_DEFAULTS,
  HEADER_CONTENT_DEFAULTS,
  HERO_CONTENT_DEFAULTS,
  PAGE_SECTION_DEFAULTS,
  contentTypesForSection,
  mergeSectionContent,
  type SectionContentType,
} from '@/lib/cms-defaults'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'

/** CMS tables may be ahead of generated Database types */
const cms = supabase as unknown as SupabaseClient

async function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export type ContentRevisionEntityType =
  | 'page_section'
  | 'section_bundle'
  | 'site_setting'
  | 'navigation'
  | 'specialization_cards'
  | 'header'
  | 'footer'
  | 'floating_actions'
  | 'hero'
  | 'about'
  | 'contact'

export type ContentRevisionStatus = 'draft' | 'published' | 'archived'

export interface PageSection {
  id: string
  section_key: string
  eyebrow: string | null
  heading: string | null
  subtitle: string | null
  is_visible: boolean
  is_locked: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface SectionContentRow {
  id: string
  section_key: string
  content_key: string
  content_value: string
  content_type: SectionContentType
  created_at: string
  updated_at: string
}

export interface SpecializationCard {
  id: string
  title: string
  description: string
  icon: string
  tone: string
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface NavigationItem {
  id: string
  label: string
  destination: string
  location: 'header' | 'footer' | 'mobile'
  section_key: string | null
  is_visible: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ContentRevision {
  id: string
  entity_type: ContentRevisionEntityType
  entity_key: string
  status: ContentRevisionStatus
  payload: Json
  label: string | null
  created_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type SectionContentMap = Record<string, string>

export type SectionContentPayload = Record<
  string,
  { content_value: string; content_type?: SectionContentType }
>

// ---------------------------------------------------------------------------
// Page sections
// ---------------------------------------------------------------------------

export async function fetchPageSections(): Promise<PageSection[]> {
  const { data, error } = await cms
    .from('page_sections')
    .select('*')
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as PageSection[]
}

export async function fetchPageSectionByKey(sectionKey: string): Promise<PageSection | null> {
  const { data, error } = await cms
    .from('page_sections')
    .select('*')
    .eq('section_key', sectionKey)
    .maybeSingle()
  await assertNoError(error)
  return (data as PageSection | null) ?? null
}

export async function upsertPageSection(
  input: Partial<PageSection> & { section_key: string },
): Promise<PageSection> {
  const { section_key, ...rest } = input
  const { data, error } = await cms
    .from('page_sections')
    .upsert({ section_key, ...rest }, { onConflict: 'section_key' })
    .select('*')
    .single()
  await assertNoError(error)
  return data as PageSection
}

export async function updatePageSectionVisibility(
  sectionKey: string,
  isVisible: boolean,
): Promise<void> {
  const { error } = await cms
    .from('page_sections')
    .update({ is_visible: isVisible })
    .eq('section_key', sectionKey)
  await assertNoError(error)
}

// ---------------------------------------------------------------------------
// Section content
// ---------------------------------------------------------------------------

export async function fetchSectionContentRows(sectionKey: string): Promise<SectionContentRow[]> {
  const { data, error } = await cms
    .from('section_content')
    .select('*')
    .eq('section_key', sectionKey)
    .order('content_key')
  await assertNoError(error)
  return (data ?? []) as SectionContentRow[]
}

export function sectionRowsToMap(rows: SectionContentRow[]): SectionContentMap {
  return Object.fromEntries(rows.map((row) => [row.content_key, row.content_value]))
}

export async function fetchSectionContentMap(sectionKey: string): Promise<SectionContentMap> {
  const rows = await fetchSectionContentRows(sectionKey)
  const published = sectionRowsToMap(rows)
  return mergeSectionContent(sectionKey, published)
}

export async function upsertSectionContentEntry(
  sectionKey: string,
  contentKey: string,
  contentValue: string,
  contentType: SectionContentType = 'text',
): Promise<SectionContentRow> {
  const { data, error } = await cms
    .from('section_content')
    .upsert(
      {
        section_key: sectionKey,
        content_key: contentKey,
        content_value: contentValue,
        content_type: contentType,
      },
      { onConflict: 'section_key,content_key' },
    )
    .select('*')
    .single()
  await assertNoError(error)
  return data as SectionContentRow
}

export async function upsertSectionContentMap(
  sectionKey: string,
  values: SectionContentMap,
): Promise<void> {
  const types = contentTypesForSection(sectionKey)
  const rows = Object.entries(values).map(([content_key, content_value]) => ({
    section_key: sectionKey,
    content_key,
    content_value,
    content_type: types[content_key] ?? ('text' as SectionContentType),
  }))
  if (rows.length === 0) return
  const { error } = await cms
    .from('section_content')
    .upsert(rows, { onConflict: 'section_key,content_key' })
  await assertNoError(error)
}

export async function upsertSectionContentPayload(
  sectionKey: string,
  payload: SectionContentPayload,
): Promise<void> {
  const types = contentTypesForSection(sectionKey)
  const rows = Object.entries(payload).map(([content_key, entry]) => ({
    section_key: sectionKey,
    content_key,
    content_value: entry.content_value,
    content_type: entry.content_type ?? types[content_key] ?? 'text',
  }))
  if (rows.length === 0) return
  const { error } = await cms
    .from('section_content')
    .upsert(rows, { onConflict: 'section_key,content_key' })
  await assertNoError(error)
}

// ---------------------------------------------------------------------------
// Specialization cards
// ---------------------------------------------------------------------------

export async function fetchSpecializationCards(): Promise<SpecializationCard[]> {
  const { data, error } = await cms
    .from('specialization_cards')
    .select('*')
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as SpecializationCard[]
}

export async function fetchSpecializationCardSkillIds(cardId: string): Promise<string[]> {
  const { data, error } = await cms
    .from('specialization_card_skills')
    .select('skill_id')
    .eq('card_id', cardId)
  await assertNoError(error)
  return (data ?? []).map((row: { skill_id: string }) => row.skill_id)
}

export async function saveSpecializationCard(
  input: Partial<SpecializationCard> & {
    title: string
    id?: string
    skillIds?: string[]
  },
): Promise<SpecializationCard> {
  const { skillIds, id, ...card } = input
  let cardId = id

  if (cardId) {
    const { data, error } = await cms
      .from('specialization_cards')
      .update(card)
      .eq('id', cardId)
      .select('*')
      .single()
    await assertNoError(error)
    cardId = (data as SpecializationCard).id
  } else {
    const { data, error } = await cms
      .from('specialization_cards')
      .insert(card)
      .select('*')
      .single()
    await assertNoError(error)
    cardId = (data as SpecializationCard).id
  }

  if (skillIds && cardId) {
    await cms.from('specialization_card_skills').delete().eq('card_id', cardId)
    if (skillIds.length > 0) {
      const { error: linkError } = await cms.from('specialization_card_skills').insert(
        skillIds.map((skill_id) => ({ card_id: cardId, skill_id })),
      )
      await assertNoError(linkError)
    }
  }

  const { data: saved, error: fetchError } = await cms
    .from('specialization_cards')
    .select('*')
    .eq('id', cardId)
    .single()
  await assertNoError(fetchError)
  return saved as SpecializationCard
}

export async function deleteSpecializationCard(id: string): Promise<void> {
  const { error } = await cms.from('specialization_cards').delete().eq('id', id)
  await assertNoError(error)
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function fetchNavigationItems(
  location?: NavigationItem['location'],
): Promise<NavigationItem[]> {
  let query = cms.from('navigation_items').select('*').order('display_order')
  if (location) query = query.eq('location', location)
  const { data, error } = await query
  await assertNoError(error)
  return (data ?? []) as NavigationItem[]
}

export async function saveNavigationItem(
  input: Partial<NavigationItem> & { label: string; destination: string; location: NavigationItem['location'] },
): Promise<NavigationItem> {
  if (input.id) {
    const { data, error } = await cms
      .from('navigation_items')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as NavigationItem
  }
  const { data, error } = await cms.from('navigation_items').insert(input).select('*').single()
  await assertNoError(error)
  return data as NavigationItem
}

export async function deleteNavigationItem(id: string): Promise<void> {
  const { error } = await cms.from('navigation_items').delete().eq('id', id)
  await assertNoError(error)
}

// ---------------------------------------------------------------------------
// Drafts & publish
// ---------------------------------------------------------------------------

export async function fetchActiveDraft(
  entityType: ContentRevisionEntityType,
  entityKey: string,
): Promise<ContentRevision | null> {
  const { data, error } = await cms
    .from('content_revisions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_key', entityKey)
    .eq('status', 'draft')
    .maybeSingle()
  await assertNoError(error)
  return (data as ContentRevision | null) ?? null
}

export async function saveContentDraft(input: {
  entityType: ContentRevisionEntityType
  entityKey: string
  payload: Json
  label?: string
  createdBy?: string | null
}): Promise<ContentRevision> {
  const existing = await fetchActiveDraft(input.entityType, input.entityKey)
  if (existing) {
    const { data, error } = await cms
      .from('content_revisions')
      .update({
        payload: input.payload,
        label: input.label ?? existing.label,
        created_by: input.createdBy ?? existing.created_by,
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as ContentRevision
  }

  const { data, error } = await cms
    .from('content_revisions')
    .insert({
      entity_type: input.entityType,
      entity_key: input.entityKey,
      status: 'draft',
      payload: input.payload,
      label: input.label ?? null,
      created_by: input.createdBy ?? null,
    })
    .select('*')
    .single()
  await assertNoError(error)
  return data as ContentRevision
}

export async function publishSectionContentDraft(revisionId: string): Promise<void> {
  const { data: revision, error: fetchError } = await cms
    .from('content_revisions')
    .select('*')
    .eq('id', revisionId)
    .single()
  await assertNoError(fetchError)
  const record = revision as ContentRevision
  if (record.status !== 'draft') {
    throw new Error('Only draft revisions can be published')
  }

  const sectionKey = record.entity_key
  const payload = record.payload

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const body = payload as Record<string, unknown>
    if (body.values && typeof body.values === 'object' && !Array.isArray(body.values)) {
      await upsertSectionContentMap(sectionKey, body.values as SectionContentMap)
    } else if (body.content && typeof body.content === 'object') {
      await upsertSectionContentPayload(sectionKey, body.content as SectionContentPayload)
    } else {
      const map: SectionContentMap = {}
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') map[key] = value
        else if (value && typeof value === 'object' && 'content_value' in (value as object)) {
          map[key] = String((value as { content_value: string }).content_value)
        }
      }
      if (Object.keys(map).length > 0) {
        await upsertSectionContentMap(sectionKey, map)
      }
    }

    if (body.pageSection && typeof body.pageSection === 'object') {
      const ps = body.pageSection as Partial<PageSection>
      await upsertPageSection({
        section_key: sectionKey,
        ...ps,
      })
    }
  }

  const { error: publishError } = await cms
    .from('content_revisions')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', revisionId)
  await assertNoError(publishError)
}

export async function saveAndPublishSectionContent(
  sectionKey: string,
  entityType: ContentRevisionEntityType,
  values: SectionContentMap,
  pageSection?: Partial<PageSection>,
  createdBy?: string | null,
): Promise<void> {
  await upsertSectionContentMap(sectionKey, values)
  if (pageSection) {
    await upsertPageSection({ section_key: sectionKey, ...pageSection })
  }
  const draft = await saveContentDraft({
    entityType,
    entityKey: sectionKey,
    payload: { values, pageSection: pageSection ?? null } as Json,
    label: `Published ${sectionKey}`,
    createdBy,
  })
  await publishSectionContentDraft(draft.id)
}

// ---------------------------------------------------------------------------
// Skill categories
// ---------------------------------------------------------------------------

export interface SkillCategory {
  id: string
  name: string
  label: string
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export async function fetchSkillCategories(): Promise<SkillCategory[]> {
  const { data, error } = await cms
    .from('skill_categories')
    .select('*')
    .order('display_order')
  await assertNoError(error)
  return (data ?? []) as SkillCategory[]
}

export async function saveSkillCategory(
  input: Partial<SkillCategory> & { name: string; label: string },
): Promise<SkillCategory> {
  if (input.id) {
    const { data, error } = await cms
      .from('skill_categories')
      .update(input)
      .eq('id', input.id)
      .select('*')
      .single()
    await assertNoError(error)
    return data as SkillCategory
  }
  const { data, error } = await cms
    .from('skill_categories')
    .insert(input)
    .select('*')
    .single()
  await assertNoError(error)
  return data as SkillCategory
}

export async function deleteSkillCategory(id: string): Promise<void> {
  const { error } = await cms.from('skill_categories').delete().eq('id', id)
  await assertNoError(error)
}

// ---------------------------------------------------------------------------
// Public CMS bundle (graceful if migration not applied)
// ---------------------------------------------------------------------------

function defaultsMap(rows: { content_key: string; content_value: string }[]) {
  return Object.fromEntries(rows.map((row) => [row.content_key, row.content_value]))
}

function defaultPageSections(): PageSection[] {
  const now = new Date().toISOString()
  return Object.entries(PAGE_SECTION_DEFAULTS).map(([section_key, value], index) => ({
    id: `default-${section_key}`,
    section_key,
    eyebrow: value.eyebrow,
    heading: value.heading,
    subtitle: value.subtitle,
    is_visible: true,
    is_locked: value.is_locked,
    display_order: (index + 1) * 10,
    created_at: now,
    updated_at: now,
  }))
}

function defaultNav(
  location: NavigationItem['location'],
  items: readonly { label: string; destination: string; section_key: string }[],
): NavigationItem[] {
  const now = new Date().toISOString()
  return items.map((item, index) => ({
    id: `default-${location}-${index}`,
    label: item.label,
    destination: item.destination,
    location,
    section_key: item.section_key,
    is_visible: true,
    display_order: (index + 1) * 10,
    created_at: now,
    updated_at: now,
  }))
}

export interface CmsPortfolioBundle {
  sections: Record<string, PageSection>
  content: Record<string, SectionContentMap>
  headerNav: NavigationItem[]
  footerNav: NavigationItem[]
  specializationCards: SpecializationCard[]
  skillCategories: SkillCategory[]
}

export async function fetchCmsPortfolioBundle(): Promise<CmsPortfolioBundle> {
  try {
    const [sections, allContent, headerNav, footerNav, specializationCards, skillCategories] =
      await Promise.all([
        fetchPageSections(),
        cms.from('section_content').select('*').then(({ data, error }) => {
          if (error) throw error
          return (data ?? []) as SectionContentRow[]
        }),
        fetchNavigationItems('header'),
        fetchNavigationItems('footer'),
        fetchSpecializationCards(),
        fetchSkillCategories().catch(() => [] as SkillCategory[]),
      ])

    const sectionMap: Record<string, PageSection> = {}
    for (const section of defaultPageSections()) {
      sectionMap[section.section_key] = section
    }
    for (const section of sections) {
      sectionMap[section.section_key] = section
    }

    const content: Record<string, SectionContentMap> = {
      hero: defaultsMap(HERO_CONTENT_DEFAULTS),
      about: defaultsMap(ABOUT_CONTENT_DEFAULTS),
      contact: defaultsMap(CONTACT_CONTENT_DEFAULTS),
      header: defaultsMap(HEADER_CONTENT_DEFAULTS),
      footer: defaultsMap(FOOTER_CONTENT_DEFAULTS),
      floating_actions: defaultsMap(FLOATING_ACTIONS_DEFAULTS),
      experience: {
        experience_column_heading: 'Professional Experience',
        education_column_heading: 'Education',
        highlights_heading: 'Highlights',
      },
      featured_projects: { featured_limit: '6' },
      hobbies: { show_when_empty: 'false', empty_state_message: '' },
    }

    for (const row of allContent) {
      if (!content[row.section_key]) content[row.section_key] = {}
      content[row.section_key][row.content_key] = row.content_value
    }

    for (const key of Object.keys(content)) {
      content[key] = mergeSectionContent(key, content[key])
    }

    const now = new Date().toISOString()
    const cards =
      specializationCards.length > 0
        ? specializationCards.filter((card) => card.is_visible)
        : DEFAULT_SPECIALIZATION_CARDS.map((card, index) => ({
            id: `default-card-${index}`,
            title: card.title,
            description: card.description,
            icon: card.icon,
            tone: card.tone,
            display_order: (index + 1) * 10,
            is_visible: true,
            created_at: now,
            updated_at: now,
          }))

    return {
      sections: sectionMap,
      content,
      headerNav:
        headerNav.filter((item) => item.is_visible).length > 0
          ? headerNav.filter((item) => item.is_visible)
          : defaultNav('header', DEFAULT_HEADER_NAV),
      footerNav:
        footerNav.filter((item) => item.is_visible).length > 0
          ? footerNav.filter((item) => item.is_visible)
          : defaultNav('footer', DEFAULT_FOOTER_NAV),
      specializationCards: cards,
      skillCategories:
        skillCategories.filter((item) => item.is_visible).length > 0
          ? skillCategories.filter((item) => item.is_visible)
          : DEFAULT_SKILL_FILTERS.filter((item) => item.key !== 'all').map((item, index) => ({
              id: `default-cat-${index}`,
              name: item.key,
              label: item.label,
              display_order: (index + 1) * 10,
              is_visible: true,
              created_at: now,
              updated_at: now,
            })),
    }
  } catch {
    const now = new Date().toISOString()
    return {
      sections: Object.fromEntries(defaultPageSections().map((s) => [s.section_key, s])),
      content: {
        hero: defaultsMap(HERO_CONTENT_DEFAULTS),
        about: defaultsMap(ABOUT_CONTENT_DEFAULTS),
        contact: defaultsMap(CONTACT_CONTENT_DEFAULTS),
        header: defaultsMap(HEADER_CONTENT_DEFAULTS),
        footer: defaultsMap(FOOTER_CONTENT_DEFAULTS),
        floating_actions: defaultsMap(FLOATING_ACTIONS_DEFAULTS),
        experience: {
          experience_column_heading: 'Professional Experience',
          education_column_heading: 'Education',
          highlights_heading: 'Highlights',
        },
        featured_projects: { featured_limit: '6' },
        hobbies: { show_when_empty: 'false', empty_state_message: '' },
      },
      headerNav: defaultNav('header', DEFAULT_HEADER_NAV),
      footerNav: defaultNav('footer', DEFAULT_FOOTER_NAV),
      specializationCards: DEFAULT_SPECIALIZATION_CARDS.map((card, index) => ({
        id: `default-card-${index}`,
        title: card.title,
        description: card.description,
        icon: card.icon,
        tone: card.tone,
        display_order: (index + 1) * 10,
        is_visible: true,
        created_at: now,
        updated_at: now,
      })),
      skillCategories: DEFAULT_SKILL_FILTERS.filter((item) => item.key !== 'all').map(
        (item, index) => ({
          id: `default-cat-${index}`,
          name: item.key,
          label: item.label,
          display_order: (index + 1) * 10,
          is_visible: true,
          created_at: now,
          updated_at: now,
        }),
      ),
    }
  }
}

export function isSectionVisible(
  sections: Record<string, PageSection>,
  key: string,
  lockedAlways = false,
): boolean {
  if (lockedAlways) return true
  const section = sections[key]
  if (!section) return true
  return section.is_visible
}

export function filterNavByVisibleSections(
  items: NavigationItem[],
  sections: Record<string, PageSection>,
): NavigationItem[] {
  return items.filter((item) => {
    if (!item.section_key) return true
    if (item.section_key === 'home' || item.section_key === 'projects' || item.section_key === 'contact') {
      return true
    }
    return isSectionVisible(sections, item.section_key)
  })
}