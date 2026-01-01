# Tasks MVP Architecture

## Overview

The Tasks MVP provides a lightweight, tenant-scoped task management system with:
- Kanban board visualization
- Queue/list views for prioritization
- Calendar integration for scheduled tasks
- Entity linking to orders, appointments, and other domain objects

## Data Model

### Core Tables

```
task_workspaces
├── Per-tenant workspace containers
├── Default: "ops" workspace for operations
└── Supports multiple workspaces per tenant

task_boards
├── Boards within a workspace (e.g., "Operations", "Sales")
├── Contains columns and tasks
└── Ordered by position

task_board_columns
├── Kanban columns (Inbox, Ready, Doing, Waiting, Done)
├── is_done flag for completed columns
└── Color customization

task_items
├── Individual tasks
├── Priority: urgent, high, normal, low
├── Status: open, closed, archived
├── Assignee, due dates, metadata
└── Position for ordering
```

### Entity Linking

```
task_links
├── Polymorphic entity references
├── entity_kind: order, appointment, customer, ticket
├── entity_id: UUID of the linked entity
└── meta: additional context (label, unresolved flag)

task_entity_registry
├── Defines valid entity kinds
├── table_name: source table for validation
├── require_exists: enforce FK-like validation
└── allow_unresolved: permit dangling references
```

## Security Model

### RLS Strategy

1. **Tenant Isolation**: All queries filtered by tenant_id
2. **Role-Based Access**: Uses existing `has_role()` function
3. **Workspace Membership**: Optional fine-grained access control

### Helper Functions

```sql
-- Check tenant membership with minimum role
task_is_tenant_member(p_tenant_id UUID, p_min_role TEXT) → BOOLEAN

-- Check workspace access
task_can_access_workspace(p_workspace_id UUID, p_min_role TEXT) → BOOLEAN

-- Check task access (used in RLS policies)
task_can_access_task(p_task_id UUID, p_min_role TEXT) → BOOLEAN
```

### Role Requirements

| Action | Minimum Role |
|--------|--------------|
| View tasks | viewer |
| Create/edit tasks | customer_service |
| Manage boards/columns | admin |
| Manage workspace | owner |

## UI Components

### Routes

```
/admin/tasks           → My Work (assigned to me)
/admin/tasks/queue     → Queue view (all tasks, sortable)
/admin/tasks/calendar  → Calendar view
/admin/tasks/boards/[slug] → Kanban board
```

### Components

| Component | Purpose |
|-----------|---------|
| `TaskBoard` | Kanban column layout with drag-drop |
| `TaskCard` | Individual task display |
| `TaskQueue` | Sortable list/table view |
| `TaskCalendar` | Calendar integration |
| `TaskDetail` | Task detail panel/modal |
| `TaskForm` | Create/edit form |
| `TaskLinkBadge` | Entity link display |

## Server Actions

```typescript
// Fetch tasks with filters
getTasks(workspaceId, filters): Promise<Task[]>

// Get single task with relations
getTask(taskId): Promise<Task | null>

// Create new task
createTask(data): Promise<Task>

// Update task fields
updateTask(taskId, data): Promise<Task>

// Move task between columns
moveTask(taskId, columnId, position): Promise<void>

// Add comment
addComment(taskId, content): Promise<Comment>

// Link entity
linkEntity(taskId, entityKind, entityId): Promise<TaskLink>
```

## Webhook Integration

### Endpoint

`POST /api/tasks/webhook`

### Supported Events

| Event | Tasks Created |
|-------|---------------|
| `order.created` | "Prepare order", "Ship order" |
| `scheduler.booking_created` | "Prep for call", "Follow up" |

### Task Creation Flow

1. Webhook receives event
2. Validates secret
3. Looks up default workspace/board/column
4. Creates tasks with metadata
5. Links tasks to source entity

## Default Seeds

### Workspace

- Slug: `ops`
- Name: Operations

### Board

- Slug: `operations`
- Name: Operations Board

### Columns

| Position | Slug | Name | Is Done |
|----------|------|------|---------|
| 0 | inbox | Inbox | false |
| 1 | ready | Ready | false |
| 2 | doing | In Progress | false |
| 3 | waiting | Waiting | false |
| 4 | done | Done | true |

## Future Enhancements

1. **Subtasks**: Hierarchical task breakdown
2. **Templates**: Reusable task templates
3. **Automation Rules**: Trigger-based task creation
4. **Time Tracking**: Log time spent on tasks
5. **Recurring Tasks**: Scheduled task generation
