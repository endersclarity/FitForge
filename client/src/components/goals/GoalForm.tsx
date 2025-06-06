// FitForge Goal Setting Form Component
// Real Data-Driven Goal Creation with TypeScript and Zod Validation
// Created: June 1, 2025

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Target, Dumbbell, Scale, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExerciseSelectionSheet } from './ExerciseSelectionSheet';

import { 
  createGoal, 
  GoalFormData, 
  CreateGoalSchema,
  GoalType,
  GoalServiceError 
} from '@/services/supabase-goal-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
// Simple exercise interface for goal creation
interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  recent_max_weight?: number;
  recent_workout_count?: number;
}

interface GoalFormProps {
  onGoalCreated?: (goalId: string) => void;
  onCancel?: () => void;
  exercises?: ExerciseOption[];
  isLoadingExercises?: boolean;
}

export function GoalForm({ onGoalCreated, onCancel, exercises = [], isLoadingExercises = false }: GoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  
  // Progress tracking for form completion
  const [formProgress, setFormProgress] = useState(0);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(CreateGoalSchema),
    defaultValues: {
      goal_type: 'weight_loss',
      goal_title: '',
      goal_description: '',
      target_date: '',
      priority_level: 'medium',
    },
  });
  
  // Calculate form completion progress
  React.useEffect(() => {
    const values = form.getValues();
    const goalType = values.goal_type;
    
    let requiredFields = ['goal_type', 'goal_title', 'target_date'];
    
    // Add goal-type specific required fields
    if (goalType === 'weight_loss') {
      requiredFields.push('start_weight_lbs', 'target_weight_lbs');
    } else if (goalType === 'strength_gain') {
      requiredFields.push('target_exercise_id', 'start_exercise_max_weight_lbs', 'target_weight_for_exercise_lbs');
    } else if (goalType === 'body_composition') {
      requiredFields.push('start_body_fat_percentage', 'target_body_fat_percentage');
    }
    
    const filledFields = requiredFields.filter(field => {
      const value = (values as any)[field];
      return value !== undefined && value !== '' && value !== null;
    });
    
    const progress = Math.round((filledFields.length / requiredFields.length) * 100);
    setFormProgress(progress);
  }, [form.watch()]);

  const goalType = form.watch('goal_type');
  const goalTitle = form.watch('goal_title');
  const startWeight = form.watch('start_weight_lbs');
  const targetWeight = form.watch('target_weight_lbs');
  const startBodyFat = form.watch('start_body_fat_percentage');
  const targetBodyFat = form.watch('target_body_fat_percentage');
  
  // Goal validation hints
  const getGoalValidationHints = () => {
    const hints: { type: 'success' | 'warning' | 'error'; message: string }[] = [];
    
    if (goalType === 'weight_loss' && startWeight && targetWeight) {
      const weightDiff = startWeight - targetWeight;
      if (weightDiff <= 0) {
        hints.push({ type: 'error', message: 'Target weight should be less than current weight for weight loss goals' });
      } else if (weightDiff > 50) {
        hints.push({ type: 'warning', message: 'Consider breaking large weight loss goals into smaller milestones for better success' });
      } else if (weightDiff >= 10 && weightDiff <= 25) {
        hints.push({ type: 'success', message: 'Great! A realistic weight loss goal (1-2 lbs per week is recommended)' });
      }
    }
    
    if (goalType === 'body_composition' && startBodyFat && targetBodyFat) {
      const bodyFatDiff = startBodyFat - targetBodyFat;
      if (bodyFatDiff <= 0) {
        hints.push({ type: 'error', message: 'Target body fat should be lower than current body fat for fat loss goals' });
      } else if (bodyFatDiff > 15) {
        hints.push({ type: 'warning', message: 'Large body fat reductions take time - consider setting intermediate milestones' });
      } else if (bodyFatDiff >= 3 && bodyFatDiff <= 8) {
        hints.push({ type: 'success', message: 'Excellent! A realistic body composition goal' });
      }
    }
    
    if (goalTitle && goalTitle.length > 50) {
      hints.push({ type: 'warning', message: 'Consider a shorter, more memorable goal title' });
    }
    
    return hints;
  };
  
  const validationHints = getGoalValidationHints();

  const onSubmit = async (data: GoalFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create goals.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const goal = await createGoal(data);
      
      toast({
        title: 'Goal Created Successfully!',
        description: `Your ${data.goal_type.replace('_', ' ')} goal "${data.goal_title}" has been set.`,
      });

      if (onGoalCreated) {
        onGoalCreated(goal.id);
      }

      // Reset form
      form.reset();
      
    } catch (error) {
      console.error('Goal creation error:', error);
      
      if (error instanceof GoalServiceError) {
        toast({
          title: 'Failed to Create Goal',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'weight_loss': return <Scale className="h-5 w-5" />;
      case 'strength_gain': return <Dumbbell className="h-5 w-5" />;
      case 'body_composition': return <Activity className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getGoalTypeDescription = (type: GoalType) => {
    switch (type) {
      case 'weight_loss': 
        return 'Set a target weight and timeline for healthy weight loss';
      case 'strength_gain': 
        return 'Set strength targets for specific exercises with progressive overload';
      case 'body_composition': 
        return 'Target body fat percentage and muscle composition goals';
      default: 
        return 'Choose your fitness goal type';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          Create Your Fitness Goal
        </CardTitle>
        <CardDescription>
          Set specific, measurable fitness targets with deadlines and track your progress with real data.
        </CardDescription>
        
        {/* Progress Indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Form Progress</span>
            <span className="font-medium">{formProgress}% Complete</span>
          </div>
          <Progress value={formProgress} className="h-2" />
          {formProgress < 100 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Complete all required fields to create your goal
            </p>
          )}
          {formProgress === 100 && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Ready to create your goal!
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Goal Type Selection */}
            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Type *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger 
                        className={cn(
                          "touch-manipulation",
                          isMobile ? "h-12 text-base" : "h-10 text-sm"
                        )}
                      >
                        <SelectValue placeholder="Select your goal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weight_loss" className={isMobile ? "py-3 px-4" : ""}>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Weight Loss
                        </div>
                      </SelectItem>
                      <SelectItem value="strength_gain" className={isMobile ? "py-3 px-4" : ""}>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Strength Gain
                        </div>
                      </SelectItem>
                      <SelectItem value="body_composition" className={isMobile ? "py-3 px-4" : ""}>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Body Composition
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {goalType && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {getGoalTypeDescription(goalType)}
                      </p>
                      
                      {/* Goal Type Specific Tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Tips for {goalType.replace('_', ' ')} goals:</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {goalType === 'weight_loss' && (
                            <>
                              <li>• Aim for 1-2 lbs per week for sustainable weight loss</li>
                              <li>• Track both weight and body measurements</li>
                              <li>• Set realistic timelines (1-2 months for every 10 lbs)</li>
                            </>
                          )}
                          {goalType === 'strength_gain' && (
                            <>
                              <li>• Progressive overload: add 2.5-5 lbs when you can complete all reps</li>
                              <li>• Focus on compound movements for best results</li>
                              <li>• Allow 4-6 weeks to see significant strength gains</li>
                            </>
                          )}
                          {goalType === 'body_composition' && (
                            <>
                              <li>• Body fat changes are gradual - allow 8-12 weeks minimum</li>
                              <li>• Combine strength training with cardio for best results</li>
                              <li>• Track measurements, not just the scale</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Goal Title */}
            <FormField
              control={form.control}
              name="goal_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Lose 20 pounds for summer, Bench press 225 lbs, Reach 15% body fat"
                      className={cn(
                        isMobile ? "h-12 text-base" : "h-10 text-sm",
                        "touch-manipulation"
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal Description */}
            <FormField
              control={form.control}
              name="goal_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details about your goal, motivation, or specific plans..."
                      className={cn(
                        "touch-manipulation resize-none",
                        isMobile ? "min-h-24 text-base" : "min-h-20 text-sm"
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal touch-manipulation",
                            isMobile ? "h-12 text-base" : "h-10 text-sm",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick your target date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className={cn(
                        "w-auto p-0",
                        // Mobile: Full width calendar for better touch
                        isMobile && "w-full max-w-sm"
                      )} 
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={isMobile ? "p-4" : ""}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight Loss Specific Fields */}
            {goalType === 'weight_loss' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Weight Loss Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_weight_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Weight (lbs) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="185"
                            className={cn(
                              // Mobile: Larger touch target
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_weight_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight (lbs) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="165"
                            className={cn(
                              // Mobile: Larger touch target
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Validation Hints for Weight Loss */}
                {validationHints.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {validationHints.map((hint, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-start gap-2 p-3 rounded-lg text-sm",
                          hint.type === 'success' && "bg-green-50 text-green-700 border border-green-200",
                          hint.type === 'warning' && "bg-yellow-50 text-yellow-700 border border-yellow-200",
                          hint.type === 'error' && "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {hint.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {hint.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {hint.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <span>{hint.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Strength Gain Specific Fields */}
            {goalType === 'strength_gain' && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">Strength Gain Details</h3>
                
                <FormField
                  control={form.control}
                  name="target_exercise_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise *</FormLabel>
                      <FormControl>
                        {isMobile ? (
                          <ExerciseSelectionSheet
                            exercises={exercises}
                            selectedExerciseId={field.value}
                            onExerciseSelect={field.onChange}
                            isLoading={isLoadingExercises}
                          />
                        ) : (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger 
                              className={cn(
                                "touch-manipulation",
                                "h-10 text-sm"
                              )}
                            >
                              <SelectValue placeholder="Select exercise" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48">
                              {isLoadingExercises && (
                                <SelectItem disabled value="loading">Loading exercises...</SelectItem>
                              )}
                              {exercises.map((exercise) => (
                                <SelectItem 
                                  key={exercise.id} 
                                  value={exercise.id}
                                >
                                  {exercise.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                      
                      {/* Exercise Selection Tip */}
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        💡 <strong>Pro tip:</strong> Choose compound movements (like bench press, squat, deadlift) for best strength gains
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_exercise_max_weight_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Max Weight (lbs) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="185"
                            className={cn(
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_weight_for_exercise_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight (lbs) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="225"
                            className={cn(
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="target_reps_for_exercise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Reps (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5"
                          className={cn(
                            "touch-manipulation",
                            isMobile ? "h-12 text-base" : "h-10 text-sm"
                          )}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Body Composition Specific Fields */}
            {goalType === 'body_composition' && (
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Body Composition Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_body_fat_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Body Fat % *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="22"
                            className={cn(
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_body_fat_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Body Fat % *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15"
                            className={cn(
                              isMobile ? "h-12 text-base" : "h-10 text-sm",
                              "touch-manipulation"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Validation Hints for Body Composition */}
                {validationHints.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {validationHints.map((hint, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-start gap-2 p-3 rounded-lg text-sm",
                          hint.type === 'success' && "bg-green-50 text-green-700 border border-green-200",
                          hint.type === 'warning' && "bg-yellow-50 text-yellow-700 border border-yellow-200",
                          hint.type === 'error' && "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {hint.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {hint.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {hint.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <span>{hint.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Motivation & Priority */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="motivation_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Why is this goal important to you?"
                        className={cn(
                          "touch-manipulation resize-none",
                          isMobile ? "min-h-20 text-base" : "min-h-[80px] text-sm"
                        )}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="priority_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            className={cn(
                              "touch-manipulation",
                              isMobile ? "h-12 text-base" : "h-10 text-sm"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high" className={isMobile ? "py-3 px-4" : ""}>High Priority</SelectItem>
                          <SelectItem value="medium" className={isMobile ? "py-3 px-4" : ""}>Medium Priority</SelectItem>
                          <SelectItem value="low" className={isMobile ? "py-3 px-4" : ""}>Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reward_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="New workout clothes, vacation, etc."
                          className={cn(
                            "touch-manipulation",
                            isMobile ? "h-12 text-base" : "h-10 text-sm"
                          )}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className={cn(
                    "w-full sm:w-auto",
                    // Mobile: 44px touch target, Desktop: standard size
                    isMobile ? "h-12 min-h-[44px]" : "h-10",
                    "touch-manipulation"
                  )}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || formProgress < 100}
                className={cn(
                  "min-w-[120px] w-full sm:w-auto",
                  // Mobile: 44px touch target, Desktop: standard size
                  isMobile ? "h-12 min-h-[44px]" : "h-10",
                  "touch-manipulation"
                )}
              >
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}