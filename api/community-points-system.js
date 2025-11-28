// =====================================================
// COMMUNITY POINTS & GAMIFICATION SYSTEM
// =====================================================
// Purpose: Award points, badges, track streaks, manage leaderboards
// Features: 20+ badges, 5 trust levels, daily streaks, rankings
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// POINTS CONFIGURATION
// =====================================================

const POINTS_CONFIG = {
  // Booking actions
  FIRST_BOOKING: 50,
  BOOKING_COMPLETED: 25,
  REPEAT_BOOKING: 15,
  
  // Review actions
  WRITE_REVIEW: 20,
  ADD_PHOTOS_TO_REVIEW: 10,
  HELPFUL_REVIEW: 5,
  
  // Social actions
  REFERRAL: 100,
  SHARE_TRIP: 10,
  TOURNAMENT_ENTRY: 50,
  TOURNAMENT_WIN: 500,
  
  // Engagement
  DAILY_LOGIN: 5,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_30: 200,
  PROFILE_COMPLETE: 30,
  
  // Content
  UPLOAD_CATCH_PHOTO: 15,
  SPECIES_LOGGED: 10,
  LOCATION_SHARED: 5
}

// Trust levels based on total points
const TRUST_LEVELS = [
  { level: 1, name: 'new', min_points: 0, max_points: 99 },
  { level: 2, name: 'member', min_points: 100, max_points: 499 },
  { level: 3, name: 'regular', min_points: 500, max_points: 1499 },
  { level: 4, name: 'veteran', min_points: 1500, max_points: 4999 },
  { level: 5, name: 'legend', min_points: 5000, max_points: Infinity }
]

// Badge definitions
const BADGES = [
  {
    name: 'First Catch',
    description: 'Completed your first charter booking',
    icon: '🎣',
    points_required: 0,
    rarity: 'common',
    trigger: 'first_booking'
  },
  {
    name: 'Early Adopter',
    description: 'Joined Gulf Coast Charters in the first month',
    icon: '🚀',
    points_required: 0,
    rarity: 'uncommon',
    trigger: 'early_signup'
  },
  {
    name: 'Review Master',
    description: 'Left 10+ helpful reviews',
    icon: '⭐',
    points_required: 100,
    rarity: 'rare',
    trigger: 'review_count_10'
  },
  {
    name: 'Social Butterfly',
    description: 'Referred 5+ friends',
    icon: '🦋',
    points_required: 500,
    rarity: 'rare',
    trigger: 'referral_count_5'
  },
  {
    name: 'Tournament Victor',
    description: 'Won your first tournament',
    icon: '🏆',
    points_required: 500,
    rarity: 'epic',
    trigger: 'tournament_win'
  },
  {
    name: 'Streak Master',
    description: 'Maintained a 30-day login streak',
    icon: '🔥',
    points_required: 200,
    rarity: 'epic',
    trigger: 'streak_30'
  },
  {
    name: 'Captain\'s Favorite',
    description: 'Received 5-star reviews from 10+ captains',
    icon: '💎',
    points_required: 1000,
    rarity: 'legendary',
    trigger: 'perfect_rating_10'
  },
  {
    name: 'Grand Slam',
    description: 'Caught all target species in one trip',
    icon: '🎯',
    points_required: 300,
    rarity: 'epic',
    trigger: 'grand_slam'
  },
  {
    name: 'Weatherproof',
    description: 'Completed 20+ trips in all conditions',
    icon: '⛈️',
    points_required: 500,
    rarity: 'rare',
    trigger: 'trip_count_20'
  },
  {
    name: 'Photo Pro',
    description: 'Uploaded 100+ catch photos',
    icon: '📸',
    points_required: 1500,
    rarity: 'epic',
    trigger: 'photo_count_100'
  }
]

// =====================================================
// MAIN API HANDLER
// =====================================================

