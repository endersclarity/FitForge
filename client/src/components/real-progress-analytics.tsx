import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Medal, TrendingUp, Download, Calendar, Activity } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";

export function RealProgressAnalytics() {
  const [timePeriod, setTimePeriod] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("3M");
  const { toast } = useToast();
  
  // Fetch real progress metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['progressMetrics', timePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/progress/metrics?period=${timePeriod}`);
      if (!response.ok) throw new Error('Failed to fetch progress metrics');
      return response.json();
    }
  });
  
  // Fetch chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['progressChart', timePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/progress/chart-data?period=${timePeriod}`);
      if (!response.ok) throw new Error('Failed to fetch chart data');
      return response.json();
    }
  });
  
  // Export progress data
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/progress/export?format=csv');
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
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
  
  if (metricsLoading || chartLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }
  
  // Default values if no data
  const {
    muscle = { change: 0, changePercent: 0, current: 0 },
    bodyFat = { change: 0, changePercent: 0, current: 0 },
    strength = { overall: { changePercent: 0 } },
    consistency = { workoutsPerWeek: 0, streak: 0, totalWorkouts: 0 }
  } = metrics || {};
  
  const achievements = [
    {
      icon: Trophy,
      title: "Consistency King",
      description: `${consistency.streak} day streak`,
      date: "Current",
      color: "text-yellow-600"
    },
    {
      icon: Flame,
      title: "Volume Master",
      description: `${consistency.totalWorkouts} workouts completed`,
      date: `${consistency.workoutsPerWeek.toFixed(1)}/week avg`,
      color: "text-orange-600"
    },
    {
      icon: Medal,
      title: "Strength Gains",
      description: `${strength.overall.changePercent > 0 ? '+' : ''}${strength.overall.changePercent.toFixed(1)}% increase`,
      date: "This period",
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Body Composition",
      description: muscle.change > 0 ? `+${muscle.change.toFixed(1)}kg muscle` : "Track more data",
      date: bodyFat.change < 0 ? `${bodyFat.change.toFixed(1)}% fat` : "No change",
      color: "text-green-600"
    }
  ];
  
  // Format strength exercises for display
  const topStrengthGains = Object.entries(strength.exercises || {})
    .sort((a, b) => b[1].changePercent - a[1].changePercent)
    .slice(0, 3);
  
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
              <p className="text-sm text-muted-foreground mb-1">Muscle Gained</p>
              <p className="text-2xl font-bold">
                {muscle.change > 0 ? '+' : ''}{muscle.change.toFixed(1)}kg
              </p>
              <p className="text-xs text-muted-foreground">
                Current: {muscle.current.toFixed(1)}kg
              </p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Body Fat Lost</p>
              <p className="text-2xl font-bold">
                {bodyFat.change.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Current: {bodyFat.current.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Strength Increase</p>
              <p className="text-2xl font-bold">
                {strength.overall.changePercent > 0 ? '+' : ''}{strength.overall.changePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Avg across exercises
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
                    dataKey="muscle" 
                    stroke="#3b82f6" 
                    name="Muscle Mass (kg)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fat" 
                    stroke="#ef4444" 
                    name="Body Fat (%)"
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
      
      {/* Top Strength Gains */}
      {topStrengthGains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Strength Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStrengthGains.map(([exercise, data]) => (
                <div key={exercise} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exercise}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.start.toFixed(0)}kg → {data.current.toFixed(0)}kg
                    </p>
                  </div>
                  <Badge variant={data.changePercent > 10 ? "default" : "secondary"}>
                    +{data.changePercent.toFixed(1)}%
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