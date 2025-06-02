// FitForge Goal Setting Form Component
// Real Data-Driven Goal Creation with TypeScript and Zod Validation
// Created: June 1, 2025

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, Dumbbell, Scale, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { 
  createGoal, 
  GoalFormData, 
  CreateGoalSchema,
  GoalType,
  GoalServiceError 
} from '@/services/supabase-goal-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Exercise } from '@/lib/supabase';

interface GoalFormProps {
  onGoalCreated?: (goalId: string) => void;
  onCancel?: () => void;
  exercises?: Exercise[];
}

export function GoalForm({ onGoalCreated, onCancel, exercises = [] }: GoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType | ''>('');

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

  const goalType = form.watch('goal_type');

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
                  <FormLabel>Goal Type</FormLabel>
                  <Select 
                    onValueChange={(value: GoalType) => {
                      field.onChange(value);
                      setSelectedGoalType(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weight_loss">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Weight Loss
                        </div>
                      </SelectItem>
                      <SelectItem value="strength_gain">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Strength Gain
                        </div>
                      </SelectItem>
                      <SelectItem value="body_composition">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Body Composition
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {goalType && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {getGoalTypeDescription(goalType)}
                    </p>
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
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Lose 20 pounds for summer, Bench press 225 lbs, Reach 15% body fat"
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
                  <FormLabel>Target Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        disabled={(date) => date < new Date()}
                        initialFocus
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_weight_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="185"
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
                        <FormLabel>Target Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="165"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                      <FormLabel>Exercise</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exercise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.exercise_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_exercise_max_weight_lbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Max Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="185"
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
                        <FormLabel>Target Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="225"
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_body_fat_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Body Fat %</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="22"
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
                        <FormLabel>Target Body Fat %</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Motivation & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="motivation_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Why is this goal important to you?"
                        className="min-h-[80px]"
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
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
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
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
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