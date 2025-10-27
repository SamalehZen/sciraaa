# Integration Guide: Real-time Agent Access Control

## Overview
This system implements a complete real-time agent access control mechanism that immediately disables agents when an admin changes their status.

## Architecture

### 1. Frontend Components

#### `hooks/use-agent-access-realtime.ts`
Main hook for real-time monitoring with dual delivery:
- **WebSocket (Primary)**: Via Pusher for instant updates
- **Polling (Fallback)**: Every 5 seconds if WebSocket fails

```typescript
useAgentAccessRealtime({
  userId: session?.user?.id,
  currentAgent: selectedModel,
  onAgentDisabled: (agentId) => {
    // Handle agent disabling
  },
  onMultipleAgentsDisabled: (agentIds) => {
    // Handle multiple agents disabling
  }
})
```

#### `components/agent-status-monitor.tsx`
Wrapper component that monitors agent status changes.

```typescript
<AgentStatusMonitor 
  currentAgent={selectedModel}
  onAgentDisabled={handleAgentDisabled}
>
  {children}
</AgentStatusMonitor>
```

#### `components/agent-disabler-guard.tsx`
Guard component that stops active chats if agent becomes unavailable.

```typescript
<AgentDisablerGuard 
  selectedModel={selectedModel}
  onStopChat={stopChatFunction}
>
  {children}
</AgentDisablerGuard>
```

### 2. Backend APIs

#### POST/PATCH `/api/admin/users/[id]/agents`
**Admin endpoint to update agent access**

Request:
```json
{
  "agents": {
    "agent-id-1": false,
    "agent-id-2": true,
    "agent-id-3": false
  }
}
```

Response:
```json
{
  "success": true,
  "message": "1 agents enabled, 2 agents disabled",
  "data": {
    "userId": "user-123",
    "agents": {...},
    "pusherTriggered": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/admin/users/[id]/agents`
**Get current agent access status for a user**

Response:
```json
{
  "success": true,
  "data": [
    { "agentId": "web", "enabled": true },
    { "agentId": "x", "enabled": false },
    ...
  ],
  "count": 16
}
```

#### GET `/api/user/agent-access`
**Get current user's agent access status**

Response: Same format as admin endpoint

### 3. Real-time Flow

```
Admin Panel (Admin Disables Agent)
        ↓
PATCH /api/admin/users/[id]/agents
        ↓
Backend:
  - Updates database
  - Logs event
  - Sends Pusher event
        ↓
Pusher Channel: private-user-{encodedUserId}
        ↓
User Frontend receives event
        ↓
Hook: useAgentAccessRealtime
  - Detects change
  - Calls callbacks
  - Invalidates React Query
        ↓
Component: AgentStatusMonitor
  - Notifies user
  - Clears localStorage
  - Dispatches custom events
        ↓
Component: AgentDisablerGuard
  - Detects current agent disabled
  - Stops active chat
  - Shows notification
        ↓
UI Updates:
  - Agent disappears from selector
  - Chat stops if active
  - User sees toast notification
```

## Implementation Steps

### Step 1: Add Components to Layout
In your main layout or app component:

```typescript
import { AgentStatusMonitor } from '@/components/agent-status-monitor';
import { AgentDisablerGuard } from '@/components/agent-disabler-guard';

export default function RootLayout({ children }) {
  return (
    <AgentStatusMonitor>
      <AgentDisablerGuard>
        {children}
      </AgentDisablerGuard>
    </AgentStatusMonitor>
  );
}
```

### Step 2: Integrate with Chat Component
Pass the required props:

```typescript
<AgentDisablerGuard 
  selectedModel={selectedModel}
  onStopChat={() => stop()}
>
  <ChatInterface 
    selectedModel={selectedModel}
    stop={stop}
    // ... other props
  />
</AgentDisablerGuard>
```

### Step 3: Use the Hooks
In form-component or custom hooks:

```typescript
const { data: agentAccess } = useAgentAccess();
useAgentAccessRealtime({
  userId: session?.user?.id,
  currentAgent: selectedModel,
  onAgentDisabled: (agentId) => {
    console.log(`Agent ${agentId} disabled`);
  }
});
```

## Event System

Custom events dispatched for flexibility:

### `agent-disabled` Event
Fired when a single agent is disabled:
```typescript
window.addEventListener('agent-disabled', (e) => {
  const agentId = e.detail.agentId;
  const timestamp = e.detail.timestamp;
});
```

