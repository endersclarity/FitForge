import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { storage } from "./storage";
import { z } from "zod";

const router = Router();

// Initialize unified file storage
const unifiedStorage = new UnifiedFileStorage();
unifiedStorage.initialize().catch(console.error);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreatePostSchema = z.object({
  content: z.string().min(1).max(1000),
  imageUrl: z.string().url().optional(),
  workoutSessionId: z.number().optional(),
  achievementId: z.number().optional(),
  tags: z.array(z.string()).optional()
});

const CreateChallengeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['cardio', 'strength', 'mindfulness', 'consistency', 'volume', 'duration']),
  target: z.number().min(1),
  unit: z.enum(['sessions', 'minutes', 'reps', 'pounds', 'kilometers', 'days']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPublic: z.boolean().default(true)
});

const UpdateProgressSchema = z.object({
  progress: z.number().min(0),
  notes: z.string().max(200).optional()
});

const FollowUserSchema = z.object({
  targetUserId: z.number().min(1)
});

const CommentSchema = z.object({
  content: z.string().min(1).max(500)
});

const LeaderboardQuerySchema = z.object({
  type: z.enum(['volume', 'frequency', 'streak', 'consistency', 'strength']).default('volume'),
  timeRange: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  category: z.string().optional()
});

// ============================================================================
// ACTIVITY FEED ENDPOINTS
// ============================================================================

// GET /api/social/feed - Get personalized activity feed
router.get("/feed", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { limit = '20', offset = '0', type } = req.query;
    
    // Get user's following list to personalize feed
    const following = await getUserFollowing(userId);
    const relevantUserIds = [userId, ...following];
    
    // Fetch activity from multiple sources
    const activities = await generateActivityFeed(relevantUserIds, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    });

    res.json({
      activities,
      hasMore: activities.length === parseInt(limit),
      total: activities.length
    });
  } catch (error: any) {
    console.error("Error fetching activity feed:", error);
    res.status(500).json({ message: error.message || "Failed to fetch activity feed" });
  }
});

// GET /api/social/posts - Get social posts with filtering
router.get("/posts", authenticateToken, async (req: any, res) => {
  try {
    const { limit = '20', userId: filterUserId, tag } = req.query;
    
    let posts = await storage.getSocialPosts(parseInt(limit));
    
    // Apply filters
    if (filterUserId) {
      posts = posts.filter(post => post.userId === parseInt(filterUserId));
    }
    
    // Add engagement data and user can interact flags
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const userHasLiked = await hasUserLikedPost(req.userId, post.id);
      const comments = await getPostComments(post.id);
      
      return {
        ...post,
        userHasLiked,
        commentsData: comments,
        canEdit: post.userId === req.userId,
        canDelete: post.userId === req.userId
      };
    }));

    res.json({
      posts: enrichedPosts,
      hasMore: posts.length === parseInt(limit)
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: error.message || "Failed to fetch posts" });
  }
});

// POST /api/social/posts - Create a new social post
router.post("/posts", authenticateToken, async (req: any, res) => {
  try {
    const postData = CreatePostSchema.parse(req.body);
    const userId = req.userId;
    
    // Validate workout session or achievement exists if referenced
    if (postData.workoutSessionId) {
      const session = await storage.getWorkoutSession(postData.workoutSessionId);
      if (!session || session.userId !== userId) {
        return res.status(400).json({ message: "Invalid workout session reference" });
      }
    }
    
    const post = await storage.createSocialPost({
      ...postData,
      userId
    });
    
    // Create activity for followers
    await createActivityForFollowers(userId, 'post_created', { postId: post.id });
    
    res.status(201).json(post);
  } catch (error: any) {
    console.error("Error creating post:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid post data", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to create post" });
  }
});

// POST /api/social/posts/:postId/like - Like or unlike a post
router.post("/posts/:postId/like", authenticateToken, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.userId;
    
    const hasLiked = await hasUserLikedPost(userId, postId);
    let result;
    
    if (hasLiked) {
      result = await unlikePost(userId, postId);
    } else {
      result = await likePost(userId, postId);
      
      // Create notification for post author
      const post = await getPostById(postId);
      if (post && post.userId !== userId) {
        await createNotification(post.userId, 'like', { 
          fromUserId: userId, 
          postId 
        });
      }
    }
    
    res.json({ 
      success: result,
      liked: !hasLiked,
      message: hasLiked ? "Post unliked" : "Post liked"
    });
  } catch (error: any) {
    console.error("Error toggling post like:", error);
    res.status(500).json({ message: error.message || "Failed to toggle like" });
  }
});

