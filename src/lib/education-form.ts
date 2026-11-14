import type { EducationLevel } from '@/types/database'

export type EducationLevelKind =
  | 'basic'
  | 'senior-high'
  | 'vocational'
  | 'higher'
  | 'flexible'

export function getEducationLevelKind(
  slug: string | null | undefined,
): EducationLevelKind {
  switch (slug) {
    case 'elementary':
    case 'junior-high':
      return 'basic'
    case 'senior-high':
      return 'senior-high'
    case 'vocational':
      return 'vocational'
    case 'associate':
    case 'bachelors':
    case 'masters':
    case 'doctoral':
    case 'postgrad-diploma':
    case 'postdoctoral':
      return 'higher'
    default:
      return 'flexible'
  }
}

export function resolveLevelSlug(
  levelId: string | null,
  levels: EducationLevel[],
  otherId = '__other__',
) {
  if (!levelId || levelId === otherId) return null
  return levels.find((level) => level.id === levelId)?.slug ?? null
}

export function educationFieldVisibility(kind: EducationLevelKind) {
  return {
    showDegree: kind === 'higher' || kind === 'flexible' || kind === 'vocational',
    showSpecialization:
      kind === 'higher' || kind === 'flexible' || kind === 'vocational',
    showTrackStrand: kind === 'senior-high',
    degreeLabel:
      kind === 'vocational'
        ? 'Qualification / Program Name'
        : 'Degree / Qualification',
    institutionLabel:
      kind === 'vocational'
        ? 'Training Provider'
        : kind === 'basic' || kind === 'senior-high'
          ? 'School Name'
          : 'Institution Name',
    addressLabel:
      kind === 'vocational'
        ? 'School / Training Center Address'
        : 'School Address',
    specializationLabel:
      kind === 'vocational' ? 'Specialization (optional)' : 'Specialization / Major',
    showCurrentlyStudying: kind !== 'basic',
    showExpectedWhenStudying: kind !== 'basic',
  }
}
