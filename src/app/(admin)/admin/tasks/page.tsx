'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertCircle, LayoutGrid, List, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getMyTasks, getDefaultWorkspace, getBoards, type TaskItem, type TaskBoard } from './actions'

const priorityColors = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export default function TasksPage() {
  usePageTitle('My Work')
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [boards, setBoards] = useState<TaskBoard[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return
      setLoading(true)
      try {
        const workspace = await getDefaultWorkspace()
        if (workspace) {
          const [myTasks, boardList] = await Promise.all([
            getMyTasks(user.id),
            getBoards(workspace.id),
          ])
          setTasks(myTasks)
          setBoards(boardList)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const overdueTasks = tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status === 'open')
  const dueTodayTasks = tasks.filter(t => {
    if (!t.due_at || t.status !== 'open') return false
    const dueDate = new Date(t.due_at).toDateString()
    const today = new Date().toDateString()
    return dueDate === today
  })
  const upcomingTasks = tasks.filter(t => {
    if (!t.due_at || t.status !== 'open') return false
    const dueDate = new Date(t.due_at)
    const today = new Date()
    return dueDate > today && dueDate.toDateString() !== today.toDateString()
  })
  const noDueDateTasks = tasks.filter(t => !t.due_at && t.status === 'open')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Work</h1>
          <p className="text-muted-foreground">Tasks assigned to you across all boards</p>
        </div>
        <div className="flex gap-2">
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
          {boards.length > 0 && (
            <Button asChild>
              <Link href={`/admin/tasks/boards/${boards[0].slug}`}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Board
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Overdue</span>
          </div>
          <p className="text-3xl font-bold mt-2">{overdueTasks.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Due Today</span>
          </div>
          <p className="text-3xl font-bold mt-2">{dueTodayTasks.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Upcoming</span>
          </div>
          <p className="text-3xl font-bold mt-2">{upcomingTasks.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Total Open</span>
          </div>
          <p className="text-3xl font-bold mt-2">{tasks.filter(t => t.status === 'open').length}</p>
        </div>
      </div>

      {/* Task Sections */}
      {overdueTasks.length > 0 && (
        <TaskSection title="Overdue" tasks={overdueTasks} variant="overdue" />
      )}
      {dueTodayTasks.length > 0 && (
        <TaskSection title="Due Today" tasks={dueTodayTasks} variant="today" />
      )}
      {upcomingTasks.length > 0 && (
        <TaskSection title="Upcoming" tasks={upcomingTasks} variant="upcoming" />
      )}
      {noDueDateTasks.length > 0 && (
        <TaskSection title="No Due Date" tasks={noDueDateTasks} variant="none" />
      )}
      {tasks.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg border">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground">You have no tasks assigned to you.</p>
        </div>
      )}
    </div>
  )
}

function TaskSection({
  title,
  tasks,
  variant,
}: {
  title: string
  tasks: TaskItem[]
  variant: 'overdue' | 'today' | 'upcoming' | 'none'
}) {
  const borderColor = {
    overdue: 'border-l-red-500',
    today: 'border-l-orange-500',
    upcoming: 'border-l-blue-500',
    none: 'border-l-gray-500',
  }[variant]

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {title}
        <Badge variant="secondary">{tasks.length}</Badge>
      </h2>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`bg-card rounded-lg border border-l-4 ${borderColor} p-4 hover:bg-accent/50 transition-colors`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{task.title}</h3>
                  <Badge className={priorityColors[task.priority]} variant="secondary">
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {task.board && (
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" />
                      {(task.board as { name: string }).name}
                    </span>
                  )}
                  {task.column && (
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: (task.column as { color: string }).color + '20' }}
                    >
                      {(task.column as { name: string }).name}
                    </span>
                  )}
                  {task.due_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(task.due_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {task.links && task.links.length > 0 && (
                <div className="flex gap-1 ml-4">
                  {task.links.map(link => (
                    <Badge key={link.id} variant="outline" className="text-xs">
                      {link.entity_kind}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