// POST /api/social/posts/:postId/comments - Add comment to a post
router.post("/posts/:postId/comments", authenticateToken, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.userId;
    const { content } = CommentSchema.parse(req.body);
    
    const comment = await createComment(postId, userId, content);
    
    // Create notification for post author
    const post = await getPostById(postId);
    if (post && post.userId !== userId) {
      await createNotification(post.userId, 'comment', { 
        fromUserId: userId, 
        postId,
        commentId: comment.id 
      });
    }
    
    res.status(201).json(comment);
  } catch (error: any) {
    console.error("Error creating comment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to create comment" });
  }
});

// ============================================================================
// CHALLENGE SYSTEM ENDPOINTS
// ============================================================================

// GET /api/social/challenges - Get available challenges
router.get("/challenges", authenticateToken, async (req: any, res) => {
  try {
    const { active = 'true', participating = 'false' } = req.query;
    const userId = req.userId;
    
    let challenges = await storage.getActiveChallenges();
    
    if (participating === 'true') {
      const userParticipations = await storage.getChallengeParticipations(userId);
      const participatingChallengeIds = userParticipations.map(p => p.challengeId);
      challenges = challenges.filter(c => participatingChallengeIds.includes(c.id));
    }
    
    // Enrich with user participation data
    const enrichedChallenges = await Promise.all(challenges.map(async (challenge) => {
      const participation = await getUserChallengeParticipation(userId, challenge.id);
      const leaderboard = await getChallengeLeaderboard(challenge.id, 5); // Top 5
      
      return {
        ...challenge,
        userParticipation: participation,
        topParticipants: leaderboard,
        userRank: participation ? await getUserChallengeRank(userId, challenge.id) : null
      };
    }));

    res.json({
      challenges: enrichedChallenges,
      total: enrichedChallenges.length
    });
  } catch (error: any) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: error.message || "Failed to fetch challenges" });
  }
});

// POST /api/social/challenges - Create a new challenge
router.post("/challenges", authenticateToken, async (req: any, res) => {
  try {
    const challengeData = CreateChallengeSchema.parse(req.body);
    const userId = req.userId;
    
    // Validate date range
    const startDate = new Date(challengeData.startDate);
    const endDate = new Date(challengeData.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    
    if (startDate < new Date()) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }
    
    const challenge = await storage.createChallenge(challengeData);
    
    // Auto-join creator to challenge
    await storage.joinChallenge({
      userId,
      challengeId: challenge.id,
      progress: 0
    });
    
    // Create activity for followers
    await createActivityForFollowers(userId, 'challenge_created', { challengeId: challenge.id });
    
    res.status(201).json(challenge);
  } catch (error: any) {
    console.error("Error creating challenge:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid challenge data", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to create challenge" });
  }
});

// POST /api/social/challenges/:challengeId/join - Join a challenge
router.post("/challenges/:challengeId/join", authenticateToken, async (req: any, res) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    const userId = req.userId;
    
    // Check if challenge exists and is active
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    if (!challenge.isActive || new Date() > new Date(challenge.endDate)) {
      return res.status(400).json({ message: "Challenge is not active or has ended" });
    }
    
    // Check if user already participating
    const existingParticipation = await getUserChallengeParticipation(userId, challengeId);
    if (existingParticipation) {
      return res.status(400).json({ message: "Already participating in this challenge" });
    }
    
    const participation = await storage.joinChallenge({
      userId,
      challengeId,
      progress: 0
    });
    
    res.status(201).json({
      participation,
      message: "Successfully joined challenge"
    });
  } catch (error: any) {
    console.error("Error joining challenge:", error);
    res.status(500).json({ message: error.message || "Failed to join challenge" });
  }
});

