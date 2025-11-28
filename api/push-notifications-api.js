// =====================================================
// PUSH NOTIFICATIONS API
// =====================================================
// Web Push notifications for tournaments, messages, bookings
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@gulfcoastcharters.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{ action: string; title: string }>
}

Deno.serve(async (req) => {
  const { action, userId, payload } = await req.json()

  try {
    switch (action) {
      case 'send_notification':
        return await sendPushNotification(userId, payload)
      
      case 'subscribe':
        return await subscribePush(userId, payload.subscription)
      
      case 'unsubscribe':
        return await unsubscribePush(userId, payload.endpoint)
      
      case 'send_bulk':
        return await sendBulkNotifications(payload.userIds, payload.notification)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================
// SEND PUSH NOTIFICATION
// =====================================================

async function sendPushNotification(userId: string, payload: PushPayload) {
  // Get user's push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !subscriptions || subscriptions.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'No active subscriptions' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const results = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        JSON.stringify(payload)
      )

      results.push({ endpoint: sub.endpoint, success: true })
    } catch (error: any) {
      console.error(`Failed to send to ${sub.endpoint}:`, error)
      
      // If subscription is invalid, deactivate it
      if (error.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', sub.id)
      }

      results.push({ endpoint: sub.endpoint, success: false, error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// SUBSCRIBE TO PUSH
// =====================================================

async function subscribePush(userId: string, subscription: any) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      is_active: true
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, message: 'Subscription saved' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// UNSUBSCRIBE FROM PUSH
// =====================================================

async function unsubscribePush(userId: string, endpoint: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, message: 'Unsubscribed' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// BULK NOTIFICATIONS
// =====================================================

async function sendBulkNotifications(userIds: string[], notification: PushPayload) {
  const results = []

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification)
    results.push({ userId, result: await result.json() })
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// HELPER FUNCTIONS - NOTIFICATION TEMPLATES
// =====================================================

export const NOTIFICATION_TEMPLATES = {
  newMessage: (senderName: string) => ({
    title: 'New Message',
    body: `${senderName} sent you a message`,
    icon: '/icons/message.png',
    tag: 'new-message',
    data: { type: 'message' }
  }),

  bookingConfirmed: (charterName: string) => ({
    title: 'Booking Confirmed!',
    body: `Your trip "${charterName}" has been confirmed`,
    icon: '/icons/booking.png',
    tag: 'booking-confirmed',
    data: { type: 'booking' }
  }),

  weatherAlert: (level: string) => ({
    title: `Weather Alert: ${level}`,
    body: 'Check conditions for your upcoming trip',
    icon: '/icons/weather.png',
    badge: '/icons/badge-warning.png',
    tag: 'weather-alert',
    data: { type: 'weather' }
  }),

  tournamentUpdate: (message: string) => ({
    title: 'Tournament Update',
    body: message,
    icon: '/icons/tournament.png',
    tag: 'tournament-update',
    data: { type: 'tournament' }
  }),

  badgeEarned: (badgeName: string) => ({
    title: 'New Badge Unlocked!',
    body: `You earned the "${badgeName}" badge`,
    icon: '/icons/badge.png',
    tag: 'badge-earned',
    data: { type: 'badge' }
  })
}

export { sendPushNotification, subscribePush, unsubscribePush }
