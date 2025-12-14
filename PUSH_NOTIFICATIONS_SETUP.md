# Push Notifications Setup Guide

This guide will help you set up push notifications for iOS and Android devices when your app is installed as a PWA.

## Overview

The push notification system consists of:
1. **Service Worker** (`public/sw.js`) - Receives and displays push notifications
2. **Push Subscription** - Stored in Supabase when users enable notifications
3. **Edge Function** - Sends push notifications via the Web Push protocol
4. **Database Trigger** - Automatically calls the Edge Function when notifications are created

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push.

Run this command in your terminal:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nekm28
Private Key: your-private-key-here
```

## Step 2: Add Environment Variables

Add these to your `.env.local` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-from-step-1
VAPID_PRIVATE_KEY=your-private-key-from-step-1
```

Also add the private key to your **Supabase Edge Function Secrets**:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add these secrets:
   - `VAPID_PUBLIC_KEY` = your public key
   - `VAPID_PRIVATE_KEY` = your private key

## Step 3: Run the Database Setup

Go to your Supabase SQL Editor and run the contents of:

```
scripts/push-notifications-setup.sql
```

This will:
- Create the `push_subscriptions` table
- Set up Row Level Security policies
- Create helper functions
- Set up triggers to send push notifications

## Step 4: Deploy the Edge Function

First, install the Supabase CLI if you haven't:

```bash
npm install -g supabase
```

Login and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the edge function:

```bash
supabase functions deploy send-push-notification
```

## Step 5: Set Up Database Webhook (Alternative to Trigger)

If the pg_net trigger doesn't work, you can use Supabase Database Webhooks:

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Configure:
   - **Name**: `send-push-notification`
   - **Table**: `notifications`
   - **Events**: `INSERT`
   - **Type**: `Supabase Edge Function`
   - **Function**: `send-push-notification`

## How It Works

### User Flow:
1. User installs the app on their phone (Add to Home Screen)
2. A banner appears asking to enable push notifications
3. User clicks "Enable" → Browser asks for permission
4. If granted, the subscription is saved to `push_subscriptions` table

### Notification Flow:
1. An expense/PO status changes
2. The existing `handle_status_notification` trigger creates a row in `notifications`
3. The `handle_push_notification` trigger fires
4. It calls the `send-push-notification` Edge Function
5. The Edge Function sends push notifications to all subscribed devices
6. User's phone shows the notification even if the app is closed

## Testing Push Notifications

### Test from Supabase SQL Editor:

```sql
-- Insert a test notification for yourself
insert into notifications (user_id, message, link)
values ('YOUR_USER_ID', 'Test notification!', '/');
```

### Test from Edge Function:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "YOUR_USER_ID", "title": "Test", "body": "Hello from push!"}'
```

## iOS Specific Notes

⚠️ **Important for iOS (iPhone/iPad):**

1. Push notifications on iOS require **iOS 16.4 or later**
2. The app **must be installed** to the Home Screen (not just opened in Safari)
3. Users must grant permission when prompted
4. The app must be added via Safari (not Chrome on iOS)

To install on iOS:
1. Open your app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Open the app from your Home Screen
5. The notification permission prompt will appear

## Android Notes

Android has better PWA support:
1. When visiting the app, Chrome will show "Add to Home Screen" prompt
2. Install the app
3. Enable notifications when prompted

## Troubleshooting

### Notifications not showing?

1. **Check browser console** for errors
2. **Verify VAPID keys** are set correctly
3. **Check notification permission** - must be "granted"
4. **iOS users** - must be iOS 16.4+ and app installed to Home Screen
5. **Check Edge Function logs** in Supabase Dashboard

### "Push subscription failed"?

1. Make sure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set
2. Check that the service worker is registered
3. Try clearing site data and re-enabling

### Edge Function not receiving calls?

1. Check if pg_net extension is enabled
2. Use Database Webhooks as an alternative
3. Check Edge Function logs for errors

## Files Created

- `public/sw.js` - Service Worker
- `lib/pushNotifications.ts` - Push notification utilities
- `components/PushNotificationManager.tsx` - UI for enabling notifications
- `supabase/functions/send-push-notification/index.ts` - Edge Function
- `scripts/push-notifications-setup.sql` - Database setup
