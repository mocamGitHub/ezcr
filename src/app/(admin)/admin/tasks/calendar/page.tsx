'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, LayoutGrid, List, User } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getCalendarTasks, getDefaultWorkspace, getBoards, type TaskItem, type TaskBoard } from '../actions'

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-500',
}

export default function TaskCalendarPage() {
  usePageTitle('Task Calendar')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [boards, setBoards] = useState<TaskBoard[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const workspace = await getDefaultWorkspace()
        if (workspace) {
          const startDate = new Date(year, month, 1).toISOString()
          const endDate = new Date(year, month + 1, 0).toISOString()
          const [calendarTasks, boardList] = await Promise.all([
            getCalendarTasks(workspace.id, startDate, endDate),
            getBoards(workspace.id),
          ])
          setTasks(calendarTasks)
          setBoards(boardList)
        }
      } catch (error) {
        console.error('Error fetching calendar:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Add empty cells for remaining days
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    currentWeek.push(null)
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const getTasksForDay = (day: number): TaskItem[] => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]
    return tasks.filter(task => {
      const dueDate = task.due_at ? new Date(task.due_at).toISOString().split('T')[0] : null
      const startDate = task.start_at ? new Date(task.start_at).toISOString().split('T')[0] : null
      return dueDate === dateStr || startDate === dateStr
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Calendar</h1>
          <p className="text-muted-foreground">View tasks by their due dates</p>
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

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-48 text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium border-b">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((day, dayIndex) => {
              const dayTasks = day ? getTasksForDay(day) : []
              return (
                <div
                  key={dayIndex}
                  className={`min-h-32 border-b border-r p-2 ${
                    day === null ? 'bg-muted/30' : ''
                  } ${isToday(day || 0) ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                >
                  {day !== null && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate text-white ${priorityColors[task.priority]}`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{dayTasks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Priority:</span>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="capitalize">{priority}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
