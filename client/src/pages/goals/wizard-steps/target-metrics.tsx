import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type GoalFormData } from '../goal-wizard';

interface TargetMetricsProps {
  goalData: GoalFormData;
  onUpdate: (data: Partial<GoalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TargetMetrics({ goalData, onUpdate, onNext, onBack }: TargetMetricsProps) {
  const handleTargetValueChange = (value: string) => {
    onUpdate({ targetValue: parseFloat(value) || 0 });
  };

  const handleCurrentValueChange = (value: string) => {
    onUpdate({ currentValue: parseFloat(value) || 0 });
  };

  const getMetricLabel = () => {
    switch (goalData.type) {
      case 'weight_loss':
        return 'Target Weight (lbs)';
      case 'strength_gain':
        return 'Target Weight (lbs)';
      case 'body_composition':
        return 'Target Body Fat %';
      case 'endurance':
        return 'Target Distance (miles)';
      default:
        return 'Target Value';
    }
  };

  const getCurrentLabel = () => {
    switch (goalData.type) {
      case 'weight_loss':
        return 'Current Weight (lbs)';
      case 'strength_gain':
        return 'Current Max Weight (lbs)';
      case 'body_composition':
        return 'Current Body Fat %';
      case 'endurance':
        return 'Current Max Distance (miles)';
      default:
        return 'Current Value';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Target Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="current-value">{getCurrentLabel()}</Label>
          <Input
            id="current-value"
            type="number"
            step="0.1"
            value={goalData.currentValue || ''}
            onChange={(e) => handleCurrentValueChange(e.target.value)}
            placeholder="Enter current value"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-value">{getMetricLabel()}</Label>
          <Input
            id="target-value"
            type="number"
            step="0.1"
            value={goalData.targetValue || ''}
            onChange={(e) => handleTargetValueChange(e.target.value)}
            placeholder="Enter target value"
          />
        </div>

        {goalData.currentValue && goalData.targetValue && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Progress needed: {Math.abs(goalData.targetValue - goalData.currentValue).toFixed(1)} units
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1"
            disabled={!goalData.targetValue || !goalData.currentValue}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}