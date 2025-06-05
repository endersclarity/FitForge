import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Dumbbell, Clock, Target, Plus, Minus, Play } from "lucide-react";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { useWorkoutSession, SessionConflictError, type SessionConflictData } from "@/hooks/use-workout-session";
import { SessionConflictDialog } from "@/components/SessionConflictDialog";
import { WorkoutProgressErrorBoundary } from "@/components/workout-progress-error-boundary";
import { localWorkoutService } from "@/services/local-workout-service";
import { useAuth } from "@/hooks/use-auth";
import type { Exercise } from "@/lib/supabase";
import { createWorkoutExerciseFromExercise, type WorkoutExercise } from "../../../shared/consolidated-schema";

export default function StartWorkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const workoutType = urlParams.get('type') || '';
  
  if (process.env.NODE_ENV === 'development') {
    // Debug info available in development
  }
  
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [sessionConflict, setSessionConflict] = useState<SessionConflictData | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const { user } = useAuth();
  const { session, startWorkout, abandonActiveSession, resumeActiveSession, loading: sessionLoading, error } = useWorkoutSession();

  // Fetch exercises from working API endpoint by workout type
  const { data: exercisesResponse, isLoading, error: exercisesError } = useQuery({
    queryKey: ["exercises", workoutType],
    queryFn: async () => {
      if (!workoutType) return { exercises: [] };
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // Filter by workout type (convert backbiceps -> BackBiceps for matching)
        const workoutTypeMapping: Record<string, string> = {
          'backbiceps': 'BackBiceps',
          'chesttriceps': 'ChestTriceps', 
          'legs': 'Legs',
          'abs': 'Abs',
          'warmup': 'Warmup'
        };
        
        const mappedType = workoutTypeMapping[workoutType] || workoutType;
        const filteredExercises = data.data.exercises.filter((ex: Exercise) => 
          ex.workoutType === mappedType
        );
        
        return { exercises: filteredExercises };
      } catch (error) {
        console.error(`❌ Failed to fetch exercises for ${workoutType}:`, error);
        throw new Error(`Failed to load ${workoutType} exercises. Please try again.`);
      }
    },
    enabled: !!workoutType,
    retry: 2,
    retryDelay: 1000
  });

  // Use exercises from API (Supabase Exercise format)
  const allExercises: Exercise[] = exercisesResponse?.exercises || [];

  // Available exercises (already filtered by workout type from Supabase)
  const availableExercises = allExercises;

  // Auto-select exercises when they load
  useEffect(() => {
    if (availableExercises.length > 0 && selectedExerciseIds.length === 0) {
      // Use exercise IDs from the API response
      const defaultExerciseIds = exercisesResponse?.exercises.slice(0, 6).map((exercise: Exercise) => exercise.id) || [];
      setSelectedExerciseIds(defaultExerciseIds);
    }
  }, [availableExercises, selectedExerciseIds.length, exercisesResponse]);

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
    return (
      <WorkoutProgressErrorBoundary 
        context="workout-session"
        onRetry={() => {
          setWorkoutStarted(false);
          // Session will be maintained by the hook
        }}
      >
        <WorkoutSession workoutType={workoutName} selectedExercises={selectedExerciseIds} />
      </WorkoutProgressErrorBoundary>
    );
  }

  // Show loading state with proper background and feedback
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading {workoutName} exercises...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your workout exercises</p>
        </div>
      </div>
    );
  }

  // Show error state with actionable feedback
  if (exercisesError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Exercises</h2>
          <p className="text-muted-foreground mb-4">
            {exercisesError instanceof Error ? exercisesError.message : 'An unexpected error occurred'}
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/workouts'} className="w-full">
              Back to Workouts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show no workout type selected
  if (!workoutType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Workout Type Selected</h1>
          <p className="text-muted-foreground mb-4">Please select a workout type to continue</p>
          <Button onClick={() => window.location.href = '/workouts'}>
            Back to Workouts
          </Button>
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

  const startWorkoutSession = async () => {
    if (!user) {
      alert('Please sign in to start a workout');
      return;
    }

    if (selectedExerciseIds.length === 0) {
      alert('Please select at least one exercise');
      return;
    }

    try {

      // Create workout exercise objects for the session using consolidated schema
      const selectedExerciseData = selectedExerciseIds
        .map(id => exercisesResponse?.exercises.find((ex: Exercise) => ex.id === id))
        .filter((exercise): exercise is Exercise => Boolean(exercise));

      const selectedExercises = selectedExerciseData
        .map((exercise: Exercise, index: number): WorkoutExercise => 
          createWorkoutExerciseFromExercise(exercise, index + 1)
        );

      // Convert canonical format to legacy format
      const legacyExercises = selectedExerciseData.map(ex => ({
        id: ex.id,
        name: ex.exerciseName,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipmentType,
        restTime: ex.restTimeSeconds,
        difficulty: ex.difficultyLevel,
        workoutType: ex.workoutType
      }));

      await startWorkout(workoutType, legacyExercises);
      setWorkoutStarted(true);
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
      
      // Handle session conflict with proper dialog
      if (error instanceof SessionConflictError) {
        setSessionConflict(error.conflictData);
        setShowConflictDialog(true);
      } else {
        // Handle other errors with alert
        alert(error instanceof Error ? error.message : 'Failed to start workout');
      }
    }
  };

  // Session conflict dialog handlers
  const handleAbandonAndStart = async () => {
    try {
      await abandonActiveSession();
      setShowConflictDialog(false);
      setSessionConflict(null);
      
      // Retry starting the workout
      await startWorkoutSession();
    } catch (error) {
      console.error('❌ Failed to abandon session and start new workout:', error);
      alert(error instanceof Error ? error.message : 'Failed to abandon previous session');
    }
  };

  const handleResumeExisting = async () => {
    try {
      await resumeActiveSession();
      setShowConflictDialog(false);
      setSessionConflict(null);
      setWorkoutStarted(true);
    } catch (error) {
      console.error('❌ Failed to resume previous session:', error);
      alert(error instanceof Error ? error.message : 'Failed to resume previous session');
    }
  };

  const handleCancelConflict = () => {
    setShowConflictDialog(false);
    setSessionConflict(null);
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

            {exercisesResponse?.exercises.map((exercise: Exercise, index: number) => {
              const exerciseId = exercise.id;
              const isSelected = selectedExerciseIds.includes(exerciseId);
              
              return (
                <Card 
                  key={exercise.id}
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
                          {exercise.category} • {exercise.difficultyLevel}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{exercise.category}</Badge>
                          {exercise.equipmentType?.map((eq: string, idx: number) => (
                            <Badge key={idx} variant="outline">{eq}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {exercise.defaultWeightLbs && exercise.defaultWeightLbs > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {exercise.defaultWeightLbs} lbs
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
                  disabled={sessionLoading || !user}
                  className="gradient-bg px-8 py-3"
                >
                  {sessionLoading ? (
                    <>
                      <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Workout Session
                    </>
                  )}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Please sign in to start a workout
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 mt-2">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-yellow-500 text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No Exercises Available</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find any exercises for <strong>{workoutName}</strong> in the database.
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                This might be because:
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-1 mb-4">
                <li>• The exercise database hasn't been populated yet</li>
                <li>• There's a connection issue with the database</li>
                <li>• No exercises are configured for this workout type</li>
              </ul>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/workouts'} className="w-full">
                  Choose Different Workout
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/exercises'} className="w-full">
                  Browse All Exercises
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Conflict Dialog */}
      {sessionConflict && (
        <SessionConflictDialog
          open={showConflictDialog}
          conflictData={sessionConflict}
          onAbandonAndStart={handleAbandonAndStart}
          onResumeExisting={handleResumeExisting}
          onCancel={handleCancelConflict}
          loading={sessionLoading}
        />
      )}
    </div>
  );
}