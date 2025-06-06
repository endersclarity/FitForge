import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db, type Goal, type GoalType } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Target,
  TrendingDown,
  Dumbbell,
  Activity,
  Calendar,
  AlertTriangle
} from "lucide-react";

// Import wizard steps
import { GoalTypeSelection } from "./wizard-steps/goal-type-selection";
import { TargetMetrics } from "./wizard-steps/target-metrics";
import { TimelineSetup } from "./wizard-steps/timeline-setup";
import { MilestoneCreation } from "./wizard-steps/milestone-creation";
import { MotivationSetup } from "./wizard-steps/motivation-setup";
import { GoalReview } from "./wizard-steps/goal-review";

export interface WizardData {
  // Goal basic info
  goalType: GoalType | '';
  goalTitle: string;
  goalDescription: string;
  priorityLevel: 'high' | 'medium' | 'low';

  // Target metrics (varies by goal type)
  targetWeightLbs?: number;
  targetBodyFatPercentage?: number;
  targetExerciseId?: string;
  targetWeightForExerciseLbs?: number;
  targetRepsForExercise?: number;
  
  // Timeline
  targetDate: string;
  estimatedWeeks: number;
  
  // Baseline/starting values
  startWeightLbs?: number;
  startBodyFatPercentage?: number;
  startExerciseMaxWeightLbs?: number;
  startExerciseMaxReps?: number;
  
  // Motivation & milestones
  motivationNotes: string;
  rewardDescription: string;
  milestones: Array<{
    percentage: number;
    description: string;
    reward?: string;
  }>;
  
  // Validation state
  isValid: boolean;
  validationErrors: string[];
}

const WIZARD_STEPS = [
  {
    id: 'type',
    title: 'Goal Type',
    description: 'Choose your fitness goal',
    icon: Target
  },
  {
    id: 'metrics',
    title: 'Target Metrics',
    description: 'Set your target numbers',
    icon: TrendingDown
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'When do you want to achieve this?',
    icon: Calendar
  },
  {
    id: 'milestones',
    title: 'Milestones',
    description: 'Break it down into steps',
    icon: CheckCircle
  },
  {
    id: 'motivation',
    title: 'Motivation',
    description: 'Keep yourself motivated',
    icon: Activity
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm your goal',
    icon: Dumbbell
  }
];

export default function GoalWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    goalType: '',
    goalTitle: '',
    goalDescription: '',
    priorityLevel: 'medium',
    targetDate: '',
    estimatedWeeks: 12,
    motivationNotes: '',
    rewardDescription: '',
    milestones: [],
    isValid: false,
    validationErrors: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // Update wizard data
  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    
    switch (WIZARD_STEPS[currentStep].id) {
      case 'type':
        if (!wizardData.goalType) errors.push('Please select a goal type');
        if (!wizardData.goalTitle.trim()) errors.push('Please enter a goal title');
        break;
        
      case 'metrics':
        if (wizardData.goalType === 'weight_loss') {
          if (!wizardData.targetWeightLbs) errors.push('Please enter your target weight');
          if (!wizardData.startWeightLbs) errors.push('Please enter your current weight');
          if (wizardData.targetWeightLbs && wizardData.startWeightLbs && wizardData.targetWeightLbs >= wizardData.startWeightLbs) {
            errors.push('Target weight must be less than current weight for weight loss');
          }
        } else if (wizardData.goalType === 'strength_gain') {
          if (!wizardData.targetExerciseId) errors.push('Please select an exercise');
          if (!wizardData.targetWeightForExerciseLbs && !wizardData.targetRepsForExercise) {
            errors.push('Please set either a target weight or rep count');
          }
        }
        break;
        
      case 'timeline':
        if (!wizardData.targetDate) errors.push('Please select a target date');
        if (new Date(wizardData.targetDate) <= new Date()) {
          errors.push('Target date must be in the future');
        }
        break;
        
      case 'milestones':
        if (wizardData.milestones.length === 0) {
          errors.push('Please add at least one milestone');
        }
        break;
        
      case 'motivation':
        if (!wizardData.motivationNotes.trim()) {
          errors.push('Please add some motivation notes');
        }
        break;
    }
    
    updateWizardData({ 
      isValid: errors.length === 0,
      validationErrors: errors 
    });
    
    return errors.length === 0;
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit goal
  const submitGoal = async () => {
    if (!validateCurrentStep() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the goal
      const goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        goal_type: wizardData.goalType as GoalType,
        goal_title: wizardData.goalTitle,
        goal_description: wizardData.goalDescription,
        
        // Target values
        target_weight_lbs: wizardData.targetWeightLbs || null,
        target_body_fat_percentage: wizardData.targetBodyFatPercentage || null,
        target_exercise_id: wizardData.targetExerciseId || null,
        target_weight_for_exercise_lbs: wizardData.targetWeightForExerciseLbs || null,
        target_reps_for_exercise: wizardData.targetRepsForExercise || null,
        
        // Starting baseline
        start_weight_lbs: wizardData.startWeightLbs || null,
        start_body_fat_percentage: wizardData.startBodyFatPercentage || null,
        start_exercise_max_weight_lbs: wizardData.startExerciseMaxWeightLbs || null,
        start_exercise_max_reps: wizardData.startExerciseMaxReps || null,
        
        // Timeline
        target_date: wizardData.targetDate,
        created_date: new Date().toISOString(),
        
        // Progress tracking
        current_progress_percentage: 0,
        is_achieved: false,
        achieved_date: null,
        
        // Motivation
        motivation_notes: wizardData.motivationNotes,
        reward_description: wizardData.rewardDescription,
        
        // Status
        is_active: true,
        priority_level: wizardData.priorityLevel
      };

      const goal = await db.createGoal(goalData);
      
      // Create milestones
      for (const milestone of wizardData.milestones) {
        // Note: Milestone creation would be implemented here
        console.log('Creating milestone:', milestone);
      }
      
      toast({
        title: 'Goal Created!',
        description: 'Your fitness goal has been successfully created.',
      });
      
      // Navigate to goals page
      setLocation('/goals');
      
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const renderStepComponent = () => {
    const stepId = WIZARD_STEPS[currentStep].id;
    
    switch (stepId) {
      case 'type':
        return (
          <GoalTypeSelection 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      case 'metrics':
        return (
          <TargetMetrics 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      case 'timeline':
        return (
          <TimelineSetup 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      case 'milestones':
        return (
          <MilestoneCreation 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      case 'motivation':
        return (
          <MotivationSetup 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      case 'review':
        return (
          <GoalReview 
            data={wizardData} 
            updateData={updateWizardData}
            errors={wizardData.validationErrors}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };

  if (!user) {
    return null;
  }

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const currentStepInfo = WIZARD_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/goals')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Goals
            </Button>
            <Badge variant="outline">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </Badge>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Goal Setting Wizard</h1>
            <p className="text-muted-foreground mb-6">
              Let's create a SMART goal to achieve your fitness aspirations
            </p>
            
            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap
                    ${isActive ? 'bg-primary text-primary-foreground' : 
                      isCompleted ? 'bg-green-100 text-green-800' : 
                      'bg-muted text-muted-foreground'}
                  `}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {step.title}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <currentStepInfo.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentStepInfo.title}</CardTitle>
                <p className="text-muted-foreground">{currentStepInfo.description}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Validation Errors */}
            {wizardData.validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Please fix the following:</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {wizardData.validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Step Content */}
            {renderStepComponent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {currentStep === WIZARD_STEPS.length - 1 ? (
                <Button
                  onClick={submitGoal}
                  disabled={!wizardData.isValid || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating Goal...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Goal
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}