// PUT /api/social/challenges/:challengeId/progress - Update challenge progress
router.put("/challenges/:challengeId/progress", authenticateToken, async (req: any, res) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    const userId = req.userId;
    const { progress, notes } = UpdateProgressSchema.parse(req.body);
    
    const participation = await storage.updateChallengeProgress(userId, challengeId, progress);
    
    if (!participation) {
      return res.status(404).json({ message: "Challenge participation not found" });
    }
    
    // Check if challenge was completed
    const challenge = await storage.getChallenge(challengeId);
    if (challenge && progress >= challenge.target && !participation.isCompleted) {
      await markChallengeCompleted(userId, challengeId);
      
      // Create achievement for completion
      await createChallengeCompletionAchievement(userId, challenge);
      
      // Create activity for completion
      await createActivityForFollowers(userId, 'challenge_completed', { challengeId });
    }
    
    res.json({
      participation,
      message: "Progress updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating challenge progress:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to update progress" });
  }
});

// GET /api/social/challenges/:challengeId/leaderboard - Get challenge leaderboard
router.get("/challenges/:challengeId/leaderboard", authenticateToken, async (req: any, res) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    const { limit = '20' } = req.query;
    
    const leaderboard = await getChallengeLeaderboard(challengeId, parseInt(limit));
    const userRank = await getUserChallengeRank(req.userId, challengeId);
    
    res.json({
      leaderboard,
      userRank,
      totalParticipants: leaderboard.length
    });
  } catch (error: any) {
    console.error("Error fetching challenge leaderboard:", error);
    res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
  }
});

// ============================================================================
// LEADERBOARD ENDPOINTS
// ============================================================================

// GET /api/social/leaderboards - Get global leaderboards
router.get("/leaderboards", authenticateToken, async (req: any, res) => {
  try {
    const { type, timeRange, category } = LeaderboardQuerySchema.parse(req.query);
    const userId = req.userId;
    
    const leaderboard = await generateGlobalLeaderboard(type, timeRange, category);
    const userRank = await getUserGlobalRank(userId, type, timeRange);
    
    res.json({
      leaderboard,
      userRank,
      type,
      timeRange,
      category,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid leaderboard parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
  }
});

// GET /api/social/leaderboards/friends - Get friends leaderboard
router.get("/leaderboards/friends", authenticateToken, async (req: any, res) => {
  try {
    const { type = 'volume', timeRange = 'month' } = req.query;
    const userId = req.userId.toString();
    
    const friends = await getUserFollowing(userId);
    const friendsLeaderboard = await generateFriendsLeaderboard([userId, ...friends], type as string, timeRange as string);
    
    res.json({
      leaderboard: friendsLeaderboard,
      type,
      timeRange,
      totalFriends: friends.length
    });
  } catch (error: any) {
    console.error("Error fetching friends leaderboard:", error);
    res.status(500).json({ message: error.message || "Failed to fetch friends leaderboard" });
  }
});

// ============================================================================
// SOCIAL INTERACTION ENDPOINTS
// ============================================================================

// POST /api/social/follow - Follow a user
router.post("/follow", authenticateToken, async (req: any, res) => {
  try {
    const { targetUserId } = FollowUserSchema.parse(req.body);
    const userId = req.userId;
    
    if (targetUserId === userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    
    // Check if target user exists
    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if already following
    const isFollowing = await checkIfFollowing(userId, targetUserId);
    if (isFollowing) {
      return res.status(400).json({ message: "Already following this user" });
    }
    
    await followUser(userId, targetUserId);
    
    // Create notification
    await createNotification(targetUserId, 'follow', { fromUserId: userId });
    
    res.json({
      success: true,
      message: "Successfully followed user"
    });
  } catch (error: any) {
    console.error("Error following user:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid follow data", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to follow user" });
  }
});

// DELETE /api/social/follow/:targetUserId - Unfollow a user
router.delete("/follow/:targetUserId", authenticateToken, async (req: any, res) => {
  try {
    const targetUserId = parseInt(req.params.targetUserId);
    const userId = req.userId;
    
    const wasFollowing = await checkIfFollowing(userId, targetUserId);
    if (!wasFollowing) {
      return res.status(400).json({ message: "Not following this user" });
    }
    
    await unfollowUser(userId, targetUserId);
    
    res.json({
      success: true,
      message: "Successfully unfollowed user"
    });
  } catch (error: any) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: error.message || "Failed to unfollow user" });
  }
});

// GET /api/social/following - Get user's following list
router.get("/following", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const following = await getUserFollowing(userId);
    
    // Get user details for each followed user
    const followingDetails = await Promise.all(
      following.map(async (followedUserId) => {
        const user = await storage.getUser(parseInt(followedUserId));
        return user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        } : null;
      })
    );
    
    res.json({
      following: followingDetails.filter(Boolean),
      count: followingDetails.filter(Boolean).length
    });
  } catch (error: any) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ message: error.message || "Failed to fetch following list" });
  }
});

