'use server'

import { createServiceClient } from '@/lib/supabase/server'

// Types
export interface TaskWorkspace {
  id: string
  tenant_id: string
  slug: string
  name: string
  description: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TaskBoard {
  id: string
  workspace_id: string
  slug: string
  name: string
  description: string | null
  position: number
  settings: Record<string, unknown>
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface TaskColumn {
  id: string
  board_id: string
  slug: string
  name: string
  color: string
  position: number
  is_done: boolean
  wip_limit: number | null
  created_at: string
  updated_at: string
}

export interface TaskItem {
  id: string
  board_id: string
  column_id: string
  title: string
  description: string | null
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'open' | 'closed' | 'archived'
  assigned_to: string | null
  created_by: string | null
  start_at: string | null
  due_at: string | null
  completed_at: string | null
  position: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined fields
  assigned_user?: {
    email: string
    first_name: string | null
    last_name: string | null
  }
  created_user?: {
    email: string
    first_name: string | null
    last_name: string | null
  }
  links?: TaskLink[]
  comment_count?: number
  // Joined relations for display
  board?: {
    name: string
    slug: string
  }
  column?: {
    name: string
    color: string
  }
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
  author?: {
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface TaskLink {
  id: string
  task_id: string
  entity_kind: 'order' | 'appointment' | 'customer' | 'ticket'
  entity_id: string
  meta: {
    label?: string
    unresolved?: boolean
  }
  created_at: string
}

function getTenantId(): string {
  const tenantId = process.env.EZCR_TENANT_ID
  if (!tenantId) throw new Error('EZCR_TENANT_ID not set')
  return tenantId
}

// Workspace Actions
export async function getDefaultWorkspace(): Promise<TaskWorkspace | null> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('task_workspaces')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', 'ops')
    .single()

  if (error) {
    console.error('Error fetching workspace:', error)
    return null
  }

  return data
}

export async function getWorkspaces(): Promise<TaskWorkspace[]> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('task_workspaces')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching workspaces:', error)
    return []
  }

  return data || []
}

// Board Actions
export async function getBoards(workspaceId: string): Promise<TaskBoard[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_boards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching boards:', error)
    return []
  }

  return data || []
}

export async function getBoardBySlug(workspaceId: string, slug: string): Promise<TaskBoard | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_boards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching board:', error)
    return null
  }

  return data
}

// Column Actions
export async function getColumns(boardId: string): Promise<TaskColumn[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_board_columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching columns:', error)
    return []
  }

  return data || []
}

