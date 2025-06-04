import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkoutQueue } from '@/hooks/use-workout-queue';
import { useWorkoutSession } from '@/hooks/use-workout-session';
import { Play, X } from 'lucide-react';
import { useLocation } from 'wouter';

export function WorkoutQueueButton() {
  const { queuedExercises, removeExercise, clearQueue } = useWorkoutQueue();
  const { startWorkout } = useWorkoutSession();
  const [, setLocation] = useLocation();

  if (queuedExercises.length === 0) {
    return null;
  }

  const handleStartWorkout = async () => {
    if (queuedExercises.length === 0) return;

    try {
      // Convert queued exercises to the format expected by startWorkout
      const legacyExercises = queuedExercises.map(exercise => ({
        id: exercise.id,
        name: exercise.exerciseName || exercise.name || exercise.id,
        primaryMuscles: exercise.primaryMuscles?.map(m => m.muscle) || [],
        secondaryMuscles: exercise.secondaryMuscles?.map(m => m.muscle) || [],
        equipment: exercise.equipmentType || [],
        restTime: 60, // Default rest time
        difficulty: exercise.category || "Medium",
        workoutType: exercise.workoutType || "Mixed"
      }));

      // Determine workout type based on most common type in selected exercises
      const workoutTypes = queuedExercises.map(ex => ex.workoutType).filter(Boolean);
      const workoutType = workoutTypes.length > 0 ? workoutTypes[0] : "Mixed";

      console.log("🏋️ Starting workout with exercises:", legacyExercises);
      
      // Start the workout session
      await startWorkout(workoutType, legacyExercises);
      
      // Clear the queue since we're starting the workout
      clearQueue();
      
      // Navigate to the workout session page
      setLocation('/workout-session');
    } catch (error) {
      console.error("Failed to start workout:", error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-xl border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Workout Queue</h3>
              <Badge variant="secondary">{queuedExercises.length}</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearQueue}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {queuedExercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between text-sm">
                <span className="flex-1 truncate">{exercise.exerciseName || exercise.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExercise(exercise.id)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleStartWorkout} 
            className="w-full"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Begin Workout ({queuedExercises.length} exercises)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}