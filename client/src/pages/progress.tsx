import { ProgressAnalytics } from "@/components/progress-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { UserStats, Achievement, WorkoutSession } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Trophy,
  Activity,
  Flame,
  Weight,
  Heart,
  Zap,
} from "lucide-react";

export default function ProgressPage() {
  const { user } = useAuth();

  const { data: userStats = [] } = useQuery<UserStats[]>({
    queryKey: ["/api/user-stats"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: workoutSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  const latestStats = userStats[0];
  const previousStats = userStats[1];

  const calculateChange = (current: number | null | undefined, previous: number | null | undefined) => {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const progressMetrics = [
    {
      label: "Weight",
      current: latestStats?.weight || 0,
      previous: previousStats?.weight,
      unit: "kg",
      icon: Weight,
      color: "text-primary",
    },
    {
      label: "Body Fat",
      current: latestStats?.bodyFat || 0,
      previous: previousStats?.bodyFat,
      unit: "%",
      icon: Target,
      color: "text-accent",
      reverse: true, // Lower is better
    },
    {
      label: "Muscle Mass",
      current: latestStats?.muscleMass || 0,
      previous: previousStats?.muscleMass,
      unit: "kg",
      icon: Activity,
      color: "text-secondary",
    },
    {
      label: "Energy Level",
      current: latestStats?.energyLevel || 0,
      previous: previousStats?.energyLevel,
      unit: "/10",
      icon: Zap,
      color: "text-orange-500",
    },
  ];

  const workoutMetrics = {
    totalSessions: workoutSessions.length,
    totalDuration: workoutSessions.reduce((sum, session) => sum + (session.totalDuration || 0), 0),
    totalCalories: workoutSessions.reduce((sum, session) => sum + (session.caloriesBurned || 0), 0),
    averageFormScore: (() => {
      const sessionsWithScore = workoutSessions.filter(s => s.formScore);
      return sessionsWithScore.length > 0 
        ? sessionsWithScore.reduce((sum, session) => sum + (session.formScore || 0), 0) / sessionsWithScore.length
        : 0;
    })(),
    thisWeekSessions: workoutSessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length,
  };

  const goals = [
    {
      title: "Weekly Workout Goal",
      current: workoutMetrics.thisWeekSessions,
      target: 5,
      unit: "sessions",
      color: "primary",
    },
    {
      title: "Monthly Calorie Burn",
      current: workoutMetrics.totalCalories,
      target: 8000,
      unit: "calories",
      color: "accent",
    },
    {
      title: "Form Score Target",
      current: Math.round(workoutMetrics.averageFormScore),
      target: 95,
      unit: "%",
      color: "secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Your Progress Journey</h1>
            <p className="text-xl text-muted-foreground">
              Track your transformation with detailed analytics
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Body Composition</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {progressMetrics.map((metric, index) => {
              const change = calculateChange(metric.current ?? undefined, metric.previous ?? undefined);
              const isPositive = metric.reverse ? change < 0 : change > 0;
              const isNegative = metric.reverse ? change > 0 : change < 0;

              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <metric.icon className={`w-8 h-8 ${metric.color}`} />
                      {metric.previous && (
                        <div className={`flex items-center text-sm ${
                          isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : isNegative ? (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          ) : null}
                          {change !== 0 && `${Math.abs(change).toFixed(1)}%`}
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {metric.current}{metric.unit}
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Workout Performance */}
          <h2 className="text-2xl font-bold mb-8">Workout Performance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-1">
                  {workoutMetrics.totalSessions}
                </div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-accent mx-auto mb-4" />
                <div className="text-3xl font-bold text-accent mb-1">
                  {Math.round(workoutMetrics.totalDuration / 60)}h
                </div>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-orange-500 mb-1">
                  {workoutMetrics.totalCalories}
                </div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-secondary mx-auto mb-4" />
                <div className="text-3xl font-bold text-secondary mb-1">
                  {Math.round(workoutMetrics.averageFormScore)}%
                </div>
                <p className="text-sm text-muted-foreground">Avg Form Score</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Goals Progress */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Current Goals</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
              const progress = Math.min((goal.current / goal.target) * 100, 100);
              const colorClass = 
                goal.color === "primary" ? "text-primary" :
                goal.color === "accent" ? "text-accent" :
                "text-secondary";

              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">{goal.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className={`font-bold ${colorClass}`}>
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(progress)}% complete
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Recent Achievements</h2>
              <Button variant="outline">View All</Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.slice(0, 6).map((achievement) => (
                <Card key={achievement.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        {achievement.value && (
                          <Badge variant="secondary" className="text-xs">
                            {achievement.value}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Progress Analytics Component */}
      <ProgressAnalytics />
    </div>
  );
}
