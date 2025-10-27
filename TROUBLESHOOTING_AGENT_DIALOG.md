# Troubleshooting: Agent Access Dialog Error

## Problem
When trying to open the agent access management dialog ("Gérer les agents"), the page shows "Something went wrong" error.

## Improvements Made

### 1. **URL Encoding Fix**
- Fixed: `userId` wasn't being URL-encoded when fetching agent data
- Solution: Added `encodeURIComponent(userId)` to all fetch calls

### 2. **Error Boundary**
- Added: `AgentAccessDialogErrorBoundary` component to catch and safely display errors
- Prevents: Full page crash if dialog component has render errors

### 3. **Improved Error Handling**
- Enhanced: Better error messages in dialog UI
- Added: Detailed logging with `[AGENT-DIALOG]` prefix
- Improved: API route now initializes agent access if records don't exist

### 4. **Better Robustness**
- Fixed: useMemo error handling with try-catch
- Added: Safe property access for agent records
- Improved: Fetch error message details

## Debugging Steps

### Step 1: Check Browser Console
1. Open the page `admin/users`
2. Open **Developer Tools** (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Click on a user's "Gérer les agents" button
5. Look for messages with `[AGENT-DIALOG]` prefix

### Step 2: Check API Response
1. Open **Developer Tools** → **Network** tab
2. Filter by "agents" 
3. Click "Gérer les agents"
4. Look for request to `/api/admin/users/[id]/agents`
5. Check the response:
   - Should see status `200`
   - Should see JSON with `{ success: true, data: [...], count: ... }`

### Step 3: Verify Authentication
1. The user performing this action **must be an admin**
2. Check in console for logs with `[ADMIN-AGENTS]` prefix
3. If you see `401 unauthorized`, the session may have expired

### Step 4: Check Database
1. Verify the `user_agent_access` table exists
2. Check if records exist for the target user:
   ```sql
   SELECT * FROM user_agent_access WHERE user_id = 'local:username';
   ```
3. If no records, the API will initialize them automatically

## Console Log Format

**When opening the dialog, you should see:**
```
[ADMIN-USERS] Opening agent dialog for user: local:john
[AGENT-DIALOG] Dialog opened with userId: local:john open: true
[AGENT-DIALOG] Fetching agents for user: local:john
[AGENT-DIALOG] Fetch URL: /api/admin/users/local%3Ajohn/agents
[AGENT-DIALOG] Response status: 200 OK
[AGENT-DIALOG] API response: { success: true, data: [...], count: 16 }
[AGENT-DIALOG] Building agents list, access: [...]
```

**If there's an error, you'll see:**
```
[AGENT-DIALOG] Fetch error: Error: HTTP 401: Unauthorized
[AGENT-DIALOG-EB] Error caught: Error: ...
```

## Common Issues & Solutions

### Issue: "HTTP 401: Unauthorized"
**Cause:** Admin session expired or user is not admin
**Solution:** 
- Refresh the page and login again
- Verify user has admin role: `ALTER TABLE user SET role='admin' WHERE id='local:username';`

### Issue: "Failed to parse JSON"
**Cause:** API returned non-JSON response
**Solution:**
- Check server logs
- Verify database connection
- Ensure route.ts file is correct

### Issue: "Network error"
**Cause:** Cannot reach API endpoint
**Solution:**
- Check if server is running
- Verify Network tab in DevTools
- Check CORS headers if applicable

### Issue: Empty agents list
**Cause:** No access records in database for user
**Solution:** 
- Automatic: Should initialize when fetching
- Manual: Run: `call initializeUserAgentAccess('local:username');`

## Testing Checklist

- [ ] Open admin/users page
- [ ] Check browser console (F12)
- [ ] Click "Gérer les agents" on a user row
- [ ] Verify `[AGENT-DIALOG]` logs appear
- [ ] Verify API response is 200
- [ ] Dialog opens successfully
- [ ] Try checking/unchecking an agent
- [ ] Verify update succeeds
- [ ] Check browser console for any [AGENT-DIALOG] error messages

## If Problem Persists

1. **Collect Logs:**
   - Screenshot of console output with `[AGENT-DIALOG]` messages
   - Screenshot of Network tab showing API response

2. **Check Database:**
   ```sql
   -- Verify user exists
   SELECT id, name, role FROM "user" WHERE id LIKE 'local:%';
   
   -- Verify agent access records
   SELECT user_id, agent_id, enabled FROM user_agent_access LIMIT 5;
   ```

3. **Server Logs:**
   - Look for messages with `[ADMIN-AGENTS]` prefix
   - Check for database connection errors

## Recent Changes

**File: `components/admin/agent-access-dialog.tsx`**
- Added userId URL encoding
- Added refetchOnWindowFocus: false (prevent unnecessary refetch loops)
- Improved error display in UI
- Added better logging

**File: `app/api/admin/users/[id]/agents/route.ts`**
- Added auto-initialization of agent access
- Better error responses with details

**File: `app/admin/users/page.tsx`**
- Added error boundary around dialog
- Added logging when opening dialog

**File: `components/admin/agent-access-dialog-error-boundary.tsx`**
- New Error Boundary component
- Safely catches component rendering errors
