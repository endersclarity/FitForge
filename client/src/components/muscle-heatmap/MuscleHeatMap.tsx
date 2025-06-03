// FitForge Muscle Heat Map Component
// Main heat map component that integrates recovery data with body diagram
// Created: June 3, 2025

import React, { useState } from 'react';
import { MuscleRecoveryState, MuscleGroupType } from '@/types/muscle-recovery';
import { useMuscleRecovery } from '@/hooks/use-muscle-recovery';
import BodyDiagram from './BodyDiagram';
import MuscleTooltip from './MuscleTooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap, Moon, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MuscleHeatMapProps {
  className?: string;
  showRecommendations?: boolean;
  showDetailedMetrics?: boolean;
  onWorkoutSuggestion?: (workoutType: 'upper' | 'lower' | 'full' | 'recovery') => void;
}

export function MuscleHeatMap({
  className,
  showRecommendations = true,
  showDetailedMetrics = true,
  onWorkoutSuggestion
}: MuscleHeatMapProps) {
  const {
    recoveryStates,
    heatMapData,
    isLoading,
    error,
    refreshRecoveryData,
    getMuscleColor,
    getMuscleRecommendation,
    getOverallFatigueLevel,
    getRecommendedWorkoutType,
    getMostRecoveredMuscles,
    getMostFatiguedMuscles
  } = useMuscleRecovery();

  // Debug logging
  React.useEffect(() => {
    console.log('🔥 MuscleHeatMap Debug:', {
      isLoading,
      error,
      recoveryStatesCount: recoveryStates.length,
      recoveryStates: recoveryStates.slice(0, 3), // Log first 3 for debugging
      heatMapData: heatMapData ? 'exists' : 'null'
    });
  }, [isLoading, error, recoveryStates, heatMapData]);

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroupType | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<{
    muscle: MuscleGroupType;
    data: MuscleRecoveryState | null;
  } | null>(null);

  // Handle muscle interactions
  const handleMuscleHover = (muscle: MuscleGroupType, data: MuscleRecoveryState | null) => {
    setHoveredMuscle(data ? { muscle, data } : null);
  };

  const handleMuscleClick = (muscle: MuscleGroupType, data: MuscleRecoveryState) => {
    setSelectedMuscle(selectedMuscle === muscle ? null : muscle);
  };

  // Handle workout suggestion
  const handleWorkoutSuggestion = () => {
    const recommendedType = getRecommendedWorkoutType();
    onWorkoutSuggestion?.(recommendedType);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'overworked':
        return 'destructive';
      case 'optimal':
        return 'default';
      case 'undertrained':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Muscle Recovery Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
            </div>
            <Skeleton className="h-80 w-full rounded-3xl" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Muscle Recovery Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load muscle recovery data: {error}
            </AlertDescription>
          </Alert>
          <button
            onClick={refreshRecoveryData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const overallFatigue = getOverallFatigueLevel();
  const recommendedWorkout = getRecommendedWorkoutType();
  const mostRecovered = getMostRecoveredMuscles();
  const mostFatigued = getMostFatiguedMuscles();

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Main Heat Map Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Muscle Recovery Map</span>
            </div>
            <Badge variant="outline">
              Overall: {overallFatigue}% Fatigue
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <BodyDiagram
            muscleStates={recoveryStates}
            onMuscleHover={handleMuscleHover}
            onMuscleClick={handleMuscleClick}
            interactive={true}
            showMetrics={true}
          />
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ready to Train */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Ready to Train</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostRecovered.length > 0 ? (
                <div className="space-y-2">
                  {mostRecovered.slice(0, 3).map((muscle) => {
                    const state = recoveryStates.find(s => s.muscleGroup === muscle);
                    return (
                      <div key={muscle} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{muscle}</span>
                        <Badge variant="secondary" className="text-xs">
                          {state?.currentFatiguePercentage.toFixed(0)}% fatigue
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No fresh muscle groups available</p>
              )}
            </CardContent>
          </Card>

          {/* Need Recovery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Moon className="h-4 w-4 text-orange-500" />
                <span>Need Recovery</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostFatigued.length > 0 ? (
                <div className="space-y-2">
                  {mostFatigued.slice(0, 3).map((muscle) => {
                    const state = recoveryStates.find(s => s.muscleGroup === muscle);
                    return (
                      <div key={muscle} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{muscle}</span>
                        <Badge 
                          variant={getStatusBadgeVariant(state?.recoveryStatus || 'unknown')}
                          className="text-xs"
                        >
                          {state?.daysUntilOptimal || 0}d rest
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">All muscle groups recovered</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workout Recommendations */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Workout Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-blue-900">
                    Recommended: {recommendedWorkout.charAt(0).toUpperCase() + recommendedWorkout.slice(1)} Body
                  </h3>
                  <p className="text-sm text-blue-700">
                    {recommendedWorkout === 'recovery' 
                      ? 'Focus on rest and light movement today'
                      : `Target ${recommendedWorkout} body muscles for optimal training`
                    }
                  </p>
                </div>
                <button
                  onClick={handleWorkoutSuggestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Workout
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Overall Fatigue:</span>
                  <span className="ml-2">{overallFatigue}%</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Fresh Groups:</span>
                  <span className="ml-2">{mostRecovered.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Muscle Detail Tooltip */}
      {selectedMuscle && (
        <MuscleTooltip
          muscle={selectedMuscle}
          data={recoveryStates.find(s => s.muscleGroup === selectedMuscle) || null}
          onClose={() => setSelectedMuscle(null)}
        />
      )}

      {/* Hover Tooltip */}
      {hoveredMuscle && hoveredMuscle.data && (
        <div className="fixed bottom-4 left-4 z-50 p-3 bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none">
          <div className="text-sm font-medium capitalize">{hoveredMuscle.muscle}</div>
          <div className="text-xs text-gray-300">
            {hoveredMuscle.data.currentFatiguePercentage.toFixed(0)}% fatigue • {' '}
            {getMuscleRecommendation(hoveredMuscle.muscle)}
          </div>
        </div>
      )}
    </div>
  );
}

export default MuscleHeatMap;