### `agents-disabled` Event
Fired when multiple agents are disabled:
```typescript
window.addEventListener('agents-disabled', (e) => {
  const agentIds = e.detail.agentIds;
  const timestamp = e.detail.timestamp;
});
```

### `agent-became-unavailable` Event
Fired when the selected agent becomes unavailable:
```typescript
window.addEventListener('agent-became-unavailable', (e) => {
  const agentId = e.detail.agentId;
});
```

## Fallback Mechanism

### When WebSocket Fails:
1. Console logs warning: `[REALTIME] Pusher unavailable, will use polling fallback`
2. Polling starts: Checks agent access every 5 seconds
3. On detection: Triggers same handlers as WebSocket
4. User experience: Slight delay (max 5 seconds) but still works

### Configuration:
- **Polling interval**: 5 seconds (in `use-agent-access-realtime.ts`)
- **React Query staleTime**: 0ms (forces immediate refetch)
- **Garbage collection**: 10 minutes

## Logging

All operations are logged with prefixes for easy filtering:

- `[REALTIME]` - Real-time monitoring
- `[ADMIN-AGENTS]` - Admin API operations
- `[USER-AGENTS]` - User API operations
- `[AGENT-STATUS]` - Status monitor operations
- `[AGENT-GUARD]` - Guard component operations

Example log sequence:
```
[REALTIME] Setting up WebSocket listener on: private-user-abc123
[REALTIME] WebSocket listener bound successfully
[ADMIN-AGENTS] Admin user123 updating agents for user user456
[ADMIN-AGENTS] Database updated for 2 agents
[ADMIN-AGENTS] Triggering Pusher on channel: private-user-xyz789
[ADMIN-AGENTS] Pusher event sent to user user456
[REALTIME] Received agent update via WebSocket
[REALTIME] Agents disabled: ['web', 'x']
[AGENT-STATUS] Agent web disabled - stopping interaction
[AGENT-GUARD] Current agent is among disabled agents!
```

## Testing Checklist

- [ ] Open two browsers: Admin & User
- [ ] Admin disables one agent
- [ ] User sees agent disappear immediately
- [ ] User sees toast notification
- [ ] Check console for `[REALTIME]` logs
- [ ] Test with Pusher disabled (block WebSocket in DevTools)
- [ ] Verify polling fallback works (max 5 second delay)
- [ ] Test disabling multiple agents
- [ ] Test re-enabling agents
- [ ] Test with currently selected agent
- [ ] Verify chat stops if active agent is disabled
- [ ] Test new users see disabled agents on login

## Database Schema

```sql
CREATE TABLE user_agent_access (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE TABLE event (
  id text PRIMARY KEY,
  category varchar NOT NULL,
  type text NOT NULL,
  message text,
  metadata json,
  user_id text REFERENCES user(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
```

## Performance Notes

1. **WebSocket**: ~100-200ms end-to-end latency
2. **Polling Fallback**: ~5 seconds maximum
3. **Database queries**: O(1) with indexed user_id
4. **Memory**: Minimal - single interval per user

## Security Considerations

1. ✅ All endpoints require authentication
2. ✅ Admin endpoint verifies admin role
3. ✅ User can only see their own access
4. ✅ All changes are audited in event log
5. ✅ Pusher channels are private and user-specific
6. ✅ No secrets exposed in client-side code

## Troubleshooting

### Problem: Agent doesn't disappear immediately
**Solutions**:
1. Check browser console for `[REALTIME]` logs
2. Verify Pusher channel name matches
3. Check that `staleTime: 0` in hook
4. Verify event is triggered from server
5. Test polling by blocking WebSocket

### Problem: Chat doesn't stop when agent disabled
**Solutions**:
1. Verify `onStopChat` prop passed to `AgentDisablerGuard`
2. Check that `stop` function is available in chat component
3. Verify event listeners are bound
4. Check for console errors

### Problem: Toast notification doesn't show
**Solutions**:
1. Verify `sonner` toast is configured
2. Check that Toaster component is rendered
3. Verify event handlers fire

## Future Enhancements

1. **Optimistic Updates**: Disable agent immediately without waiting for confirmation
2. **Batch Updates**: Support disabling/enabling groups of agents
3. **Scheduled Disabling**: Schedule agent disabling for future time
4. **Usage Analytics**: Track which agents are disabled most frequently
5. **Notifications**: Email/SMS notification when agent is disabled
6. **History**: Show history of agent status changes
