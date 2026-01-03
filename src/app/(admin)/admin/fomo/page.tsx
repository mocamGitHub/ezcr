'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Package,
  Zap,
  Users,
  AlertCircle,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { type FOMOBannerConfig, DEFAULT_CONFIGS } from '@/components/marketing/FOMOBanner'

type BannerType = FOMOBannerConfig['type']
type BannerPosition = FOMOBannerConfig['position']

const TYPE_OPTIONS: { value: BannerType; label: string; icon: React.ReactNode }[] = [
  { value: 'countdown', label: 'Countdown Timer', icon: <Clock className="w-4 h-4" /> },
  { value: 'stock', label: 'Low Stock Alert', icon: <Package className="w-4 h-4" /> },
  { value: 'recent_purchase', label: 'Recent Purchase', icon: <Zap className="w-4 h-4" /> },
  { value: 'visitors', label: 'Active Visitors', icon: <Users className="w-4 h-4" /> },
  { value: 'custom', label: 'Custom Message', icon: <AlertCircle className="w-4 h-4" /> },
]

const POSITION_OPTIONS: { value: BannerPosition; label: string }[] = [
  { value: 'top', label: 'Top of Page' },
  { value: 'bottom', label: 'Bottom of Page' },
  { value: 'floating', label: 'Floating Corner' },
]

const DEFAULT_BANNER: FOMOBannerConfig = {
  id: '',
  enabled: true,
  type: 'stock',
  message: 'Only {count} ramps left in stock! Order now before they\'re gone.',
  stockCount: 7,
  stockThreshold: 10,
  backgroundColor: '#FEF3C7',
  textColor: '#92400E',
  accentColor: '#F78309',
  position: 'top',
  dismissible: true,
  showIcon: true,
  priority: 1,
}

