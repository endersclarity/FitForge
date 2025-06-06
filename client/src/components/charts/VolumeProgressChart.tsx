/**
 * Volume Progress Chart Component
 * Displays workout volume progression over time using Chart.js
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
import { TrendingUp, TrendingDown, BarChart3, Calendar, Info, Target } from 'lucide-react';
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

interface VolumeMetrics {
  totalVolume: number;
  averageVolume: number;
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  bestVolumeSession: WorkoutSession | null;
  volumeByType: Record<string, number>;
}

interface VolumeProgressChartProps {
  sessions: WorkoutSession[];
  timeRange?: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  showDetailedMetrics?: boolean;
  chartType?: 'line' | 'bar' | 'both';
  height?: number;
}

export function VolumeProgressChart({ 
  sessions, 
  timeRange = '3M',
  showDetailedMetrics = true,
  chartType = 'line',
  height = 400
}: VolumeProgressChartProps) {

  const chartTheme = {
    primary: '#6366f1',
    secondary: '#8b5cf6', 
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    gray: '#6b7280'
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

  // Calculate volume metrics
  const volumeMetrics: VolumeMetrics = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalVolume: 0,
        averageVolume: 0,
        volumeTrend: 'stable',
        bestVolumeSession: null,
        volumeByType: {}
      };
    }

    // Calculate total volume per session
    const sessionVolumes = filteredSessions.map(session => {
      const totalVolume = session.exercises.reduce((sessionTotal, exercise) => {
        const exerciseVolume = exercise.sets.reduce((exerciseTotal, set) => 
          exerciseTotal + set.volume, 0
        );
        return sessionTotal + exerciseVolume;
      }, 0);
      
      return { ...session, totalVolume };
    });

    const totalVolume = sessionVolumes.reduce((sum, session) => sum + session.totalVolume, 0);
    const averageVolume = totalVolume / sessionVolumes.length;

    // Determine trend (compare first half vs second half)
    const midpoint = Math.floor(sessionVolumes.length / 2);
    const firstHalfAvg = sessionVolumes.slice(0, midpoint).reduce((sum, s) => sum + s.totalVolume, 0) / midpoint;
    const secondHalfAvg = sessionVolumes.slice(midpoint).reduce((sum, s) => sum + s.totalVolume, 0) / (sessionVolumes.length - midpoint);
    
    let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const trendThreshold = averageVolume * 0.1; // 10% threshold
    
    if (secondHalfAvg > firstHalfAvg + trendThreshold) {
      volumeTrend = 'increasing';
    } else if (secondHalfAvg < firstHalfAvg - trendThreshold) {
      volumeTrend = 'decreasing';
    }

    const bestVolumeSession = sessionVolumes.reduce((best, current) => 
      current.totalVolume > best.totalVolume ? current : best
    );

    // Volume by workout type
    const volumeByType = sessionVolumes.reduce((acc, session) => {
      acc[session.workoutType] = (acc[session.workoutType] || 0) + session.totalVolume;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVolume,
      averageVolume,
      volumeTrend,
      bestVolumeSession,
      volumeByType
    };
  }, [filteredSessions]);

  // Prepare chart data
  const chartData: ChartData<'line' | 'bar'> = useMemo(() => {
    const sessionVolumes = filteredSessions.map(session => {
      const totalVolume = session.exercises.reduce((sessionTotal, exercise) => {
        const exerciseVolume = exercise.sets.reduce((exerciseTotal, set) => 
          exerciseTotal + set.volume, 0
        );
        return sessionTotal + exerciseVolume;
      }, 0);
      
      return {
        date: session.date,
        volume: totalVolume,
        workoutType: session.workoutType
      };
    });

    // Calculate moving average (3-session window)
    const movingAverages = sessionVolumes.map((_, index) => {
      const start = Math.max(0, index - 1);
      const end = Math.min(sessionVolumes.length, index + 2);
      const window = sessionVolumes.slice(start, end);
      const avg = window.reduce((sum, s) => sum + s.volume, 0) / window.length;
      return avg;
    });

    return {
      labels: sessionVolumes.map(s => format(parseISO(s.date), 'MMM d')),
      datasets: [
        {
          label: 'Workout Volume (lbs)',
          data: sessionVolumes.map(s => s.volume),
          borderColor: chartTheme.primary,
          backgroundColor: chartType === 'bar' ? `${chartTheme.primary}80` : `${chartTheme.primary}20`,
          borderWidth: 3,
          fill: chartType === 'line',
          tension: 0.4,
          pointBackgroundColor: chartTheme.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          type: chartType === 'both' ? 'bar' : chartType
        },
        ...(chartType === 'line' || chartType === 'both' ? [{
          label: 'Moving Average',
          data: movingAverages,
          borderColor: chartTheme.info,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          type: 'line' as const
        }] : [])
      ]
    };
  }, [filteredSessions, chartType, chartTheme]);

  // Chart options
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
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
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} lbs`;
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
            size: 11
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
            size: 11
          },
          callback: (value) => `${value} lbs`
        },
        beginAtZero: true
      }
    }
  };

  const getTrendIcon = () => {
    switch (volumeMetrics.volumeTrend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    switch (volumeMetrics.volumeTrend) {
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
            <BarChart3 className="w-5 h-5" />
            Volume Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Workout Data</h3>
            <p className="text-muted-foreground max-w-md">
              Complete some workouts to see your volume progression. Each workout's volume is calculated as the sum of weight × reps for all exercises.
            </p>
            <Badge variant="outline" className="mt-4">
              Formula: Volume = Σ (Weight × Reps) per workout
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
              <BarChart3 className="w-5 h-5 text-primary" />
              Volume Progress Chart
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Workout volume progression over {timeRange === 'ALL' ? 'all time' : timeRange} • {filteredSessions.length} sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {volumeMetrics.volumeTrend}
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
                {Math.round(volumeMetrics.totalVolume).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Volume (lbs)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {Math.round(volumeMetrics.averageVolume).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Avg per Session</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {volumeMetrics.bestVolumeSession ? Math.round(volumeMetrics.bestVolumeSession.totalVolume).toLocaleString() : 0}
              </p>
              <p className="text-xs text-muted-foreground">Best Session</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info">
                {filteredSessions.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: `${height}px` }}>
          {chartType === 'line' || chartType === 'both' ? (
            <Line data={chartData} options={chartOptions as ChartOptions<'line'>} />
          ) : (
            <Bar data={chartData} options={chartOptions as ChartOptions<'bar'>} />
          )}
        </div>

        {/* Best Session Details */}
        {showDetailedMetrics && volumeMetrics.bestVolumeSession && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              Best Volume Session
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(parseISO(volumeMetrics.bestVolumeSession.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Workout Type</p>
                <p className="font-medium">{volumeMetrics.bestVolumeSession.workoutType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Volume</p>
                <p className="font-medium">
                  {Math.round(volumeMetrics.bestVolumeSession.totalVolume).toLocaleString()} lbs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formula Explanation */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Volume Calculation Formula
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Volume per Exercise:</strong> Weight × Reps for each set, summed per exercise
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Total Workout Volume:</strong> Sum of all exercise volumes in the session
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                <strong>Data Source:</strong> Real workout data from {filteredSessions.length} logged sessions
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}