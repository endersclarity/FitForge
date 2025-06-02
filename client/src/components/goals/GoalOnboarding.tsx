// FitForge Goal Onboarding Component
// First-time user guidance for goal setting with educational content

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Target, 
  ArrowRight, 
  CheckCircle, 
  Scale,
  Dumbbell,
  Activity,
  Calendar,
  TrendingUp,
  Database,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface GoalOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function GoalOnboarding({ onComplete, onSkip }: GoalOnboardingProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'goal-types',
      title: 'Choose Your Goal Type',
      description: 'FitForge supports three main types of fitness goals',
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center p-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Scale className="h-8 w-8 mx-auto text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Weight Loss</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Set target weight with deadline tracking
              </p>
              <Badge variant="outline" className="text-xs">
                Formula: (start - current) / (start - target) × 100%
              </Badge>
            </Card>
            
            <Card className="text-center p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <Dumbbell className="h-8 w-8 mx-auto text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Strength Gain</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Target specific exercises and rep ranges
              </p>
              <Badge variant="outline" className="text-xs">
                Based on actual workout session data
              </Badge>
            </Card>
            
            <Card className="text-center p-4 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
              <Activity className="h-8 w-8 mx-auto text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Body Composition</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Track body fat percentage changes
              </p>
              <Badge variant="outline" className="text-xs">
                Requires body measurement logging
              </Badge>
            </Card>
          </div>
          
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Real Data Only</AlertTitle>
            <AlertDescription>
              All progress calculations use your actual measurements and workout data. 
              No mock data or estimates - we show you exactly how calculations work.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'data-requirements',
      title: 'Understanding Data Requirements',
      description: 'Each goal type needs specific data to track progress accurately',
      icon: <Database className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Scale className="h-6 w-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Weight Loss Goals</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Track progress by logging your weight regularly
                </p>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Initial weight measurement (at goal creation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Regular weight check-ins (weekly recommended)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Target weight and realistic deadline</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Dumbbell className="h-6 w-6 text-green-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100">Strength Goals</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Track progress through workout session logging
                </p>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Specific exercise selection (e.g., "Bench Press")</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Current max weight/reps baseline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Regular workout logging with target exercise</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Body Composition Goals</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Track body fat percentage and muscle mass changes
                </p>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Initial body fat percentage measurement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Regular body composition logging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Target body fat percentage and timeline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'formula-transparency',
      title: 'Transparent Progress Calculations',
      description: 'See exactly how we calculate your progress with real formulas',
      icon: <TrendingUp className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>Formula Transparency Promise</AlertTitle>
            <AlertDescription>
              Every progress percentage you see shows the exact formula used and data sources. 
              No hidden calculations or arbitrary scoring systems.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-600" />
                Weight Loss Formula
              </h4>
              <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                Progress = (Starting Weight - Current Weight) / (Starting Weight - Target Weight) × 100%
              </div>
              <p className="text-xs text-muted-foreground">
                Example: Started at 180lbs, currently 175lbs, target 160lbs
                <br />
                Progress = (180 - 175) / (180 - 160) × 100% = 25%
              </p>
            </Card>
            
            <Card className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-green-600" />
                Strength Progress
              </h4>
              <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                Progress = (Current Max - Starting Max) / (Target Max - Starting Max) × 100%
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your best performance in recent workout sessions for the target exercise.
                Data source attribution shows which workouts contributed to the calculation.
              </p>
            </Card>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you'll always see:</h4>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>The exact formula used for your progress percentage</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Data source: "Based on X measurements over Y days"</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Date range for calculation period</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Number of data points used in calculation</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Ready to Start?',
      description: 'You\'re all set to create your first goal with confidence',
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-semibold">You're Ready to Set Goals!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You now understand how FitForge tracks progress with real data and transparent calculations. 
              Let's create your first goal.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Button 
              onClick={() => setLocation('/goals/new')}
              className="gap-2"
              size="lg"
            >
              <Target className="h-5 w-5" />
              Create My First Goal
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onComplete}
              size="lg"
            >
              Explore Dashboard First
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Pro tip: Start with one goal to see how progress tracking works</p>
            <p>📊 You can always add more goals later from your dashboard</p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2">
        <CardHeader className="text-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSkip}
            className="absolute right-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            {currentStepData.icon}
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          </div>
          
          <CardDescription className="text-base">
            {currentStepData.description}
          </CardDescription>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {currentStepData.content}
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onSkip}>
                Skip Tutorial
              </Button>
              
              <Button onClick={handleNext} className="gap-2">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}