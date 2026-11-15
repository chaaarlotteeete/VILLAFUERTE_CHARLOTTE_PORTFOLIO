export type WritingAction = 'rephrase' | 'summarize' | 'improve' | 'organize'

export type ContentVersionType =
  | 'original'
  | 'ai_generated'
  | 'manual_edit'
  | 'pdf_import'

export interface ContentVersion {
  id: string
  project_id: string | null
  draft_key: string | null
  field_name: string
  content: string
  version_type: ContentVersionType
  ai_action: WritingAction | 'pdf_import' | null
  created_at: string
}

export type AssistableField =
  | 'role'
  | 'short_description'
  | 'full_description'
  | 'objectives'
  | 'feature_title'
  | 'feature_description'
  | 'contribution_title'
  | 'contribution_description'

export const FIELD_AI_ACTIONS: Record<AssistableField, WritingAction[]> = {
  role: ['improve', 'rephrase'],
  short_description: ['rephrase', 'summarize', 'improve'],
  full_description: ['rephrase', 'summarize', 'improve', 'organize'],
  objectives: ['organize', 'summarize', 'improve', 'rephrase'],
  feature_title: ['improve', 'rephrase'],
  feature_description: ['rephrase', 'summarize', 'improve'],
  contribution_title: ['improve', 'rephrase'],
  contribution_description: ['rephrase', 'summarize', 'improve', 'organize'],
}

export const WRITING_ACTION_LABELS: Record<WritingAction, string> = {
  rephrase: 'Rephrase',
  summarize: 'Summarize',
  improve: 'Improve',
  organize: 'Organize',
}

export const VERSION_TYPE_LABELS: Record<ContentVersionType, string> = {
  original: 'Original input',
  ai_generated: 'AI-generated',
  manual_edit: 'Manually edited',
  pdf_import: 'PDF import',
}
