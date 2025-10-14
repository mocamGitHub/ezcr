# Team/User Management - Implementation Plan

**Priority**: High
**Estimated Time**: 2-3 hours
**Status**: Not Started

---

## Overview

Build an admin panel for managing staff members who access the admin dashboard and CRM.

## What to Build

### Page: `/admin/team`

Admin page for viewing and managing team members (staff, admins, customer service reps).

### Features Needed

#### 1. List Team Members
- Show all users with access to admin panel
- Display: Name, Email, Role, Status, Last Login
- Filter by role, status
- Search by name/email

#### 2. Invite New Team Member
- Modal/form to invite user via email
- Select role: Admin, Customer Service, Viewer
- Send invitation email via Resend
- Create user in Supabase Auth

#### 3. Edit Team Member
- Change role/permissions
- Update name, profile info
- Activate/deactivate account

#### 4. Roles & Permissions

| Role | Permissions |
|------|------------|
| **Owner** | Full access, can manage users |
| **Admin** | Full CRM, orders, can't manage users |
| **Customer Service** | View/edit customers, orders, notes |
| **Viewer** | Read-only access to CRM |

---

## Database Schema (Already Exists)

```sql
-- user_profiles table (already exists)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT, -- 'owner', 'admin', 'customer_service', 'viewer'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Missing column**: `role` (need to add this)

---

## Implementation Steps

### Step 1: Add Role Column
```sql
-- Migration: 00014_add_user_roles.sql
ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'viewer';
ALTER TABLE user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing user to be owner
UPDATE user_profiles SET role = 'owner' WHERE email = 'your-email@example.com';
```

### Step 2: Create Server Actions
```typescript
// src/actions/team.ts

export async function getTeamMembers() {
  // List all users in this tenant
}

export async function inviteTeamMember(email: string, role: string) {
  // Create auth user, send invitation email
}

export async function updateTeamMember(userId: string, updates) {
  // Update role, profile info
}

export async function deactivateTeamMember(userId: string) {
  // Set is_active = false
}
```

### Step 3: Create UI Components
```typescript
// src/components/team/TeamList.tsx - List team members
// src/components/team/InviteTeamMemberModal.tsx - Invite form
// src/components/team/TeamMemberCard.tsx - Individual member card
```

### Step 4: Create Page
```typescript
// src/app/(admin)/admin/team/page.tsx
import { TeamList } from '@/components/team/TeamList'

export default function TeamPage() {
  return (
    <div>
      <h1>Team Management</h1>
      <TeamList />
    </div>
  )
}
```

---

## API Integration

### Supabase Auth for Invitations
```typescript
// Use Supabase Admin API to create user
const { data, error } = await supabase.auth.admin.createUser({
  email: 'newuser@example.com',
  email_confirm: true, // Auto-confirm or send invitation
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer_service',
  },
})
```

### Resend for Invitation Emails
```typescript
await resend.emails.send({
  from: 'team@ezcycleramp.com',
  to: email,
  subject: 'You've been invited to join EZ Cycle Ramp team',
  html: `
    <p>Click here to set your password and join the team:</p>
    <a href="${resetPasswordLink}">Accept Invitation</a>
  `,
})
```

---

## Security Considerations

### Row Level Security (RLS)
```sql
-- Only owners/admins can view team members
CREATE POLICY "Only admins can view team" ON user_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles
      WHERE tenant_id = user_profiles.tenant_id
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners can update team members
CREATE POLICY "Only owners can update team" ON user_profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles
      WHERE tenant_id = user_profiles.tenant_id
      AND role = 'owner'
    )
  );
```

### Permission Checks
```typescript
// src/lib/permissions.ts
export async function requireRole(minRole: 'viewer' | 'customer_service' | 'admin' | 'owner') {
  const user = await getCurrentUser()
  if (!hasPermission(user.role, minRole)) {
    throw new Error('Insufficient permissions')
  }
}

function hasPermission(userRole: string, requiredRole: string): boolean {
  const hierarchy = ['viewer', 'customer_service', 'admin', 'owner']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
}
```

---

## Testing Checklist

- [ ] Owner can view all team members
- [ ] Owner can invite new team member
- [ ] Invitation email sent via Resend
- [ ] New user can accept invitation and set password
- [ ] Owner can change team member role
- [ ] Owner can deactivate team member
- [ ] Deactivated user cannot log in
- [ ] Admin cannot access team management (only owner can)
- [ ] Customer service can access CRM but not team page
- [ ] Viewer has read-only access to CRM

---

## Optional Enhancements (Future)

- [ ] Activity log (who invited whom, role changes)
- [ ] Team member avatars
- [ ] Bulk invite via CSV
- [ ] Custom permission sets (beyond roles)
- [ ] Two-factor authentication requirement
- [ ] Session management (view active sessions, force logout)

---

## Estimated Effort

| Task | Time |
|------|------|
| Add role column migration | 10 min |
| Create team server actions | 30 min |
| Build UI components | 60 min |
| Create team page | 30 min |
| Add RLS policies | 20 min |
| Testing | 30 min |
| **Total** | **~3 hours** |

---

## Priority

**High** - You'll need this when you hire your first employee or want to give someone access to help with customer service.

**But** - Not urgent for launch if you're the only admin.

---

## Next Steps

1. Decide if you want to build this now or later
2. If now, start with migration to add `role` column
3. Build server actions
4. Build UI
5. Test thoroughly

**Would you like me to start building this?**
