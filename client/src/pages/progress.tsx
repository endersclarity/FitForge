import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Target, Calendar, Weight, ChevronDown, ChevronUp, Dumbbell, Clock, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutSession } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressCharts } from "@/components/progress-charts";

export default function Progress() {
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  
  // Fetch comprehensive workout data (both sessions and logs)
  const { data: workoutSessions = [], isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  // Fetch workout logs to supplement session data
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ["workout-logs"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/workout-logs");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch workout logs:", error);
        return [];
      }
    }
  });

  // Combine workout sessions with workout logs for complete data
  const allWorkoutData = React.useMemo(() => {
    const combined = [...workoutSessions];
    
    // Group workout logs by session ID
    const logsBySession = new Map<string, any[]>();
    const completedSessions = new Set<string>();
    
    workoutLogs.forEach((log: any) => {
      if (log.exerciseName === 'WORKOUT_COMPLETED') {
        completedSessions.add(log.sessionId);
      } else {
        if (!logsBySession.has(log.sessionId)) {
          logsBySession.set(log.sessionId, []);
        }
        logsBySession.get(log.sessionId)!.push(log);
      }
    });
    
    // Convert workout logs to session format
    completedSessions.forEach(sessionId => {
      const sessionLogs = logsBySession.get(sessionId) || [];
      if (sessionLogs.length === 0) return;
      
      // Group by exercise
      const exerciseGroups = new Map<string, any[]>();
      sessionLogs.forEach(log => {
        if (!exerciseGroups.has(log.exerciseName)) {
          exerciseGroups.set(log.exerciseName, []);
        }
        exerciseGroups.get(log.exerciseName)!.push(log);
      });
      
      const exercises = Array.from(exerciseGroups.entries()).map(([exerciseName, logs]) => ({
        exerciseName,
        sets: logs.map(log => ({
          weight: log.set?.weight || 0,
          reps: log.set?.reps || 0,
          volume: log.set?.volume || 0
        }))
      }));
      
      const totalVolume = exercises.reduce((sum, ex) => 
        sum + ex.sets.reduce((setSum, set) => setSum + (set.volume || 0), 0), 0);
      
      // Create workout session from logs
      const logSession = {
        id: parseInt(sessionId.slice(-6), 16) || Math.random() * 1000000,
        userId: 1,
        workoutTemplateId: null,
        startTime: sessionLogs[0]?.timestamp || new Date().toISOString(),
        endTime: sessionLogs[sessionLogs.length - 1]?.timestamp || new Date().toISOString(),
        duration: 30, // Estimate
        exercises,
        caloriesBurned: Math.round(totalVolume * 0.1),
        notes: null,
        rating: 5,
        completionStatus: 'completed' as const,
        createdAt: sessionLogs[0]?.timestamp || new Date().toISOString(),
        workoutId: 1,
        totalDuration: 30,
        formScore: 8,
        workoutType: sessionLogs[0]?.workoutType || 'Mixed',
        totalVolume,
        status: 'completed' as const
      };
      
      combined.push(logSession);
    });
    
    return combined.sort((a, b) => 
      new Date(b.createdAt || b.startTime).getTime() - new Date(a.createdAt || a.startTime).getTime()
    );
  }, [workoutSessions, workoutLogs]);

  // Fetch comprehensive analytics that aggregates all data sources
  const { data: analytics } = useQuery({
    queryKey: ["/api/workout-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/workout-analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    }
  });

  // Fetch user preferences for body stats data
  const { data: userPreferences } = useQuery({
    queryKey: ["user-preferences", "1"],
    queryFn: async () => {
      const response = await fetch("/api/users/preferences/1");
      if (!response.ok) throw new Error("Failed to fetch user preferences");
      return response.json();
    }
  });

  // Use real comprehensive statistics
  const totalWorkouts = analytics?.totalCompletedWorkouts || allWorkoutData.filter(session => session.status === 'completed').length;
  const totalVolume = analytics?.totalVolume || allWorkoutData.reduce((total, session) => total + (session.totalVolume || 0), 0);
  const totalCalories = analytics?.totalCalories || Math.round(totalVolume * 0.1);
  
  const currentStreak = calculateStreak(allWorkoutData);
  
  // Transform data for charts component
  const chartsData = {
    sessions: allWorkoutData.map(session => ({
      date: (session.createdAt || session.startTime).toString(),
      workoutType: session.workoutType || 'Mixed',
      duration: session.totalDuration || 0,
      totalVolume: Array.isArray(session.exercises) ? session.exercises.reduce((sum: number, ex: any) => 
        sum + (Array.isArray(ex.sets) ? ex.sets.reduce((setSum: number, set: any) => setSum + ((set.weight || 0) * (set.reps || 0)), 0) : 0), 0) : 0,
      caloriesBurned: Math.round((session.totalDuration || 0) * 5.5), // 5.5 cal/min estimate
      formScore: session.formScore || 8,
      exercises: Array.isArray(session.exercises) ? session.exercises.map((ex: any) => ({
        name: ex.exerciseName || 'Unknown Exercise',
        sets: Array.isArray(ex.sets) ? ex.sets.map((set: any) => ({
          weight: set.weight || 0,
          reps: set.reps || 0,
          volume: (set.weight || 0) * (set.reps || 0)
        })) : []
      })) : []
    })),
    bodyStats: userPreferences?.bodyStats ? [
      {
        date: userPreferences.bodyStats.updatedAt,
        weight: userPreferences.bodyStats.bodyWeight,
        bodyFat: 15, // Default estimate - user hasn't entered body fat
        muscleMass: userPreferences.bodyStats.bodyWeight * 0.4 // Estimate 40% muscle mass
      }
    ] : [],
    exerciseProgress: [] // TODO: Add exercise progression data
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/progress/export?format=csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitforge-progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  function calculateStreak(sessions: WorkoutSession[]): number {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].createdAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Your Progress</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track your fitness journey and celebrate your achievements
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold mb-1">{totalWorkouts || 0}</div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-accent/10 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-bold mb-1">{totalVolume.toLocaleString() || 0}</div>
              <p className="text-sm text-muted-foreground">lbs Total Volume</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-secondary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl font-bold mb-1">{Math.round(totalCalories) || 0}</div>
              <p className="text-sm text-muted-foreground">Est. Calories Burned</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500 mb-1">{currentStreak}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Workout History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Workout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading workout history...</p>
              </div>
            ) : allWorkoutData.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No workout history yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete your first workout to start building your history
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allWorkoutData.map((session) => {
                    const sessionDate = new Date(session.createdAt);
                    const isExpanded = expandedSession === session.id;
                    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
                    const exerciseCount = exercises.length;
                    const totalSets = exercises.reduce((sum: number, ex: {sets?: any[]}) => sum + (ex.sets?.length || 0), 0);
                    
                    return (
                      <Card key={session.id} className="overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {session.workoutType ? 
                                    session.workoutType.replace(/([A-Z])/g, ' $1').trim() : 
                                    'Workout Session'}
                                </h4>
                                {session.status === 'completed' && (
                                  <Badge variant="secondary" className="text-xs">Completed</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {sessionDate.toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {session.totalDuration || 0} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Dumbbell className="w-4 h-4" />
                                  {exerciseCount} exercises
                                </span>
                                <span className="flex items-center gap-1">
                                  <Weight className="w-4 h-4" />
                                  {session.totalVolume?.toLocaleString() || 0} lbs
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              {isExpanded ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                          </div>
                        </div>
                        
                        {isExpanded && exercises.length > 0 && (
                          <div className="border-t bg-muted/20 p-4">
                            <h5 className="font-medium mb-3">Exercise Details</h5>
                            <div className="space-y-3">
                              {exercises.map((exercise: {exerciseName: string, sets?: {weight: number, reps: number}[]}, index: number) => (
                                <div key={index} className="bg-background rounded-lg p-3">
                                  <h6 className="font-medium mb-2">{exercise.exerciseName}</h6>
                                  <div className="grid grid-cols-4 gap-2 text-sm">
                                    <div className="text-muted-foreground">Set</div>
                                    <div className="text-muted-foreground">Weight</div>
                                    <div className="text-muted-foreground">Reps</div>
                                    <div className="text-muted-foreground">Volume</div>
                                    {exercise.sets?.map((set: {weight: number, reps: number}, setIndex: number) => (
                                      <React.Fragment key={setIndex}>
                                        <div>{setIndex + 1}</div>
                                        <div>{set.weight} lbs</div>
                                        <div>{set.reps}</div>
                                        <div>{set.weight * set.reps} lbs</div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Charts */}
        {totalWorkouts > 0 && (
          <div className="mt-8">
            <ProgressCharts
              data={chartsData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onExport={handleExport}
            />
          </div>
        )}

        {/* Getting Started Message */}
        {totalWorkouts === 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">Start Tracking Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Complete your first workout to begin tracking detailed progress with charts and analytics
              </p>
              <p className="text-sm text-muted-foreground">
                Formula: Volume = Sets × Reps × Weight | Calories ≈ Volume × 0.1
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}