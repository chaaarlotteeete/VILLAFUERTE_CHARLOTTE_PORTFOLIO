import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDeleteButtonProps {
  label?: string
  title?: string
  description?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDeleteButton({
  label = 'Delete',
  title = 'Delete item?',
  description = 'This action cannot be undone.',
  onConfirm,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          <Trash2 />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(event) => {
              event.preventDefault()
              void (async () => {
                setLoading(true)
                try {
                  await onConfirm()
                  setOpen(false)
                } finally {
                  setLoading(false)
                }
              })()
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
