/**
 * Strength Progress Chart Component
 * Displays strength progression by tracking 1RM estimates and max lifts over time
 * Real data visualization with transparent formula calculations
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Dumbbell, Calendar, Info, Target, Zap } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WorkoutSession {
  id: string;
  date: string;
  workoutType: string;
  duration: number; // minutes
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
      volume: number; // weight * reps
    }>;
  }>;
}

export interface ExerciseProgress {
  exerciseName: string;
  maxWeight: number;
  estimatedOneRM: number;
  totalSets: number;
  lastPerformed: string;
  progressTrend: 'increasing' | 'decreasing' | 'stable';
  strengthGain: number; // percentage improvement
}

export interface StrengthMetrics {
  totalExercises: number;
  overallStrengthGain: number;
  topExercises: ExerciseProgress[];
  strengthTrend: 'increasing' | 'decreasing' | 'stable';
  recentPRs: Array<{
    exercise: string;
    weight: number;
    reps: number;
    date: string;
    estimatedOneRM: number;
  }>;
}

export interface StrengthProgressChartProps {
  sessions: WorkoutSession[];
  timeRange?: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  focusExercises?: string[];
  showDetailedMetrics?: boolean;
  chartType?: 'line' | 'bar';
  height?: number;
}

export function StrengthProgressChart({ 
  sessions, 
  timeRange = '3M',
  focusExercises = [],
  showDetailedMetrics = true,
  chartType = 'line',
  height = 400
}: StrengthProgressChartProps) {

  const chartTheme = {
    primary: '#6366f1',
    secondary: '#8b5cf6', 
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#a855f7',
    orange: '#f97316',
    gray: '#6b7280'
  };

  // Epley formula for 1RM estimation: Weight × (1 + 0.0333 × Reps)
  const calculateOneRM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps > 15) return weight; // Don't calculate 1RM for high-rep sets
    return weight * (1 + 0.0333 * reps);
  };

  // Filter sessions by time range
  const filteredSessions = useMemo(() => {
    if (timeRange === 'ALL') return sessions;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return sessions.filter(session => 
      new Date(session.date) >= cutoffDate
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, timeRange]);

  // Calculate exercise progress and strength metrics
  const strengthMetrics: StrengthMetrics = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalExercises: 0,
        overallStrengthGain: 0,
        topExercises: [],
        strengthTrend: 'stable',
        recentPRs: []
      };
    }

    // Extract all exercise performances
    const exercisePerformances: Array<{
      exercise: string;
      weight: number;
      reps: number;
      date: string;
      estimatedOneRM: number;
    }> = [];

    filteredSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) { // Only track weighted exercises
            exercisePerformances.push({
              exercise: exercise.name,
              weight: set.weight,
              reps: set.reps,
              date: session.date,
              estimatedOneRM: calculateOneRM(set.weight, set.reps)
            });
          }
        });
      });
    });

    // Group by exercise and calculate progress
    const exerciseGroups = exercisePerformances.reduce((acc, perf) => {
      if (!acc[perf.exercise]) {
        acc[perf.exercise] = [];
      }
      acc[perf.exercise].push(perf);
      return acc;
    }, {} as Record<string, typeof exercisePerformances>);

    // Calculate progress for each exercise
    const exerciseProgressArray: ExerciseProgress[] = Object.entries(exerciseGroups)
      .map(([exerciseName, performances]) => {
        // Sort by date
        performances.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const maxWeight = Math.max(...performances.map(p => p.weight));
        const estimatedOneRM = Math.max(...performances.map(p => p.estimatedOneRM));
        const totalSets = performances.length;
        const lastPerformed = performances[performances.length - 1].date;

        // Calculate progress trend
        const firstQuarter = performances.slice(0, Math.ceil(performances.length / 4));
        const lastQuarter = performances.slice(-Math.ceil(performances.length / 4));
        
        const firstAvgOneRM = firstQuarter.reduce((sum, p) => sum + p.estimatedOneRM, 0) / firstQuarter.length;
        const lastAvgOneRM = lastQuarter.reduce((sum, p) => sum + p.estimatedOneRM, 0) / lastQuarter.length;
        
        const strengthGain = ((lastAvgOneRM - firstAvgOneRM) / firstAvgOneRM) * 100;
        
        let progressTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (strengthGain > 5) progressTrend = 'increasing';
        else if (strengthGain < -5) progressTrend = 'decreasing';

        return {
          exerciseName,
          maxWeight,
          estimatedOneRM,
          totalSets,
          lastPerformed,
          progressTrend,
          strengthGain
        };
      })
      .filter(exercise => exercise.totalSets >= 3) // Only include exercises with at least 3 sets
      .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM);

    // Calculate overall metrics
    const totalExercises = exerciseProgressArray.length;
    const overallStrengthGain = exerciseProgressArray.length > 0 
      ? exerciseProgressArray.reduce((sum, ex) => sum + ex.strengthGain, 0) / exerciseProgressArray.length
      : 0;

    const increasingCount = exerciseProgressArray.filter(ex => ex.progressTrend === 'increasing').length;
    const decreasingCount = exerciseProgressArray.filter(ex => ex.progressTrend === 'decreasing').length;
    
    let strengthTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (increasingCount > decreasingCount) strengthTrend = 'increasing';
    else if (decreasingCount > increasingCount) strengthTrend = 'decreasing';

    // Find recent PRs (personal records)
    const recentPRs = exercisePerformances
      .filter(perf => {
        // Get all performances for this exercise
        const exercisePerfs = exercisePerformances.filter(p => p.exercise === perf.exercise);
        // Sort by estimated 1RM descending
        exercisePerfs.sort((a, b) => b.estimatedOneRM - a.estimatedOneRM);
        // Check if this is the top performance for this exercise
        return exercisePerfs[0] === perf;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Top 5 recent PRs

    const topExercises = exerciseProgressArray.slice(0, 8); // Top 8 exercises by 1RM

    return {
      totalExercises,
      overallStrengthGain,
      topExercises,
      strengthTrend,
      recentPRs
    };
  }, [filteredSessions]);

  // Prepare chart data for top exercises
  const chartData: ChartData<'line'> | ChartData<'bar'> = useMemo(() => {
    if (strengthMetrics.topExercises.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Get exercises to display (focus exercises if provided, otherwise top exercises)
    const exercisesToShow = focusExercises.length > 0 
      ? strengthMetrics.topExercises.filter(ex => focusExercises.includes(ex.exerciseName))
      : strengthMetrics.topExercises.slice(0, 6);

    if (exercisesToShow.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Create timeline data for each exercise
    const datasets = exercisesToShow.map((exercise, index) => {
      // Get all performances for this exercise
      const exercisePerformances: Array<{
        date: string;
        estimatedOneRM: number;
      }> = [];

      filteredSessions.forEach(session => {
        session.exercises.forEach(ex => {
          if (ex.name === exercise.exerciseName) {
            ex.sets.forEach(set => {
              if (set.weight > 0 && set.reps > 0) {
                exercisePerformances.push({
                  date: session.date,
                  estimatedOneRM: calculateOneRM(set.weight, set.reps)
                });
              }
            });
          }
        });
      });

      // Group by date and take max 1RM per day
      const dailyMaxes = exercisePerformances.reduce((acc, perf) => {
        const date = perf.date;
        if (!acc[date] || perf.estimatedOneRM > acc[date]) {
          acc[date] = perf.estimatedOneRM;
        }
        return acc;
      }, {} as Record<string, number>);

      // Sort by date
      const sortedData = Object.entries(dailyMaxes)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, oneRM]) => ({ date, oneRM }));

      const colors = [
        chartTheme.primary,
        chartTheme.success,
        chartTheme.warning,
        chartTheme.purple,
        chartTheme.orange,
        chartTheme.info
      ];

      return {
        label: exercise.exerciseName,
        data: sortedData.map(d => d.oneRM),
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}20`,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: colors[index % colors.length],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    // Use the longest timeline as labels
    const allDates = new Set<string>();
    filteredSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (exercisesToShow.some(ex => ex.exerciseName === exercise.name)) {
          allDates.add(session.date);
        }
      });
    });

    const sortedDates = Array.from(allDates).sort();
    const labels = sortedDates.map(date => format(parseISO(date), 'MMM d'));

    return { labels, datasets };
  }, [filteredSessions, strengthMetrics.topExercises, focusExercises, chartTheme]);

  // Chart options
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartTheme.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} lbs (est. 1RM)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: chartTheme.gray,
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: chartTheme.gray,
          font: {
            size: 10
          },
          callback: (value) => `${value} lbs`
        },
        beginAtZero: false
      }
    }
  };

  const getTrendIcon = () => {
    switch (strengthMetrics.strengthTrend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Dumbbell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    switch (strengthMetrics.strengthTrend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (filteredSessions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Strength Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Strength Data</h3>
            <p className="text-muted-foreground max-w-md">
              Log workouts with weighted exercises to track your strength progression. We calculate estimated 1RM using the Epley formula.
            </p>
            <Badge variant="outline" className="mt-4">
              Formula: 1RM = Weight × (1 + 0.0333 × Reps)
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Strength Progress Chart
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated 1RM progression over {timeRange === 'ALL' ? 'all time' : timeRange} • {strengthMetrics.totalExercises} exercises tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {strengthMetrics.strengthTrend}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        {showDetailedMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {strengthMetrics.overallStrengthGain > 0 ? '+' : ''}
                {strengthMetrics.overallStrengthGain.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Strength Gain</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {strengthMetrics.topExercises.length > 0 
                  ? Math.round(strengthMetrics.topExercises[0].estimatedOneRM) 
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Top 1RM (lbs)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {strengthMetrics.recentPRs.length}
              </p>
              <p className="text-xs text-muted-foreground">Recent PRs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info">
                {strengthMetrics.totalExercises}
              </p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: `${height}px` }}>
          {chartType === 'line' ? (
            <Line data={chartData as ChartData<'line'>} options={chartOptions as ChartOptions<'line'>} />
          ) : (
            <Bar data={chartData as ChartData<'bar'>} options={chartOptions as ChartOptions<'bar'>} />
          )}
        </div>

        {/* Recent PRs */}
        {showDetailedMetrics && strengthMetrics.recentPRs.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-warning" />
              Recent Personal Records
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {strengthMetrics.recentPRs.slice(0, 6).map((pr, index) => (
                <div key={index} className="bg-background rounded p-3">
                  <p className="font-medium text-sm">{pr.exercise}</p>
                  <p className="text-lg font-bold text-primary">
                    {pr.weight} lbs × {pr.reps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Est. 1RM: {Math.round(pr.estimatedOneRM)} lbs
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(pr.date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Exercises Summary */}
        {showDetailedMetrics && strengthMetrics.topExercises.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-success" />
              Strongest Exercises by Estimated 1RM
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strengthMetrics.topExercises.slice(0, 6).map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                  <div>
                    <p className="font-medium text-sm">{exercise.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.totalSets} sets • {exercise.strengthGain > 0 ? '+' : ''}{exercise.strengthGain.toFixed(1)}% gain
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{Math.round(exercise.estimatedOneRM)} lbs</p>
                    <Badge 
                      variant={exercise.progressTrend === 'increasing' ? 'default' : 
                               exercise.progressTrend === 'decreasing' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {exercise.progressTrend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formula Explanation */}
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                Strength Calculation Formula
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Epley Formula:</strong> Estimated 1RM = Weight × (1 + 0.0333 × Reps)
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Progress Tracking:</strong> Comparing average estimated 1RM over time periods
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-2">
                <strong>Data Source:</strong> Real workout data from weighted exercises only (bodyweight exercises excluded)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}