import { DashboardOverview } from "@/components/dashboard-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { localWorkoutService } from "@/services/local-workout-service";
import { userPreferencesService } from "@/services/user-preferences-service";
import type { WorkoutSession } from "@/lib/supabase";

// Custom achievement type for calculated achievements
interface CalculatedAchievement {
  id: number;
  title: string;
  description: string;
  category: string;
  unlockedAt: string;
  icon: string;
}
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock, 
  Flame, 
  Trophy,
  Activity,
  Users,
  Play
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch recent workout sessions from local API
  const { data: recentSessions = [], isLoading: sessionsLoading, error: sessionsError } = useQuery<WorkoutSession[]>({
    queryKey: ["local-workout-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('🔍 Fetching workout history from local API...');
      try {
        const sessions = await localWorkoutService.getWorkoutHistory(user.id.toString(), 10);
        console.log(`✅ Found ${sessions.length} workout sessions from local data`);
        return sessions;
      } catch (error) {
        console.error('❌ Failed to fetch local workout history:', error);
        throw new Error('Failed to load workout history');
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch user preferences and nutrition data
  const { data: userPreferences } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('🔍 Fetching user preferences...');
      return userPreferencesService.getUserPreferences(user.id.toString());
    },
    enabled: !!user,
  });

  const { data: nutritionData } = useQuery({
    queryKey: ["nutrition-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return userPreferencesService.getTodayNutrition(user.id.toString());
    },
    enabled: !!user,
  });

  const { data: achievementsData = [] } = useQuery({
    queryKey: ["/api/achievements"],
  });

  // Calculate real progress based on actual Supabase data
  const today = new Date();
  const todaysSessions = recentSessions.filter(session => {
    const sessionDate = new Date(session.start_time);
    return sessionDate.toDateString() === today.toDateString() && session.completion_status === 'completed';
  });
  
  // Progress is based on whether user completed a workout today (0 or 100)
  const workoutProgress = todaysSessions.length > 0 ? 100 : 0;
  
  const todayStats = {
    workoutProgress,
    calorieGoal: userPreferences?.targetGoals?.dailyCalorieGoal || 2200,
    caloriesConsumed: nutritionData?.caloriesConsumed || 0,
    proteinGoal: userPreferences?.targetGoals?.dailyProteinGoal || 150,
    proteinConsumed: nutritionData?.proteinConsumed || 0,
    workoutsThisWeek: recentSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo && session.completion_status === 'completed';
    }).length,
  };

  // Calculate achievements based on workout data
  const calculateAchievements = (): CalculatedAchievement[] => {
    const calculatedAchievements: CalculatedAchievement[] = [];
    const now = new Date();
    
    // First Workout Achievement
    if (recentSessions.length > 0) {
      calculatedAchievements.push({
        id: 1,
        title: "First Steps",
        description: "Completed your first workout session",
        category: "milestone",
        unlockedAt: recentSessions[recentSessions.length - 1].created_at,
        icon: "🎯"
      });
    }
    
    // 5 Workouts Achievement
    if (recentSessions.length >= 5) {
      calculatedAchievements.push({
        id: 2,
        title: "Getting Consistent",
        description: "Completed 5 workout sessions",
        category: "milestone",
        unlockedAt: recentSessions[recentSessions.length - 5].created_at,
        icon: "💪"
      });
    }
    
    // 10 Workouts Achievement
    if (recentSessions.length >= 10) {
      calculatedAchievements.push({
        id: 3,
        title: "Dedicated Athlete",
        description: "Completed 10 workout sessions",
        category: "milestone",
        unlockedAt: recentSessions[recentSessions.length - 10].created_at,
        icon: "🏆"
      });
    }
    
    // Volume Achievements
    const totalVolumeLifted = recentSessions.reduce((sum, session) => sum + (session.total_volume_lbs || 0), 0);
    if (totalVolumeLifted >= 10000) {
      calculatedAchievements.push({
        id: 4,
        title: "Heavy Lifter",
        description: "Lifted over 10,000 lbs total volume",
        category: "strength",
        unlockedAt: now.toISOString(),
        icon: "🏋️"
      });
    }
    
    // Streak Achievement
    if (todayStats.workoutsThisWeek >= 3) {
      calculatedAchievements.push({
        id: 5,
        title: "Week Warrior",
        description: "Completed 3+ workouts this week",
        category: "consistency",
        unlockedAt: now.toISOString(),
        icon: "🔥"
      });
    }
    
    return calculatedAchievements;
  };
  
  const achievements = Array.isArray(achievementsData) && achievementsData.length > 0 ? achievementsData : calculateAchievements();

  const { data: challenges = [] } = useQuery({
    queryKey: ["/api/challenges"],
  });

  const quickActions = [
    {
      title: "Exercises",
      description: "Browse all 38 exercises",
      icon: Play,
      color: "bg-primary/10 text-primary",
      href: "/exercises",
    },
    {
      title: "Workout History",
      description: "View past workouts & muscle heat map",
      icon: TrendingUp,
      color: "bg-secondary/10 text-secondary",
      href: "/progress",
    },
    {
      title: "Nutrition Tracker",
      description: "Track your meals and calories",
      icon: Target,
      color: "bg-accent/10 text-accent",
      href: "/nutrition",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ready to crush your fitness goals today?
            </p>
            
            {/* Today's Progress */}
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-16 h-16 progress-ring">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted opacity-30"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="175.9"
                        strokeDashoffset={175.9 * (1 - todayStats.workoutProgress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-foreground font-bold">{todayStats.workoutProgress}%</span>
                    </div>
                  </div>
                  <p className="font-medium">Daily Goal</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {todayStats.workoutsThisWeek}
                  </div>
                  <p className="font-medium">Workouts This Week</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {Math.round((todayStats.caloriesConsumed / todayStats.calorieGoal) * 100)}%
                  </div>
                  <p className="font-medium">Calorie Goal</p>
                  <Progress 
                    value={(todayStats.caloriesConsumed / todayStats.calorieGoal) * 100} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="card-hover cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Workouts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    Recent Workouts
                  </CardTitle>
                  <Link href="/progress">
                    <Button variant="outline" size="sm">
                      See All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSessions.slice(0, 5).map((session) => {
                      const sessionDate = new Date(session.created_at);
                      const isToday = sessionDate.toDateString() === new Date().toDateString();
                      // Note: exercises data would need to be fetched separately from workout_exercises table
                      const exerciseCount = 0; // Placeholder - would need separate query
                      const totalSets = 0; // Placeholder - would need separate query
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {session.workout_type ? 
                                  session.workout_type.replace(/([A-Z])/g, ' $1').trim() : 
                                  'Workout Session'}
                              </p>
                              {isToday && (
                                <Badge variant="secondary" className="text-xs">Today</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {sessionDate.toLocaleDateString()} at {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {exerciseCount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {exerciseCount} exercises • {totalSets} sets
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {session.total_duration_seconds ? Math.round(session.total_duration_seconds / 60) : 0} min
                            </p>
                            {session.total_volume_lbs && session.total_volume_lbs > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {session.total_volume_lbs.toLocaleString()} lbs
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent workouts</p>
                    <Link href="/workouts">
                      <Button className="mt-4 gradient-bg">Start First Workout</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-accent" />
                    Recent Achievements
                  </CardTitle>
                  {achievements.length > 3 && (
                    <Badge variant="secondary">
                      +{achievements.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.slice(0, 3).map((achievement: CalculatedAchievement) => (
                      <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          {achievement.icon ? (
                            <span className="text-xl">{achievement.icon}</span>
                          ) : (
                            <Trophy className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{achievement.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No achievements yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Complete workouts to earn your first achievement!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Workout History */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Recent Workouts</h2>
            <Link href="/progress">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading workout history...</p>
            </div>
          ) : sessionsError ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-muted-foreground mb-4">Unable to load workout history</p>
                <Button onClick={() => window.location.reload()} size="sm">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : recentSessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No workouts yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first workout to see your progress here
                </p>
                <Link href="/workouts">
                  <Button>Start Your First Workout</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recentSessions.slice(0, 5).map((session) => {
                const sessionDate = new Date(session.start_time);
                const duration = session.total_duration_seconds 
                  ? Math.round(session.total_duration_seconds / 60) 
                  : 0;
                
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {session.session_name || session.workout_type || 'Workout'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {sessionDate.toLocaleDateString()} at {sessionDate.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          {duration > 0 && (
                            <div className="text-center">
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                {duration}m
                              </div>
                            </div>
                          )}
                          
                          {session.total_volume_lbs > 0 && (
                            <div className="text-center">
                              <div className="font-semibold">{session.total_volume_lbs}</div>
                              <div className="text-muted-foreground">lbs</div>
                            </div>
                          )}
                          
                          {session.calories_burned && (
                            <div className="text-center">
                              <div className="flex items-center text-muted-foreground">
                                <Flame className="w-4 h-4 mr-1" />
                                {session.calories_burned}
                              </div>
                            </div>
                          )}
                          
                          <Badge 
                            variant={session.completion_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {session.completion_status === 'completed' ? 'Completed' : 
                             session.completion_status === 'in_progress' ? 'In Progress' : 'Cancelled'}
                          </Badge>
                        </div>
                      </div>
                      
                      {session.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Overview Component */}
      <DashboardOverview />
    </div>
  );
}
