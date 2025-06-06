import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type GoalFormData } from '../goal-wizard';

interface TimelineSetupProps {
  goalData: GoalFormData;
  onUpdate: (data: Partial<GoalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TimelineSetup({ goalData, onUpdate, onNext, onBack }: TimelineSetupProps) {
  const handleStartDateChange = (date: string) => {
    onUpdate({ startDate: new Date(date) });
  };

  const handleTargetDateChange = (date: string) => {
    onUpdate({ targetDate: new Date(date) });
  };

  const handleTimeframeSelect = (timeframe: string) => {
    const startDate = new Date();
    let targetDate = new Date();
    
    switch (timeframe) {
      case '1-month':
        targetDate.setMonth(targetDate.getMonth() + 1);
        break;
      case '3-months':
        targetDate.setMonth(targetDate.getMonth() + 3);
        break;
      case '6-months':
        targetDate.setMonth(targetDate.getMonth() + 6);
        break;
      case '1-year':
        targetDate.setFullYear(targetDate.getFullYear() + 1);
        break;
    }
    
    onUpdate({ 
      startDate: startDate,
      targetDate: targetDate
    });
  };

  const getDaysRemaining = () => {
    if (goalData.startDate && goalData.targetDate) {
      const diffTime = goalData.targetDate.getTime() - goalData.startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Quick Timeframes</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleTimeframeSelect('1-month')}
              className="h-auto py-3"
            >
              <div className="text-center">
                <div className="font-semibold">1 Month</div>
                <div className="text-sm text-muted-foreground">Quick results</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTimeframeSelect('3-months')}
              className="h-auto py-3"
            >
              <div className="text-center">
                <div className="font-semibold">3 Months</div>
                <div className="text-sm text-muted-foreground">Balanced</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTimeframeSelect('6-months')}
              className="h-auto py-3"
            >
              <div className="text-center">
                <div className="font-semibold">6 Months</div>
                <div className="text-sm text-muted-foreground">Sustainable</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTimeframeSelect('1-year')}
              className="h-auto py-3"
            >
              <div className="text-center">
                <div className="font-semibold">1 Year</div>
                <div className="text-sm text-muted-foreground">Long-term</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={formatDate(goalData.startDate)}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-date">Target Date</Label>
            <Input
              id="target-date"
              type="date"
              value={formatDate(goalData.targetDate)}
              onChange={(e) => handleTargetDateChange(e.target.value)}
            />
          </div>
        </div>

        {goalData.startDate && goalData.targetDate && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Duration: {getDaysRemaining()} days
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
            disabled={!goalData.startDate || !goalData.targetDate}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}