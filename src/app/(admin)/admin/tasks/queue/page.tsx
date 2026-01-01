'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, LayoutGrid, Calendar, User, Clock, Filter } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getQueueTasks, getDefaultWorkspace, getBoards, type TaskItem, type TaskBoard } from '../actions'

const priorityColors = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }

type SortField = 'priority' | 'due_at' | 'created_at' | 'title'
type SortDirection = 'asc' | 'desc'

export default function TaskQueuePage() {
  usePageTitle('Task Queue')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [boards, setBoards] = useState<TaskBoard[]>([])
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const workspace = await getDefaultWorkspace()
        if (workspace) {
          const [queueTasks, boardList] = await Promise.all([
            getQueueTasks(workspace.id),
            getBoards(workspace.id),
          ])
          setTasks(queueTasks)
          setBoards(boardList)
        }
      } catch (error) {
        console.error('Error fetching queue:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sortedTasks = [...tasks]
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'due_at':
          if (!a.due_at && !b.due_at) comparison = 0
          else if (!a.due_at) comparison = 1
          else if (!b.due_at) comparison = -1
          else comparison = new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getAgeDays = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Queue</h1>
          <p className="text-muted-foreground">All open tasks sorted by priority</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/tasks">
              <User className="h-4 w-4 mr-2" />
              My Work
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedTasks.length} tasks
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  Task
                  {sortField === 'title' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer w-32" onClick={() => handleSort('priority')}>
                <div className="flex items-center gap-1">
                  Priority
                  {sortField === 'priority' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer w-32" onClick={() => handleSort('due_at')}>
                <div className="flex items-center gap-1">
                  Due Date
                  {sortField === 'due_at' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer w-24" onClick={() => handleSort('created_at')}>
                <div className="flex items-center gap-1">
                  Age
                  {sortField === 'created_at' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="w-40">Assignee</TableHead>
              <TableHead className="w-32">Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map(task => (
              <TableRow key={task.id} className="hover:bg-accent/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                    )}
                    {task.links && task.links.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.links.map(link => (
                          <Badge key={link.id} variant="outline" className="text-xs">
                            {link.entity_kind}: {link.meta?.label || link.entity_id.slice(0, 8)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.priority]} variant="secondary">
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.due_at ? (
                    <div className={`flex items-center gap-1 ${new Date(task.due_at) < new Date() ? 'text-red-600' : ''}`}>
                      <Clock className="h-3 w-3" />
                      {new Date(task.due_at).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{getAgeDays(task.created_at)}d</span>
                </TableCell>
                <TableCell>
                  {task.assigned_user ? (
                    <span className="text-sm">
                      {task.assigned_user.first_name || task.assigned_user.email.split('@')[0]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.column && (
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: (task.column as { color: string }).color + '20' }}
                    >
                      {(task.column as { name: string }).name}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sortedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No tasks in queue
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
