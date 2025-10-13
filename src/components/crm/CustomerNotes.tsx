'use client'

import { useState } from 'react'
import type { CustomerNote } from '@/types/crm'
import { addCustomerNote, updateCustomerNote, deleteCustomerNote } from '@/actions/crm'

interface CustomerNotesProps {
  notes: CustomerNote[]
  customerEmail: string
  onUpdate: () => void
}

export function CustomerNotes({ notes, customerEmail, onUpdate }: CustomerNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [newNotePinned, setNewNotePinned] = useState(false)
  const [editNote, setEditNote] = useState('')
  const [editNotePinned, setEditNotePinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      setSaving(true)
      await addCustomerNote(customerEmail, newNote, newNotePinned)
      setNewNote('')
      setNewNotePinned(false)
      setIsAdding(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to add note:', err)
      alert('Failed to add note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditNote = async (noteId: string) => {
    if (!editNote.trim()) return

    try {
      setSaving(true)
      await updateCustomerNote(noteId, editNote, editNotePinned)
      setEditingId(null)
      setEditNote('')
      setEditNotePinned(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to update note:', err)
      alert('Failed to update note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteCustomerNote(noteId)
      onUpdate()
    } catch (err) {
      console.error('Failed to delete note:', err)
      alert('Failed to delete note. Please try again.')
    }
  }

  const startEdit = (note: CustomerNote) => {
    setEditingId(note.id)
    setEditNote(note.note)
    setEditNotePinned(note.is_pinned)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNote('')
    setEditNotePinned(false)
  }

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const unpinnedNotes = notes.filter(n => !n.is_pinned)

  return (
    <div className="space-y-4">
      {/* Add Note Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notes</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Add Note
        </button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="border rounded-lg p-4 bg-card">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note about this customer..."
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newNotePinned}
                onChange={(e) => setNewNotePinned(e.target.checked)}
                className="w-4 h-4"
              />
              <span>📌 Pin this note</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAdding(false)
                  setNewNote('')
                  setNewNotePinned(false)
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || saving}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">📌 Pinned Notes</h4>
          {pinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editNote={editNote}
              editNotePinned={editNotePinned}
              saving={saving}
              onEdit={startEdit}
              onSave={handleEditNote}
              onCancel={cancelEdit}
              onDelete={handleDeleteNote}
              setEditNote={setEditNote}
              setEditNotePinned={setEditNotePinned}
            />
          ))}
        </div>
      )}

      {/* Regular Notes */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <h4 className="text-sm font-semibold text-muted-foreground">Notes</h4>
          )}
          {unpinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editNote={editNote}
              editNotePinned={editNotePinned}
              saving={saving}
              onEdit={startEdit}
              onSave={handleEditNote}
              onCancel={cancelEdit}
              onDelete={handleDeleteNote}
              setEditNote={setEditNote}
              setEditNotePinned={setEditNotePinned}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && !isAdding && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No notes yet. Add one to get started.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            + Add First Note
          </button>
        </div>
      )}
    </div>
  )
}

function NoteCard({
  note,
  isEditing,
  editNote,
  editNotePinned,
  saving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  setEditNote,
  setEditNotePinned,
}: {
  note: CustomerNote
  isEditing: boolean
  editNote: string
  editNotePinned: boolean
  saving: boolean
  onEdit: (note: CustomerNote) => void
  onSave: (noteId: string) => void
  onCancel: () => void
  onDelete: (noteId: string) => void
  setEditNote: (note: string) => void
  setEditNotePinned: (pinned: boolean) => void
}) {
  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <textarea
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={editNotePinned}
              onChange={(e) => setEditNotePinned(e.target.checked)}
              className="w-4 h-4"
            />
            <span>📌 Pin this note</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(note.id)}
              disabled={!editNote.trim() || saving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-4 bg-card ${note.is_pinned ? 'border-primary' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {note.is_pinned && (
            <div className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-2">
              📌 Pinned
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{note.note}</p>
        </div>
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => onEdit(note)}
            className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
            title="Edit note"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="px-2 py-1 text-xs border rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete note"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(note.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
    </div>
  )
}
