import type {
  ProjectPlatform,
  ProjectStatus,
  ProjectType,
} from '@/types/database'

export interface ParsedProjectDocument {
  title?: string
  role?: string
  short_description?: string
  full_description?: string
  objectives?: string
  project_type?: ProjectType
  platform?: ProjectPlatform
  status?: ProjectStatus
  start_date?: string
  end_date?: string
  github_url?: string
  live_url?: string
  features?: Array<{ title: string; description: string }>
  contributions?: Array<{ title: string; description: string }>
  technologies?: string[]
}

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractLabeledBlock(text: string, labels: string[]) {
  const labelPattern = labels.map(escapeRegExp).join('|')
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-–]?\\s*([^\\n]+(?:\\n(?!\\s*(?:${labelPattern})\\s*[:\\-–]).*)*)`,
    'i',
  )
  const match = text.match(regex)
  if (!match?.[1]) return undefined
  return match[1].trim().replace(/\n+/g, '\n')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseFlexibleDateToken(token: string): string | undefined {
  const cleaned = token.trim().replace(/,/g, '')
  if (/^\d{4}$/.test(cleaned)) return cleaned

  const isoMonth = cleaned.match(/^(\d{4})[/-](\d{1,2})$/)
  if (isoMonth) {
    const month = isoMonth[2].padStart(2, '0')
    if (Number(month) >= 1 && Number(month) <= 12) {
      return `${isoMonth[1]}-${month}`
    }
  }

  const monthYear = cleaned.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{4})$/i,
  )
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1].toLowerCase().replace(/\.$/, '')]
    if (month) return `${monthYear[2]}-${month}`
  }

  const yearMonthName = cleaned.match(
    /^(\d{4})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?$/i,
  )
  if (yearMonthName) {
    const month = MONTH_MAP[yearMonthName[2].toLowerCase().replace(/\.$/, '')]
    if (month) return `${yearMonthName[1]}-${month}`
  }

  return undefined
}

function parseDateRange(raw: string | undefined): {
  start_date?: string
  end_date?: string
} {
  if (!raw) return {}
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  const range = cleaned.split(/\s*(?:–|-|to|until|through)\s*/i)
  if (range.length >= 2) {
    const start = parseFlexibleDateToken(range[0])
    const endToken = range[1]
    if (/present|ongoing|current/i.test(endToken)) {
      return start ? { start_date: start } : {}
    }
    const end = parseFlexibleDateToken(endToken)
    return {
      ...(start ? { start_date: start } : {}),
      ...(end ? { end_date: end } : {}),
    }
  }
  const single = parseFlexibleDateToken(cleaned)
  return single ? { start_date: single } : {}
}

function parseEnumValue<T extends string>(
  raw: string | undefined,
  options: readonly T[],
): T | undefined {
  if (!raw) return undefined
  const normalized = raw.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === normalized)
}

function parseListItems(raw: string | undefined) {
  if (!raw) return []
  const lines = raw
    .split(/\n|•|●|▪|■|;/)
    .map((line) => line.replace(/^[\s\-*–—\d.)]+/, '').trim())
    .filter((line) => line.length > 1)

  return lines.map((line) => {
    const [title, ...rest] = line.split(/\s*[:\-–]\s*/)
    return {
      title: (title || line).trim(),
      description: rest.join(' - ').trim(),
    }
  })
}

function parseTechnologies(raw: string | undefined) {
  if (!raw) return []
  return raw
    .split(/,|\||\/|\n|•|;/)
    .map((item) => item.replace(/^[\s\-*–—]+/, '').trim())
    .filter((item) => item.length > 1 && item.length < 40)
}

function firstUrl(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[0]) return match[0]
  }
  return undefined
}

export function parseProjectDocumentText(rawText: string): ParsedProjectDocument {
  const text = normalizeText(rawText)
  if (!text) return {}

  const title =
    extractLabeledBlock(text, [
      'Project Title',
      'Title',
      'Project Name',
      'System Name',
      'System Title',
      'Application Name',
      'Product Name',
      'Capstone Title',
    ]) || text.split('\n').find((line) => line.trim().length > 3)?.trim()

  const role = extractLabeledBlock(text, [
    'Role',
    'Position',
    'Your Role',
    'Project Role',
    'Individual Role',
    'Developer Role',
    'Team Role',
  ])

  const short_description = extractLabeledBlock(text, [
    'Short Description',
    'Abstract',
    'Project Summary',
    'Summary',
    'Overview',
    'Project Overview',
    'System Overview',
    'Rationale',
  ])

  const scopeBlock = extractLabeledBlock(text, [
    'Scope',
    'Scope and Limitations',
    'Scope of the Project',
    'Project Scope',
    'System Coverage',
    'System Boundaries',
    'Project Coverage',
    'Limitations',
    'Delimitations',
  ])

  const full_description =
    extractLabeledBlock(text, [
      'Full Description',
      'Description',
      'Project Description',
      'System Description',
      'Project Background',
      'Background of the Study',
      'About the Project',
      'Introduction',
      'General Description',
      'System Flow',
      'System Workflow',
      'Workflow',
      'Process Flow',
      'Process Description',
    ]) ||
    [short_description, scopeBlock].filter(Boolean).join('\n\n') ||
    short_description

  const objectives = extractLabeledBlock(text, [
    'Objectives',
    'General Objectives',
    'Specific Objectives',
    'Research Objectives',
    'Project Objectives',
    'Project Goals',
    'Goals',
    'Aims',
    'Purpose',
    'Expected Outcomes',
  ])

  const typeRaw = extractLabeledBlock(text, [
    'Project Type',
    'Type',
    'Category',
  ])
  const platformRaw = extractLabeledBlock(text, [
    'Platform',
    'Target Platform',
    'Platforms',
    'Infrastructure',
  ])
  const statusRaw = extractLabeledBlock(text, ['Status', 'Project Status'])

  const timelineRaw =
    extractLabeledBlock(text, [
      'Project Timeline',
      'Development Schedule',
      'Implementation Period',
      'Project Duration',
      'Timeline',
      'Duration',
      'Date',
      'Dates',
      'Period',
    ]) ||
    extractLabeledBlock(text, ['Start Date', 'Started', 'Start'])

  const endOnly = extractLabeledBlock(text, [
    'End Date',
    'Completed',
    'Completion Date',
    'Finished',
  ])

  const dates = parseDateRange(timelineRaw)
  if (!dates.end_date && endOnly) {
    const end = parseFlexibleDateToken(endOnly)
    if (end) dates.end_date = end
  }

  const features = parseListItems(
    extractLabeledBlock(text, [
      'Features',
      'Key Features',
      'System Features',
      'Functionalities',
      'System Functionalities',
      'Key Functionalities',
      'Functions',
      'Modules',
      'System Modules',
      'Capabilities',
      'Services',
      'User Functions',
      'Admin Functions',
    ]),
  )

  const contributions = parseListItems(
    extractLabeledBlock(text, [
      'Individual Contributions',
      'My Contributions',
      'Personal Contributions',
      'Developer Responsibilities',
      'Contributions',
      'Contribution',
    ]),
  )

  const technologies = parseTechnologies(
    extractLabeledBlock(text, [
      'Tools and Technologies',
      'Technologies Used',
      'Technology Stack',
      'Tech Stack',
      'Technologies',
      'Development Tools',
      'Programming Languages',
      'Frameworks',
      'Libraries',
      'Database',
      'APIs',
      'Third-Party Services',
      'Software Requirements',
      'Software',
      'Tools',
      'Stack',
      'Platforms',
    ]),
  )

  const github_url = firstUrl(text, [
    /https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i,
  ])
  const live_url = firstUrl(text, [
    /https?:\/\/(?:www\.)?(?!github\.com)[^\s)]+/i,
  ])

  const project_type = parseEnumValue(typeRaw, [
    'Individual',
    'Group',
    'Capstone',
    'Academic',
  ] as const)
  const platform = parseEnumValue(platformRaw, [
    'Web',
    'Mobile',
    'Web and Mobile',
  ] as const)
  const status = parseEnumValue(statusRaw, [
    'Ongoing',
    'Completed',
    'Archived',
  ] as const)

  return {
    ...(title ? { title: title.split('\n')[0].trim().slice(0, 160) } : {}),
    ...(role ? { role: role.split('\n')[0].trim().slice(0, 120) } : {}),
    ...(short_description
      ? { short_description: short_description.slice(0, 400) }
      : {}),
    ...(full_description ? { full_description } : {}),
    ...(objectives ? { objectives } : {}),
    ...(project_type ? { project_type } : {}),
    ...(platform ? { platform } : {}),
    ...(status ? { status } : {}),
    ...dates,
    ...(github_url ? { github_url } : {}),
    ...(live_url && live_url !== github_url ? { live_url } : {}),
    ...(features.length ? { features } : {}),
    ...(contributions.length ? { contributions } : {}),
    ...(technologies.length ? { technologies } : {}),
  }
}
