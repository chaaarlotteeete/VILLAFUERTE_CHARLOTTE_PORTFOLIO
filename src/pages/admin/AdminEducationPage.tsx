import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { FileUploadField } from '@/components/admin/FileUploadField'
import { MonthYearPicker } from '@/components/admin/MonthYearPicker'
import { SearchableCombobox } from '@/components/admin/SearchableCombobox'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  educationFieldVisibility,
  getEducationLevelKind,
  resolveLevelSlug,
} from '@/lib/education-form'
import {
  deleteEducation,
  fetchAdminEducation,
  saveEducation,
} from '@/services/adminContent'
import {
  fetchAdminAwards,
  fetchEducationAwardIds,
  setEducationAwards,
} from '@/services/adminAwards'
import {
  createDegreeOption,
  fetchDegreeOptions,
  fetchEducationLevels,
  fetchEducationStrands,
  fetchEducationTracks,
} from '@/services/catalogs'
import type {
  Award,
  DegreeOption,
  Education,
  EducationLevel,
  EducationStatus,
  EducationStrand,
  EducationTrack,
} from '@/types/database'
import {
  compareFlexibleDateValues,
  formatDateRange,
  fromFlexibleDateValue,
  toFlexibleDateValue,
} from '@/utils/date'

const OTHER_ID = '__other__'

const STATUS_OPTIONS: { value: EducationStatus; label: string }[] = [
  { value: 'currently_studying', label: 'Currently studying' },
  { value: 'completed', label: 'Completed' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'discontinued', label: 'Discontinued' },
  { value: 'on_hold', label: 'On hold' },
]

type EducationFormState = {
  education_level_id: string | null
  custom_education_level: string
  degree_option_id: string | null
  custom_degree: string
  track_id: string | null
  strand_id: string | null
  custom_track: string
  custom_strand: string
  institution: string
  school_address: string
  city: string
  province: string
  country: string
  school_logo_url: string
  specialization: string
  description: string
  academic_highlights: string
  status: EducationStatus
  is_current: boolean
  start_date: string
  end_date: string
  expected_graduation: string
  is_visible: boolean
  selectedAwardIds: string[]
}

const emptyForm: EducationFormState = {
  education_level_id: null,
  custom_education_level: '',
  degree_option_id: null,
  custom_degree: '',
  track_id: null,
  strand_id: null,
  custom_track: '',
  custom_strand: '',
  institution: '',
  school_address: '',
  city: '',
  province: '',
  country: '',
  school_logo_url: '',
  specialization: '',
  description: '',
  academic_highlights: '',
  status: 'completed',
  is_current: false,
  start_date: '',
  end_date: '',
  expected_graduation: '',
  is_visible: true,
  selectedAwardIds: [],
}

function isOtherEducationLevel(
  levelId: string | null,
  levels: EducationLevel[],
) {
  if (!levelId) return false
  if (levelId === OTHER_ID) return true
  const level = levels.find((item) => item.id === levelId)
  if (!level) return false
  return (
    level.slug === 'other' || level.name.trim().toLowerCase() === 'other'
  )
}

function isOtherDegreeOption(
  optionId: string | null,
  options: DegreeOption[],
) {
  if (!optionId) return false
  if (optionId === OTHER_ID) return true
  const option = options.find((item) => item.id === optionId)
  if (!option) return false
  return (
    option.slug === 'other' || option.name.trim().toLowerCase() === 'other'
  )
}

function isOtherCatalogOption(
  optionId: string | null,
  options: Array<{ id: string; slug: string; name: string }>,
) {
  if (!optionId) return false
  if (optionId === OTHER_ID) return true
  const option = options.find((item) => item.id === optionId)
  if (!option) return false
  return (
    option.slug === 'other' ||
    option.slug.endsWith('-other') ||
    option.slug === 'other-strand' ||
    option.name.trim().toLowerCase() === 'other'
  )
}