// GET /api/social/followers - Get user's followers list
router.get("/followers", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const followers = await getUserFollowers(userId);
    
    // Get user details for each follower
    const followerDetails = await Promise.all(
      followers.map(async (followerUserId) => {
        const user = await storage.getUser(parseInt(followerUserId));
        return user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        } : null;
      })
    );
    
    res.json({
      followers: followerDetails.filter(Boolean),
      count: followerDetails.filter(Boolean).length
    });
  } catch (error: any) {
    console.error("Error fetching followers list:", error);
    res.status(500).json({ message: error.message || "Failed to fetch followers list" });
  }
});

// GET /api/social/notifications - Get user notifications
router.get("/notifications", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { limit = '20', unreadOnly = 'false' } = req.query;
    
    const notifications = await getUserNotifications(userId, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({
      notifications,
      unreadCount: await getUnreadNotificationCount(userId)
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message || "Failed to fetch notifications" });
  }
});

// PUT /api/social/notifications/:notificationId/read - Mark notification as read
router.put("/notifications/:notificationId/read", authenticateToken, async (req: any, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    const userId = req.userId;
    
    await markNotificationAsRead(userId, notificationId);
    
    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: error.message || "Failed to mark notification as read" });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Social data management functions (simplified implementations)
async function getUserFollowing(userId: string): Promise<string[]> {
  // In a real implementation, this would query a follows table
  // For now, return empty array - can be enhanced later
  return [];
}

async function getUserFollowers(userId: string): Promise<string[]> {
  // In a real implementation, this would query a follows table
  return [];
}

async function generateActivityFeed(userIds: string[], options: any) {
  // Aggregate activities from multiple sources
  const activities = [];
  
  // Get recent workout completions
  for (const userId of userIds) {
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    const recentSessions = userWorkoutData.sessions
      .filter(s => s.sessionType === 'completed')
      .slice(0, 5)
      .map(session => ({
        id: `workout_${session.id}`,
        type: 'workout_completed',
        userId: parseInt(userId),
        timestamp: session.endTime || session.startTime,
        data: {
          workoutType: session.workoutType,
          totalVolume: session.totalVolume,
          duration: session.totalDuration,
          exercises: session.exercises.length
        }
      }));
    
    activities.push(...recentSessions);
  }
  
  // Get recent social posts
  const posts = await storage.getSocialPosts(10);
  const postActivities = posts.map(post => ({
    id: `post_${post.id}`,
    type: 'post_created',
    userId: post.userId,
    timestamp: post.createdAt,
    data: {
      content: post.content,
      likes: post.likes,
      comments: post.comments
    }
  }));
  
  activities.push(...postActivities);
  
  // Sort by timestamp and apply pagination
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));
}

