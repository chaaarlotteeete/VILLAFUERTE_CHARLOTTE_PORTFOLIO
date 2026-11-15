export type SectionTargetKey =
  | 'title'
  | 'role'
  | 'short_description'
  | 'full_description'
  | 'objectives'
  | 'features'
  | 'scope'
  | 'technologies'
  | 'platform'
  | 'timeline'
  | 'contributions'
  | 'status'
  | 'project_type'

export interface SectionTarget {
  key: SectionTargetKey
  labels: string[]
  /** Extra loose terms used for page relevance scoring (not only headings). */
  contextTerms?: string[]
}

export interface PageText {
  page: number
  text: string
}

export interface TargetedSegment {
  key: SectionTargetKey
  heading: string | null
  page: number
  end_page: number
  text: string
  match_type: 'heading' | 'keyword' | 'context'
}

/** Skip bibliography / appendix style pages when scoring relevance. */
const IRRELEVANT_PAGE =
  /\b(references?|bibliography|works cited|literature review|related studies?|appendix|acknowledg(?:e)?ments?|curriculum vitae|resume)\b/i

export const SECTION_TARGETS: SectionTarget[] = [
  {
    key: 'title',
    labels: [
      'Project Title',
      'Title',
      'Project Name',
      'System Name',
      'System Title',
      'Application Name',
      'Product Name',
      'Capstone Title',
    ],
  },
  {
    key: 'short_description',
    labels: [
      'Abstract',
      'Project Overview',
      'Introduction',
      'Project Summary',
      'Summary',
      'Overview',
      'Rationale',
      'Short Description',
    ],
  },
  {
    key: 'full_description',
    labels: [
      'Project Overview',
      'System Description',
      'Project Description',
      'Background',
      'Project Background',
      'Background of the Study',
      'General Description',
      'About the Project',
      'Full Description',
      'Process Description',
      'System Workflow',
      'Workflow',
    ],
  },
  {
    key: 'objectives',
    labels: [
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
    ],
  },
  {
    key: 'features',
    labels: [
      'Features',
      'Functionalities',
      'System Functions',
      'System Functionalities',
      'System Features',
      'Modules',
      'System Modules',
      'Capabilities',
      'Key Features',
      'User Functions',
      'Admin Functions',
    ],
  },
  {
    key: 'scope',
    labels: [
      'Scope',
      'Scope and Limitations',
      'Project Scope',
      'Scope of the Project',
      'Project Coverage',
      'System Coverage',
      'System Boundaries',
      'Limitations',
      'Delimitations',
    ],
  },
  {
    key: 'technologies',
    labels: [
      'Tools and Technologies',
      'Technology Stack',
      'Tech Stack',
      'Technologies Used',
      'Technologies',
      'Software',
      'Software Requirements',
      'Development Tools',
      'Programming Languages',
      'Frameworks',
      'Libraries',
      'Database',
      'APIs',
      'Third-Party Services',
    ],
    contextTerms: [
      'react',
      'typescript',
      'javascript',
      'python',
      'java',
      'flutter',
      'firebase',
      'supabase',
      'mysql',
      'postgresql',
      'mongodb',
      'node.js',
      'express',
      'laravel',
      'django',
    ],
  },
  {
    key: 'platform',
    labels: [
      'Platform',
      'Application Type',
      'System Requirements',
      'Target Platform',
      'Platforms',
      'Infrastructure',
    ],
    contextTerms: ['web application', 'mobile application', 'android', 'ios'],
  },
  {
    key: 'timeline',
    labels: [
      'Project Schedule',
      'Development Timeline',
      'Project Timeline',
      'Project Duration',
      'Implementation Period',
      'Development Schedule',
      'Timeline',
      'Duration',
      'Schedule',
    ],
  },
  {
    key: 'contributions',
    labels: [
      'Individual Contributions',
      'My Contributions',
      'Personal Contributions',
      'Developer Responsibilities',
      'Contributions',
      'Contribution',
    ],
  },
  {
    key: 'role',
    labels: [
      'Roles and Responsibilities',
      'Role',
      'Position',
      'Your Role',
      'Project Role',
      'Team Composition',
      'Individual Role',
    ],
  },
  {
    key: 'status',
    labels: ['Project Status', 'Status', 'Completion Status'],
  },
  {
    key: 'project_type',
    labels: ['Project Type', 'Capstone Type', 'Category'],
  },
]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function headingRegex(labels: string[]) {
  const pattern = labels.map(escapeRegExp).join('|')
  return new RegExp(
    `(?:^|\\n)\\s*(?:${pattern})\\s*(?:[:\\-–]|\\n)`,
    'i',
  )
}

function isLikelyIrrelevantPage(text: string) {
  const head = text.slice(0, 400)
  return IRRELEVANT_PAGE.test(head)
}

