/**
 * PUSH NOTIFICATIONS API
 * Send push notifications for tournament updates
 */

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// VAPID keys for web push (generate with: npx web-push generate-vapid-keys)
webpush.setVapidDetails(
  'mailto:support@gulfcoastcharters.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to user
 */
async function sendPushNotification(userId, payload) {
  try {
    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);
    
    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, message: 'No active subscriptions' };
    }
    
    const results = [];
    
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };
        
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        
        results.push({ subscription_id: sub.id, success: true });
        
        // Update last used
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
        
      } catch (error) {
        console.error('Push failed for subscription:', sub.id, error);
        
        // If subscription is invalid, deactivate it
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id);
        }
        
        results.push({ subscription_id: sub.id, success: false, error: error.message });
      }
    }
    
    return {
      success: true,
      results: results,
      total_sent: results.filter(r => r.success).length
    };
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send tournament update to all participants
 */
async function sendTournamentUpdate(tournamentId, updateData) {
  try {
    // Get all tournament participants with push enabled
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select(`
        user_id,
        user_notification_preferences!inner(
          push_enabled,
          push_tournament_catches
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'active');
    
    if (!participants || participants.length === 0) {
      return { success: true, notifications_sent: 0 };
    }
    
    // Filter users who want this type of notification
    const notificationType = updateData.update_type;
    const eligibleUsers = participants.filter(p => {
      const prefs = p.user_notification_preferences;
      if (!prefs.push_enabled) return false;
      
      switch (notificationType) {
        case 'catch':
          return prefs.push_tournament_catches;
        case 'fish_biting':
          return prefs.push_fish_biting;
        case 'hot_spot':
          return prefs.push_hot_spots;
        case 'pro_tip':
          return prefs.push_pro_tips;
        default:
          return true;
      }
    });
    
    // Prepare notification payload
    const payload = {
      title: updateData.title || 'Tournament Update',
      message: updateData.message,
      icon: '/icons/tournament-icon.png',
      image: updateData.photo_url,
      url: `/tournaments/${tournamentId}`,
      tournament_id: tournamentId,
      update_id: updateData.id,
      tag: `tournament-${tournamentId}`,
      data: updateData
    };
    
    // Send to all eligible users
    let sentCount = 0;
    const sendPromises = eligibleUsers.map(async (participant) => {
      const result = await sendPushNotification(participant.user_id, payload);
      if (result.success) sentCount++;
    });
    
    await Promise.all(sendPromises);
    
    // Log the broadcast
    await supabase
      .from('tournament_updates')
      .update({
        push_sent: true,
        push_sent_at: new Date().toISOString(),
        push_recipient_count: sentCount
      })
      .eq('id', updateData.id);
    
    return {
      success: true,
      notifications_sent: sentCount,
      eligible_users: eligibleUsers.length
    };
    
  } catch (error) {
    console.error('Error sending tournament update:', error);
    throw error;
  }
}

/**
 * Subscribe user to push notifications
 */
async function subscribeToPush(userId, subscription, deviceInfo = {}) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: deviceInfo.userAgent,
        device_type: deviceInfo.deviceType,
        active: true
      });
    
    if (error) throw error;
    
    return { success: true };
    
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
async function unsubscribeFromPush(userId, endpoint) {
  try {
    await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
}

module.exports = {
  sendPushNotification,
  sendTournamentUpdate,
  subscribeToPush,
  unsubscribeFromPush
};