async function hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
  // Simplified implementation - would query likes table in real app
  return false;
}

async function getPostComments(postId: number) {
  // Simplified implementation - would query comments table
  return [];
}

async function likePost(userId: number, postId: number): Promise<boolean> {
  // Simplified implementation - would insert into likes table
  return await storage.likeSocialPost(postId);
}

async function unlikePost(userId: number, postId: number): Promise<boolean> {
  // Simplified implementation - would delete from likes table
  return true;
}

async function getPostById(postId: number) {
  // Simplified implementation
  const posts = await storage.getSocialPosts(100);
  return posts.find(p => p.id === postId);
}

async function createComment(postId: number, userId: number, content: string) {
  // Simplified implementation - would insert into comments table
  return {
    id: Date.now(),
    postId,
    userId,
    content,
    createdAt: new Date()
  };
}

async function createNotification(userId: number, type: string, data: any) {
  // Simplified implementation - would insert into notifications table
  console.log(`Creating notification for user ${userId}: ${type}`, data);
}

async function createActivityForFollowers(userId: number, activityType: string, data: any) {
  // Simplified implementation - would create activity entries for followers
  console.log(`Creating activity for followers of user ${userId}: ${activityType}`, data);
}

async function getUserChallengeParticipation(userId: number, challengeId: number) {
  const participations = await storage.getChallengeParticipations(userId);
  return participations.find(p => p.challengeId === challengeId);
}

async function getChallengeLeaderboard(challengeId: number, limit: number) {
  // Simplified implementation - would query challenge participations with user data
  return [];
}

async function getUserChallengeRank(userId: number, challengeId: number): Promise<number | null> {
  // Simplified implementation - would calculate rank based on progress
  return null;
}

async function markChallengeCompleted(userId: number, challengeId: number) {
  // Simplified implementation - would update participation record
  return true;
}

async function createChallengeCompletionAchievement(userId: number, challenge: any) {
  // Create achievement for challenge completion
  await storage.createAchievement({
    userId,
    type: 'challenge_completion',
    title: `Challenge Champion`,
    description: `Completed the ${challenge.name} challenge`,
    iconType: 'trophy',
    value: challenge.name
  });
}

async function generateGlobalLeaderboard(type: string, timeRange: string, category?: string) {
  // Simplified implementation - would aggregate user stats across time range
  return [];
}

async function getUserGlobalRank(userId: number, type: string, timeRange: string): Promise<number | null> {
  // Simplified implementation - would calculate user's rank in global leaderboard
  return null;
}

async function generateFriendsLeaderboard(userIds: string[], type: string, timeRange: string) {
  // Simplified implementation - would calculate leaderboard for specific users
  return [];
}

async function followUser(userId: number, targetUserId: number) {
  // Simplified implementation - would insert into follows table
  return true;
}

async function unfollowUser(userId: number, targetUserId: number) {
  // Simplified implementation - would delete from follows table
  return true;
}

async function checkIfFollowing(userId: number, targetUserId: number): Promise<boolean> {
  // Simplified implementation - would check follows table
  return false;
}

async function getUserNotifications(userId: number, options: { limit: number; unreadOnly: boolean }) {
  // Simplified implementation - would query notifications table
  return [];
}

async function getUnreadNotificationCount(userId: number): Promise<number> {
  // Simplified implementation - would count unread notifications
  return 0;
}

async function markNotificationAsRead(userId: number, notificationId: number) {
  // Simplified implementation - would update notification record
  return true;
}

export default router;