Deno.serve(async (req) => {
  const { action, userId, data } = await req.json()

  try {
    switch (action) {
      case 'award_points':
        return await awardPoints(userId, data.points, data.reason, data.action_type, data.reference_id)
      
      case 'check_badges':
        return await checkAndAwardBadges(userId)
      
      case 'update_streak':
        return await updateLoginStreak(userId)
      
      case 'get_leaderboard':
        return await getLeaderboard(data.period, data.limit)
      
      case 'get_user_stats':
        return await getUserStats(userId)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================
// AWARD POINTS
// =====================================================

async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  actionType: string,
  referenceId?: string
) {
  // Create transaction record
  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      points: points,
      reason: reason,
      action_type: actionType,
      reference_id: referenceId
    })

  if (txError) throw txError

  // Update or create user_points record
  const { data: userPoints, error: fetchError } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

  const newTotal = (userPoints?.total_points || 0) + points
  const newLevel = calculateLevel(newTotal)
  const trustLevel = calculateTrustLevel(newTotal)

  if (userPoints) {
    // Update existing
    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        total_points: newTotal,
        level: newLevel,
        trust_level: trustLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) throw updateError
  } else {
    // Create new
    const { error: insertError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: newTotal,
        level: newLevel,
        trust_level: trustLevel
      })

    if (insertError) throw insertError
  }

  // Check for badge achievements
  await checkAndAwardBadges(userId)

  // Update leaderboards
  await updateLeaderboards(userId, newTotal)

  // Send notification
  await sendPointsNotification(userId, points, reason)

  return new Response(
    JSON.stringify({
      success: true,
      total_points: newTotal,
      level: newLevel,
      trust_level: trustLevel,
      points_awarded: points
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// BADGE SYSTEM
// =====================================================

async function checkAndAwardBadges(userId: string) {
  const newBadges: string[] = []

  // Get user stats
  const { data: userPoints } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id, badges(name)')
    .eq('user_id', userId)

  const earnedBadgeNames = userBadges?.map(ub => ub.badges?.name) || []

  // Get all badge definitions
  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')

  // Check each badge
  for (const badge of allBadges || []) {
    if (earnedBadgeNames.includes(badge.name)) continue

    let shouldAward = false

    // Check trigger conditions
    switch (badge.trigger) {
      case 'first_booking':
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', userId)
        shouldAward = bookingCount && bookingCount >= 1
        break

      case 'review_count_10':
        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', userId)
        shouldAward = reviewCount && reviewCount >= 10
        break

      case 'referral_count_5':
        // Check referral count (would need referral tracking table)
        break

      case 'streak_30':
        shouldAward = userPoints?.streak_days >= 30
        break

      case 'trip_count_20':
        const { count: tripCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', userId)
          .eq('status', 'completed')
        shouldAward = tripCount && tripCount >= 20
        break

      // Add more trigger checks...
    }

    if (shouldAward && userPoints.total_points >= badge.points_required) {
      // Award badge
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id
        })

      newBadges.push(badge.name)

      // Award badge bonus points
      await awardPoints(
        userId,
        badge.rarity === 'legendary' ? 500 :
        badge.rarity === 'epic' ? 200 :
        badge.rarity === 'rare' ? 100 : 50,
        `Earned "${badge.name}" badge`,
        'badge',
        badge.id
      )

      // Send notification
      await sendBadgeNotification(userId, badge)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      new_badges: newBadges
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// STREAK TRACKING
// =====================================================

async function updateLoginStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: userPoints } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userPoints) {
    // First login ever
    await supabase.from('user_points').insert({
      user_id: userId,
      streak_days: 1,
      last_activity_date: today,
      total_points: POINTS_CONFIG.DAILY_LOGIN
    })

    return
  }

  const lastActivity = userPoints.last_activity_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = userPoints.streak_days || 0
  let bonusPoints = 0

  if (lastActivity === today) {
    // Already logged in today, no change
    return
  } else if (lastActivity === yesterdayStr) {
    // Consecutive day - increment streak
    newStreak += 1

    // Award streak bonuses
    if (newStreak === 7) {
      bonusPoints = POINTS_CONFIG.STREAK_BONUS_7
    } else if (newStreak === 30) {
      bonusPoints = POINTS_CONFIG.STREAK_BONUS_30
    }
  } else {
    // Streak broken - reset to 1
    newStreak = 1
  }

  // Update streak
  await supabase
    .from('user_points')
    .update({
      streak_days: newStreak,
      last_activity_date: today
    })
    .eq('user_id', userId)

  // Award daily login points
  await awardPoints(
    userId,
    POINTS_CONFIG.DAILY_LOGIN + bonusPoints,
    bonusPoints > 0 ? `${newStreak}-day streak bonus!` : 'Daily login',
    'streak'
  )
}

// =====================================================
// LEADERBOARDS
// =====================================================

async function updateLeaderboards(userId: string, totalPoints: number) {
  const periods = ['daily', 'weekly', 'monthly', 'all_time']

  for (const period of periods) {
    await supabase
      .from('leaderboards')
      .upsert({
        user_id: userId,
        period: period,
        points: totalPoints,
        rank: await calculateRank(userId, period)
      })
  }
}

async function getLeaderboard(period: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('leaderboards')
    .select(`
      rank,
      points,
      users (
        id,
        full_name,
        avatar_url
      ),
      user_points (
        level,
        trust_level
      )
    `)
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, leaderboard: data }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function calculateRank(userId: string, period: string): Promise<number> {
  const { data } = await supabase
    .from('leaderboards')
    .select('points')
    .eq('period', period)
    .order('points', { ascending: false })

  const userPoints = data?.find(entry => entry.user_id === userId)?.points || 0
  const rank = data?.filter(entry => entry.points > userPoints).length || 0

  return rank + 1
}

// =====================================================
// USER STATS
// =====================================================

async function getUserStats(userId: string) {
  const { data: userPoints } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      badges (
        name,
        description,
        icon,
        rarity
      )
    `)
    .eq('user_id', userId)

  const { data: recentTransactions } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const pointsToNextLevel = calculatePointsToNextLevel(userPoints?.total_points || 0)

  return new Response(
    JSON.stringify({
      success: true,
      stats: {
        total_points: userPoints?.total_points || 0,
        level: userPoints?.level || 1,
        trust_level: userPoints?.trust_level || 'new',
        streak_days: userPoints?.streak_days || 0,
        badges: badges || [],
        recent_transactions: recentTransactions || [],
        points_to_next_level: pointsToNextLevel
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

function calculateTrustLevel(points: number): string {
  const level = TRUST_LEVELS.find(
    l => points >= l.min_points && points <= l.max_points
  )
  return level?.name || 'new'
}

function calculatePointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints)
  const nextLevelPoints = currentLevel * 100
  return nextLevelPoints - currentPoints
}

async function sendPointsNotification(userId: string, points: number, reason: string) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `+${points} points earned!`,
    message: reason,
    type: 'badge'
  })
}

async function sendBadgeNotification(userId: string, badge: any) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `New badge unlocked: ${badge.icon} ${badge.name}`,
    message: badge.description,
    type: 'badge'
  })
}

// =====================================================
// EXPORTS
// =====================================================

export {
  awardPoints,
  checkAndAwardBadges,
  updateLoginStreak,
  getLeaderboard,
  getUserStats,
  POINTS_CONFIG,
  TRUST_LEVELS,
  BADGES
}
