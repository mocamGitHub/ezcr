'use client'

import { useState } from 'react'
import type { CustomerTask } from '@/types/crm'
import { createCustomerTask, updateCustomerTask, deleteCustomerTask } from '@/actions/crm'

interface CustomerTasksProps {
  tasks: CustomerTask[]
  customerEmail: string
  onUpdate: () => void
}

export function CustomerTasks({ tasks, customerEmail, onUpdate }: CustomerTasksProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // New task state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')

  // Edit task state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')

  const handleAddTask = async () => {
    if (!newTitle.trim()) return

    try {
      setSaving(true)
      await createCustomerTask(
        customerEmail,
        newTitle,
        newDescription || undefined,
        newDueDate || undefined,
        newPriority
      )
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setNewPriority('medium')
      setIsAdding(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTask = async (taskId: string) => {
    if (!editTitle.trim()) return

    try {
      setSaving(true)
      await updateCustomerTask(taskId, {
        title: editTitle,
        description: editDescription || undefined,
        due_date: editDueDate || undefined,
        priority: editPriority,
      })
      setEditingId(null)
      onUpdate()
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleComplete = async (task: CustomerTask) => {
    try {
      await updateCustomerTask(task.id, {
        completed: !task.completed,
      })
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle task:', err)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await deleteCustomerTask(taskId)
      onUpdate()
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task. Please try again.')
    }
  }

  const startEdit = (task: CustomerTask) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditDueDate(task.due_date || '')
    setEditPriority(task.priority)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditDueDate('')
    setEditPriority('medium')
  }

  const openTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="border rounded-lg p-4 bg-card">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-2"
          />
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="px-3 py-2 text-sm border rounded-md"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewTitle('')
                setNewDescription('')
                setNewDueDate('')
                setNewPriority('medium')
              }}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              disabled={!newTitle.trim() || saving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      )}

      {/* Open Tasks */}
      {openTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Open Tasks ({openTasks.length})</h4>
          {openTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              editTitle={editTitle}
              editDescription={editDescription}
              editDueDate={editDueDate}
              editPriority={editPriority}
              saving={saving}
              onEdit={startEdit}
              onSave={handleUpdateTask}
              onCancel={cancelEdit}
              onToggle={handleToggleComplete}
              onDelete={handleDeleteTask}
              setEditTitle={setEditTitle}
              setEditDescription={setEditDescription}
              setEditDueDate={setEditDueDate}
              setEditPriority={setEditPriority}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">✓ Completed ({completedTasks.length})</h4>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isEditing={false}
              editTitle=""
              editDescription=""
              editDueDate=""
              editPriority="medium"
              saving={false}
              onEdit={startEdit}
              onSave={handleUpdateTask}
              onCancel={cancelEdit}
              onToggle={handleToggleComplete}
              onDelete={handleDeleteTask}
              setEditTitle={setEditTitle}
              setEditDescription={setEditDescription}
              setEditDueDate={setEditDueDate}
              setEditPriority={setEditPriority}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && !isAdding && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No tasks yet. Create one to get started.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            + Create First Task
          </button>
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task,
  isEditing,
  editTitle,
  editDescription,
  editDueDate,
  editPriority,
  saving,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
  setEditTitle,
  setEditDescription,
  setEditDueDate,
  setEditPriority,
}: {
  task: CustomerTask
  isEditing: boolean
  editTitle: string
  editDescription: string
  editDueDate: string
  editPriority: 'low' | 'medium' | 'high' | 'urgent'
  saving: boolean
  onEdit: (task: CustomerTask) => void
  onSave: (taskId: string) => void
  onCancel: () => void
  onToggle: (task: CustomerTask) => void
  onDelete: (taskId: string) => void
  setEditTitle: (title: string) => void
  setEditDescription: (description: string) => void
  setEditDueDate: (date: string) => void
  setEditPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => void
}) {
  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-2"
        />
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as any)}
            className="px-3 py-2 text-sm border rounded-md"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(task.id)}
            disabled={!editTitle.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <div className={`border rounded-lg p-4 bg-card ${task.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-destructive' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
          className="mt-1 w-5 h-5 cursor-pointer"
        />
        <div className="flex-1">
          <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={`inline-flex px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className={`${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                📅 Due: {new Date(task.due_date).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {!task.completed && (
            <button
              onClick={() => onEdit(task)}
              className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
              title="Edit task"
            >
              ✏️
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
