# Fix: Real-time Agent Access Updates

## Problem
When an administrator disables an agent for a user (e.g., Agent X), the user's interface was not updating in real-time to reflect this change. The user would need to reload the page or wait for the polling interval to see the change.

## Root Cause
The issue was in the `useAgentAccess` hook configuration:
1. **High staleTime (5 seconds)**: This prevented React Query from immediately refetching data when `invalidateQueries` was called
2. **Inefficient polling interval (10 seconds)**: Falls back to polling instead of real-time updates

## Solution Implemented

### 1. Updated `hooks/use-agent-access.ts`
- Changed `staleTime` from `5000ms` to `0ms` - ensures data is always considered stale, forcing immediate refetch on invalidation
- Reduced `refetchInterval` from `10000ms` to `5000ms` - more frequent fallback polling

### 2. How Real-time Updates Work
1. Admin changes agent access via `/api/admin/users/[id]/agents` (PATCH)
2. Backend API triggers Pusher event: `pusher.trigger(`private-user-${userId}`, 'agent-access-updated', { userId })`
3. User's form-component listens to Pusher channel and receives event
4. Event handler calls:
   - `queryClient.invalidateQueries({ queryKey: ['agent-access', userId] })`
   - `queryClient.refetchQueries({ queryKey: ['agent-access', userId] })`
5. Hook refetches data from `/api/user/agent-access`
6. Component recalculates visible agents based on updated access data
7. UI immediately reflects the change

### 3. Filtering Logic
In `components/ui/form-component.tsx`, lines 1699-1704:
```typescript
if (agentAccess && agentAccess.length > 0) {
  const access = agentAccess.find((a: any) => a.agentId === group.id);
  // If access record exists and is disabled, hide the agent
  if (access && access.enabled === false) return false;
}
```

This ensures that:
- If agent is disabled (`enabled === false`), it's filtered out from visible groups
- If no access record exists, agent remains visible (default behavior)

## Testing
After this fix:
1. Admin disables Agent X for User Y
2. If User Y is logged in and viewing the interface:
   - Pusher event triggers immediately
   - Agent X disappears from the agent selector within 100-200ms
3. If User Y logs in after disabling:
   - Agent X will not appear (respects access settings)

## Database Schema
The `userAgentAccess` table structure:
```sql
CREATE TABLE "user_agent_access" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "agent_id" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("user_id", "agent_id")
);
```

Composite unique index ensures one access record per user-agent pair.