export default function FOMOManagementPage() {
  useRouter() // Keep for potential navigation
  useAuth() // Keep for auth context
  const [banners, setBanners] = useState<FOMOBannerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingBanner, setEditingBanner] = useState<FOMOBannerConfig | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerToDelete, setBannerToDelete] = useState<FOMOBannerConfig | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load banners
  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fomo-banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      } else {
        // Use defaults if no banners configured
        setBanners(DEFAULT_CONFIGS)
      }
    } catch (err) {
      console.error('Error loading banners:', err)
      setBanners(DEFAULT_CONFIGS)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingBanner({
      ...DEFAULT_BANNER,
      id: `banner-${Date.now()}`,
    })
    setShowDialog(true)
  }

  const handleEdit = (banner: FOMOBannerConfig) => {
    setEditingBanner({ ...banner })
    setShowDialog(true)
  }

  const handleDeleteClick = (banner: FOMOBannerConfig) => {
    setBannerToDelete(banner)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return

    try {
      const response = await fetch(`/api/admin/fomo-banners?id=${bannerToDelete.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setBanners(banners.filter((b) => b.id !== bannerToDelete.id))
      }
    } catch (err) {
      console.error('Error deleting banner:', err)
      setError('Failed to delete banner')
    } finally {
      setBannerToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleEnabled = async (banner: FOMOBannerConfig) => {
    const updated = { ...banner, enabled: !banner.enabled }
    try {
      const response = await fetch('/api/admin/fomo-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (response.ok) {
        setBanners(banners.map((b) => (b.id === banner.id ? updated : b)))
      }
    } catch (err) {
      console.error('Error toggling banner:', err)
    }
  }

  const handleSave = async () => {
    if (!editingBanner) return

    setSaving(true)
    setError(null)

    try {
      const existing = banners.find((b) => b.id === editingBanner.id)
      const method = existing ? 'PUT' : 'POST'

      const response = await fetch('/api/admin/fomo-banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner),
      })

      if (response.ok) {
        // Reload banners to get server-generated IDs for new banners
        await loadBanners()
        setShowDialog(false)
        setEditingBanner(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save banner')
      }
    } catch (err) {
      console.error('Error saving banner:', err)
      setError('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const getTypeIcon = (type: BannerType) => {
    const option = TYPE_OPTIONS.find((t) => t.value === type)
    return option?.icon || <AlertCircle className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FOMO Banners</h1>
          <p className="text-muted-foreground mt-1">
            Manage urgency banners to increase conversions
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Banner
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Banners Created</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first FOMO banner to display urgency messages to customers.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(banner.type)}
                    <CardTitle className="text-lg capitalize">
                      {banner.type.replace('_', ' ')}
                    </CardTitle>
                  </div>
                  <Badge variant={banner.enabled ? 'default' : 'secondary'}>
                    {banner.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{banner.message}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Preview */}
                <div
                  className="p-3 rounded-lg text-sm mb-4"
                  style={{
                    backgroundColor: banner.backgroundColor,
                    color: banner.textColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {banner.showIcon && (
                      <span style={{ color: banner.accentColor }}>{getTypeIcon(banner.type)}</span>
                    )}
                    <span className="line-clamp-1">
                      {banner.message
                        .replace('{count}', String(banner.stockCount || 0))
                        .replace('{visitors}', String(banner.visitorCount || 0))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleEnabled(banner)}
                      title={banner.enabled ? 'Disable' : 'Enable'}
                    >
                      {banner.enabled ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(banner)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {banner.position}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner?.id.startsWith('banner-') ? 'Create Banner' : 'Edit Banner'}
            </DialogTitle>
          </DialogHeader>

          {editingBanner && (
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Banner Type</Label>
                  <Select
                    value={editingBanner.type}
                    onValueChange={(value: BannerType) =>
                      setEditingBanner({ ...editingBanner, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={editingBanner.position}
                    onValueChange={(value: BannerPosition) =>
                      setEditingBanner({ ...editingBanner, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={editingBanner.message}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, message: e.target.value })
                  }
                  placeholder="Use {count} for stock count, {visitors} for visitor count, {countdown} for timer"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {'{count}'}, {'{visitors}'}, {'{countdown}'}
                </p>
              </div>

              {/* Type-specific settings */}
              {editingBanner.type === 'stock' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stock Count</Label>
                    <Input
                      type="number"
                      value={editingBanner.stockCount || 0}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          stockCount: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Threshold</Label>
                    <Input
                      type="number"
                      value={editingBanner.stockThreshold || 10}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          stockThreshold: parseInt(e.target.value) || 10,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {editingBanner.type === 'countdown' && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={editingBanner.endDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        endDate: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
              )}

              {editingBanner.type === 'visitors' && (
                <div className="space-y-2">
                  <Label>Visitor Count</Label>
                  <Input
                    type="number"
                    value={editingBanner.visitorCount || 0}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        visitorCount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}

              {/* Scheduling */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={editingBanner.startDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        startDate: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority (lower = higher priority)</Label>
                  <Input
                    type="number"
                    value={editingBanner.priority}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editingBanner.backgroundColor || '#FEF3C7'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, backgroundColor: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editingBanner.backgroundColor || '#FEF3C7'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, backgroundColor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editingBanner.textColor || '#92400E'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, textColor: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editingBanner.textColor || '#92400E'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, textColor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editingBanner.accentColor || '#F78309'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, accentColor: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editingBanner.accentColor || '#F78309'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, accentColor: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingBanner.enabled}
                    onCheckedChange={(checked: boolean) =>
                      setEditingBanner({ ...editingBanner, enabled: checked })
                    }
                  />
                  <Label>Enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingBanner.dismissible}
                    onCheckedChange={(checked: boolean) =>
                      setEditingBanner({ ...editingBanner, dismissible: checked })
                    }
                  />
                  <Label>Dismissible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingBanner.showIcon}
                    onCheckedChange={(checked: boolean) =>
                      setEditingBanner({ ...editingBanner, showIcon: checked })
                    }
                  />
                  <Label>Show Icon</Label>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className={`p-4 rounded-lg ${editingBanner.position === 'floating' ? 'max-w-md' : ''}`}
                  style={{
                    backgroundColor: editingBanner.backgroundColor,
                    color: editingBanner.textColor,
                  }}
                >
                  <div className="flex items-center justify-center gap-3 text-sm font-medium">
                    {editingBanner.showIcon && (
                      <span style={{ color: editingBanner.accentColor }}>
                        {getTypeIcon(editingBanner.type)}
                      </span>
                    )}
                    <span>
                      {editingBanner.message
                        .replace('{count}', String(editingBanner.stockCount || 0))
                        .replace('{visitors}', String(editingBanner.visitorCount || 0))
                        .replace('{countdown}', '2d 05h 30m 15s')}
                    </span>
                    {editingBanner.dismissible && (
                      <button className="ml-2 p-1 rounded-full hover:bg-black/10">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Banner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Banner"
        description={`Are you sure you want to delete this ${bannerToDelete?.type || ''} banner? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
