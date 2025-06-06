import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../goal-wizard";
import {
  TrendingDown,
  Dumbbell,
  Activity,
  Heart,
  Target,
  Trophy,
  Timer,
  Zap
} from "lucide-react";

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
    color: 'bg-red-100 text-red-800 border-red-200',
    features: ['Track weight progress', 'Body fat monitoring', 'Calorie targets', 'Progress photos'],
    timeframe: '3-12 months typically'
  },
  {
    id: 'strength_gain',
    title: 'Strength Gain',
    description: 'Build muscle and increase lifting capacity',
    icon: Dumbbell,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    features: ['Exercise progression', 'Rep and weight tracking', 'Personal records', 'Volume monitoring'],
    timeframe: '6-24 weeks per goal'
  },
  {
    id: 'body_composition',
    title: 'Body Composition',
    description: 'Improve muscle-to-fat ratio and physique',
    icon: Activity,
    color: 'bg-green-100 text-green-800 border-green-200',
    features: ['Body measurements', 'Muscle mass tracking', 'Fat percentage', 'Visual progress'],
    timeframe: '3-6 months typically'
  }
];

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High Priority', description: 'Primary focus goal', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium Priority', description: 'Important but flexible', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low Priority', description: 'Nice to have goal', color: 'bg-gray-100 text-gray-800' }
];

export function GoalTypeSelection({ data, updateData }: GoalTypeSelectionProps) {
  const handleGoalTypeSelect = (goalTypeId: string) => {
    const goalType = GOAL_TYPES.find(type => type.id === goalTypeId);
    if (goalType) {
      updateData({
        goalType: goalTypeId as any,
        goalTitle: data.goalTitle || goalType.title // Set default title if empty
      });
    }
  };

  const generateGoalTitle = (type: string, customText?: string) => {
    if (customText?.trim()) return customText;
    
    const templates = {
      weight_loss: 'Lose Weight and Get Fit',
      strength_gain: 'Build Strength and Muscle',
      body_composition: 'Improve Body Composition'
    };
    
    return templates[type as keyof typeof templates] || 'My Fitness Goal';
  };

  return (
    <div className="space-y-6">
      {/* Goal Type Selection */}
      <div>
        <Label className="text-base font-semibold mb-4 block">
          What type of fitness goal do you want to achieve?
        </Label>
        <div className="grid gap-4">
          {GOAL_TYPES.map((goalType) => {
            const Icon = goalType.icon;
            const isSelected = data.goalType === goalType.id;
            
            return (
              <Card
                key={goalType.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleGoalTypeSelect(goalType.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${goalType.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{goalType.title}</h3>
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Target className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{goalType.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Trophy className="h-3 w-3" />
                            <span className="font-medium">Features</span>
                          </div>
                          <ul className="text-muted-foreground space-y-1">
                            {goalType.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-current rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Timer className="h-3 w-3" />
                            <span className="font-medium">Typical Timeline</span>
                          </div>
                          <p className="text-muted-foreground">{goalType.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Goal Title and Description */}
      {data.goalType && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label htmlFor="goalTitle" className="text-base font-semibold">
              Goal Title
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Give your goal a motivating name that inspires you
            </p>
            <Input
              id="goalTitle"
              placeholder={generateGoalTitle(data.goalType)}
              value={data.goalTitle}
              onChange={(e) => updateData({ goalTitle: e.target.value })}
              className="text-lg font-medium"
            />
          </div>

          <div>
            <Label htmlFor="goalDescription" className="text-base font-semibold">
              Goal Description (Optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Describe why this goal matters to you and what success looks like
            </p>
            <Textarea
              id="goalDescription"
              placeholder="I want to achieve this goal because..."
              value={data.goalDescription}
              onChange={(e) => updateData({ goalDescription: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              Goal Priority Level
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              How important is this goal compared to your other fitness objectives?
            </p>
            <div className="grid gap-3">
              {PRIORITY_LEVELS.map((priority) => (
                <Card
                  key={priority.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    data.priorityLevel === priority.value
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => updateData({ priorityLevel: priority.value as any })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={priority.color}>
                          {priority.value === 'high' && <Zap className="h-3 w-3 mr-1" />}
                          {priority.value === 'medium' && <Heart className="h-3 w-3 mr-1" />}
                          {priority.value === 'low' && <Target className="h-3 w-3 mr-1" />}
                          {priority.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {priority.description}
                        </span>
                      </div>
                      {data.priorityLevel === priority.value && (
                        <Badge variant="outline" className="bg-primary text-primary-foreground">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}