export async function createColumn(
  boardId: string,
  name: string,
  color: string,
  isDone: boolean = false
): Promise<TaskColumn | null> {
  const supabase = await createServiceClient()

  // Get max position
  const { data: maxPos } = await supabase
    .from('task_board_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position || 0) + 1

  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('task_board_columns')
    .insert({
      board_id: boardId,
      name,
      slug,
      color,
      position,
      is_done: isDone,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating column:', error)
    return null
  }

  return data
}

export async function updateColumn(
  columnId: string,
  updates: {
    name?: string
    color?: string
    is_done?: boolean
  }
): Promise<TaskColumn | null> {
  const supabase = await createServiceClient()

  // If name is being updated, also update slug
  const updateData: Record<string, unknown> = { ...updates }
  if (updates.name) {
    updateData.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const { data, error } = await supabase
    .from('task_board_columns')
    .update(updateData)
    .eq('id', columnId)
    .select()
    .single()

  if (error) {
    console.error('Error updating column:', error)
    return null
  }

  return data
}

export async function deleteColumn(columnId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceClient()

  // Check if column has any tasks
  const { count } = await supabase
    .from('task_items')
    .select('id', { count: 'exact', head: true })
    .eq('column_id', columnId)

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete column with ${count} task${count > 1 ? 's' : ''}. Move or delete tasks first.`,
    }
  }

  const { error } = await supabase
    .from('task_board_columns')
    .delete()
    .eq('id', columnId)

  if (error) {
    console.error('Error deleting column:', error)
    return { success: false, error: 'Failed to delete column' }
  }

  return { success: true }
}

// Task Actions
export async function getTasks(boardId: string): Promise<TaskItem[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_items')
    .select(`
      *,
      assigned_user:user_profiles!task_items_assigned_to_fkey(email, first_name, last_name),
      created_user:user_profiles!task_items_created_by_fkey(email, first_name, last_name),
      links:task_links(*),
      comments:task_comments(count)
    `)
    .eq('board_id', boardId)
    .neq('status', 'archived')
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return (data || []).map(task => ({
    ...task,
    comment_count: task.comments?.[0]?.count || 0,
  }))
}

export async function getMyTasks(userId: string): Promise<TaskItem[]> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  // Get all tasks assigned to user across all boards in tenant workspaces
  const { data, error } = await supabase
    .from('task_items')
    .select(`
      *,
      board:task_boards!inner(
        id,
        name,
        slug,
        workspace:task_workspaces!inner(
          id,
          name,
          tenant_id
        )
      ),
      column:task_board_columns(id, name, color, is_done),
      links:task_links(*)
    `)
    .eq('assigned_to', userId)
    .eq('board.workspace.tenant_id', tenantId)
    .neq('status', 'archived')
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false })

  if (error) {
    console.error('Error fetching my tasks:', error)
    return []
  }

  return data || []
}

export async function getQueueTasks(workspaceId: string): Promise<TaskItem[]> {
  const supabase = await createServiceClient()

  // Get all open tasks across all boards in workspace
  const { data, error } = await supabase
    .from('task_items')
    .select(`
      *,
      board:task_boards!inner(id, name, slug, workspace_id),
      column:task_board_columns(id, name, color, is_done),
      assigned_user:user_profiles!task_items_assigned_to_fkey(email, first_name, last_name),
      links:task_links(*)
    `)
    .eq('board.workspace_id', workspaceId)
    .eq('status', 'open')
    .order('priority', { ascending: false })
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching queue tasks:', error)
    return []
  }

  return data || []
}

export async function getCalendarTasks(workspaceId: string, startDate: string, endDate: string): Promise<TaskItem[]> {
  const supabase = await createServiceClient()

  // Get tasks with start_at or due_at within date range
  const { data, error } = await supabase
    .from('task_items')
    .select(`
      *,
      board:task_boards!inner(id, name, slug, workspace_id),
      column:task_board_columns(id, name, color, is_done),
      assigned_user:user_profiles!task_items_assigned_to_fkey(email, first_name, last_name)
    `)
    .eq('board.workspace_id', workspaceId)
    .neq('status', 'archived')
    .or(`start_at.gte.${startDate},due_at.gte.${startDate}`)
    .or(`start_at.lte.${endDate},due_at.lte.${endDate}`)
    .order('start_at', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching calendar tasks:', error)
    return []
  }

  return data || []
}

export async function getTask(taskId: string): Promise<TaskItem | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_items')
    .select(`
      *,
      assigned_user:user_profiles!task_items_assigned_to_fkey(email, first_name, last_name),
      created_user:user_profiles!task_items_created_by_fkey(email, first_name, last_name),
      links:task_links(*)
    `)
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('Error fetching task:', error)
    return null
  }

  return data
}

export async function createTask(data: {
  board_id: string
  column_id: string
  title: string
  description?: string
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  assigned_to?: string
  created_by: string
  start_at?: string
  due_at?: string
}): Promise<TaskItem | null> {
  const supabase = await createServiceClient()

  // Get max position in column
  const { data: maxPos } = await supabase
    .from('task_items')
    .select('position')
    .eq('column_id', data.column_id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position || 0) + 1

  const { data: task, error } = await supabase
    .from('task_items')
    .insert({
      ...data,
      position,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return null
  }

  return task
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string
    description: string
    priority: 'urgent' | 'high' | 'normal' | 'low'
    status: 'open' | 'closed' | 'archived'
    assigned_to: string | null
    start_at: string | null
    due_at: string | null
    completed_at: string | null
    metadata: Record<string, unknown>
  }>
): Promise<TaskItem | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_items')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error)
    return null
  }

  return data
}

export async function moveTask(
  taskId: string,
  targetColumnId: string,
  newPosition: number
): Promise<boolean> {
  const supabase = await createServiceClient()

  // Get the target column to check if it's a "done" column
  const { data: column } = await supabase
    .from('task_board_columns')
    .select('is_done')
    .eq('id', targetColumnId)
    .single()

  const updates: Record<string, unknown> = {
    column_id: targetColumnId,
    position: newPosition,
  }

  // If moving to a "done" column, set completed_at
  if (column?.is_done) {
    updates.completed_at = new Date().toISOString()
    updates.status = 'closed'
  } else {
    updates.completed_at = null
    updates.status = 'open'
  }

  const { error } = await supabase
    .from('task_items')
    .update(updates)
    .eq('id', taskId)

  if (error) {
    console.error('Error moving task:', error)
    return false
  }

  return true
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('task_items')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return false
  }

  return true
}

// Comment Actions
export async function getComments(taskId: string): Promise<TaskComment[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      author:user_profiles!task_comments_author_id_fkey(email, first_name, last_name)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data || []
}

export async function addComment(taskId: string, authorId: string, content: string): Promise<TaskComment | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: authorId,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return null
  }

  return data
}

// Link Actions
export async function linkEntity(
  taskId: string,
  entityKind: 'order' | 'appointment' | 'customer' | 'ticket',
  entityId: string,
  label?: string
): Promise<TaskLink | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('task_links')
    .insert({
      task_id: taskId,
      entity_kind: entityKind,
      entity_id: entityId,
      meta: label ? { label } : {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error linking entity:', error)
    return null
  }

  return data
}

export async function unlinkEntity(linkId: string): Promise<boolean> {
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('task_links')
    .delete()
    .eq('id', linkId)

  if (error) {
    console.error('Error unlinking entity:', error)
    return false
  }

  return true
}

// Task Stats for dashboard widgets
export async function getTaskStats(workspaceId: string, userId?: string): Promise<{
  open_count: number
  overdue_count: number
  my_work_count: number
  completed_today: number
}> {
  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Get all open tasks in workspace
  const { data: openTasks } = await supabase
    .from('task_items')
    .select('id, due_at, assigned_to, completed_at', { count: 'exact' })
    .eq('status', 'open')
    .in('board_id', (
      supabase
        .from('task_boards')
        .select('id')
        .eq('workspace_id', workspaceId)
    ) as unknown as string[])

  const now = new Date()
  const stats = {
    open_count: openTasks?.length || 0,
    overdue_count: openTasks?.filter(t => t.due_at && new Date(t.due_at) < now).length || 0,
    my_work_count: userId ? openTasks?.filter(t => t.assigned_to === userId).length || 0 : 0,
    completed_today: 0,
  }

  // Get completed today count
  const { count: completedToday } = await supabase
    .from('task_items')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed')
    .gte('completed_at', today)
    .in('board_id', (
      supabase
        .from('task_boards')
        .select('id')
        .eq('workspace_id', workspaceId)
    ) as unknown as string[])

  stats.completed_today = completedToday || 0

  return stats
}
