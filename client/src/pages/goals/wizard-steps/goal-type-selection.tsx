import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, Dumbbell, Activity, Heart } from "lucide-react";
import type { WizardData } from "../goal-wizard";

interface GoalTypeSelectionProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: string[];
}

const GOAL_TYPES = [
  {
    id: 'weight_loss',
    title: 'Weight Loss',
    description: 'Lose weight and improve body composition',
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    examples: ['Lose 20 pounds', 'Reduce body fat to 15%', 'Fit into size 32 jeans']
  },
  {
    id: 'strength_gain',
    title: 'Strength Gain',
    description: 'Build muscle and increase strength',
    icon: Dumbbell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    examples: ['Bench press 225 lbs', 'Deadlift 400 lbs', 'Do 10 pull-ups']
  },
  {
    id: 'endurance',
    title: 'Endurance',
    description: 'Improve cardiovascular fitness',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    examples: ['Run a 5K in under 25 minutes', 'Complete a marathon', 'Bike 50 miles']
  },
  {
    id: 'body_composition',
    title: 'Body Composition',
    description: 'Change body fat percentage and muscle mass',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    examples: ['Gain 10 lbs of muscle', 'Reduce body fat to 12%', 'Achieve lean physique']
  }
] as const;

export function GoalTypeSelection({ data, updateData, errors }: GoalTypeSelectionProps) {
  const selectedType = GOAL_TYPES.find(type => type.id === data.goalType);

  return (
    <div className="space-y-6">
      {/* Goal Type Selection */}
      <div>
        <Label className="text-base font-medium mb-4 block">
          What type of fitness goal do you want to achieve?
        </Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOAL_TYPES.map((goalType) => {
            const Icon = goalType.icon;
            const isSelected = data.goalType === goalType.id;
            
            return (
              <Card 
                key={goalType.id}
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}
                `}
                onClick={() => updateData({ goalType: goalType.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${goalType.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${goalType.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{goalType.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goalType.description}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Examples:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {goalType.examples.map((example, index) => (
                              <li key={index}>• {example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Goal Title */}
      <div>
        <Label htmlFor="goalTitle" className="text-base font-medium">
          Give your goal a specific title
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Be specific and motivating. This will help you stay focused.
        </p>
        <Input
          id="goalTitle"
          placeholder={selectedType ? `e.g., ${selectedType.examples[0]}` : "e.g., Lose 20 pounds in 6 months"}
          value={data.goalTitle}
          onChange={(e) => updateData({ goalTitle: e.target.value })}
          className="text-base"
        />
      </div>

      {/* Goal Description */}
      <div>
        <Label htmlFor="goalDescription" className="text-base font-medium">
          Describe your goal in detail (optional)
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Add context about why this goal matters to you and what success looks like.
        </p>
        <Textarea
          id="goalDescription"
          placeholder="I want to achieve this goal because..."
          value={data.goalDescription}
          onChange={(e) => updateData({ goalDescription: e.target.value })}
          rows={3}
          className="text-base resize-none"
        />
      </div>

      {/* Priority Level */}
      <div>
        <Label className="text-base font-medium mb-3 block">
          How important is this goal to you?
        </Label>
        <Select 
          value={data.priorityLevel} 
          onValueChange={(value: 'high' | 'medium' | 'low') => updateData({ priorityLevel: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Priority - Top focus</span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium Priority - Important but flexible</span>
              </div>
            </SelectItem>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Low Priority - Nice to have</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SMART Goal Tips */}
      {data.goalType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 SMART Goal Tips</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>S</strong>pecific: You've chosen {selectedType?.title.toLowerCase()}</p>
            <p><strong>M</strong>easurable: We'll set target numbers in the next step</p>
            <p><strong>A</strong>chievable: Make sure your target is realistic</p>
            <p><strong>R</strong>elevant: This should align with your fitness priorities</p>
            <p><strong>T</strong>ime-bound: We'll set a deadline in step 3</p>
          </div>
        </div>
      )}
    </div>
  );
}