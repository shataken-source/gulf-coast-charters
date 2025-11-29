/**
 * COMMUNITY POINTS & GAMIFICATION SYSTEM
 * Award points, track badges, manage leaderboards
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Point values for different actions
const POINT_VALUES = {
  // Posts & Content
  fishing_report: 25,
  fishing_report_with_photo: 35,
  fishing_report_with_video: 50,
  helpful_answer: 50,
  comment: 5,
  
  // Bookings
  create_booking: 100,
  complete_booking: 50,
  review_captain: 15,
  review_with_photos: 25,
  
  // Daily Actions
  daily_check_in: 3,
  streak_7_days: 50,
  streak_30_days: 200,
  streak_90_days: 500,
  
  // Community
  upvote_received: 1,
  best_answer_selected: 50,
  follow_user: 2,
  share_content: 10,
  
  // Milestones
  first_post: 10,
  profile_complete_100: 100,
  verified_email: 25,
  verified_phone: 25,
  
  // AI Interaction
  ask_fishy_bot: 3,
  use_finn_recommendation: 10,
  complete_finn_suggested_booking: 100,
  
  // Tournament
  tournament_entry: 50,
  tournament_catch: 25,
  tournament_win: 500
};

// Badge definitions (35+ badges)
const BADGES = {
  // Milestone Badges
  breaking_the_ice: {
    id: 'breaking_the_ice',
    name: 'Breaking the Ice',
    description: 'Posted your first content',
    icon: '🎉',
    requirement: { type: 'posts', count: 1 }
  },
  chronicler: {
    id: 'chronicler',
    name: 'Chronicler',
    description: 'Posted 50 fishing reports',
    icon: '📝',
    requirement: { type: 'posts', count: 50 }
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    description: 'Posted 200 fishing reports',
    icon: '👑',
    requirement: { type: 'posts', count: 200 }
  },
  
  // Social Badges
  helper: {
    id: 'helper',
    name: 'Helper',
    description: 'Received 25 helpful votes',
    icon: '🤝',
    requirement: { type: 'helpful_votes', count: 25 }
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    description: 'Helped 10 new anglers',
    icon: '👨‍🏫',
    requirement: { type: 'mentoring', count: 10 }
  },
  popular: {
    id: 'popular',
    name: 'Popular',
    description: '100 followers',
    icon: '🌟',
    requirement: { type: 'followers', count: 100 }
  },
  
  // Fishing Badges
  first_catch: {
    id: 'first_catch',
    name: 'First Catch',
    description: 'Logged your first catch',
    icon: '🎣',
    requirement: { type: 'catches', count: 1 }
  },
  trophy_hunter: {
    id: 'trophy_hunter',
    name: 'Trophy Hunter',
    description: 'Caught 10+ species',
    icon: '🏆',
    requirement: { type: 'species', count: 10 }
  },
  species_master: {
    id: 'species_master',
    name: 'Species Master',
    description: 'Caught 25+ species',
    icon: '🐟',
    requirement: { type: 'species', count: 25 }
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: '10 trips before 6 AM',
    icon: '🌅',
    requirement: { type: 'dawn_trips', count: 10 }
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: '10 night fishing trips',
    icon: '🌙',
    requirement: { type: 'night_trips', count: 10 }
  },
  deep_sea_expert: {
    id: 'deep_sea_expert',
    name: 'Deep Sea Expert',
    description: '10 offshore trips',
    icon: '🌊',
    requirement: { type: 'offshore_trips', count: 10 }
  },
  
  // Community Contribution
  best_answer: {
    id: 'best_answer',
    name: 'Best Answer',
    description: '10 best answers selected',
    icon: '💡',
    requirement: { type: 'best_answers', count: 10 }
  },
  quality_contributor: {
    id: 'quality_contributor',
    name: 'Quality Contributor',
    description: '50 helpful posts',
    icon: '⭐',
    requirement: { type: 'helpful_posts', count: 50 }
  },
  photographer: {
    id: 'photographer',
    name: 'Photographer',
    description: 'Uploaded 100 photos',
    icon: '📸',
    requirement: { type: 'photos', count: 100 }
  },
  data_keeper: {
    id: 'data_keeper',
    name: 'Data Keeper',
    description: 'Logged 50 detailed reports',
    icon: '📊',
    requirement: { type: 'detailed_reports', count: 50 }
  },
  
  // Leaderboard
  weekly_winner: {
    id: 'weekly_winner',
    name: 'Weekly Winner',
    description: 'Top of weekly leaderboard',
    icon: '🥇',
    requirement: { type: 'leaderboard', period: 'week', rank: 1 }
  },
  streak_champion: {
    id: 'streak_champion',
    name: 'Streak Champion',
    description: '90-day activity streak',
    icon: '🔥',
    requirement: { type: 'streak', days: 90 }
  }
};

/**
 * Award points to user
 */
