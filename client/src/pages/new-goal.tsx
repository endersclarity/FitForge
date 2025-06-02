// FitForge New Goal Creation Page
// Form page for creating new fitness goals

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalProgressEngine } from '@/services/goal-progress-engine';
import { useAuth } from '@/hooks/use-auth';

export default function NewGoalPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Array<{
    id: string;
    name: string;
    category: string;
    recent_max_weight?: number;
    recent_workout_count?: number;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  if (!user) {
    setLocation('/auth');
    return null;
  }

  // Load exercise data for goal creation
  useEffect(() => {
    const loadExerciseData = async () => {
      try {
        setIsLoadingData(true);
        const exerciseData = await GoalProgressEngine.getAvailableExercisesForStrengthGoals();
        setExercises(exerciseData);
      } catch (error) {
        console.error('Error loading exercise data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user) {
      loadExerciseData();
    }
  }, [user]);

  const handleGoalCreated = () => {
    // Navigate back to goals dashboard after successful creation
    setLocation('/goals');
  };

  const handleCancel = () => {
    // Navigate back to goals dashboard on cancel
    setLocation('/goals');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Goals
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Create New Goal</h1>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Set a specific, measurable fitness target. We'll track your progress using real data 
              from your workouts and measurements with transparent calculations.
            </p>
          </div>
        </div>

        {/* Goal Creation Form */}
        <GoalForm 
          onGoalCreated={handleGoalCreated}
          onCancel={handleCancel}
          exercises={exercises}
          isLoadingExercises={isLoadingData}
        />
      </div>
    </div>
  );
}