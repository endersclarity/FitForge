// FitForge Muscle Tooltip Component
// Detailed muscle information tooltip for heat map interactions
// Created: June 3, 2025

import React from 'react';
import { MuscleRecoveryState, MuscleGroupType } from '@/types/muscle-recovery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Zap, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MuscleTooltipProps {
  muscle: MuscleGroupType;
  data: MuscleRecoveryState | null;
  onClose: () => void;
  className?: string;
}

export function MuscleTooltip({
  muscle,
  data,
  onClose,
  className
}: MuscleTooltipProps) {
  if (!data) {
    return (
      <Card className={cn("fixed bottom-4 right-4 w-80 z-50 shadow-lg", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">{muscle}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No recovery data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format dates
  const lastWorkoutDate = data.lastWorkoutDate.toLocaleDateString();
  const daysSinceWorkout = Math.floor(
    (Date.now() - data.lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'overworked':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Overworked',
          description: 'Needs more recovery time'
        };
      case 'optimal':
        return {
          icon: Zap,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Optimal',
          description: 'Ready for training'
        };
      case 'undertrained':
        return {
          icon: CheckCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Fresh',
          description: 'Well-recovered, ready to work'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          description: 'Status unclear'
        };
    }
  };

  const statusInfo = getStatusInfo(data.recoveryStatus);
  const StatusIcon = statusInfo.icon;

  // Get fatigue color
  const getFatigueColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get recommendations
  const getRecommendations = () => {
    const fatigue = data.currentFatiguePercentage;
    const status = data.recoveryStatus;

    if (status === 'overworked') {
      return [
        'Allow more recovery time',
        'Focus on other muscle groups',
        'Consider light stretching or mobility work',
        `Rest for ${data.daysUntilOptimal} more day${data.daysUntilOptimal !== 1 ? 's' : ''}`
      ];
    } else if (status === 'optimal') {
      return [
        'Perfect for moderate to high intensity training',
        'Good time for progressive overload',
        'Consider compound movements',
        'Monitor fatigue during workout'
      ];
    } else {
      return [
        'Ready for intense training',
        'Good candidate for volume increases',
        'Consider targeting this muscle group',
        'Safe for maximum effort exercises'
      ];
    }
  };

  const recommendations = getRecommendations();

  return (
    <Card className={cn("fixed bottom-4 right-4 w-96 z-50 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize flex items-center space-x-2">
            <span>{muscle}</span>
            <Badge 
              variant="outline" 
              className={cn(statusInfo.color, statusInfo.bgColor, statusInfo.borderColor)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{statusInfo.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fatigue Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Fatigue</span>
            <span className="text-sm text-gray-600">
              {data.currentFatiguePercentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={data.currentFatiguePercentage} 
            className="h-2"
            // className={cn("h-2", getFatigueColor(data.currentFatiguePercentage))}
          />
        </div>

        {/* Workout History */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Last Workout</span>
            </div>
            <p className="font-medium">{lastWorkoutDate}</p>
            <p className="text-xs text-gray-500">{daysSinceWorkout} days ago</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>Intensity</span>
            </div>
            <p className="font-medium">
              {(data.workoutIntensity * 10).toFixed(1)}/10 RPE
            </p>
            <p className="text-xs text-gray-500">
              {data.workoutIntensity > 0.7 ? 'High' : data.workoutIntensity > 0.4 ? 'Moderate' : 'Light'}
            </p>
          </div>
        </div>

        {/* Recovery Timeline */}
        {data.daysUntilOptimal > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="h-3 w-3" />
              <span className="text-sm font-medium">Recovery Timeline</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">{data.daysUntilOptimal} day{data.daysUntilOptimal !== 1 ? 's' : ''}</span>
                {' '}until optimal training status
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Training Recommendations</h4>
          <ul className="space-y-1">
            {recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            disabled={data.recoveryStatus === 'overworked'}
          >
            Add to Workout
          </Button>
          <Button size="sm" variant="ghost" className="flex-1">
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MuscleTooltip;