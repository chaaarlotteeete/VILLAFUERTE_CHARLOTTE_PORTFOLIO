import { supabase } from '@/lib/supabase'
import type { Skill } from '@/types/database'

export async function fetchSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as Skill[]).filter((skill) => skill.is_visible !== false)
}

export function groupSkillsByCategory(skills: Skill[]) {
  const groups = new Map<string, Skill[]>()

  for (const skill of skills) {
    const current = groups.get(skill.category) ?? []
    current.push(skill)
    groups.set(skill.category, current)
  }

  return [...groups.entries()].map(([category, items]) => ({
    category,
    items,
  }))
}