async function awardPoints(userId, action, metadata = {}) {
  try {
    const points = POINT_VALUES[action];
    
    if (!points) {
      throw new Error(`Unknown action: ${action}`);
    }
    
    // Insert points transaction
    const { error: txError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: points,
        action: action,
        reference_id: metadata.reference_id,
        reference_type: metadata.reference_type,
        description: metadata.description
      });
    
    if (txError) throw txError;
    
    // Update user stats
    const { error: statsError } = await supabase.rpc('award_points', {
      p_user_id: userId,
      p_points: points,
      p_action: action,
      p_reference_id: metadata.reference_id,
      p_reference_type: metadata.reference_type,
      p_description: metadata.description
    });
    
    if (statsError) throw statsError;
    
    // Check for new badges
    await checkBadges(userId);
    
    // Update leaderboard rank
    await updateLeaderboardRank(userId);
    
    return {
      success: true,
      points_awarded: points,
      action: action
    };
    
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
}

/**
 * Check if user earned new badges
 */
async function checkBadges(userId) {
  try {
    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!stats) return;
    
    // Get current badges
    const { data: currentBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);
    
    const earnedBadgeIds = new Set(currentBadges?.map(b => b.badge_id) || []);
    
    // Check each badge requirement
    const newBadges = [];
    
    for (const [badgeKey, badge] of Object.entries(BADGES)) {
      if (earnedBadgeIds.has(badge.id)) continue;
      
      let earned = false;
      
      switch (badge.requirement.type) {
        case 'posts':
          earned = stats.reports_posted >= badge.requirement.count;
          break;
        case 'catches':
          earned = stats.fish_caught >= badge.requirement.count;
          break;
        case 'trips':
          earned = stats.trips_logged >= badge.requirement.count;
          break;
        case 'streak':
          earned = stats.current_streak >= badge.requirement.days;
          break;
        default:
          break;
      }
      
      if (earned) {
        newBadges.push({
          user_id: userId,
          badge_id: badge.id,
          badge_name: badge.name,
          badge_description: badge.description
        });
      }
    }
    
    // Award new badges
    if (newBadges.length > 0) {
      await supabase
        .from('user_badges')
        .insert(newBadges);
      
      // Award bonus points for badges
      for (const badge of newBadges) {
        await awardPoints(userId, 'badge_earned', {
          description: `Earned badge: ${badge.badge_name}`
        });
      }
    }
    
    return newBadges;
    
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

/**
 * Update leaderboard rank
 */
async function updateLeaderboardRank(userId) {
  try {
    // Get user's rank
    const { data: rankings } = await supabase
      .from('user_stats')
      .select('user_id, total_points')
      .order('total_points', { ascending: false });
    
    const rank = rankings?.findIndex(r => r.user_id === userId) + 1;
    
    // Check for leaderboard badges
    if (rank === 1) {
      await checkBadges(userId);
    }
    
    return rank;
    
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

/**
 * Get user leaderboard position
 */
async function getLeaderboard(period = 'all_time', limit = 10) {
  try {
    let query = supabase
      .from('user_stats')
      .select(`
        user_id,
        total_points,
        current_streak,
        badges_earned,
        users!inner(full_name, avatar_url)
      `)
      .order('total_points', { ascending: false })
      .limit(limit);
    
    // Filter by period if needed
    if (period === 'weekly' || period === 'monthly') {
      // Would need additional logic for time-based filtering
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data?.map((user, index) => ({
      rank: index + 1,
      user_id: user.user_id,
      name: user.users.full_name,
      avatar: user.users.avatar_url,
      points: user.total_points,
      badges: user.badges_earned,
      streak: user.current_streak
    }));
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

/**
 * Daily check-in
 */
async function dailyCheckIn(userId) {
  try {
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: stats } = await supabase
      .from('user_stats')
      .select('last_activity_date, current_streak')
      .eq('user_id', userId)
      .single();
    
    if (stats?.last_activity_date === today) {
      return { success: false, message: 'Already checked in today' };
    }
    
    // Award check-in points
    await awardPoints(userId, 'daily_check_in');
    
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    if (stats?.last_activity_date === yesterdayStr) {
      newStreak = (stats.current_streak || 0) + 1;
    }
    
    // Award streak bonuses
    if (newStreak === 7) {
      await awardPoints(userId, 'streak_7_days');
    } else if (newStreak === 30) {
      await awardPoints(userId, 'streak_30_days');
    } else if (newStreak === 90) {
      await awardPoints(userId, 'streak_90_days');
    }
    
    // Update stats
    await supabase
      .from('user_stats')
      .update({
        last_activity_date: today,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, stats?.longest_streak || 0)
      })
      .eq('user_id', userId);
    
    return {
      success: true,
      streak: newStreak,
      points_earned: POINT_VALUES.daily_check_in
    };
    
  } catch (error) {
    console.error('Error in daily check-in:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  awardPoints,
  checkBadges,
  getLeaderboard,
  dailyCheckIn,
  POINT_VALUES,
  BADGES
};
