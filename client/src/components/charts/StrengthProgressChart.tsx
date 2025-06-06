// StrengthProgressChart Component
// Shows max weight progression per exercise using Chart.js bar chart
// Created: June 6, 2025

import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, TrendingUp, Trophy, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExerciseRecord {
  exerciseName: string;
  date: string;
  weight: number;
  reps: number;
  workoutType: string;
}

interface StrengthProgressChartProps {
  data: ExerciseRecord[];
  timeRange: '1M' | '3M' | '6M' | '1Y';
  className?: string;
  showPersonalRecords?: boolean;
  exerciseFilter?: string;
  height?: number;
}

interface ExerciseProgress {
  exerciseName: string;
  currentMax: number;
  previousMax: number;
  improvement: number;
  improvementPercentage: number;
  workoutType: string;
  lastUpdated: string;
  totalSessions: number;
}

export function StrengthProgressChart({
  data,
  timeRange,
  className,
  showPersonalRecords = true,
  exerciseFilter,
  height = 400
}: StrengthProgressChartProps) {
  
  const [selectedExerciseType, setSelectedExerciseType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'improvement' | 'current' | 'name'>('improvement');

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
    
    let filtered = data.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= cutoff && record.weight > 0; // Only include weighted exercises
    });

    // Apply exercise filter if provided
    if (exerciseFilter) {
      filtered = filtered.filter(record => 
        record.exerciseName.toLowerCase().includes(exerciseFilter.toLowerCase())
      );
    }

    // Apply exercise type filter
    if (selectedExerciseType !== 'all') {
      filtered = filtered.filter(record => 
        record.workoutType.toLowerCase().includes(selectedExerciseType.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeRange, exerciseFilter, selectedExerciseType]);

  // Calculate exercise progress
  const exerciseProgress = useMemo(() => {
    const progressMap = new Map<string, ExerciseProgress>();
    
    // Group records by exercise
    const exerciseGroups = filteredData.reduce((groups, record) => {
      if (!groups[record.exerciseName]) {
        groups[record.exerciseName] = [];
      }
      groups[record.exerciseName].push(record);
      return groups;
    }, {} as Record<string, ExerciseRecord[]>);

    // Calculate progress for each exercise
    Object.entries(exerciseGroups).forEach(([exerciseName, records]) => {
      if (records.length === 0) return;

      // Sort records by date
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Find max weights
      const currentMax = Math.max(...records.map(r => r.weight));
      const currentMaxRecord = records.find(r => r.weight === currentMax);
      
      // Calculate previous max (from first half of time period)
      const midpoint = Math.floor(records.length / 2);
      const earlierRecords = records.slice(0, Math.max(1, midpoint));
      const previousMax = Math.max(...earlierRecords.map(r => r.weight));
      
      const improvement = currentMax - previousMax;
      const improvementPercentage = previousMax > 0 ? (improvement / previousMax) * 100 : 0;
      
      progressMap.set(exerciseName, {
        exerciseName,
        currentMax,
        previousMax,
        improvement,
        improvementPercentage,
        workoutType: currentMaxRecord?.workoutType || '',
        lastUpdated: currentMaxRecord?.date || '',
        totalSessions: records.length
      });
    });

    // Convert to array and sort
    let progressArray = Array.from(progressMap.values());
    
    switch (sortBy) {
      case 'improvement':
        progressArray.sort((a, b) => b.improvement - a.improvement);
        break;
      case 'current':
        progressArray.sort((a, b) => b.currentMax - a.currentMax);
        break;
      case 'name':
        progressArray.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
        break;
    }
    
    return progressArray.slice(0, 10); // Show top 10 exercises
  }, [filteredData, sortBy]);

  // Get unique workout types for filter
  const workoutTypes = useMemo(() => {
    const types = [...new Set(data.map(record => record.workoutType))];
    return types.filter(type => type && type.length > 0);
  }, [data]);

  // Chart data
  const chartData: ChartData<'bar'> = useMemo(() => {
    const labels = exerciseProgress.map(exercise => {
      // Truncate long exercise names
      const name = exercise.exerciseName;
      return name.length > 20 ? `${name.substring(0, 17)}...` : name;
    });

    const currentWeights = exerciseProgress.map(exercise => exercise.currentMax);
    const previousWeights = exerciseProgress.map(exercise => exercise.previousMax);

    return {
      labels,
      datasets: [
        {
          label: 'Previous Max',
          data: previousWeights,
          backgroundColor: `${chartTheme.gray}60`,
          borderColor: chartTheme.gray,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Current Max',
          data: currentWeights,
          backgroundColor: currentWeights.map((current, index) => {
            const previous = previousWeights[index];
            if (current > previous) return `${chartTheme.success}80`;
            if (current < previous) return `${chartTheme.danger}80`;
            return `${chartTheme.primary}80`;
          }),
          borderColor: currentWeights.map((current, index) => {
            const previous = previousWeights[index];
            if (current > previous) return chartTheme.success;
            if (current < previous) return chartTheme.danger;
            return chartTheme.primary;
          }),
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }, [exerciseProgress, chartTheme]);

  // Chart options
  const chartOptions: ChartOptions<'bar'> = useMemo(() => ({
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
          title: (context) => {
            const exerciseIndex = context[0].dataIndex;
            return exerciseProgress[exerciseIndex]?.exerciseName || '';
          },
          label: (context) => {
            const exerciseIndex = context.dataIndex;
            const exercise = exerciseProgress[exerciseIndex];
            if (context.datasetIndex === 1 && exercise) {
              const improvement = exercise.improvement;
              const improvementText = improvement > 0 ? `+${improvement}` : `${improvement}`;
              return [
                `Current Max: ${context.parsed.y} lbs`,
                `Improvement: ${improvementText} lbs (${exercise.improvementPercentage.toFixed(1)}%)`,
                `Sessions: ${exercise.totalSessions}`,
                `Last Updated: ${new Date(exercise.lastUpdated).toLocaleDateString()}`
              ];
            }
            return `${context.dataset.label}: ${context.parsed.y} lbs`;
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
          },
          maxRotation: 45,
          minRotation: 0
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
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }), [chartTheme, exerciseProgress]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (exerciseProgress.length === 0) {
      return {
        totalExercises: 0,
        avgImprovement: 0,
        bestImprovement: { exercise: '', improvement: 0 },
        recordsSet: 0
      };
    }

    const totalExercises = exerciseProgress.length;
    const improvements = exerciseProgress.map(e => e.improvement);
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    const bestImprovement = exerciseProgress.reduce((best, current) => 
      current.improvement > best.improvement ? current : best
    );
    const recordsSet = exerciseProgress.filter(e => e.improvement > 0).length;

    return {
      totalExercises,
      avgImprovement,
      bestImprovement: {
        exercise: bestImprovement.exerciseName,
        improvement: bestImprovement.improvement
      },
      recordsSet
    };
  }, [exerciseProgress]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Strength Progress
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Workout Type Filter */}
            <Select value={selectedExerciseType} onValueChange={setSelectedExerciseType}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {workoutTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'improvement' | 'current' | 'name') => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improvement">By Progress</SelectItem>
                <SelectItem value="current">By Weight</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {exerciseProgress.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Strength Data</h3>
              <p className="text-sm">
                Complete more workouts with weights to track strength progression
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                Shows max weight achieved per exercise over time
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{summaryStats.totalExercises}</p>
                <p className="text-xs text-muted-foreground">Exercises</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">+{summaryStats.avgImprovement.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Avg Improvement</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{summaryStats.recordsSet}</p>
                <p className="text-xs text-muted-foreground">Records Set</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">+{summaryStats.bestImprovement.improvement}</p>
                <p className="text-xs text-muted-foreground">Best Gain</p>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: `${height}px` }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Personal Records Section */}
            {showPersonalRecords && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  Recent Progress Highlights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exerciseProgress
                    .filter(exercise => exercise.improvement > 0)
                    .slice(0, 4)
                    .map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{exercise.exerciseName}</p>
                        <p className="text-xs text-green-700">
                          +{exercise.improvement} lbs (+{exercise.improvementPercentage.toFixed(1)}%)
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {exercise.currentMax} lbs
                      </Badge>
                    </div>
                  ))}
                </div>
                {exerciseProgress.filter(e => e.improvement > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keep training to see strength improvements over time
                  </p>
                )}
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Tracking {timeRange} • Top {exerciseProgress.length} exercises
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default StrengthProgressChart;