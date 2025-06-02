// FitForge New Goal Page
// Route: /goals/new
// Real Data-Driven Goal Creation Interface

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalForm } from '@/components/goals/GoalForm';
import { db, Exercise } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function NewGoalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load exercises for strength goals
    const loadExercises = async () => {
      try {
        const exerciseData = await db.getExercises();
        setExercises(exerciseData);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        toast({
          title: 'Warning',
          description: 'Could not load exercise list. Strength goals may not work properly.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [user, navigate, toast]);

  const handleGoalCreated = (goalId: string) => {
    toast({
      title: 'Success!',
      description: 'Your goal has been created. Redirecting to goals dashboard...',
    });
    
    // Navigate to goals dashboard or specific goal view
    setTimeout(() => {
      navigate('/goals');
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/goals');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading goal creation form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/goals')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Create Your Fitness Goal</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Set specific, measurable fitness targets with deadlines. Track your progress with real data 
              and transparent calculations based on your actual workouts and measurements.
            </p>
          </div>
        </div>

        {/* Goal Creation Form */}
        <GoalForm 
          onGoalCreated={handleGoalCreated}
          onCancel={handleCancel}
          exercises={exercises}
        />

        {/* Help Text */}
        <div className="mt-8 text-center">
          <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-medium mb-3">Goal Progress Tracking</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Weight Loss:</strong> Progress calculated as: 
                (start_weight - current_weight) / (start_weight - target_weight) × 100%
              </p>
              <p>
                <strong>Strength Gain:</strong> Based on your logged workout sets and personal records for the target exercise
              </p>
              <p>
                <strong>Body Composition:</strong> Progress tracked from body measurements you enter over time
              </p>
              <p className="pt-2 border-t">
                All progress calculations show their data sources: "Based on X workouts since goal creation"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}