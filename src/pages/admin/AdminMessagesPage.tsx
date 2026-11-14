import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncData } from '@/hooks/useAsyncData'
import { cn } from '@/lib/utils'
import {
  deleteMessage,
  fetchAdminMessages,
  updateMessageRead,
} from '@/services/adminContent'
import type { ContactMessage } from '@/types/database'
import { formatDate } from '@/utils/date'

export function AdminMessagesPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminMessages)
  const [search, setSearch] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const messages = useMemo(() => {
    let list = [...(data ?? [])]
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((message) =>
        [message.full_name, message.email, message.subject, message.message]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    }
    if (readFilter === 'unread') list = list.filter((item) => !item.is_read)
    if (readFilter === 'read') list = list.filter((item) => item.is_read)
    return list
  }, [data, search, readFilter])

  const selected =
    messages.find((item) => item.id === selectedId) ?? messages[0] ?? null

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const unread = (data ?? []).filter((item) => !item.is_read).length

  async function markRead(message: ContactMessage, is_read: boolean) {
    await updateMessageRead(message.id, is_read)
    toast.success(is_read ? 'Marked as read' : 'Marked as unread')
    reload()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Messages"
        description={`${unread} unread message${unread === 1 ? '' : 's'} in your inbox.`}
      />

      <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
        <Input
          placeholder="Search sender, email, subject, or message..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search messages"
        />
        <Select
          value={readFilter}
          onValueChange={(value) =>
            setReadFilter(value as 'all' | 'unread' | 'read')
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {messages.length === 0 ? (
        <EmptyState title="No messages found" />
      ) : (
        <div className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[22rem_1fr]">
          <div className="max-h-[70vh] overflow-y-auto border-b lg:border-b-0 lg:border-r">
            {messages.map((message) => {
              const active = selected?.id === message.id
              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(message.id)
                    if (!message.is_read) {
                      void markRead(message, true)
                    }
                  }}
                  className={cn(
                    'w-full border-b px-4 py-3 text-left transition-colors last:border-b-0',
                    'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    active && 'bg-accent/50',
                    !message.is_read && 'bg-primary/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{message.full_name}</p>
                    {!message.is_read ? <Badge>New</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {message.email}
                  </p>
                  <p className="mt-1 truncate text-sm">{message.subject}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {message.message}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDate(message.created_at, 'MMM d, yyyy HH:mm')}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="min-h-[20rem] p-5">
            {selected ? (
              <article className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.subject}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.full_name} ·{' '}
                      <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Received{' '}
                      {formatDate(selected.created_at, 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void markRead(selected, !selected.is_read)
                      }
                    >
                      Mark as {selected.is_read ? 'Unread' : 'Read'}
                    </Button>
                    <ConfirmDeleteButton
                      title="Delete message?"
                      description="This permanently removes the contact message."
                      onConfirm={async () => {
                        await deleteMessage(selected.id)
                        toast.success('Message deleted')
                        setSelectedId(null)
                        reload()
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selected.message}
                  </p>
                </div>
              </article>
            ) : (
              <EmptyState title="Select a message" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
