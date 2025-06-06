import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { type GoalFormData, type Milestone } from '../goal-wizard';

interface MilestoneCreationProps {
  goalData: GoalFormData;
  onUpdate: (data: Partial<GoalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MilestoneCreation({ goalData, onUpdate, onNext, onBack }: MilestoneCreationProps) {
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    targetValue: 0,
    targetDate: new Date()
  });

  const handleAddMilestone = () => {
    if (newMilestone.title && newMilestone.targetValue) {
      const milestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestone.title,
        description: newMilestone.description || '',
        targetValue: newMilestone.targetValue,
        targetDate: newMilestone.targetDate || new Date(),
        completed: false
      };

      const currentMilestones = goalData.milestones || [];
      onUpdate({ milestones: [...currentMilestones, milestone] });
      
      // Reset form
      setNewMilestone({
        title: '',
        description: '',
        targetValue: 0,
        targetDate: new Date()
      });
    }
  };

  const handleRemoveMilestone = (milestoneId: string) => {
    const currentMilestones = goalData.milestones || [];
    onUpdate({ 
      milestones: currentMilestones.filter(m => m.id !== milestoneId) 
    });
  };

  const generateSuggestedMilestones = () => {
    if (!goalData.currentValue || !goalData.targetValue || !goalData.startDate || !goalData.targetDate) {
      return;
    }

    const totalProgress = Math.abs(goalData.targetValue - goalData.currentValue);
    const totalDays = Math.ceil((goalData.targetDate.getTime() - goalData.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const suggestions: Milestone[] = [
      {
        id: '1',
        title: '25% Progress',
        description: 'First quarter milestone',
        targetValue: goalData.currentValue + (totalProgress * 0.25) * (goalData.targetValue > goalData.currentValue ? 1 : -1),
        targetDate: new Date(goalData.startDate.getTime() + (totalDays * 0.25 * 24 * 60 * 60 * 1000)),
        completed: false
      },
      {
        id: '2',
        title: '50% Progress',
        description: 'Halfway point milestone',
        targetValue: goalData.currentValue + (totalProgress * 0.5) * (goalData.targetValue > goalData.currentValue ? 1 : -1),
        targetDate: new Date(goalData.startDate.getTime() + (totalDays * 0.5 * 24 * 60 * 60 * 1000)),
        completed: false
      },
      {
        id: '3',
        title: '75% Progress',
        description: 'Final stretch milestone',
        targetValue: goalData.currentValue + (totalProgress * 0.75) * (goalData.targetValue > goalData.currentValue ? 1 : -1),
        targetDate: new Date(goalData.startDate.getTime() + (totalDays * 0.75 * 24 * 60 * 60 * 1000)),
        completed: false
      }
    ];

    onUpdate({ milestones: suggestions });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Milestones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={generateSuggestedMilestones}
            className="w-full"
            disabled={!goalData.currentValue || !goalData.targetValue}
          >
            Generate Suggested Milestones
          </Button>

          {goalData.milestones && goalData.milestones.length > 0 && (
            <div className="space-y-3">
              <Label>Current Milestones</Label>
              {goalData.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{milestone.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Target: {milestone.targetValue} by {milestone.targetDate.toLocaleDateString()}
                    </div>
                    {milestone.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMilestone(milestone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <Label>Add Custom Milestone</Label>
            
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Title</Label>
              <Input
                id="milestone-title"
                value={newMilestone.title || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g., First 10 lbs lost"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description (optional)</Label>
              <Textarea
                id="milestone-description"
                value={newMilestone.description || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Additional details about this milestone"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-value">Target Value</Label>
                <Input
                  id="milestone-value"
                  type="number"
                  step="0.1"
                  value={newMilestone.targetValue || ''}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: parseFloat(e.target.value) || 0 })}
                  placeholder="Target value"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="milestone-date">Target Date</Label>
                <Input
                  id="milestone-date"
                  type="date"
                  value={newMilestone.targetDate ? newMilestone.targetDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: new Date(e.target.value) })}
                />
              </div>
            </div>

            <Button onClick={handleAddMilestone} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}