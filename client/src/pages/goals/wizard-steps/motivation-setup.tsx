import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Target, Trophy, Star } from "lucide-react";
import { type GoalFormData } from '../goal-wizard';

interface MotivationSetupProps {
  goalData: GoalFormData;
  onUpdate: (data: Partial<GoalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MotivationSetup({ goalData, onUpdate, onNext, onBack }: MotivationSetupProps) {
  const [customReward, setCustomReward] = useState('');

  const motivationReasons = [
    { id: 'health', label: 'Better Health', icon: Heart },
    { id: 'confidence', label: 'Boost Confidence', icon: Star },
    { id: 'performance', label: 'Athletic Performance', icon: Trophy },
    { id: 'appearance', label: 'Look Better', icon: Target },
    { id: 'energy', label: 'More Energy', icon: Star },
    { id: 'longevity', label: 'Live Longer', icon: Heart },
    { id: 'strength', label: 'Get Stronger', icon: Trophy },
    { id: 'habit', label: 'Build Habits', icon: Target }
  ];

  const rewardSuggestions = [
    'New workout clothes',
    'Massage or spa day',
    'New fitness equipment',
    'Weekend getaway',
    'Nice dinner out',
    'New book or course',
    'Concert or event tickets',
    'Professional photoshoot'
  ];

  const handleMotivationToggle = (reasonId: string) => {
    const currentMotivations = goalData.motivations || [];
    const isSelected = currentMotivations.includes(reasonId);
    
    if (isSelected) {
      onUpdate({ 
        motivations: currentMotivations.filter(m => m !== reasonId) 
      });
    } else {
      onUpdate({ 
        motivations: [...currentMotivations, reasonId] 
      });
    }
  };

  const handleRewardSelect = (reward: string) => {
    onUpdate({ reward });
  };

  const handleCustomRewardAdd = () => {
    if (customReward.trim()) {
      onUpdate({ reward: customReward.trim() });
      setCustomReward('');
    }
  };

  const handleWhyChange = (why: string) => {
    onUpdate({ why });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Motivation & Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Why is this goal important to you?</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select all that apply - understanding your motivation helps maintain commitment.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {motivationReasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = goalData.motivations?.includes(reason.id) || false;
                
                return (
                  <Button
                    key={reason.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleMotivationToggle(reason.id)}
                    className="h-auto py-3 justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {reason.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="personal-why">Describe your personal "why" (optional)</Label>
            <Textarea
              id="personal-why"
              value={goalData.why || ''}
              onChange={(e) => handleWhyChange(e.target.value)}
              placeholder="What deeper reason drives you to achieve this goal? This will help you stay motivated during challenging times..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">How will you reward yourself?</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose a meaningful reward for achieving your goal.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Suggested Rewards</Label>
              <div className="grid grid-cols-1 gap-2">
                {rewardSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant={goalData.reward === suggestion ? "default" : "outline"}
                    onClick={() => handleRewardSelect(suggestion)}
                    className="justify-start h-auto py-2"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-reward">Custom Reward</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-reward"
                  value={customReward}
                  onChange={(e) => setCustomReward(e.target.value)}
                  placeholder="Enter your own reward idea"
                />
                <Button onClick={handleCustomRewardAdd} disabled={!customReward.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {goalData.reward && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Your reward:</strong> {goalData.reward}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1"
            disabled={!goalData.motivations?.length}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}