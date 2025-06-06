import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trophy, Heart, CheckCircle } from "lucide-react";
import { type GoalFormData } from '../goal-wizard';

interface GoalReviewProps {
  goalData: GoalFormData;
  onUpdate: (data: Partial<GoalFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function GoalReview({ goalData, onUpdate, onSubmit, onBack }: GoalReviewProps) {
  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'weight_loss':
        return 'Weight Loss';
      case 'strength_gain':
        return 'Strength Gain';
      case 'body_composition':
        return 'Body Composition';
      case 'endurance':
        return 'Endurance';
      default:
        return type;
    }
  };

  const getProgressNeeded = () => {
    if (goalData.currentValue && goalData.targetValue) {
      return Math.abs(goalData.targetValue - goalData.currentValue);
    }
    return 0;
  };

  const getDuration = () => {
    if (goalData.startDate && goalData.targetDate) {
      const diffTime = goalData.targetDate.getTime() - goalData.startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.round(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''}`;
      }
    }
    return 'Not set';
  };

  const getMotivationLabels = () => {
    const motivationMap: Record<string, string> = {
      'health': 'Better Health',
      'confidence': 'Boost Confidence',
      'performance': 'Athletic Performance',
      'appearance': 'Look Better',
      'energy': 'More Energy',
      'longevity': 'Live Longer',
      'strength': 'Get Stronger',
      'habit': 'Build Habits'
    };

    return goalData.motivations?.map(m => motivationMap[m] || m) || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Overview */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{goalData.title}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Goal Type</div>
              <div className="font-medium">{getGoalTypeLabel(goalData.type)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">{getDuration()}</div>
            </div>
          </div>
        </div>

        {/* Progress Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h4 className="font-semibold">Progress Target</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Current</div>
              <div className="font-semibold text-lg">{goalData.currentValue}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Target</div>
              <div className="font-semibold text-lg">{goalData.targetValue}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Progress Needed</div>
              <div className="font-semibold text-lg">{getProgressNeeded().toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h4 className="font-semibold">Timeline</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {goalData.startDate?.toLocaleDateString() || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Target Date</div>
              <div className="font-medium">
                {goalData.targetDate?.toLocaleDateString() || 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {goalData.milestones && goalData.milestones.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <h4 className="font-semibold">Milestones ({goalData.milestones.length})</h4>
            </div>
            <div className="space-y-2">
              {goalData.milestones.slice(0, 3).map((milestone, index) => (
                <div key={milestone.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {milestone.targetValue} by {milestone.targetDate.toLocaleDateString()}
                  </div>
                </div>
              ))}
              {goalData.milestones.length > 3 && (
                <div className="text-sm text-muted-foreground text-center">
                  +{goalData.milestones.length - 3} more milestones
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            <h4 className="font-semibold">Motivation</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {getMotivationLabels().map((motivation) => (
              <Badge key={motivation} variant="secondary">
                {motivation}
              </Badge>
            ))}
          </div>
          {goalData.why && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Your Why:</div>
              <div className="text-sm">{goalData.why}</div>
            </div>
          )}
        </div>

        {/* Reward */}
        {goalData.reward && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <h4 className="font-semibold">Reward</h4>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="font-medium">{goalData.reward}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onSubmit} className="flex-1">
            Create Goal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}