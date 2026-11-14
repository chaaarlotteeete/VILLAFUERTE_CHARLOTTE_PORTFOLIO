import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SortableHandleProps {
  attributes: Record<string, unknown>
  listeners: Record<string, unknown> | undefined
  isDragging: boolean
}

export interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void | Promise<void>
  renderItem: (item: T, handleProps: SortableHandleProps) => React.ReactNode
  disabled?: boolean
  className?: string
}

interface SortableRowProps<T extends { id: string }> {
  item: T
  disabled?: boolean
  renderItem: (item: T, handleProps: SortableHandleProps) => React.ReactNode
}

function SortableRow<T extends { id: string }>({
  item,
  disabled,
  renderItem,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'z-10')}>
      {renderItem(item, {
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: listeners as Record<string, unknown> | undefined,
        isDragging,
      })}
    </div>
  )
}

export interface SortableItemShellProps {
  children: React.ReactNode
  className?: string
  isDragging?: boolean
}

export function SortableItemShell({
  children,
  className,
  isDragging,
}: SortableItemShellProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-background',
        isDragging && 'shadow-md',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    await onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <ul className={cn('space-y-2', className)}>
          {items.map((item) => (
            <li key={item.id}>
              <SortableRow
                item={item}
                disabled={disabled}
                renderItem={renderItem}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}