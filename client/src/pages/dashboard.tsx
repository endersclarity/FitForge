import { DashboardOverview } from "@/components/dashboard-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { WorkoutSession, UserStats, Challenge } from "@shared/schema";

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

  const { data: recentSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats/latest"],
  });

  const { data: achievementsData = [] } = useQuery({
    queryKey: ["/api/achievements"],
  });

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
        unlockedAt: recentSessions[recentSessions.length - 1].createdAt.toISOString(),
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
        unlockedAt: recentSessions[recentSessions.length - 5].createdAt.toISOString(),
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
        unlockedAt: recentSessions[recentSessions.length - 10].createdAt.toISOString(),
        icon: "🏆"
      });
    }
    
    // Volume Achievements
    const totalVolumeLifted = recentSessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
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

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  // Calculate real progress based on actual data
  const today = new Date();
  const todaysSessions = recentSessions.filter(session => {
    const sessionDate = new Date(session.createdAt);
    return sessionDate.toDateString() === today.toDateString();
  });
  
  // Progress is based on whether user completed a workout today (0 or 100)
  const workoutProgress = todaysSessions.length > 0 ? 100 : 0;
  
  const todayStats = {
    workoutProgress,
    calorieGoal: 2200,
    caloriesConsumed: userStats?.caloriesConsumed || 0,
    workoutsThisWeek: recentSessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length,
  };

  const quickActions = [
    {
      title: "Start Quick Workout",
      description: "15-minute full body routine",
      icon: Play,
      color: "bg-primary/10 text-primary",
      href: "/workouts",
    },
    {
      title: "Log Nutrition",
      description: "Track your meals",
      icon: Target,
      color: "bg-accent/10 text-accent",
      href: "/nutrition",
    },
    {
      title: "View Progress",
      description: "Check your stats",
      icon: TrendingUp,
      color: "bg-secondary/10 text-secondary",
      href: "/progress",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Welcome back, {user?.firstName}! 👋
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
                      const sessionDate = new Date(session.createdAt);
                      const isToday = sessionDate.toDateString() === new Date().toDateString();
                      const exercises = Array.isArray(session.exercises) ? session.exercises : [];
                      const exerciseCount = exercises.length;
                      const totalSets = exercises.reduce((sum: number, ex: {sets?: any[]}) => sum + (ex.sets?.length || 0), 0);
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {session.workoutType ? 
                                  session.workoutType.replace(/([A-Z])/g, ' $1').trim() : 
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
                              {session.totalDuration || 0} min
                            </p>
                            {session.totalVolume && session.totalVolume > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {session.totalVolume.toLocaleString()} lbs
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

      {/* Dashboard Overview Component */}
      <DashboardOverview />
    </div>
  );
}