function statusLabel(status: EducationStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

function educationToForm(
  item: Education,
  degreeOptions: DegreeOption[],
  awardIds: string[],
): EducationFormState {
  let educationLevelId = item.education_level_id ?? null
  if (!educationLevelId && item.custom_education_level) {
    educationLevelId = OTHER_ID
  }

  let degreeOptionId = item.degree_option_id ?? null
  let customDegree = ''
  if (degreeOptionId) {
    const linked = degreeOptions.find((opt) => opt.id === degreeOptionId)
    if (
      linked &&
      (linked.slug === 'other' || linked.name.trim().toLowerCase() === 'other')
    ) {
      customDegree = item.degree
    }
  } else if (item.degree.trim()) {
    const match = degreeOptions.find((opt) => opt.name === item.degree)
    if (match) {
      degreeOptionId = match.id
      if (
        match.slug === 'other' ||
        match.name.trim().toLowerCase() === 'other'
      ) {
        customDegree = item.degree
      }
    } else {
      // Free-text qualification / basic level title — keep as custom for vocational/flexible.
      degreeOptionId = null
      customDegree = item.degree
    }
  }

  const status =
    item.status ?? (item.is_current ? 'currently_studying' : 'completed')

  return {
    education_level_id: educationLevelId,
    custom_education_level: item.custom_education_level ?? '',
    degree_option_id: degreeOptionId,
    custom_degree: customDegree,
    track_id: item.track_id ?? null,
    strand_id: item.strand_id ?? null,
    custom_track: item.custom_track ?? '',
    custom_strand: item.custom_strand ?? '',
    institution: item.institution,
    school_address: item.school_address ?? '',
    city: item.city ?? '',
    province: item.province ?? '',
    country: item.country ?? '',
    school_logo_url: item.school_logo_url ?? '',
    specialization: item.specialization ?? '',
    description: item.description ?? '',
    academic_highlights: item.academic_highlights ?? '',
    status,
    is_current: item.is_current || status === 'currently_studying',
    start_date: toFlexibleDateValue(
      item.start_date,
      item.start_date_precision,
    ),
    end_date: toFlexibleDateValue(item.end_date, item.end_date_precision),
    expected_graduation: toFlexibleDateValue(
      item.expected_graduation,
      item.expected_graduation_precision,
    ),
    is_visible: item.is_visible,
    selectedAwardIds: awardIds,
  }
}

export function AdminEducationPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminEducation)
  const [levels, setLevels] = useState<EducationLevel[]>([])
  const [tracks, setTracks] = useState<EducationTrack[]>([])
  const [strands, setStrands] = useState<EducationStrand[]>([])
  const [degreeOptions, setDegreeOptions] = useState<DegreeOption[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [catalogsLoading, setCatalogsLoading] = useState(true)

  const [form, setForm] = useState<EducationFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [levelRows, trackRows, awardRows] = await Promise.all([
          fetchEducationLevels(),
          fetchEducationTracks(),
          fetchAdminAwards(),
        ])
        if (cancelled) return
        setLevels(levelRows)
        setTracks(trackRows)
        setAwards(awardRows)
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load catalogs',
          )
        }
      } finally {
        if (!cancelled) setCatalogsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const levelSlug = useMemo(
    () => resolveLevelSlug(form.education_level_id, levels, OTHER_ID),
    [form.education_level_id, levels],
  )
  const levelKind = getEducationLevelKind(
    form.education_level_id === OTHER_ID ? 'other' : levelSlug,
  )
  const fields = educationFieldVisibility(levelKind)
  const showCustomLevel = isOtherEducationLevel(form.education_level_id, levels)
  const isStudying =
    form.status === 'currently_studying' || form.is_current
  const showOtherTrack = isOtherCatalogOption(form.track_id, tracks)
  const showOtherStrand = isOtherCatalogOption(form.strand_id, strands)

  const activeLevelId = useMemo(() => {
    if (!form.education_level_id || form.education_level_id === OTHER_ID)
      return null
    if (isOtherEducationLevel(form.education_level_id, levels)) {
      return form.education_level_id
    }
    return form.education_level_id
  }, [form.education_level_id, levels])

  useEffect(() => {
    let cancelled = false
    if (!fields.showDegree || !activeLevelId) {
      setDegreeOptions([])
      return
    }
    void fetchDegreeOptions(activeLevelId)
      .then((rows) => {
        if (!cancelled) setDegreeOptions(rows)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load degrees',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeLevelId, fields.showDegree])

  useEffect(() => {
    let cancelled = false
    if (!fields.showTrackStrand || !form.track_id || form.track_id === OTHER_ID) {
      setStrands([])
      return
    }
    void fetchEducationStrands(form.track_id)
      .then((rows) => {
        if (!cancelled) setStrands(rows)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load strands',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [form.track_id, fields.showTrackStrand])

  const levelComboboxOptions = useMemo(
    () =>
      levels.map((level) => ({
        id: level.id,
        label: level.name,
        keywords: level.slug,
      })),
    [levels],
  )

  const degreeComboboxOptions = useMemo(
    () =>
      degreeOptions.map((option) => ({
        id: option.id,
        label: option.name,
        keywords: option.slug,
      })),
    [degreeOptions],
  )

  const trackComboboxOptions = useMemo(
    () =>
      tracks
        .filter((track) => track.slug !== 'other')
        .map((track) => ({
          id: track.id,
          label: track.name,
          keywords: track.slug,
        })),
    [tracks],
  )

  const strandComboboxOptions = useMemo(
    () =>
      strands
        .filter((strand) => strand.is_visible !== false)
        .map((strand) => ({
          id: strand.id,
          label: strand.name,
          keywords: strand.slug,
        })),
    [strands],
  )

  function reset() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  async function openEdit(item: Education) {
    try {
      const levelId = item.education_level_id
      let degrees: DegreeOption[] = []
      if (levelId) {
        degrees = await fetchDegreeOptions(levelId)
        setDegreeOptions(degrees)
      }
      if (item.track_id) {
        try {
          const strandRows = await fetchEducationStrands(item.track_id)
          setStrands(strandRows)
        } catch {
          setStrands([])
        }
      }
      let awardIds: string[] = []
      try {
        awardIds = await fetchEducationAwardIds(item.id)
      } catch {
        awardIds = []
      }
      setForm(educationToForm(item, degrees, awardIds))
      setEditingId(item.id)
      setShowForm(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load entry')
    }
  }

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education"
        description="Manage educational institutions, degrees, tracks, and linked awards."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyForm)
              setShowForm(true)
            }}
          >
            Add Education
          </Button>
        }
      />

      {showForm || editingId ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.education_level_id) {
                toast.error('Education level is required')
                return
              }
              if (!form.institution.trim()) {
                toast.error(`${fields.institutionLabel} is required`)
                return
              }

              const selectedLevel = levels.find(
                (level) => level.id === form.education_level_id,
              )
              const kind = getEducationLevelKind(
                form.education_level_id === OTHER_ID
                  ? 'other'
                  : selectedLevel?.slug,
              )
              const visibility = educationFieldVisibility(kind)

              let degreeText = ''
              let degreeOptionId: string | null = null
              let specialization: string | null = null
              let trackId: string | null = null
              let strandId: string | null = null
              let customTrack: string | null = null
              let customStrand: string | null = null

              if (kind === 'basic') {
                degreeText =
                  selectedLevel?.name ||
                  form.custom_education_level.trim() ||
                  'Education'
                degreeOptionId = null
                specialization = null
              } else if (kind === 'senior-high') {
                if (!form.track_id && !form.custom_track.trim()) {
                  toast.error('Track is required for Senior High School')
                  return
                }
                const trackOther = isOtherCatalogOption(form.track_id, tracks)
                if (trackOther || form.track_id === OTHER_ID) {
                  if (!form.custom_track.trim()) {
                    toast.error('Enter a custom track')
                    return
                  }
                  customTrack = form.custom_track.trim()
                  trackId = tracks.find((t) => t.slug === 'other')?.id ?? null
                } else {
                  trackId = form.track_id
                }

                const strandOther = isOtherCatalogOption(
                  form.strand_id,
                  strands,
                )
                if (strandOther || form.strand_id === OTHER_ID) {
                  if (!form.custom_strand.trim()) {
                    toast.error('Enter a custom strand')
                    return
                  }
                  customStrand = form.custom_strand.trim()
                  strandId = null
                } else if (form.strand_id) {
                  strandId = form.strand_id
                } else {
                  toast.error('Strand is required for Senior High School')
                  return
                }

                const trackName =
                  customTrack ||
                  tracks.find((t) => t.id === trackId)?.name ||
                  ''
                const strandName =
                  customStrand ||
                  strands.find((s) => s.id === strandId)?.name ||
                  ''
                // Store strand as primary title to avoid Degree=STEM + Strand=STEM duplication.
                degreeText = strandName || trackName || 'Senior High School'
                degreeOptionId = null
                specialization = null
              } else if (visibility.showDegree) {
                const usingOtherDegree = isOtherDegreeOption(
                  form.degree_option_id,
                  degreeOptions,
                )

                if (kind === 'vocational') {
                  if (!form.custom_degree.trim()) {
                    toast.error('Qualification / Program Name is required')
                    return
                  }
                  degreeText = form.custom_degree.trim()
                  degreeOptionId = null
                } else if (form.degree_option_id && !usingOtherDegree) {
                  const option = degreeOptions.find(
                    (row) => row.id === form.degree_option_id,
                  )
                  degreeText = option?.name.trim() ?? ''
                  degreeOptionId = form.degree_option_id
                } else if (usingOtherDegree) {
                  const custom = form.custom_degree.trim()
                  if (!custom) {
                    toast.error('Enter a custom degree or qualification')
                    return
                  }
                  degreeText = custom
                  if (activeLevelId) {
                    try {
                      const existing = degreeOptions.find(
                        (row) =>
                          row.name.trim().toLowerCase() ===
                            custom.toLowerCase() && row.slug !== 'other',
                      )
                      if (existing) {
                        degreeOptionId = existing.id
                        degreeText = existing.name
                      } else {
                        const created = await createDegreeOption(
                          activeLevelId,
                          custom,
                        )
                        degreeOptionId = created.id
                        degreeText = created.name
                      }
                    } catch {
                      degreeOptionId = null
                    }
                  }
                } else if (form.custom_degree.trim()) {
                  degreeText = form.custom_degree.trim()
                } else {
                  toast.error('Degree or qualification is required')
                  return
                }

                if (!degreeText.trim()) {
                  toast.error(
                    kind === 'vocational'
                      ? 'Qualification / Program Name is required'
                      : 'Degree or qualification is required',
                  )
                  return
                }

                specialization = visibility.showSpecialization
                  ? form.specialization.trim() || null
                  : null
              }

              const status: EducationStatus = form.is_current
                ? 'currently_studying'
                : form.status
              const studying = status === 'currently_studying'

              const startParsed = fromFlexibleDateValue(form.start_date)
              const endParsed = fromFlexibleDateValue(form.end_date)
              const expectedParsed = fromFlexibleDateValue(
                form.expected_graduation,
              )

              if (form.start_date.trim() && !startParsed.date) {
                toast.error('Enter a valid start year (YYYY) or month (MM/YYYY)')
                return
              }
              if (form.end_date.trim() && !endParsed.date) {
                toast.error('Enter a valid end year (YYYY) or month (MM/YYYY)')
                return
              }
              if (form.expected_graduation.trim() && !expectedParsed.date) {
                toast.error(
                  'Enter a valid expected graduation year (YYYY) or month (MM/YYYY)',
                )
                return
              }

              if (
                !studying &&
                form.start_date.trim().length >= 4 &&
                form.end_date.trim().length >= 4 &&
                compareFlexibleDateValues(form.start_date, form.end_date) > 0
              ) {
                toast.error('Start date must be on or before end date')
                return
              }

              if (
                visibility.showExpectedWhenStudying &&
                form.start_date.trim().length >= 4 &&
                form.expected_graduation.trim().length >= 4 &&
                compareFlexibleDateValues(
                  form.start_date,
                  form.expected_graduation,
                ) > 0
              ) {
                toast.error(
                  'Expected graduation must be on or after start date',
                )
                return
              }

              if (status === 'completed' && !studying && !endParsed.date) {
                toast.error('End date is required when status is completed')
                return
              }

              let educationLevelId: string | null = null
              let customEducationLevel: string | null = null

              if (form.education_level_id === OTHER_ID) {
                customEducationLevel =
                  form.custom_education_level.trim() || null
                if (!customEducationLevel) {
                  toast.error('Custom education level is required')
                  return
                }
              } else if (form.education_level_id) {
                educationLevelId = form.education_level_id
                if (showCustomLevel) {
                  customEducationLevel =
                    form.custom_education_level.trim() || null
                }
              }

              try {
                const saved = await saveEducation({
                  id: editingId ?? undefined,
                  degree: degreeText.trim(),
                  institution: form.institution.trim(),
                  specialization,
                  start_date: startParsed.date,
                  end_date: studying ? null : endParsed.date,
                  expected_graduation:
                    studying && visibility.showExpectedWhenStudying
                      ? expectedParsed.date
                      : null,
                  start_date_precision: startParsed.precision ?? 'month',
                  end_date_precision: studying
                    ? 'month'
                    : (endParsed.precision ?? 'month'),
                  expected_graduation_precision:
                    studying && visibility.showExpectedWhenStudying
                      ? (expectedParsed.precision ?? 'month')
                      : 'month',
                  is_current: studying,
                  status,
                  is_visible: form.is_visible,
                  description: form.description.trim() || null,
                  academic_highlights: form.academic_highlights.trim() || null,
                  education_level_id: educationLevelId,
                  custom_education_level: customEducationLevel,
                  degree_option_id: degreeOptionId,
                  school_address: form.school_address.trim() || null,
                  city: form.city.trim() || null,
                  province: form.province.trim() || null,
                  country: form.country.trim() || null,
                  school_logo_url: form.school_logo_url.trim() || null,
                  track_id: kind === 'senior-high' ? trackId : null,
                  strand_id: kind === 'senior-high' ? strandId : null,
                  custom_track: kind === 'senior-high' ? customTrack : null,
                  custom_strand: kind === 'senior-high' ? customStrand : null,
                  display_order: editingId
                    ? (items.find((item) => item.id === editingId)
                        ?.display_order ?? items.length)
                    : items.length,
                })

                try {
                  await setEducationAwards(saved.id, form.selectedAwardIds)
                } catch (awardErr) {
                  toast.error(
                    awardErr instanceof Error
                      ? `Saved education, but linking awards failed: ${awardErr.message}`
                      : 'Saved education, but linking awards failed',
                  )
                  reset()
                  reload()
                  return
                }

                toast.success(
                  editingId ? 'Education updated' : 'Education added',
                )
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Education' : 'Add Education'}
          </h2>

          {catalogsLoading ? (
            <p className="text-sm text-muted-foreground">Loading catalogs…</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <SearchableCombobox
              label="Education Level"
              value={form.education_level_id}
              options={levelComboboxOptions}
              required
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  education_level_id: value,
                  custom_education_level:
                    value === OTHER_ID ||
                    isOtherEducationLevel(value, levels)
                      ? current.custom_education_level
                      : '',
                  degree_option_id: null,
                  custom_degree: '',
                  track_id: null,
                  strand_id: null,
                  custom_track: '',
                  custom_strand: '',
                  specialization: '',
                }))
                setDegreeOptions([])
                setStrands([])
              }}
            />

            {showCustomLevel ? (
              <div className="space-y-2">
                <Label>Custom education level</Label>
                <Input
                  value={form.custom_education_level}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      custom_education_level: event.target.value,
                    })
                  }
                  placeholder="Describe the education level"
                  required
                />
              </div>
            ) : null}

            {fields.showTrackStrand ? (
              <>
                <SearchableCombobox
                  label="Track"
                  value={form.track_id}
                  options={trackComboboxOptions}
                  allowOther
                  onChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      track_id: value,
                      strand_id: null,
                      custom_strand: '',
                      custom_track: isOtherCatalogOption(value, tracks)
                        ? current.custom_track
                        : '',
                    }))
                  }}
                />
                {showOtherTrack ? (
                  <div className="space-y-2">
                    <Label>Custom track</Label>
                    <Input
                      value={form.custom_track}
                      onChange={(event) =>
                        setForm({ ...form, custom_track: event.target.value })
                      }
                      placeholder="Enter track"
                      required
                    />
                  </div>
                ) : null}
                {showOtherTrack ? (
                  <div className="space-y-2">
                    <Label>Custom strand</Label>
                    <Input
                      value={form.custom_strand}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          custom_strand: event.target.value,
                          strand_id: OTHER_ID,
                        })
                      }
                      placeholder="Enter strand"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <SearchableCombobox
                      label="Strand"
                      value={form.strand_id}
                      options={strandComboboxOptions}
                      allowOther
                      disabled={!form.track_id}
                      onChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          strand_id: value,
                          custom_strand: isOtherCatalogOption(value, strands)
                            ? current.custom_strand
                            : '',
                        }))
                      }}
                    />
                    {showOtherStrand ? (
                      <div className="space-y-2">
                        <Label>Custom strand</Label>
                        <Input
                          value={form.custom_strand}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              custom_strand: event.target.value,
                            })
                          }
                          placeholder="Enter strand"
                          required
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {fields.showDegree ? (
              <>
                {levelKind === 'vocational' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      {fields.degreeLabel}
                      <span className="text-destructive" aria-hidden>
                        {' '}
                        *
                      </span>
                    </Label>
                    <Input
                      required
                      value={form.custom_degree}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          custom_degree: event.target.value,
                          degree_option_id: null,
                        })
                      }
                      placeholder="e.g. Computer Systems Servicing NC II"
                    />
                  </div>
                ) : (
                  <>
                    <SearchableCombobox
                      label={fields.degreeLabel}
                      value={form.degree_option_id}
                      options={degreeComboboxOptions}
                      allowOther
                      onChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          degree_option_id: value,
                          custom_degree: isOtherDegreeOption(
                            value,
                            degreeOptions,
                          )
                            ? current.custom_degree
                            : '',
                        }))
                      }}
                    />
                    {isOtherDegreeOption(
                      form.degree_option_id,
                      degreeOptions,
                    ) ? (
                      <div className="space-y-2">
                        <Label>Custom {fields.degreeLabel.toLowerCase()}</Label>
                        <Input
                          value={form.custom_degree}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              custom_degree: event.target.value,
                            })
                          }
                          placeholder="Enter degree or qualification"
                          required
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {fields.showSpecialization ? (
              <div className="space-y-2 md:col-span-2">
                <Label>{fields.specializationLabel}</Label>
                <Input
                  value={form.specialization}
                  onChange={(event) =>
                    setForm({ ...form, specialization: event.target.value })
                  }
                />
              </div>
            ) : null}

            <div className="space-y-2 md:col-span-2">
              <Label>
                {fields.institutionLabel}
                <span className="text-destructive" aria-hidden>
                  {' '}
                  *
                </span>
              </Label>
              <Input
                required
                value={form.institution}
                onChange={(event) =>
                  setForm({ ...form, institution: event.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{fields.addressLabel}</Label>
              <Input
                value={form.school_address}
                onChange={(event) =>
                  setForm({ ...form, school_address: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(event) =>
                  setForm({ ...form, city: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Province</Label>
              <Input
                value={form.province}
                onChange={(event) =>
                  setForm({ ...form, province: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(event) =>
                  setForm({ ...form, country: event.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <FileUploadField
                label="School logo"
                value={form.school_logo_url || null}
                folder="school-logos"
                accept="image/jpeg,image/png,image/webp"
                onUploaded={(url) =>
                  setForm({ ...form, school_logo_url: url })
                }
                onClear={() => setForm({ ...form, school_logo_url: '' })}
              />
            </div>

            <div className="space-y-2">
              <Label>Education Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  const next = value as EducationStatus
                  setForm((current) => ({
                    ...current,
                    status: next,
                    is_current: next === 'currently_studying',
                    end_date:
                      next === 'currently_studying' ? '' : current.end_date,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fields.showCurrentlyStudying ? (
              <label className="flex items-center gap-3 self-end text-sm">
                <Switch
                  checked={form.is_current}
                  onCheckedChange={(checked) => {
                    setForm((current) => ({
                      ...current,
                      is_current: checked,
                      status: checked ? 'currently_studying' : current.status,
                      end_date: checked ? '' : current.end_date,
                    }))
                  }}
                />
                Currently studying
              </label>
            ) : (
              <div />
            )}

            <MonthYearPicker
              label="Start date"
              allowYearOnly
              value={form.start_date}
              onChange={(value) => setForm({ ...form, start_date: value })}
            />

            {isStudying && fields.showExpectedWhenStudying ? (
              <MonthYearPicker
                label="Expected graduation"
                allowYearOnly
                value={form.expected_graduation}
                onChange={(value) =>
                  setForm({ ...form, expected_graduation: value })
                }
              />
            ) : (
              <MonthYearPicker
                label="End date"
                allowYearOnly
                value={form.end_date}
                required={form.status === 'completed'}
                onChange={(value) => setForm({ ...form, end_date: value })}
              />
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Academic highlights</Label>
              <Textarea
                value={form.academic_highlights}
                onChange={(event) =>
                  setForm({ ...form, academic_highlights: event.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <Switch
                checked={form.is_visible}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_visible: checked })
                }
              />
              Visible on public site
            </label>

            <div className="space-y-3 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-base">Linked awards</Label>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/admin/awards">Add Award</Link>
                </Button>
              </div>
              {awards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No awards yet. Create awards to link them here.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {awards.map((award) => {
                    const checked = form.selectedAwardIds.includes(award.id)
                    return (
                      <label
                        key={award.id}
                        className="flex cursor-pointer items-start gap-3 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            setForm((current) => {
                              const ids = new Set(current.selectedAwardIds)
                              if (value) ids.add(award.id)
                              else ids.delete(award.id)
                              return {
                                ...current,
                                selectedAwardIds: [...ids],
                              }
                            })
                          }}
                        />
                        <span>
                          <span className="font-medium">{award.title}</span>
                          {award.issuer ? (
                            <span className="text-muted-foreground">
                              {' '}
                              · {award.issuer}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? 'Update' : 'Save Education'}
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No education entries yet"
          description="Add schools, degrees, and academic timelines."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const studying =
              item.is_current || item.status === 'currently_studying'
            const levelName =
              levels.find((level) => level.id === item.education_level_id)
                ?.name || item.custom_education_level
            return (
              <div key={item.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.institution}</h3>
                      <Badge variant="outline">{statusLabel(item.status)}</Badge>
                      {studying ? <Badge>Current</Badge> : null}
                      {!item.is_visible ? (
                        <Badge variant="secondary">Hidden</Badge>
                      ) : (
                        <Badge variant="success">Visible</Badge>
                      )}
                    </div>
                    {levelName ? (
                      <p className="text-xs text-muted-foreground">{levelName}</p>
                    ) : null}
                    <p className="text-sm font-medium">{item.degree}</p>
                    {item.specialization ? (
                      <p className="text-sm text-muted-foreground">
                        {item.specialization}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(
                        item.start_date,
                        item.end_date,
                        studying,
                        item.start_date_precision,
                        item.end_date_precision,
                      )}
                    </p>
                    {item.description ? (
                      <p className="mt-2 text-sm">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void openEdit(item)}
                    >
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      onConfirm={async () => {
                        await deleteEducation(item.id)
                        toast.success('Deleted')
                        reload()
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
