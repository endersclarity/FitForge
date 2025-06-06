// VolumeProgressChart Component
// Shows total workout volume (weight × reps × sets) over time using Chart.js line chart
// Created: June 6, 2025

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WorkoutVolumeData {
  date: string;
  totalVolume: number;
  workoutType: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
      volume: number;
    }>;
  }>;
}

interface VolumeProgressChartProps {
  data: WorkoutVolumeData[];
  timeRange: '1W' | '1M' | '3M' | '6M' | '1Y';
  className?: string;
  showTrend?: boolean;
  showAverage?: boolean;
  height?: number;
}

export function VolumeProgressChart({
  data,
  timeRange,
  className,
  showTrend = true,
  showAverage = true,
  height = 300
}: VolumeProgressChartProps) {
  
  // Chart theme
  const chartTheme = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gray: '#6b7280'
  };

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '1W':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data
      .filter(session => new Date(session.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalVolume: 0,
        averageVolume: 0,
        highestVolume: 0,
        trend: 'stable' as const,
        trendPercentage: 0,
        workoutCount: 0
      };
    }

    const totalVolume = filteredData.reduce((sum, session) => sum + session.totalVolume, 0);
    const averageVolume = totalVolume / filteredData.length;
    const highestVolume = Math.max(...filteredData.map(session => session.totalVolume));
    
    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midpoint);
    const secondHalf = filteredData.slice(midpoint);
    
    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return {
        totalVolume,
        averageVolume,
        highestVolume,
        trend: 'stable' as const,
        trendPercentage: 0,
        workoutCount: filteredData.length
      };
    }
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.totalVolume, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.totalVolume, 0) / secondHalf.length;
    
    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    const trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
    
    return {
      totalVolume,
      averageVolume,
      highestVolume,
      trend,
      trendPercentage: Math.abs(trendPercentage),
      workoutCount: filteredData.length
    };
  }, [filteredData]);

  // Chart data
  const chartData: ChartData<'line'> = useMemo(() => {
    const labels = filteredData.map(session => {
      const date = new Date(session.date);
      if (timeRange === '1W') {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      } else if (timeRange === '1M' || timeRange === '3M') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
    });

    const volumeData = filteredData.map(session => session.totalVolume);
    const averageVolume = metrics.averageVolume;

    return {
      labels,
      datasets: [
        {
          label: 'Total Volume (lbs)',
          data: volumeData,
          borderColor: chartTheme.primary,
          backgroundColor: `${chartTheme.primary}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: chartTheme.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
        ...(showAverage ? [{
          label: 'Average Volume',
          data: new Array(volumeData.length).fill(averageVolume),
          borderColor: chartTheme.gray,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        }] : [])
      ]
    };
  }, [filteredData, metrics.averageVolume, showAverage, timeRange, chartTheme]);

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
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
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const sessionIndex = context.dataIndex;
            const session = filteredData[sessionIndex];
            if (context.datasetIndex === 0 && session) {
              return [
                `Volume: ${context.parsed.y.toLocaleString()} lbs`,
                `Workout: ${session.workoutType}`,
                `Exercises: ${session.exercises.length}`
              ];
            }
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
          },
          maxTicksLimit: timeRange === '1W' ? 7 : timeRange === '1M' ? 8 : 6
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
          callback: (value) => `${(value as number).toLocaleString()}`
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      line: {
        borderCapStyle: 'round' as const
      }
    }
  }), [chartTheme, filteredData, timeRange]);

  // Trend icon and color
  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (metrics.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Volume Progress
          </CardTitle>
          {showTrend && metrics.workoutCount > 2 && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {metrics.trendPercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Workout Data</h3>
              <p className="text-sm">
                Complete workouts to see volume progression over time
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                Volume = Weight × Reps × Sets for all exercises
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.workoutCount}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Math.round(metrics.averageVolume).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Avg Volume</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Math.round(metrics.highestVolume).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Peak Volume</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Math.round(metrics.totalVolume).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: `${height}px` }}>
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Additional Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Tracking {timeRange} • {filteredData.length} workouts
              </p>
              {showTrend && metrics.workoutCount > 2 && (
                <Badge variant="outline" className={getTrendColor()}>
                  {metrics.trend === 'up' ? 'Trending Up' : 
                   metrics.trend === 'down' ? 'Trending Down' : 'Stable'}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default VolumeProgressChart;