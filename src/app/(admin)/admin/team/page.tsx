'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getTeamMembersPaginated,
  getTeamStats,
  inviteTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
  type TeamMember,
  type InviteTeamMemberData,
} from '@/actions/team'
import { getRoleDisplayName, getRoleBadgeColor, getInvitableRoles } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { EnvironmentBanner } from '@/components/EnvironmentBanner'
import { AdminDataTable, PageHeader, type ColumnDef, type RowAction } from '@/components/admin'
import { UserPlus, UserX, UserCheck } from 'lucide-react'

export default function TeamManagementPage() {
  // Table state
  const [members, setMembers] = useState<TeamMember[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState('first_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats state
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    byRole: { owner: number; admin: number; customer_service: number; viewer: number }
  } | null>(null)

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteData, setInviteData] = useState<InviteTeamMemberData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [membersResult, statsResult] = await Promise.all([
        getTeamMembersPaginated({
          page,
          pageSize,
          sortColumn,
          sortDirection,
          search,
        }),
        getTeamStats(),
      ])
      setMembers(membersResult.data)
      setTotalCount(membersResult.totalCount)
      setStats(statsResult)
    } catch (err: any) {
      console.error('Error loading team data:', err)
      setError(err.message || 'Failed to load team data')
      toast.error(err.message || 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page on sort change
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page on search
  }

  const handleInvite = async () => {
    if (!inviteData.email) {
      toast.error('Email is required')
      return
    }

    try {
      setInviteLoading(true)
      const result = await inviteTeamMember(inviteData)
      toast.success(result.message || 'Team member invited successfully')
      setInviteModalOpen(false)
      setInviteData({ email: '', first_name: '', last_name: '', role: 'viewer' })
      loadData()
    } catch (err: any) {
      console.error('Error inviting team member:', err)
      toast.error(err.message || 'Failed to invite team member')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleToggleActive = async (member: TeamMember) => {
    try {
      if (member.is_active) {
        const result = await deactivateTeamMember(member.id)
        toast.success(result.message || 'Team member deactivated')
      } else {
        const result = await reactivateTeamMember(member.id)
        toast.success(result.message || 'Team member reactivated')
      }
      loadData()
    } catch (err: any) {
      console.error('Error toggling team member status:', err)
      toast.error(err.message || 'Failed to update team member')
    }
  }

  // Column definitions
  const columns: ColumnDef<TeamMember>[] = [
    {
      key: 'first_name',
      header: 'Name',
      sortable: true,
      cell: (member) => (
        <div className="font-medium">
          {member.first_name || member.last_name
            ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
            : 'Not Set'}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      cell: (member) => (
        <span className="text-muted-foreground">{member.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      cell: (member) => (
        <Badge className={getRoleBadgeColor(member.role)}>
          {getRoleDisplayName(member.role)}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (member) => (
        <Badge
          variant={member.is_active ? 'default' : 'secondary'}
          className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        >
          {member.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      sortable: true,
      cell: (member) => (
        <span className="text-muted-foreground">
          {member.last_login
            ? new Date(member.last_login).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'Never'}
        </span>
      ),
    },
  ]

  // Row actions
  const getRowActions = (member: TeamMember): RowAction<TeamMember>[] => {
    if (member.role === 'owner') {
      return [] // No actions for owners
    }

    return [
      {
        label: member.is_active ? 'Deactivate' : 'Reactivate',
        onClick: () => handleToggleActive(member),
        icon: member.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
        destructive: member.is_active,
      },
    ]
  }

  return (
    <div className="p-8">
      <EnvironmentBanner />

      <PageHeader
        title="Team Management"
        description="Manage staff members who have access to the admin dashboard"
        primaryAction={
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        }
      />

      {/* Team Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Total Members</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.active}</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{stats.inactive}</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Owners</div>
            <div className="text-2xl font-bold mt-1 text-purple-600">{stats.byRole.owner}</div>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      <AdminDataTable
        data={members}
        columns={columns}
        keyField="id"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyTitle="No team members found"
        emptyDescription="Invite team members to give them access to the admin dashboard."
        emptyAction={{
          label: 'Invite Team Member',
          onClick: () => setInviteModalOpen(true),
        }}
        rowActions={getRowActions}
      />

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new team member. They&apos;ll receive an email with instructions to set their password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={inviteData.first_name}
                  onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={inviteData.last_name}
                  onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getInvitableRoles().map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Admin: Full CRM access | Customer Service: View/edit customers | Viewer: Read-only
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
