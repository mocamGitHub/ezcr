'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, User, List, Calendar, GripVertical, MessageSquare, Link2, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getDefaultWorkspace,
  getBoardBySlug,
  getColumns,
  getTasks,
  createTask,
  moveTask,
  type TaskBoard,
  type TaskColumn,
  type TaskItem,
} from '../../actions'

const priorityColors = {
  urgent: 'border-l-red-500 bg-red-50 dark:bg-red-950',
  high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950',
  normal: 'border-l-blue-500',
  low: 'border-l-gray-500',
}

const priorityBadgeColors = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export default function TaskBoardPage() {
  const params = useParams()
  const boardSlug = params.boardSlug as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<TaskBoard | null>(null)
  const [columns, setColumns] = useState<TaskColumn[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null)

  usePageTitle(board?.name || 'Board')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const workspace = await getDefaultWorkspace()
      if (workspace) {
        const boardData = await getBoardBySlug(workspace.id, boardSlug)
        if (boardData) {
          setBoard(boardData)
          const [columnsData, tasksData] = await Promise.all([
            getColumns(boardData.id),
            getTasks(boardData.id),
          ])
          setColumns(columnsData)
          setTasks(tasksData)
        }
      }
    } catch (error) {
      console.error('Error fetching board:', error)
    } finally {
      setLoading(false)
    }
  }, [boardSlug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMoveTask = async (taskId: string, targetColumnId: string) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, column_id: targetColumnId }
          : t
      )
    )

    const success = await moveTask(taskId, targetColumnId, 0)
    if (!success) {
      // Revert on failure
      fetchData()
    }
  }

  const handleCreateTask = async (data: {
    title: string
    description: string
    priority: 'urgent' | 'high' | 'normal' | 'low'
  }) => {
    if (!board || !newTaskColumnId || !user?.id) return

    const newTask = await createTask({
      board_id: board.id,
      column_id: newTaskColumnId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      created_by: user.id,
    })

    if (newTask) {
      setTasks(prev => [...prev, newTask])
      setNewTaskOpen(false)
      setNewTaskColumnId(null)
    }
  }

  const getTasksForColumn = (columnId: string) =>
    tasks.filter(t => t.column_id === columnId).sort((a, b) => a.position - b.position)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium">Board not found</h2>
        <p className="text-muted-foreground">The board you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/tasks">Go to My Work</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">{board.name}</h1>
          {board.description && (
            <p className="text-muted-foreground">{board.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/tasks">
              <User className="h-4 w-4 mr-2" />
              My Work
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/tasks/queue">
              <List className="h-4 w-4 mr-2" />
              Queue
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/tasks/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg"
          >
            {/* Column Header */}
            <div
              className="p-3 font-medium flex items-center justify-between border-b"
              style={{ borderLeftColor: column.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2">
                <span>{column.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {getTasksForColumn(column.id).length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setNewTaskColumnId(column.id)
                  setNewTaskOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Column Body */}
            <div
              className="flex-1 p-2 space-y-2 overflow-y-auto min-h-48"
              onDragOver={e => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-muted/50')
              }}
              onDragLeave={e => {
                e.currentTarget.classList.remove('bg-muted/50')
              }}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-muted/50')
                const taskId = e.dataTransfer.getData('taskId')
                if (taskId) {
                  handleMoveTask(taskId, column.id)
                }
              }}
            >
              {getTasksForColumn(column.id).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Dialog */}
      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}

function TaskCard({ task }: { task: TaskItem }) {
  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status === 'open'

  return (
    <div
      className={`bg-card rounded-lg border border-l-4 ${priorityColors[task.priority]} p-3 cursor-move hover:shadow-md transition-shadow`}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('taskId', task.id)
        e.currentTarget.classList.add('opacity-50')
      }}
      onDragEnd={e => {
        e.currentTarget.classList.remove('opacity-50')
      }}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{task.title}</div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={priorityBadgeColors[task.priority]} variant="secondary">
              {task.priority}
            </Badge>

            {task.due_at && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                {new Date(task.due_at).toLocaleDateString()}
              </span>
            )}

            {task.comment_count && task.comment_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {task.comment_count}
              </span>
            )}

            {task.links && task.links.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                {task.links.length}
              </span>
            )}
          </div>

          {/* Assignee */}
          {task.assigned_user && (
            <div className="text-xs text-muted-foreground mt-2">
              {task.assigned_user.first_name || task.assigned_user.email.split('@')[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewTaskDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; description: string; priority: 'urgent' | 'high' | 'normal' | 'low' }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title, description, priority })
    setTitle('')
    setDescription('')
    setPriority('normal')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to the board.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter task title"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
