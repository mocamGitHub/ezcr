'use client'

import { useEffect, useState } from 'react'
import { getTeamMembers, inviteTeamMember, updateTeamMember, deactivateTeamMember, reactivateTeamMember, type TeamMember, type InviteTeamMemberData } from '@/actions/team'
import { getRoleDisplayName, getRoleBadgeColor, getInvitableRoles } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { EnvironmentBanner } from '@/components/EnvironmentBanner'

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteData, setInviteData] = useState<InviteTeamMemberData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  })

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await getTeamMembers()
      setMembers(data)
    } catch (error: any) {
      console.error('Error loading team members:', error)
      toast.error(error.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

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
      loadMembers()
    } catch (error: any) {
      console.error('Error inviting team member:', error)
      toast.error(error.message || 'Failed to invite team member')
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
      loadMembers()
    } catch (error: any) {
      console.error('Error toggling team member status:', error)
      toast.error(error.message || 'Failed to update team member')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <EnvironmentBanner />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <EnvironmentBanner />

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage staff members who have access to the admin dashboard
            </p>
          </div>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          size="lg"
          className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
        >
          + Invite Team Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">Total Members</div>
          <div className="text-2xl font-bold mt-1">{members.length}</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {members.filter(m => m.is_active).length}
          </div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">Inactive</div>
          <div className="text-2xl font-bold mt-1 text-orange-600">
            {members.filter(m => !m.is_active).length}
          </div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">Owners</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">
            {members.filter(m => m.role === 'owner').length}
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Role</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Last Login</th>
              <th className="text-right px-4 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No team members found
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {member.first_name || member.last_name
                      ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                      : 'Not Set'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {getRoleDisplayName(member.role)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={member.is_active ? 'default' : 'secondary'}
                    className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {member.last_login
                    ? new Date(member.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Never'}
                </td>
                <td className="px-4 py-3 text-right">
                  {member.role !== 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(member)}
                    >
                      {member.is_active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
