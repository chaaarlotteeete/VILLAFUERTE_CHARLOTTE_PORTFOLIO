import {
  History,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  assistProjectWriting,
  fetchContentVersions,
  saveContentVersion,
} from '@/services/projectWritingAssist'
import {
  FIELD_AI_ACTIONS,
  VERSION_TYPE_LABELS,
  WRITING_ACTION_LABELS,
  type AssistableField,
  type ContentVersion,
  type WritingAction,
} from '@/types/projectWritingAssist'
import { cn } from '@/lib/utils'
import { joinListItems, parseListItems } from '@/utils/listField'

interface TextSelection {
  start: number
  end: number
  text: string
  /** When listMode, which item the selection belongs to. */
  itemIndex?: number
}

interface AiWritingAssistantProps {
  /** AI instruction key / prompt field. */
  fieldName: AssistableField
  /** Optional distinct history key (e.g. feature:<id>:description). */
  versionFieldName?: string
  label: string
  value: string
  onChange: (value: string) => void
  projectId?: string | null
  draftKey: string
  projectContext?: string
  multiline?: boolean
  /** Edit as a bullet list (stored as `- item` lines). */
  listMode?: boolean
  className?: string
  placeholder?: string
  minHeightClassName?: string
  /** Called when a version is recorded (for shared history state). */
  onVersionSaved?: (version: ContentVersion) => void
}

