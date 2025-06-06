import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { localWorkoutService } from "@/services/local-workout-service";
import type { WorkoutSession } from "@/lib/supabase";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Dumbbell,
  Clock,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Flame,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "1y";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface MuscleGroupData {
  name: string;
  volume: number;
  workouts: number;
  color: string;
}

interface WorkoutTrendData {
  date: string;
  volume: number;
  duration: number;
  workouts: number;
  calories: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch workout data
  const { data: workoutSessions = [], isLoading, error } = useQuery<WorkoutSession[]>({
    queryKey: ["analytics-workout-history", user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];
      console.log(`🔍 Fetching analytics data for ${timeRange}...`);
      
      // Get more data for analytics
      const limit = timeRange === "7d" ? 50 : timeRange === "30d" ? 100 : 200;
      const sessions = await localWorkoutService.getWorkoutHistory(user.id.toString(), limit);
      console.log(`✅ Found ${sessions.length} sessions for analytics`);
      return sessions;
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000
  });

  // Calculate date range for filtering
  const dateRange = useMemo(() => {
    const now = new Date();
    const ranges = {
      "7d": subDays(now, 7),
      "30d": subDays(now, 30),
      "90d": subDays(now, 90),
      "1y": subDays(now, 365)
    };
    return ranges[timeRange];
  }, [timeRange]);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    return workoutSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= dateRange;
    });
  }, [workoutSessions, dateRange]);

  // Calculate analytics metrics
  const analyticsMetrics = useMemo((): AnalyticsMetric[] => {
    const completedSessions = filteredSessions.filter(s => s.completion_status === 'completed');
    
    const totalVolume = completedSessions.reduce((sum, session) => sum + (session.total_volume_lbs || 0), 0);
    const totalDuration = completedSessions.reduce((sum, session) => sum + (session.total_duration_seconds || 0), 0);
    const totalCalories = completedSessions.reduce((sum, session) => sum + (session.calories_burned || 0), 0);
    const workoutCount = completedSessions.length;
    
    const avgDuration = workoutCount > 0 ? Math.round(totalDuration / workoutCount / 60) : 0;
    const avgVolume = workoutCount > 0 ? Math.round(totalVolume / workoutCount) : 0;
    
    // Calculate previous period for comparisons
    const periodDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const prevStart = subDays(dateRange, periodDays);
    const prevSessions = workoutSessions.filter(s => {
      const date = new Date(s.start_time);
      return date >= prevStart && date < dateRange && s.completion_status === 'completed';
    });
    
    const prevVolume = prevSessions.reduce((sum, s) => sum + (s.total_volume_lbs || 0), 0);
    const prevWorkouts = prevSessions.length;
    
    const volumeChange = prevVolume > 0 ? ((totalVolume - prevVolume) / prevVolume) * 100 : 0;
    const workoutChange = prevWorkouts > 0 ? ((workoutCount - prevWorkouts) / prevWorkouts) * 100 : 0;

    return [
      {
        label: "Total Volume",
        value: `${totalVolume.toLocaleString()} lbs`,
        change: volumeChange,
        changeLabel: `vs previous ${timeRange}`,
        icon: Dumbbell,
        color: "text-blue-600"
      },
      {
        label: "Workouts Completed",
        value: workoutCount,
        change: workoutChange,
        changeLabel: `vs previous ${timeRange}`,
        icon: Activity,
        color: "text-green-600"
      },
      {
        label: "Avg Workout Duration",
        value: `${avgDuration} min`,
        icon: Clock,
        color: "text-purple-600"
      },
      {
        label: "Total Calories Burned",
        value: totalCalories.toLocaleString(),
        icon: Flame,
        color: "text-orange-600"
      },
      {
        label: "Avg Volume per Workout",
        value: `${avgVolume.toLocaleString()} lbs`,
        icon: Target,
        color: "text-indigo-600"
      },
      {
        label: "Workout Frequency",
        value: `${(workoutCount / periodDays * 7).toFixed(1)}/week`,
        icon: Calendar,
        color: "text-teal-600"
      }
    ];
  }, [filteredSessions, workoutSessions, timeRange, dateRange]);

  // Generate workout trend data
  const workoutTrendData = useMemo((): WorkoutTrendData[] => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const interval = timeRange === "1y" ? 7 : 1; // Weekly intervals for 1 year, daily otherwise
    
    const data: WorkoutTrendData[] = [];
    
    for (let i = days - interval; i >= 0; i -= interval) {
      const date = subDays(new Date(), i);
      const endDate = interval > 1 ? subDays(new Date(), i - interval + 1) : date;
      
      const periodsessions = filteredSessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= endDate && sessionDate <= date && session.completion_status === 'completed';
      });
      
      const volume = periodsessions.reduce((sum, s) => sum + (s.total_volume_lbs || 0), 0);
      const duration = periodsessions.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) / 60; // Convert to minutes
      const calories = periodsessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0);
      
      data.push({
        date: interval > 1 ? `Week of ${format(endDate, 'MMM d')}` : format(date, 'MMM d'),
        volume: Math.round(volume),
        duration: Math.round(duration),
        workouts: periodsessions.length,
        calories: Math.round(calories)
      });
    }
    
    return data.reverse();
  }, [filteredSessions, timeRange]);

  // Generate muscle group distribution data
  const muscleGroupData = useMemo((): MuscleGroupData[] => {
    const muscleGroups = new Map<string, { volume: number; workouts: number }>();
    
    filteredSessions.forEach(session => {
      if (session.completion_status !== 'completed') return;
      
      // Extract muscle groups from workout type
      const workoutType = session.workout_type || 'Other';
      const volume = session.total_volume_lbs || 0;
      
      // Simple muscle group mapping based on workout type
      let muscleGroup = 'Other';
      if (workoutType.toLowerCase().includes('chest') || workoutType.toLowerCase().includes('push')) {
        muscleGroup = 'Chest';
      } else if (workoutType.toLowerCase().includes('back') || workoutType.toLowerCase().includes('pull')) {
        muscleGroup = 'Back';
      } else if (workoutType.toLowerCase().includes('leg') || workoutType.toLowerCase().includes('squat')) {
        muscleGroup = 'Legs';
      } else if (workoutType.toLowerCase().includes('shoulder')) {
        muscleGroup = 'Shoulders';
      } else if (workoutType.toLowerCase().includes('arm') || workoutType.toLowerCase().includes('bicep') || workoutType.toLowerCase().includes('tricep')) {
        muscleGroup = 'Arms';
      } else if (workoutType.toLowerCase().includes('core') || workoutType.toLowerCase().includes('ab')) {
        muscleGroup = 'Core';
      }
      
      const current = muscleGroups.get(muscleGroup) || { volume: 0, workouts: 0 };
      muscleGroups.set(muscleGroup, {
        volume: current.volume + volume,
        workouts: current.workouts + 1
      });
    });
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    return Array.from(muscleGroups.entries()).map(([name, data], index) => ({
      name,
      volume: data.volume,
      workouts: data.workouts,
      color: colors[index % colors.length]
    }));
  }, [filteredSessions]);

  // Render change indicator
  const renderChangeIndicator = (change?: number) => {
    if (change === undefined) return null;
    
    const isPositive = change > 0;
    const isNeutral = Math.abs(change) < 1;
    
    if (isNeutral) {
      return (
        <div className="flex items-center text-muted-foreground">
          <Minus className="h-3 w-3 mr-1" />
          <span className="text-sm">No change</span>
        </div>
      );
    }
    
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
        <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-muted-foreground mb-4">Unable to load analytics data</p>
              <Button onClick={() => window.location.reload()} size="sm">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Workout Analytics</h1>
              <p className="text-muted-foreground">
                Track your progress and identify trends in your fitness journey
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {analyticsMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 ${metric.color}`} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            <p className="text-2xl font-bold">{metric.value}</p>
                          </div>
                        </div>
                      </div>
                      
                      {metric.change !== undefined && (
                        <div className="mt-4 flex items-center justify-between">
                          {renderChangeIndicator(metric.change)}
                          <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-accent" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Most Active Day</span>
                    <Badge variant="secondary">
                      {workoutTrendData.length > 0 
                        ? workoutTrendData.reduce((max, day) => day.workouts > max.workouts ? day : max).date
                        : 'No data'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Volume Day</span>
                    <Badge variant="secondary">
                      {workoutTrendData.length > 0 
                        ? `${workoutTrendData.reduce((max, day) => day.volume > max.volume ? day : max).volume.toLocaleString()} lbs`
                        : 'No data'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Longest Workout</span>
                    <Badge variant="secondary">
                      {workoutTrendData.length > 0 
                        ? `${Math.max(...workoutTrendData.map(d => d.duration))} min`
                        : 'No data'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Consistency Rate</span>
                    <Badge variant="secondary">
                      {filteredSessions.length > 0 
                        ? `${((filteredSessions.filter(s => s.completion_status === 'completed').length / filteredSessions.length) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Workout Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(filteredSessions.map(s => s.workout_type || 'Custom')))
                      .slice(0, 5)
                      .map((workoutType, index) => {
                        const count = filteredSessions.filter(s => (s.workout_type || 'Custom') === workoutType).length;
                        const percentage = (count / filteredSessions.length) * 100;
                        
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{workoutType}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-8">
            <div className="grid gap-6">
              {/* Volume Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Volume Progression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workoutTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'volume' ? `${value} lbs` : value,
                            name === 'volume' ? 'Volume' : name
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3b82f6" 
                          fill="url(#volumeGradient)" 
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Workout Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Workout Frequency & Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={workoutTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="workouts" fill="#10b981" name="Workouts" />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="duration" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          name="Duration (min)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Muscle Group Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dumbbell className="w-5 h-5 mr-2 text-indigo-600" />
                    Volume by Muscle Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={muscleGroupData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="volume"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {muscleGroupData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} lbs`, 'Volume']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Workout Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Workouts by Muscle Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={muscleGroupData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip formatter={(value) => [value, 'Workouts']} />
                        <Bar 
                          dataKey="workouts" 
                          fill="#8b5cf6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Muscle Group Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {muscleGroupData.map((group, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{group.name}</h4>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Volume:</span>
                          <span className="font-medium">{group.volume.toLocaleString()} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Workouts:</span>
                          <span className="font-medium">{group.workouts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg per workout:</span>
                          <span className="font-medium">
                            {group.workouts > 0 ? Math.round(group.volume / group.workouts).toLocaleString() : 0} lbs
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Status */}
        {filteredSessions.length === 0 && (
          <Card className="mt-8 text-center py-12">
            <CardContent>
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                No workout data found for the selected time period. Start logging workouts to see your analytics.
              </p>
              <Button>
                Start Your First Workout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}