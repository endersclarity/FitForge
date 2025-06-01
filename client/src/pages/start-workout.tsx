import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Dumbbell, Clock, Target, Plus, Minus, Play } from "lucide-react";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { useRealWorkoutSession } from "@/hooks/use-real-workout-session";

interface Exercise {
  exerciseName: string;
  equipmentType: string;
  category: string;
  workoutType: string;
  variation: string;
  weight: number | string;
  restTime: string;
  reps: number;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
}

interface WorkoutExercise extends Exercise {
  selectedWeight: number;
  targetReps: number;
  sets: Array<{
    reps: number;
    weight: number;
    completed: boolean;
    restTime?: number;
  }>;
}

export default function StartWorkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutType = urlParams.get('type') || '';
  
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  
  const { session } = useRealWorkoutSession();

  // Fetch exercises from the API
  const { data: exerciseResponse, isLoading } = useQuery({
    queryKey: ["/api/exercises"],
    select: (data: any) => {
      // Handle the nested API response structure
      if (data?.success && data?.data?.exercises) {
        return data.data.exercises;
      }
      return data || [];
    }
  });
  
  const allExercises: Exercise[] = exerciseResponse || [];

  // Filter exercises by workout type
  const availableExercises = allExercises.filter(exercise => 
    exercise.workoutType.toLowerCase() === workoutType.toLowerCase()
  );

  // Auto-select exercises when they load
  useEffect(() => {
    if (availableExercises.length > 0 && selectedExerciseIds.length === 0) {
      const defaultExerciseIds = availableExercises.slice(0, 6).map((exercise, index) => 
        `${exercise.exerciseName}-${index}`);
      setSelectedExerciseIds(defaultExerciseIds);
    }
  }, [availableExercises, selectedExerciseIds.length]);

  const workoutTypeNames: Record<string, string> = {
    'abs': 'Abs & Core',
    'backbiceps': 'Back & Biceps', 
    'chesttriceps': 'Chest & Triceps',
    'legs': 'Legs',
    'warmup': 'Warm-up'
  };

  const workoutName = workoutTypeNames[workoutType] || 'Unknown Workout';

  // If we have an active session or workout has been started, show the WorkoutSession component
  if (session || workoutStarted) {
    return <WorkoutSession workoutType={workoutName} selectedExercises={selectedExerciseIds} />;
  }

  if (!workoutType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Workout Type Selected</h1>
          <Button onClick={() => window.location.href = '/workouts'}>
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading {workoutName} exercises...</p>
        </div>
      </div>
    );
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const startWorkoutSession = () => {
    setWorkoutStarted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/workouts'}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workouts
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Start {workoutName}</h1>
            <p className="text-muted-foreground">
              {selectedExerciseIds.length} exercises selected
            </p>
          </div>
        </div>
      </section>

      {/* Exercise Selection */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableExercises.length > 0 ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Select Exercises</h2>
              <p className="text-muted-foreground">
                {selectedExerciseIds.length} exercises selected
              </p>
            </div>

            {availableExercises.map((exercise, index) => {
              const exerciseId = `${exercise.exerciseName}-${index}`;
              const isSelected = selectedExerciseIds.includes(exerciseId);
              
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                  }`}
                  onClick={() => toggleExerciseSelection(exerciseId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{exercise.exerciseName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.primaryMuscles.map(m => m.muscle).join(", ")}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{exercise.category}</Badge>
                          <Badge variant="outline">{exercise.equipmentType}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {typeof exercise.weight === 'number' && (
                          <div className="text-sm text-muted-foreground">
                            {exercise.weight} lbs
                          </div>
                        )}
                        <Badge variant={isSelected ? "default" : "secondary"}>
                          {isSelected ? "Selected" : "Select"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedExerciseIds.length > 0 && (
              <div className="text-center pt-6">
                <Button 
                  size="lg" 
                  onClick={startWorkoutSession}
                  className="gradient-bg px-8 py-3"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Workout Session
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No exercises found for {workoutName}
            </p>
            <Button onClick={() => window.location.href = '/workouts'}>
              Choose Different Workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}