export function AiWritingAssistant({
  fieldName,
  versionFieldName,
  label,
  value,
  onChange,
  projectId,
  draftKey,
  projectContext,
  multiline = true,
  listMode = false,
  className,
  placeholder,
  minHeightClassName,
  onVersionSaved,
}: AiWritingAssistantProps) {
  const actions = FIELD_AI_ACTIONS[fieldName]
  const historyKey = versionFieldName || fieldName
  const lastPersisted = useRef(value)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previewTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const selectionRef = useRef<TextSelection | null>(null)
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [busyAction, setBusyAction] = useState<WritingAction | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [editPreview, setEditPreview] = useState(false)
  const [originalSnapshot, setOriginalSnapshot] = useState('')
  const [generated, setGenerated] = useState('')
  const [activeAction, setActiveAction] = useState<WritingAction | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  const [history, setHistory] = useState<ContentVersion[]>([])
  const [compareLeft, setCompareLeft] = useState('')
  const [compareRight, setCompareRight] = useState('')
  /** Selection range active for the open AI preview (apply splices here). */
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(
    null,
  )

  const listItems = useMemo(
    () => (listMode ? parseListItems(value) : []),
    [listMode, value],
  )

  const canAssist = listMode
    ? listItems.some((item) => item.trim().length > 0)
    : value.trim().length > 0

  const hasSelection = Boolean(selection && selection.text.trim().length > 0)

  function resizeTextarea(node: HTMLTextAreaElement | null) {
    if (!node) return
    node.style.height = '0px'
    node.style.height = `${node.scrollHeight}px`
  }

  function rememberSelection(next: TextSelection | null) {
    selectionRef.current = next
    setSelection(next)
  }

  function captureSelection(
    node: HTMLTextAreaElement | HTMLInputElement,
    itemIndex?: number,
  ) {
    const start = node.selectionStart ?? 0
    const end = node.selectionEnd ?? 0
    if (end > start) {
      rememberSelection({
        start,
        end,
        text: node.value.slice(start, end),
        itemIndex,
      })
      return
    }
    rememberSelection(null)
  }

  function updateListItems(nextItems: string[]) {
    onChange(joinListItems(nextItems))
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      resizeTextarea(textareaRef.current)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [value, minHeightClassName, listMode])

  useEffect(() => {
    if (!editPreview) return
    const frame = window.requestAnimationFrame(() => {
      resizeTextarea(previewTextareaRef.current)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [generated, editPreview])

  useEffect(() => {
    if (!historyOpen) return
    void fetchContentVersions({
      projectId,
      draftKey,
      fieldName: historyKey,
    }).then(setHistory)
  }, [historyOpen, projectId, draftKey, historyKey])

  async function recordVersion(
    content: string,
    versionType: ContentVersion['version_type'],
    aiAction: WritingAction | 'pdf_import' | null = null,
  ) {
    const version = await saveContentVersion({
      projectId,
      draftKey,
      fieldName: historyKey,
      content,
      versionType,
      aiAction,
    })
    lastPersisted.current = content
    setHistory((current) => [version, ...current])
    onVersionSaved?.(version)
    return version
  }

  async function runAction(
    action: WritingAction,
    options?: {
      source?: string
      selectionOverride?: TextSelection | null
      forceFullField?: boolean
    },
  ) {
    const activeSelection =
      options?.forceFullField
        ? null
        : (options?.selectionOverride ?? selectionRef.current)
    const useSelection = Boolean(
      activeSelection && activeSelection.text.trim().length > 0,
    )
    const source = (
      options?.source ??
      (useSelection ? activeSelection!.text : value)
    ).trim()

    if (!source) {
      toast.error('Enter or highlight some content before using the AI assistant')
      return
    }

    setBusyAction(action)
    try {
      if (!previewOpen || !originalSnapshot) {
        setOriginalSnapshot(source)
        await recordVersion(
          useSelection ? value : source,
          'original',
        )
      }

      const result = await assistProjectWriting({
        fieldName,
        action,
        content: source,
        projectContext,
        scope: useSelection ? 'selection' : 'full',
        fullFieldContent: useSelection ? value : undefined,
      })

      setGenerated(result.content)
      setActiveAction(action)
      setNotes(result.notes)
      setEditPreview(false)
      setPendingSelection(useSelection ? activeSelection : null)
      setPreviewOpen(true)

      await recordVersion(result.content, 'ai_generated', action)
      toast.success(
        useSelection
          ? `${WRITING_ACTION_LABELS[action]} ready for highlighted text`
          : `${WRITING_ACTION_LABELS[action]} ready for review`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI assist failed')
    } finally {
      setBusyAction(null)
    }
  }

  function applyIntoValue(nextFragment: string) {
    if (!pendingSelection) {
      onChange(nextFragment)
      return
    }

    if (
      listMode &&
      typeof pendingSelection.itemIndex === 'number' &&
      pendingSelection.itemIndex >= 0
    ) {
      const items = parseListItems(value)
      const index = pendingSelection.itemIndex
      const current = items[index] ?? ''
      items[index] =
        current.slice(0, pendingSelection.start) +
        nextFragment +
        current.slice(pendingSelection.end)
      onChange(joinListItems(items))
      return
    }

    onChange(
      value.slice(0, pendingSelection.start) +
        nextFragment +
        value.slice(pendingSelection.end),
    )
  }

  async function applyGeneratedVersion() {
    const wasSelection = Boolean(pendingSelection)
    applyIntoValue(generated)
    setPreviewOpen(false)
    setEditPreview(false)
    setPendingSelection(null)
    toast.success(
      wasSelection
        ? 'Highlighted text updated'
        : 'AI version applied to the form field',
    )
  }

  function dismissGenerated() {
    setPreviewOpen(false)
    setEditPreview(false)
    setPendingSelection(null)
  }

  async function restoreVersion(version: ContentVersion) {
    onChange(version.content)
    setHistoryOpen(false)
    setCompareOpen(false)
    await recordVersion(version.content, 'manual_edit')
    toast.success('Previous version restored')
  }

  const statusLabel = useMemo(() => {
    if (busyAction) return `Generating ${WRITING_ACTION_LABELS[busyAction]}…`
    if (previewOpen && generated) return 'Preview ready'
    if (hasSelection) return 'Highlighted text ready for Rephrase / Improve'
    return null
  }, [busyAction, previewOpen, generated, hasSelection])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={fieldName}>{label}</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {actions.map((action) => {
            const selectionFriendly =
              action === 'rephrase' || action === 'improve'
            const labelText =
              hasSelection && selectionFriendly
                ? `${WRITING_ACTION_LABELS[action]} selection`
                : WRITING_ACTION_LABELS[action]
            return (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2 text-xs"
                disabled={!canAssist || Boolean(busyAction)}
                onMouseDown={(event) => {
                  // Keep textarea selection when clicking AI actions.
                  event.preventDefault()
                }}
                onClick={() => {
                  const preferSelection =
                    selectionFriendly ||
                    (hasSelection && action !== 'organize')
                  void runAction(action, {
                    forceFullField: !preferSelection && action === 'organize',
                    selectionOverride: preferSelection
                      ? selectionRef.current
                      : null,
                  })
                }}
              >
                {busyAction === action ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {labelText}
              </Button>
            )
          })}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="size-3.5" />
            History
          </Button>
        </div>
      </div>

      {listMode ? (
        <div className="space-y-2">
          {listItems.map((item, index) => (
            <div key={`objective-${index}`} className="flex items-start gap-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/50" />
              <Input
                value={item}
                placeholder={placeholder || `Objective ${index + 1}`}
                className="min-h-10"
                onSelect={(event) =>
                  captureSelection(event.currentTarget, index)
                }
                onKeyUp={(event) =>
                  captureSelection(event.currentTarget, index)
                }
                onMouseUp={(event) =>
                  captureSelection(event.currentTarget, index)
                }
                onChange={(event) => {
                  const next = [...listItems]
                  next[index] = event.target.value
                  // Keep empty trailing row editable without collapsing.
                  updateListItems(
                    next.every((entry) => !entry.trim()) ? [''] : next,
                  )
                  captureSelection(event.currentTarget, index)
                }}
                onBlur={() => {
                  const joined = joinListItems(parseListItems(value))
                  if (joined.trim().length < 2) return
                  if (joined.trim() === lastPersisted.current.trim()) return
                  void recordVersion(joined, 'manual_edit')
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mt-0.5 shrink-0"
                disabled={listItems.length <= 1}
                onClick={() => {
                  const next = listItems.filter((_, i) => i !== index)
                  updateListItems(next.length ? next : [''])
                  rememberSelection(null)
                }}
                aria-label="Remove objective"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => updateListItems([...listItems, ''])}
          >
            <Plus className="size-3.5" />
            Add objective
          </Button>
        </div>
      ) : (
        <Textarea
          id={fieldName}
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          className={cn(
            'min-h-0 resize-none overflow-hidden',
            multiline ? minHeightClassName || 'min-h-[2.75rem]' : 'min-h-[2.5rem]',
          )}
          onSelect={(event) => captureSelection(event.currentTarget)}
          onKeyUp={(event) => captureSelection(event.currentTarget)}
          onMouseUp={(event) => captureSelection(event.currentTarget)}
          onChange={(event) => {
            onChange(event.target.value)
            resizeTextarea(event.currentTarget)
            captureSelection(event.currentTarget)
          }}
          onBlur={() => {
            if (value.trim().length < 2) return
            if (value.trim() === lastPersisted.current.trim()) return
            void recordVersion(value, 'manual_edit')
          }}
        />
      )}

      {statusLabel ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          {statusLabel}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tip: highlight text, then use Rephrase or Improve on the selection only.
        </p>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden">
          <DialogTitle>AI writing preview</DialogTitle>
          <div className="flex flex-wrap gap-2 text-sm">
            {activeAction ? (
              <Badge variant="secondary">
                {WRITING_ACTION_LABELS[activeAction]}
              </Badge>
            ) : null}
            {pendingSelection ? (
              <Badge variant="outline">Highlighted selection</Badge>
            ) : null}
            <Badge variant="outline">Not saved until you apply</Badge>
          </div>
          {notes ? (
            <p className="text-xs text-muted-foreground">{notes}</p>
          ) : null}

          <div className="grid max-h-[50vh] gap-3 overflow-y-auto md:grid-cols-2">
            <section className="space-y-2 rounded-lg border p-3">
              <h3 className="text-sm font-semibold">Original</h3>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {originalSnapshot || '—'}
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">AI-generated</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditPreview((v) => !v)}
                >
                  {editPreview ? 'Done' : 'Edit'}
                </Button>
              </div>
              {editPreview ? (
                <Textarea
                  ref={previewTextareaRef}
                  rows={1}
                  value={generated}
                  onChange={(event) => {
                    setGenerated(event.target.value)
                    resizeTextarea(event.currentTarget)
                  }}
                  className="min-h-[4.5rem] resize-none overflow-hidden"
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {generated || '—'}
                </p>
              )}
            </section>
          </div>

          <section className="rounded-lg border bg-muted/20 p-3">
            <h3 className="mb-1 text-sm font-semibold">Current form value</h3>
            <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {value || '—'}
            </p>
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={dismissGenerated}>
              Dismiss
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!activeAction || Boolean(busyAction)}
              onClick={() =>
                void runAction(activeAction || 'improve', {
                  source: originalSnapshot,
                  selectionOverride: pendingSelection,
                  forceFullField: !pendingSelection,
                })
              }
            >
              {busyAction ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Regenerate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCompareLeft(originalSnapshot)
                setCompareRight(generated)
                setCompareOpen(true)
              }}
            >
              Compare
            </Button>
            <Button type="button" onClick={() => void applyGeneratedVersion()}>
              Use This Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
          <DialogTitle>Version history — {label}</DialogTitle>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved versions yet for this field.
              </p>
            ) : (
              history.map((version) => (
                <div
                  key={version.id}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {VERSION_TYPE_LABELS[version.version_type]}
                    </Badge>
                    {version.ai_action ? (
                      <Badge variant="outline">{version.ai_action}</Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {version.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCompareLeft(value)
                        setCompareRight(version.content)
                        setCompareOpen(true)
                      }}
                    >
                      Compare with current
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void restoreVersion(version)}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogTitle>Compare versions</DialogTitle>
          <div className="grid max-h-[55vh] gap-3 overflow-y-auto md:grid-cols-2">
            <section className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">Left</h3>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {compareLeft || '—'}
              </p>
            </section>
            <section className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">Right</h3>
              <p className="whitespace-pre-wrap break-words text-sm">
                {compareRight || '—'}
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
