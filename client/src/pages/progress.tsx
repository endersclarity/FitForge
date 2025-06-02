import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Target, Calendar, Weight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutSession } from "@shared/schema";

export default function Progress() {
  // Fetch real workout data
  const { data: workoutSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  // Calculate real statistics
  const totalWorkouts = workoutSessions.length;
  
  const totalVolume = workoutSessions.reduce((total, session) => {
    return total + (session.totalVolume || 0);
  }, 0);
  
  const totalCalories = workoutSessions.reduce((total, session) => {
    // Estimate: 0.1 calories per pound lifted
    return total + (session.totalVolume || 0) * 0.1;
  }, 0);
  
  const currentStreak = calculateStreak(workoutSessions);
  
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

        {/* Progress Message */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Track Your Real Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {totalWorkouts === 0 
                ? "Start your first workout to begin tracking progress"
                : "Your progress is being tracked! Charts coming soon."}
            </p>
            <p className="text-sm text-muted-foreground">
              Formula: Volume = Sets × Reps × Weight | Calories ≈ Volume × 0.1
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}