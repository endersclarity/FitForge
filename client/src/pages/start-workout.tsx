import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Dumbbell, Clock, Target, Plus, Minus, Play } from "lucide-react";

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
  
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

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
    if (availableExercises.length > 0 && selectedExercises.length === 0) {
      const defaultExercises = availableExercises.slice(0, 6).map(exercise => ({
        ...exercise,
        selectedWeight: typeof exercise.weight === 'number' ? exercise.weight : 50,
        targetReps: exercise.reps || 10,
        sets: [
          { reps: 0, weight: typeof exercise.weight === 'number' ? exercise.weight : 50, completed: false },
          { reps: 0, weight: typeof exercise.weight === 'number' ? exercise.weight : 50, completed: false },
          { reps: 0, weight: typeof exercise.weight === 'number' ? exercise.weight : 50, completed: false }
        ]
      }));
      setSelectedExercises(defaultExercises);
    }
  }, [availableExercises]);

  const workoutTypeNames: Record<string, string> = {
    'abs': 'Abs & Core',
    'backbiceps': 'Back & Biceps', 
    'chesttriceps': 'Chest & Triceps',
    'legs': 'Legs',
    'warmup': 'Warm-up'
  };

  const workoutName = workoutTypeNames[workoutType] || 'Unknown Workout';

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

  const updateExerciseWeight = (exerciseIndex: number, weight: number) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? { ...exercise, selectedWeight: weight, sets: exercise.sets.map(set => ({ ...set, weight })) }
        : exercise
    ));
  };

  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? { 
            ...exercise, 
            sets: exercise.sets.map((set, sIndex) => 
              sIndex === setIndex ? { ...set, reps, completed: reps > 0 } : set
            )
          }
        : exercise
    ));
  };

  const startWorkoutSession = () => {
    setWorkoutStarted(true);
    setCurrentExerciseIndex(0);
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? { 
            ...exercise, 
            sets: exercise.sets.map((set, sIndex) => 
              sIndex === setIndex ? { ...set, completed: true } : set
            )
          }
        : exercise
    ));
  };

  if (workoutStarted) {
    const currentExercise = selectedExercises[currentExerciseIndex];
    if (!currentExercise) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">🎉 Workout Complete!</h1>
            <p className="mb-4">Great job completing your {workoutName} workout!</p>
            <Button onClick={() => window.location.href = '/workouts'}>
              Back to Workouts
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{currentExercise.exerciseName}</h1>
            <p className="text-muted-foreground">Exercise {currentExerciseIndex + 1} of {selectedExercises.length}</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                {currentExercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold">Set {setIndex + 1}</span>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSetReps(currentExerciseIndex, setIndex, parseInt(e.target.value) || 0)}
                          className="w-20"
                          placeholder="Reps"
                        />
                        <span>reps @</span>
                        <Input 
                          type="number"
                          value={set.weight}
                          onChange={(e) => {
                            const weight = parseInt(e.target.value) || 0;
                            updateExerciseWeight(currentExerciseIndex, weight);
                          }}
                          className="w-20"
                          placeholder="Weight"
                        />
                        <span>lbs</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => completeSet(currentExerciseIndex, setIndex)}
                      variant={set.completed ? "secondary" : "default"}
                      disabled={set.reps === 0}
                    >
                      {set.completed ? "✓ Done" : "Complete"}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                  disabled={currentExerciseIndex === 0}
                >
                  Previous Exercise
                </Button>
                <Button 
                  onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                  disabled={!currentExercise.sets.every(set => set.completed)}
                >
                  {currentExerciseIndex === selectedExercises.length - 1 ? "Finish Workout" : "Next Exercise"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              {selectedExercises.length} exercises selected
            </p>
          </div>
        </div>
      </section>

      {/* Exercise Selection */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedExercises.length > 0 ? (
          <div className="space-y-4">
            {selectedExercises.map((exercise, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{exercise.exerciseName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.primaryMuscles.map(m => m.muscle).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Weight:</span>
                        <Input 
                          type="number"
                          value={exercise.selectedWeight}
                          onChange={(e) => updateExerciseWeight(index, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm">lbs</span>
                      </div>
                      <Badge>{exercise.sets.length} sets</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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