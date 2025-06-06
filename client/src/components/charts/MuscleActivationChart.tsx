import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface MuscleGroupData {
  muscleGroup: string;
  frequency: number;
  exercises: string[];
  lastTrained?: string;
}

interface MuscleActivationChartProps {
  data: MuscleGroupData[];
  timeRange: '1W' | '1M' | '3M';
  className?: string;
  showRecommendations?: boolean;
  height?: number;
}

const MUSCLE_GROUP_ORDER = [
  'Chest',
  'Shoulders',
  'Back',
  'Arms',
  'Core',
  'Legs',
  'Glutes',
  'Calves'
];

export function MuscleActivationChart({
  data,
  timeRange,
  className,
  showRecommendations = true,
  height = 400
}: MuscleActivationChartProps) {
  // Chart theme
  const chartTheme = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gray: '#6b7280'
  };

  // Process and normalize data
  const processedData = useMemo(() => {
    // Create a map for all muscle groups with default values
    const muscleMap = new Map<string, MuscleGroupData>(
      MUSCLE_GROUP_ORDER.map(muscle => [
        muscle,
        { muscleGroup: muscle, frequency: 0, exercises: [] }
      ])
    );

    // Update with actual data
    data.forEach(item => {
      if (muscleMap.has(item.muscleGroup)) {
        muscleMap.set(item.muscleGroup, item);
      }
    });

    // Convert back to array maintaining order
    return MUSCLE_GROUP_ORDER.map(muscle => muscleMap.get(muscle)!);
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalActivations = processedData.reduce((sum, item) => sum + item.frequency, 0);
    const maxFrequency = Math.max(...processedData.map(item => item.frequency), 1);
    const avgFrequency = totalActivations / processedData.length;
    
    // Find underworked muscle groups (below 50% of average)
    const underworked = processedData
      .filter(item => item.frequency < avgFrequency * 0.5)
      .map(item => item.muscleGroup);
    
    // Find overworked muscle groups (above 150% of average)
    const overworked = processedData
      .filter(item => item.frequency > avgFrequency * 1.5)
      .map(item => item.muscleGroup);

    return {
      totalActivations,
      maxFrequency,
      avgFrequency,
      underworked,
      overworked
    };
  }, [processedData]);

  // Chart data
  const chartData: ChartData<'radar'> = useMemo(() => {
    const labels = processedData.map(item => item.muscleGroup);
    const frequencies = processedData.map(item => item.frequency);
    
    // Normalize to percentage of max for better visualization
    const normalizedFrequencies = frequencies.map(freq => 
      stats.maxFrequency > 0 ? (freq / stats.maxFrequency) * 100 : 0
    );

    return {
      labels,
      datasets: [
        {
          label: 'Activation Frequency',
          data: normalizedFrequencies,
          backgroundColor: `${chartTheme.primary}20`,
          borderColor: chartTheme.primary,
          borderWidth: 2,
          pointBackgroundColor: frequencies.map(freq => {
            if (freq === 0) return chartTheme.gray;
            if (freq > stats.avgFrequency * 1.5) return chartTheme.warning;
            if (freq < stats.avgFrequency * 0.5) return chartTheme.danger;
            return chartTheme.primary;
          }),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    };
  }, [processedData, stats, chartTheme]);

  // Chart options
  const chartOptions: ChartOptions<'radar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartTheme.primary,
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const muscleData = processedData[index];
            const percentage = context.parsed.r;
            
            return [
              `Frequency: ${muscleData.frequency} sessions`,
              `Percentage: ${percentage.toFixed(1)}% of max`,
              `Exercises: ${muscleData.exercises.length}`
            ];
          },
          afterLabel: (context) => {
            const index = context.dataIndex;
            const muscleData = processedData[index];
            
            if (muscleData.exercises.length > 0) {
              return [
                '',
                'Recent exercises:',
                ...muscleData.exercises.slice(0, 3).map(ex => `• ${ex}`)
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}%`,
          font: {
            size: 11
          },
          color: chartTheme.gray
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold' as const
          },
          color: (context) => {
            const index = context.index;
            const frequency = processedData[index].frequency;
            
            if (frequency === 0) return chartTheme.gray;
            if (frequency > stats.avgFrequency * 1.5) return chartTheme.warning;
            if (frequency < stats.avgFrequency * 0.5) return chartTheme.danger;
            return chartTheme.primary;
          }
        }
      }
    }
  }), [processedData, stats, chartTheme]);

  // Get time range label
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '1W': return 'Past Week';
      case '1M': return 'Past Month';
      case '3M': return 'Past 3 Months';
      default: return 'Recent';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Muscle Activation
          </CardTitle>
          <Badge variant="outline">
            {getTimeRangeLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {stats.totalActivations === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Workout Data</h3>
              <p className="text-sm">
                Complete workouts to see muscle group activation patterns
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                Track which muscle groups you're training most frequently
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalActivations}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.avgFrequency.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg per Group</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{processedData.filter(d => d.frequency > 0).length}</p>
                <p className="text-xs text-muted-foreground">Active Groups</p>
              </div>
            </div>

            {/* Radar Chart */}
            <div style={{ height: `${height}px` }}>
              <Radar data={chartData} options={chartOptions} />
            </div>

            {/* Recommendations */}
            {showRecommendations && (stats.underworked.length > 0 || stats.overworked.length > 0) && (
              <div className="mt-6 space-y-3">
                {stats.underworked.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Underworked Muscle Groups
                    </p>
                    <p className="text-xs text-red-700">
                      Consider adding more exercises for: {stats.underworked.join(', ')}
                    </p>
                  </div>
                )}
                
                {stats.overworked.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      High Frequency Groups
                    </p>
                    <p className="text-xs text-yellow-700">
                      {stats.overworked.join(', ')} - Ensure adequate recovery time
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Balanced</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>High</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>Based on workout frequency</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MuscleActivationChart;