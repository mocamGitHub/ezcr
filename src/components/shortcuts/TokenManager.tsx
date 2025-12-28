'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface Token {
  id: string
  name: string
  scopes: string[]
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  isActive: boolean
}

const AVAILABLE_SCOPES = [
  { id: 'today', label: "Today's Schedule", description: 'View today\'s bookings and events' },
  { id: 'block-time', label: 'Block Time', description: 'Create time blocks to mark busy' },
  { id: 'create-link', label: 'Create Booking Link', description: 'Generate shareable booking links' },
  { id: 'reschedule', label: 'Reschedule', description: 'Reschedule existing bookings' },
  { id: '*', label: 'Full Access', description: 'All permissions (use with caution)' },
]

export function TokenManager() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/shortcuts/tokens')
      const data = await response.json()
      if (data.success) {
        setTokens(data.tokens)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
      toast.error('Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast.error('Token name is required')
      return
    }
    if (selectedScopes.length === 0) {
      toast.error('Select at least one scope')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/shortcuts/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName, scopes: selectedScopes }),
      })
      const data = await response.json()

      if (data.success) {
        setNewToken(data.token)
        fetchTokens()
        toast.success('Token created! Copy it now - it won\'t be shown again.')
      } else {
        toast.error(data.error || 'Failed to create token')
      }
    } catch (error) {
      toast.error('Failed to create token')
    } finally {
      setCreating(false)
    }
  }

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/shortcuts/tokens?id=${tokenId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Token revoked')
        fetchTokens()
      } else {
        toast.error(data.error || 'Failed to revoke token')
      }
    } catch (error) {
      toast.error('Failed to revoke token')
    }
  }

  const copyToken = async () => {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetCreateDialog = () => {
    setNewTokenName('')
    setSelectedScopes([])
    setNewToken(null)
    setCopied(false)
    setCreateDialogOpen(false)
  }

  const toggleScope = (scopeId: string) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shortcuts API Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Create tokens to use with iOS Shortcuts or other integrations
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newToken ? 'Token Created' : 'Create API Token'}
              </DialogTitle>
              <DialogDescription>
                {newToken
                  ? 'Copy your token now. It will not be shown again.'
                  : 'Give your token a name and select the permissions it needs.'}
              </DialogDescription>
            </DialogHeader>

            {newToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm font-mono break-all">
                    {newToken}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyToken}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={resetCreateDialog}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g., iPhone Shortcuts"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.id}
                        className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedScopes.includes(scope.id)}
                          onCheckedChange={() => toggleScope(scope.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{scope.label}</p>
                          <p className="text-xs text-muted-foreground">{scope.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetCreateDialog}>
                    Cancel
                  </Button>
                  <Button onClick={createToken} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Token
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tokens yet</h3>
          <p className="text-muted-foreground mt-1">
            Create a token to get started with the Shortcuts API
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                token.isActive ? '' : 'opacity-50 bg-muted'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{token.name}</p>
                  {!token.isActive && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {token.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {new Date(token.createdAt).toLocaleDateString()}
                  {token.lastUsedAt && ` • Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              {token.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeToken(token.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TokenManager
