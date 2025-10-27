# Testing Agent Access Real-time Updates

## Overview
This guide explains how to test the real-time agent access update system.

## Test Scenario 1: Basic Disabling
**Goal**: Verify that when an admin disables an agent for a user, the user immediately sees it removed from their interface.

### Steps:
1. Open two browser windows/tabs:
   - Window A: Admin user logged in, at `/admin/users`
   - Window B: Regular user logged in, viewing the main chat interface

2. In Window A (Admin):
   - Find the regular user in the users table
   - Click on the user row to open the agent access dialog
   - Uncheck one agent (e.g., "web")
   - You should see a toast: "Accès agent mis à jour"

3. In Window B (User):
   - The agent should disappear from the agent selector within 100-200ms
   - If using browser DevTools:
     - Open Console tab
     - Look for logs starting with `[AGENT-ACCESS]`
     - You should see: `[AGENT-ACCESS] Agent access updated via Pusher`
     - Followed by: `[AGENT-ACCESS] Data refetched successfully`

### Expected Output in Console:
```
[AGENT-ACCESS] Subscribing to channel: private-user-<encodedId>
[AGENT-ACCESS] Bound to agent-access-updated event
[AGENT-ACCESS] Agent access updated via Pusher {userId: "...", agents: {...}, timestamp: "..."}
[AGENT-ACCESS] Data refetched successfully
```

## Test Scenario 2: Multiple Agents
**Goal**: Verify that multiple agents can be disabled at once.

### Steps:
1. Same setup as Scenario 1
2. In Window A (Admin):
   - Disable 3-4 agents at once
   - Click the checkboxes in the agent access dialog

3. In Window B (User):
   - All disabled agents should disappear immediately

## Test Scenario 3: Re-enabling
**Goal**: Verify that re-enabling agents works in real-time.

### Steps:
1. Same as above, but re-enable agents instead of disabling them
2. Verify that agents reappear in the selector

## Test Scenario 4: Fallback Polling
**Goal**: Verify that polling works if Pusher fails.

### Steps:
1. Open DevTools Network tab in Window B
2. Block WebSocket connections (simulate Pusher failure)
3. In Window A: Disable an agent
4. In Window B: 
   - Console should show: `[AGENT-ACCESS] Pusher not available, relying on polling`
   - The agent should disappear within 5 seconds (polling interval)

## Debugging

### Check Pusher Connection
In browser console:
```javascript
// Should return the Pusher client instance
window.__PUSHER_CLIENT
```

### Check Channel Subscription
```javascript
// Get all subscribed channels
Object.keys(window.__PUSHER_CLIENT.channels.channels)
// Should include something like: "private-user-<encodedId>"
```

### Check Query Cache
```javascript
// In React Query DevTools
// Query key: ['agent-access', '<userId>']
// Should have fresh data after update
```

## Common Issues

### Issue 1: Agent doesn't disappear after admin disables it
- **Cause**: Pusher event not received or query not refetching
- **Fix**:
  1. Check browser console for `[AGENT-ACCESS]` logs
  2. Verify Pusher channel name matches between server and client
  3. Check that `staleTime: 0` is set in useAgentAccess hook
  4. Verify event is being sent from server logs

### Issue 2: Agent reappears after refresh
- **Cause**: Database not updated correctly
- **Fix**:
  1. Check that the agent access record was updated in DB
  2. Verify `updateUserAgentAccess` function was called
  3. Check for database errors in server logs

### Issue 3: Real-time update works but Admin dialog doesn't show changes
- **Cause**: Dialog has its own query cache
- **Fix**:
  1. The dialog should refetch when the update happens (line 45 in agent-access-dialog.tsx)
  2. Verify that Pusher events are being received on admin channel
  3. Consider adding real-time subscription to dialog component

## Performance Considerations

1. **staleTime: 0** - Data is always refetched when invalidated. This is important for real-time updates but means every change triggers a network request.

2. **refetchInterval: 5000** - Fallback polling every 5 seconds if Pusher fails. Can be adjusted based on needs.

3. **Pusher Rate Limits** - Be aware that Pusher has rate limits. For high-volume updates, consider batching.

## Future Improvements

1. Add Pusher subscription to admin dialog to see changes from other admins in real-time
2. Add optimistic UI updates (immediately hide agent while request is in flight)
3. Add retry logic for failed Pusher events
4. Consider using Server-Sent Events (SSE) as fallback instead of polling
