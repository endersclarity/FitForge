// FitForge Goal Progress Chart Component
// Visual progress display with formula transparency and data source attribution

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Database,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Goal, GoalType } from '@/services/supabase-goal-service';
import { ProgressCalculationResult } from '@/services/goal-progress-engine';

interface ProgressChartProps {
  goal: Goal;
  progressResult: ProgressCalculationResult;
  showFormula?: boolean;
  size?: 'compact' | 'normal' | 'large';
}

interface ProgressTimelineData {
  date: string;
  value: number;
  target: number;
}

export function ProgressChart({ 
  goal, 
  progressResult, 
  showFormula = true, 
  size = 'normal' 
}: ProgressChartProps) {
  
  const isCompact = size === 'compact';
  const isLarge = size === 'large';
  
  // Calculate days remaining
  const daysRemaining = differenceInDays(new Date(goal.target_date), new Date());
  const isOverdue = daysRemaining < 0;
  
  // Generate timeline data for trend visualization
  const generateTimelineData = (): ProgressTimelineData[] => {
    const startDate = new Date(goal.created_date);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    const data: ProgressTimelineData[] = [];
    const totalDays = differenceInDays(targetDate, startDate);
    const daysPassed = Math.min(differenceInDays(today, startDate), totalDays);
    
    // Add key points: start, current, target
    data.push({
      date: format(startDate, 'MMM d'),
      value: 0,
      target: 0
    });
    
    if (daysPassed > 0) {
      data.push({
        date: format(today, 'MMM d'),
        value: progressResult.current_progress_percentage,
        target: (daysPassed / totalDays) * 100
      });
    }
    
    data.push({
      date: format(targetDate, 'MMM d'),
      value: progressResult.is_achieved ? 100 : progressResult.current_progress_percentage,
      target: 100
    });
    
    return data;
  };
  
  const timelineData = generateTimelineData();
  
  // Colors for different goal types
  const getGoalColors = (goalType: GoalType) => {
    switch (goalType) {
      case 'weight_loss':
        return { primary: '#3b82f6', secondary: '#dbeafe', accent: '#1d4ed8' };
      case 'strength_gain':
        return { primary: '#10b981', secondary: '#d1fae5', accent: '#047857' };
      case 'body_composition':
        return { primary: '#8b5cf6', secondary: '#ede9fe', accent: '#7c3aed' };
      default:
        return { primary: '#6b7280', secondary: '#f3f4f6', accent: '#374151' };
    }
  };
  
  const colors = getGoalColors(goal.goal_type);
  
  // Pie chart data for progress visualization
  const pieData = [
    { name: 'Completed', value: progressResult.current_progress_percentage, color: colors.primary },
    { name: 'Remaining', value: 100 - progressResult.current_progress_percentage, color: colors.secondary }
  ];
  
  const getStatusIcon = () => {
    if (progressResult.is_achieved) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (isOverdue) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    if (progressResult.current_progress_percentage > 50) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    }
    return <Target className="h-5 w-5 text-blue-600" />;
  };
  
  const getStatusText = () => {
    if (progressResult.is_achieved) {
      return "Goal Achieved! 🎉";
    }
    if (isOverdue) {
      return `${Math.abs(daysRemaining)} days overdue`;
    }
    return `${daysRemaining} days remaining`;
  };
  
  const getStatusColor = () => {
    if (progressResult.is_achieved) return "text-green-700 dark:text-green-400";
    if (isOverdue) return "text-red-700 dark:text-red-400";
    return "text-blue-700 dark:text-blue-400";
  };

  if (isCompact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{Math.round(progressResult.current_progress_percentage)}%</span>
            </div>
            <span className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <Progress 
            value={progressResult.current_progress_percentage} 
            className="h-2 mb-2"
          />
          <p className="text-xs text-muted-foreground">
            {progressResult.data_source_description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className={isLarge ? "pb-4" : "pb-2"}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={`flex items-center gap-2 ${isLarge ? 'text-xl' : 'text-lg'}`}>
              {getStatusIcon()}
              Progress Tracking
            </CardTitle>
            <CardDescription>
              {Math.round(progressResult.current_progress_percentage)}% complete • {getStatusText()}
            </CardDescription>
          </div>
          {progressResult.milestone_data && (
            <div className="text-right">
              <div className="text-lg font-semibold">
                {progressResult.milestone_data.current_value}{progressResult.milestone_data.unit}
              </div>
              <div className="text-sm text-muted-foreground">
                of {progressResult.milestone_data.target_value}{progressResult.milestone_data.unit}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressResult.current_progress_percentage)}%
            </span>
          </div>
          <Progress 
            value={progressResult.current_progress_percentage} 
            className={`${isLarge ? 'h-4' : 'h-3'}`}
          />
        </div>

        {/* Visual Charts */}
        {isLarge && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress Timeline
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={colors.primary} 
                    strokeWidth={3}
                    name="Actual Progress"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke={colors.accent} 
                    strokeDasharray="5 5"
                    name="Target Progress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Progress Pie Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Completion Status
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Data Source Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Data Source</span>
          </div>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {progressResult.data_source_description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {progressResult.calculation_date_range.start} to {progressResult.calculation_date_range.end}
            </div>
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {progressResult.data_points_count} data points
            </div>
          </div>
        </div>

        {/* Formula Display */}
        {showFormula && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Calculation Formula</span>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg font-mono text-sm">
              {progressResult.calculation_formula}
            </div>
          </div>
        )}

        {/* Timeline Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Created:</span>{' '}
            {format(new Date(goal.created_date), 'MMM d, yyyy')}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Target:</span>{' '}
            {format(new Date(goal.target_date), 'MMM d, yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}