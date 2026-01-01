'use client'

import * as React from 'react'
import { Save, ChevronDown, Trash2, Bookmark, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  saveFilterPreset,
  getFilterPresets,
  deleteFilterPreset,
  type FilterPreset,
} from '@/actions/filter-presets'

interface FilterPresetDropdownProps {
  /** Page identifier for filtering presets */
  page: string
  /** Current filter state to save */
  currentFilters: Record<string, unknown>
  /** Callback when a preset is selected */
  onApplyPreset: (filters: Record<string, unknown>) => void
  /** Whether there are active filters to save */
  hasActiveFilters: boolean
  /** Optional class name */
  className?: string
}

export function FilterPresetDropdown({
  page,
  currentFilters,
  onApplyPreset,
  hasActiveFilters,
  className,
}: FilterPresetDropdownProps) {
  const [presets, setPresets] = React.useState<FilterPreset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [presetToDelete, setPresetToDelete] = React.useState<FilterPreset | null>(null)
  const [presetName, setPresetName] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Load presets on mount
  React.useEffect(() => {
    loadPresets()
  }, [page])

  const loadPresets = async () => {
    try {
      setLoading(true)
      const result = await getFilterPresets(page)
      setPresets(result)
    } catch (error) {
      console.error('Failed to load presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreset = async () => {
    if (!presetName.trim()) return

    try {
      setSaving(true)
      const newPreset = await saveFilterPreset(page, presetName.trim(), currentFilters)
      setPresets((prev) => [...prev, newPreset].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success(`Preset "${presetName}" saved`)
      setSaveDialogOpen(false)
      setPresetName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save preset'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePreset = async () => {
    if (!presetToDelete) return

    try {
      await deleteFilterPreset(presetToDelete.id)
      setPresets((prev) => prev.filter((p) => p.id !== presetToDelete.id))
      toast.success(`Preset "${presetToDelete.name}" deleted`)
      setDeleteDialogOpen(false)
      setPresetToDelete(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete preset'
      toast.error(message)
    }
  }

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters)
    toast.success(`Applied "${preset.name}"`)
  }

  const confirmDelete = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    setPresetToDelete(preset)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Bookmark className="h-4 w-4 mr-2" />
            Presets
            {presets.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({presets.length})</span>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Save current filters */}
          <DropdownMenuItem
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasActiveFilters}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Save current filters
          </DropdownMenuItem>

          {presets.length > 0 && <DropdownMenuSeparator />}

          {/* Saved presets */}
          {loading ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : presets.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              No saved presets
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center justify-between group"
              >
                <span className="truncate">{preset.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => confirmDelete(preset, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Give your filter preset a name to quickly apply these filters later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim() || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{presetToDelete?.name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePreset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
