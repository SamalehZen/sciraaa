# Testing DateSpot Manual Guide

This document outlines the steps to manually test the **DateSpot** feature in Sciraaa.

## Prerequisites

Ensure the following environment variables are set in your `.env.local`:

```env
# Database Connection
DATABASE_URL="postgresql://..."

# Real-time Services
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."

# Location & Places
SERPER_API_KEY="..."
```

## Database Setup

Before testing, ensure the database schema is up to date:

```bash
pnpm db:push
```

## Test Scenarios

### 1. User Flow: Create a Couple

1. **Login** to the application.
2. **Navigate** to `/datespot`.
3. You should see options to "Create Couple" or "Join with Code".
4. **Click** "Create Couple".
5. **Verify** that a 6-character code is generated and displayed (e.g., `ABC123`).
6. **Copy** this code.

### 2. Partner Flow: Join a Couple

1. **Open** an Incognito window or use a second browser.
2. **Login** as a *different* user.
3. **Navigate** to `/datespot`.
4. **Click** "Join with Code".
5. **Enter** the code copied in step 1.
6. **Verify** you are redirected to the Couple Dashboard (`/datespot/couple/[coupleId]`).
7. The dashboard should welcome both users ("Lovebirds").

### 3. Session Creation

1. On the **Primary User's** device:
2. **Click** "Find a Spot Nearby" (or "New Adventure").
3. **Select** a "Vibe" (Eat, Coffee, Drinks).
4. **Use** the map to pick a location (default is your current location/Paris).
5. **Click** "Start Swiping!".
6. **Verify** you are redirected to the swiping interface (`.../session/[sessionId]`).

### 4. Real-time Swiping

1. **Observe** both screens.
2. Additional places should load.
3. **Swipe Right** (Like) on a place on Device A.
4. **Swipe Left** (Dislike) on the same place on Device B.
   - Result: No match. Card disappears.
5. **Swipe Right** (Like) on a specific place (e.g. "Le Café Populaire") on Device A.
6. **Swipe Right** (Like) on the *same* place on Device B.
7. **Verify** Match Celebration screen triggers on **BOTH** devices instantly via Pusher.

### 5. Post-Match

1. From the Celebration screen, checking details.
2. Click "Continue" to return or see history (if implemented).

## Troubleshooting

- **Maps not loading**: Check internet connection (Leaflet loads tiles from CDN).
- **No places found**: Check `SERPER_API_KEY` and ensure you are pointing to a populated area.
- **Swipes not syncing**: Check Pusher console for connection errors or verify `PUSHER_` env vars.
