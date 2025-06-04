import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Medal, TrendingUp, Download, Calendar, Activity } from "lucide-react";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
// Analytics service and auth removed - using unified storage endpoints

export function RealProgressAnalytics() {
  const [timePeriod, setTimePeriod] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("3M");
  const { toast } = useToast();
  
  // Get timeframe in days
  const getTimeframeDays = (period: string) => {
    switch (period) {
      case "1M": return 30;
      case "3M": return 90;
      case "6M": return 180;
      case "1Y": return 365;
      case "ALL": return 365 * 2; // 2 years max
      default: return 90;
    }
  };
  
  // Fetch unified analytics from our new endpoint
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['unified-analytics', timePeriod],
    queryFn: async () => {
      const response = await fetch("/api/workouts/analytics", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    }
  });
  
  // Fetch workout history for trend calculations from unified storage
  const { data: workoutHistory, isLoading: trendsLoading } = useQuery({
    queryKey: ['workout-history-trends', timePeriod],
    queryFn: async () => {
      const response = await fetch("/api/workouts/history", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch workout history");
      return response.json();
    }
  });
  
  // Calculate weekly trends from workout history
  const weeklyTrends = React.useMemo(() => {
    if (!workoutHistory?.workouts) return [];
    
    const workouts = workoutHistory.workouts.filter((w: any) => w.sessionType === 'completed');
    const weeks = new Map();
    
    workouts.forEach((workout: any) => {
      const date = new Date(workout.startTime);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          weekStart: weekKey,
          totalVolume: 0,
          workoutCount: 0,
          totalDuration: 0
        });
      }
      
      const week = weeks.get(weekKey);
      week.totalVolume += workout.totalVolume || 0;
      week.workoutCount += 1;
      week.totalDuration += workout.totalDuration || 0;
    });
    
    return Array.from(weeks.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [workoutHistory]);
  
  // Export progress data - simplified to use weekly trends
  const handleExportData = async () => {
    try {
      if (!weeklyTrends || weeklyTrends.length === 0) {
        toast({
          title: "No data to export",
          description: "Complete some workouts to generate analytics data.",
          variant: "destructive",
        });
        return;
      }

      // Convert trends data to CSV
      const headers = ['Week Start', 'Total Volume (lbs)', 'Workout Count', 'Total Duration (minutes)'];
      
      const csvData = [
        headers.join(','),
        ...weeklyTrends.map((week: any) => [
          week.weekStart,
          week.totalVolume,
          week.workoutCount,
          week.totalDuration
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitforge-progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful! 📊",
        description: "Your progress data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export progress data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (metricsLoading || trendsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  // Process chart data from weekly trends
  const chartData = weeklyTrends?.map(week => ({
    month: week.weekStart.split('-').slice(1).join('/'), // MM/DD format
    volume: week.totalVolume,
    workouts: week.workoutCount,
    avgDuration: Math.round(week.avgDuration / 60) // Convert to minutes
  })) || [];
  
  // Default values if no data, using real analytics
  const defaultMetrics = {
    strengthGain: 0,
    volumeIncrease: 0,
    consistencyStreak: 0,
    totalWorkouts: 0,
    avgWorkoutDuration: 0,
    strongestMuscleGroup: 'chest',
    mostImprovedExercise: 'Bench Press'
  };
  
  const actualMetrics = metrics || defaultMetrics;
  
  // Calculate summary stats from unified metrics
  const totalVolume = metrics?.totalVolume || 0;
  const totalWorkouts = metrics?.totalWorkouts || 0;
  const totalPRs = metrics?.personalRecordCount || 0;
  const workoutsPerWeek = totalWorkouts > 0 ? (totalWorkouts / (getTimeframeDays(timePeriod) / 7)) : 0;
  
  const achievements = [
    {
      icon: Trophy,
      title: "Consistency Champion",
      description: `${actualMetrics.consistencyStreak} day streak`,
      date: "Current",
      color: "text-yellow-600"
    },
    {
      icon: Flame,
      title: "Volume Master",
      description: `${totalWorkouts} workouts completed`,
      date: `${workoutsPerWeek.toFixed(1)}/week avg`,
      color: "text-orange-600"
    },
    {
      icon: Medal,
      title: "Strength Gains",
      description: `${actualMetrics.strengthGain > 0 ? '+' : ''}${actualMetrics.strengthGain.toFixed(1)}% increase`,
      date: "This period",
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Personal Records",
      description: `${totalPRs} new PRs set`,
      date: `Strongest: ${actualMetrics.strongestMuscleGroup}`,
      color: "text-green-600"
    }
  ];
  
  // Show volume trends from unified data
  const topVolumeGains = [
    { exercise: 'All Exercises', volume: metrics?.totalVolume || 0 },
    { exercise: 'Recent Workouts', volume: weeklyTrends.slice(-4).reduce((sum: number, week: any) => sum + week.totalVolume, 0) },
    { exercise: 'This Month', volume: weeklyTrends.slice(-4).reduce((sum: number, week: any) => sum + week.totalVolume, 0) }
  ].sort((a, b) => b.volume - a.volume);
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress Analytics</CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-1 p-1 bg-muted rounded-md">
                {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                    className="px-3"
                  >
                    {period}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-2xl font-bold">
                {(totalVolume / 1000).toFixed(1)}k lbs
              </p>
              <p className="text-xs text-muted-foreground">
                {timePeriod} period
              </p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Personal Records</p>
              <p className="text-2xl font-bold">
                {totalPRs}
              </p>
              <p className="text-xs text-muted-foreground">
                New achievements
              </p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Consistency</p>
              <p className="text-2xl font-bold">
                {workoutsPerWeek.toFixed(1)}/wk
              </p>
              <p className="text-xs text-muted-foreground">
                {actualMetrics.consistencyStreak} day streak
              </p>
            </div>
          </div>
          
          {/* Progress Chart */}
          {chartData && chartData.length > 0 ? (
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3b82f6" 
                    name="Weekly Volume (lbs)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="workouts" 
                    stroke="#ef4444" 
                    name="Weekly Workouts"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Log body stats to see your progress chart
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Top Volume Gains */}
      {topVolumeGains.some(group => group.volume > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Volume by Muscle Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVolumeGains.filter(group => group.volume > 0).map((group) => (
                <div key={group.exercise} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{group.exercise}</p>
                    <p className="text-sm text-muted-foreground">
                      Total training volume
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {(group.volume / 1000).toFixed(1)}k lbs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex gap-3">
                <div className={`p-2 rounded-lg bg-muted ${achievement.color}`}>
                  <achievement.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}