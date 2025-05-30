/**
 * Progressive Overload Suggestion Component
 * Shows intelligent weight recommendations during workout logging
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { useProgressiveOverload } from "@/hooks/use-progressive-overload";

interface ProgressiveOverloadSuggestionProps {
  exerciseId: number;
  exerciseName: string;
  currentWeight: string;
  onWeightSuggestionAccepted: (weight: number) => void;
  className?: string;
}

export function ProgressiveOverloadSuggestion({
  exerciseId,
  exerciseName,
  currentWeight,
  onWeightSuggestionAccepted,
  className = ""
}: ProgressiveOverloadSuggestionProps) {
  const { 
    recommendation,
    isLoading,
    error,
    suggestedWeight,
    confidenceLevel,
    reasoning,
    isReadyForProgression,
    acceptSuggestion,
    rejectSuggestion
  } = useProgressiveOverload({ exerciseId, enabled: exerciseId > 0 });

  // Don't show if loading or no recommendation
  if (isLoading || !recommendation || error) {
    return null;
  }

  const currentWeightNum = parseFloat(currentWeight) || 0;
  const isCurrentWeightSuggested = Math.abs(currentWeightNum - suggestedWeight) < 0.1;
  
  // Only show if we have a meaningful suggestion
  if (isCurrentWeightSuggested && recommendation.suggestion.increaseAmount === 0) {
    return null;
  }

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <Target className="h-4 w-4 text-blue-600" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      case 'medium': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      case 'low': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const handleAcceptSuggestion = () => {
    acceptSuggestion();
    onWeightSuggestionAccepted(suggestedWeight);
  };

  return (
    <Card className={`${getConfidenceColor(confidenceLevel)} border-2 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              {getConfidenceIcon(confidenceLevel)}
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Smart Weight Suggestion
                <Badge variant="secondary" className="text-xs">
                  {confidenceLevel} confidence
                </Badge>
              </h4>
              
              {isReadyForProgression && (
                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Ready for progression
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-primary">
                  {suggestedWeight}kg
                </div>
                {recommendation.suggestion.increaseAmount > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    +{recommendation.suggestion.increaseAmount}kg
                  </div>
                )}
                {recommendation.suggestion.increaseAmount < 0 && (
                  <div className="text-sm text-orange-600 font-medium">
                    {recommendation.suggestion.increaseAmount}kg (deload)
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                {reasoning}
              </p>
              
              {/* Last session summary */}
              {recommendation.suggestion.lastSessionSummary.weight > 0 && (
                <div className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                  <div className="font-medium mb-1">Last Session:</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>Weight: {recommendation.suggestion.lastSessionSummary.weight}kg</span>
                    <span>Reps: {recommendation.suggestion.lastSessionSummary.totalReps}</span>
                    <span>RPE: {recommendation.suggestion.lastSessionSummary.averageRPE.toFixed(1)}/10</span>
                    <span>
                      {recommendation.suggestion.lastSessionSummary.allSetsCompleted ? '✅ Completed' : '❌ Incomplete'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleAcceptSuggestion}
                className="flex-1"
              >
                Use {suggestedWeight}kg
              </Button>
              
              {recommendation.suggestion.alternativeWeights.length > 0 && (
                <div className="flex gap-1">
                  {recommendation.suggestion.alternativeWeights
                    .filter(w => Math.abs(w - suggestedWeight) > 0.1) // Exclude the main suggestion
                    .slice(0, 2) // Show max 2 alternatives
                    .map((altWeight, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => onWeightSuggestionAccepted(altWeight)}
                        className="px-2"
                      >
                        {altWeight}
                      </Button>
                    ))
                  }
                </div>
              )}
            </div>
            
            {/* Performance metrics preview */}
            {recommendation.metrics && (
              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                <div className="text-center">
                  <div className="font-medium text-muted-foreground">Consistency</div>
                  <div className="text-sm">{(recommendation.metrics.consistencyScore * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-muted-foreground">Volume Trend</div>
                  <div className="text-sm">
                    {recommendation.metrics.volumeTrend === 'increasing' && '📈'}
                    {recommendation.metrics.volumeTrend === 'stable' && '➡️'}
                    {recommendation.metrics.volumeTrend === 'decreasing' && '📉'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-muted-foreground">Since Progress</div>
                  <div className="text-sm">{recommendation.metrics.weeksSinceLastProgression}w</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for when space is limited
 */
export function CompactProgressiveOverloadSuggestion({
  exerciseId,
  currentWeight,
  onWeightSuggestionAccepted,
  className = ""
}: Pick<ProgressiveOverloadSuggestionProps, 'exerciseId' | 'currentWeight' | 'onWeightSuggestionAccepted' | 'className'>) {
  const { suggestedWeight, confidenceLevel, isLoading, recommendation } = useProgressiveOverload({ 
    exerciseId, 
    enabled: exerciseId > 0 
  });

  if (isLoading || !recommendation) return null;

  const currentWeightNum = parseFloat(currentWeight) || 0;
  const isCurrentWeightSuggested = Math.abs(currentWeightNum - suggestedWeight) < 0.1;
  
  if (isCurrentWeightSuggested && recommendation.suggestion.increaseAmount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 ${className}`}>
      <Brain className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium">Suggested: {suggestedWeight}kg</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onWeightSuggestionAccepted(suggestedWeight)}
        className="h-6 px-2 text-xs"
      >
        Use
      </Button>
    </div>
  );
}