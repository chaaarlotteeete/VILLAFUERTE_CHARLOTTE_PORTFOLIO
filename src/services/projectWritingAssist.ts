import { edgeFunctionErrorMessage } from '@/lib/edgeFunctionError'
import { supabase } from '@/lib/supabase'
import type {
  ContentVersion,
  ContentVersionType,
  WritingAction,
} from '@/types/projectWritingAssist'

export async function assistProjectWriting(options: {
  fieldName: string
  action: WritingAction
  content: string
  projectContext?: string
  scope?: 'full' | 'selection'
  fullFieldContent?: string
}) {
  const { data, error } = await supabase.functions.invoke(
    'assist-project-writing',
    {
      body: {
        field_name: options.fieldName,
        action: options.action,
        content: options.content,
        project_context: options.projectContext || '',
        scope: options.scope || 'full',
        full_field_content: options.fullFieldContent || '',
      },
    },
  )

  const payload = data as {
    ok?: boolean
    error?: string
    content?: string
    original?: string
    action?: WritingAction
    notes?: string | null
  } | null

  if (error) {
    throw new Error(await edgeFunctionErrorMessage(error, data))
  }

  if (!payload?.ok || !payload.content) {
    throw new Error(payload?.error || 'Writing assistance failed')
  }

  return {
    content: payload.content,
    original: payload.original || options.content,
    action: payload.action || options.action,
    notes: payload.notes ?? null,
  }
}

export async function saveContentVersion(input: {
  projectId?: string | null
  draftKey?: string | null
  fieldName: string
  content: string
  versionType: ContentVersionType
  aiAction?: WritingAction | 'pdf_import' | null
}): Promise<ContentVersion> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const row = {
    project_id: input.projectId || null,
    draft_key: input.draftKey || null,
    field_name: input.fieldName,
    content: input.content,
    version_type: input.versionType,
    ai_action: input.aiAction ?? null,
    created_by: user?.id ?? null,
  }

  const { data, error } = await supabase
    .from('project_field_content_versions')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    // Soft-fail persistence so local UX still works if table types lag.
    return {
      id: crypto.randomUUID(),
      project_id: row.project_id,
      draft_key: row.draft_key,
      field_name: row.field_name,
      content: row.content,
      version_type: row.version_type,
      ai_action: row.ai_action,
      created_at: new Date().toISOString(),
    }
  }

  return data as ContentVersion
}

export async function fetchContentVersions(options: {
  projectId?: string | null
  draftKey?: string | null
  fieldName: string
}): Promise<ContentVersion[]> {
  let query = supabase
    .from('project_field_content_versions')
    .select('*')
    .eq('field_name', options.fieldName)
    .order('created_at', { ascending: false })
    .limit(40)

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  } else if (options.draftKey) {
    query = query.eq('draft_key', options.draftKey)
  } else {
    return []
  }

  const { data, error } = await query
  if (error) return []
  return data || []
}
