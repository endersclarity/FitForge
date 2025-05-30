/**
 * Progress Charts Component
 * Chart.js-powered progress visualization dashboard
 */

import React, { useEffect, useRef } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, TrendingUp, Target, Download, Zap } from 'lucide-react';

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
  date: string;
  workoutType: string;
  duration: number;
  totalVolume: number;
  caloriesBurned: number;
  formScore: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
      volume: number;
    }>;
  }>;
}

interface ProgressMetrics {
  sessions: WorkoutSession[];
  bodyStats: Array<{
    date: string;
    weight: number;
    bodyFat: number;
    muscleMass: number;
  }>;
  exerciseProgress: Array<{
    exerciseName: string;
    dates: string[];
    maxWeights: number[];
    totalVolumes: number[];
  }>;
}

interface ProgressChartsProps {
  data: ProgressMetrics;
  timeRange: '1M' | '3M' | '6M' | '1Y';
  onTimeRangeChange: (range: '1M' | '3M' | '6M' | '1Y') => void;
  onExport: () => void;
}

export function ProgressCharts({ data, timeRange, onTimeRangeChange, onExport }: ProgressChartsProps) {
  const chartTheme = {
    primary: '#6366f1',
    secondary: '#8b5cf6', 
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gray: '#6b7280'
  };

  // Chart.js default options for consistent styling
  const defaultOptions: Partial<ChartOptions> = {
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
          }
        }
      }
    }
  };

  // Workout Volume Over Time Chart Data
  const volumeChartData: ChartData<'line'> = {
    labels: data.sessions.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Volume (lbs)',
        data: data.sessions.map(s => s.totalVolume),
        borderColor: chartTheme.primary,
        backgroundColor: `${chartTheme.primary}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartTheme.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Body Composition Chart Data
  const bodyCompositionData: ChartData<'line'> = {
    labels: data.bodyStats.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: data.bodyStats.map(s => s.weight),
        borderColor: chartTheme.primary,
        backgroundColor: `${chartTheme.primary}20`,
        borderWidth: 2,
        yAxisID: 'y',
        tension: 0.3
      },
      {
        label: 'Body Fat %',
        data: data.bodyStats.map(s => s.bodyFat),
        borderColor: chartTheme.warning,
        backgroundColor: `${chartTheme.warning}20`,
        borderWidth: 2,
        yAxisID: 'y1',
        tension: 0.3
      },
      {
        label: 'Muscle Mass (lbs)',
        data: data.bodyStats.map(s => s.muscleMass),
        borderColor: chartTheme.success,
        backgroundColor: `${chartTheme.success}20`,
        borderWidth: 2,
        yAxisID: 'y',
        tension: 0.3
      }
    ]
  };

  // Workout Types Distribution Chart Data
  const workoutTypeData: ChartData<'bar'> = {
    labels: ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Abs', 'Mixed'],
    datasets: [
      {
        label: 'Workout Count',
        data: [
          data.sessions.filter(s => s.workoutType.includes('Chest')).length,
          data.sessions.filter(s => s.workoutType.includes('Back')).length,
          data.sessions.filter(s => s.workoutType.includes('Legs')).length,
          data.sessions.filter(s => s.workoutType.includes('Abs')).length,
          data.sessions.filter(s => !['Chest', 'Back', 'Legs', 'Abs'].some(type => s.workoutType.includes(type))).length
        ],
        backgroundColor: [
          `${chartTheme.primary}80`,
          `${chartTheme.secondary}80`,
          `${chartTheme.success}80`,
          `${chartTheme.warning}80`,
          `${chartTheme.gray}80`
        ],
        borderColor: [
          chartTheme.primary,
          chartTheme.secondary,
          chartTheme.success,
          chartTheme.warning,
          chartTheme.gray
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  // Form Score Trend Chart Data
  const formScoreData: ChartData<'line'> = {
    labels: data.sessions.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Form Score',
        data: data.sessions.map(s => s.formScore || 8),
        borderColor: chartTheme.success,
        backgroundColor: `${chartTheme.success}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartTheme.success,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  };

  // Calculate key metrics
  const totalWorkouts = data.sessions.length;
  const avgVolume = Math.round(data.sessions.reduce((sum, s) => sum + s.totalVolume, 0) / totalWorkouts);
  const totalCalories = data.sessions.reduce((sum, s) => sum + s.caloriesBurned, 0);
  const avgFormScore = Math.round((data.sessions.reduce((sum, s) => sum + (s.formScore || 8), 0) / totalWorkouts) * 10) / 10;

  // Recent personal records (mock data for demonstration)
  const recentPRs = [
    { exercise: 'Bench Press', weight: 225, date: '2025-01-28' },
    { exercise: 'Deadlift', weight: 315, date: '2025-01-25' },
    { exercise: 'Squat', weight: 275, date: '2025-01-22' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Progress Analytics</h2>
          <p className="text-muted-foreground">
            Track your fitness journey with detailed performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Buttons */}
          {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </Button>
          ))}
          
          {/* Export Button */}
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Volume</p>
                <p className="text-2xl font-bold">{avgVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">lbs per workout</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calories</p>
                <p className="text-2xl font-bold">{totalCalories.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">burned total</p>
              </div>
              <Zap className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Form Score</p>
                <p className="text-2xl font-bold">{avgFormScore}</p>
                <p className="text-xs text-muted-foreground">out of 10</p>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Workout Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={volumeChartData} 
                options={defaultOptions as any} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Body Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Body Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={bodyCompositionData} 
                options={defaultOptions as any} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Workout Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Workout Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={workoutTypeData} 
                options={defaultOptions as any} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-success" />
              Form Score Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={formScoreData} 
                options={defaultOptions as any} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Recent Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPRs.map((pr, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{pr.exercise}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(pr.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {pr.weight} lbs
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}