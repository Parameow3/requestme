// Supabase Edge Function to send push notifications
// Deploy with: supabase functions deploy send-push-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id?: string
  role?: string
  title: string
  body: string
  url?: string
  tag?: string
}

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

// Convert base64 VAPID key to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(b64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Send push notification using Web Push protocol
async function sendPushNotification(
  subscription: PushSubscription,
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For Deno/Edge Functions, we use the webpush library pattern
    // The actual implementation uses the Web Push protocol

    const pushData = JSON.stringify(payload)
    
    // Create the push message
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        // Note: Full VAPID implementation requires crypto operations
        // For production, use a proper web-push library
      },
      body: pushData,
    })

    if (!response.ok) {
      console.error('Push failed:', response.status, await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending push:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const payload: PushPayload = await req.json()
    
    let subscriptions: PushSubscription[] = []

    // Get subscriptions based on user_id or role
    if (payload.user_id) {
      const { data, error } = await supabase.rpc('get_push_subscriptions_for_user', {
        target_user_id: payload.user_id
      })
      if (error) throw error
      subscriptions = data || []
    } else if (payload.role) {
      const { data, error } = await supabase.rpc('get_push_subscriptions_for_role', {
        target_role: payload.role
      })
      if (error) throw error
      subscriptions = data || []
    }

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare the push payload
    const pushPayload = {
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      tag: payload.tag || 'expense-notification',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
    }

    // Send to all subscriptions
    let sent = 0
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const success = await sendPushNotification(sub, pushPayload, vapidPublicKey, vapidPrivateKey)
        if (success) sent++
        return success
      })
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