/** Score a page for whether OCR/extra work is worthwhile. */
export function scorePageRelevance(page: PageText): number {
  if (isLikelyIrrelevantPage(page.text)) return -10
  const lower = page.text.toLowerCase()
  let score = 0

  // Early pages often hold title/abstract.
  if (page.page <= 5) score += 3
  if (page.page <= 15) score += 1

  for (const target of SECTION_TARGETS) {
    for (const label of target.labels) {
      if (lower.includes(label.toLowerCase())) score += 4
    }
    for (const term of target.contextTerms || []) {
      if (lower.includes(term.toLowerCase())) score += 1
    }
  }

  return score
}

export function selectPagesForOcr(
  sparsePages: PageText[],
  maxPages = 8,
): number[] {
  return [...sparsePages]
    .map((page) => ({ page: page.page, score: scorePageRelevance(page) }))
    .filter((item) => item.score > 0 || item.page <= 5)
    .sort((a, b) => b.score - a.score || a.page - b.page)
    .slice(0, maxPages)
    .map((item) => item.page)
}

function extractBlockAfterHeading(
  pageText: string,
  matchIndex: number,
  matchLength: number,
  maxChars: number,
) {
  const start = matchIndex + matchLength
  let body = pageText.slice(start)
  // Cut at next all-caps / numbered chapter-like heading if present.
  const nextHeading = body.search(
    /\n\s*(?:chapter\s+\d+|\d+(?:\.\d+)*\s+[A-Z][A-Za-z].{0,60}|REFERENCES|APPENDIX|BIBLIOGRAPHY)\b/,
  )
  if (nextHeading > 80) body = body.slice(0, nextHeading)
  return body.trim().slice(0, maxChars)
}

/**
 * Locate only project-relevant sections. Does not return whole-document text.
 */
export function locateTargetedSegments(
  pages: PageText[],
  options?: { maxSegmentChars?: number; maxSegments?: number },
): TargetedSegment[] {
  const maxSegmentChars = options?.maxSegmentChars ?? 3500
  const maxSegments = options?.maxSegments ?? 40
  const segments: TargetedSegment[] = []
  const seen = new Set<string>()

  for (const page of pages) {
    if (isLikelyIrrelevantPage(page.text) && page.page > 8) continue

    for (const target of SECTION_TARGETS) {
      const regex = headingRegex(target.labels)
      const match = regex.exec(page.text)
      if (!match) continue

      const heading = match[0].replace(/[:\-\n]+$/g, '').trim()
      const key = `${target.key}:${page.page}:${heading.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)

      const text = extractBlockAfterHeading(
        page.text,
        match.index,
        match[0].length,
        maxSegmentChars,
      )
      if (text.length < 8 && target.key !== 'title') continue

      // Include a little of the next page if the section looks truncated.
      let endPage = page.page
      let combined = text
      const next = pages.find((p) => p.page === page.page + 1)
      if (
        next &&
        !isLikelyIrrelevantPage(next.text) &&
        text.length < maxSegmentChars * 0.55 &&
        !headingRegex(SECTION_TARGETS.flatMap((t) => t.labels)).test(
          next.text.slice(0, 200),
        )
      ) {
        combined = `${text}\n${next.text.slice(0, Math.floor(maxSegmentChars / 2))}`.slice(
          0,
          maxSegmentChars,
        )
        endPage = next.page
      }

      segments.push({
        key: target.key,
        heading,
        page: page.page,
        end_page: endPage,
        text: combined,
        match_type: 'heading',
      })
    }
  }

  // Contextual fallbacks for sparse fields (technologies / platform).
  for (const target of SECTION_TARGETS) {
    if (!target.contextTerms?.length) continue
    if (segments.some((segment) => segment.key === target.key)) continue

    for (const page of pages) {
      if (isLikelyIrrelevantPage(page.text) && page.page > 8) continue
      const lower = page.text.toLowerCase()
      const hits = target.contextTerms.filter((term) =>
        lower.includes(term.toLowerCase()),
      )
      if (hits.length < 2) continue
      const key = `${target.key}:ctx:${page.page}`
      if (seen.has(key)) continue
      seen.add(key)
      segments.push({
        key: target.key,
        heading: null,
        page: page.page,
        end_page: page.page,
        text: page.text.slice(0, maxSegmentChars),
        match_type: 'context',
      })
      break
    }
  }

  // Always keep a small title/front-matter window if no title heading found.
  if (!segments.some((segment) => segment.key === 'title') && pages[0]) {
    segments.unshift({
      key: 'title',
      heading: null,
      page: pages[0].page,
      end_page: pages[0].page,
      text: pages[0].text.slice(0, 800),
      match_type: 'keyword',
    })
  }

  return segments.slice(0, maxSegments)
}

export function formatSegmentsForAi(segments: TargetedSegment[]) {
  return segments
    .map((segment) => {
      const pages =
        segment.end_page === segment.page
          ? `page ${segment.page}`
          : `pages ${segment.page}-${segment.end_page}`
      const heading = segment.heading || '(contextual match)'
      return `### TARGET ${segment.key} | ${pages} | ${heading} | match=${segment.match_type}\n${segment.text}`
    })
    .join('\n\n')
}
