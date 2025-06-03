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
import { workoutService } from "@/services/supabase-workout-service";
import { useAuth } from "@/hooks/use-supabase-auth";
import type { Exercise } from "@/lib/supabase";

// Legacy Exercise interface for compatibility with existing UI
interface LegacyExercise {
  exerciseName: string;
  equipmentType: string[];
  category: string;
  workoutType: string;
  variation: string;
  weight: number | string;
  restTime: string;
  reps: number;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
}

interface WorkoutExercise extends LegacyExercise {
  id: string;
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
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 StartWorkout component loaded with Supabase');
    console.log('📍 Current URL:', window.location.href);
    console.log('🎯 Workout type from URL:', workoutType);
    console.log('🔗 URL params:', Object.fromEntries(urlParams));
  }
  
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [sessionConflict, setSessionConflict] = useState<SessionConflictData | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const { user } = useAuth();
  const { session, startWorkout, abandonActiveSession, resumeActiveSession, loading: sessionLoading, error } = useWorkoutSession();

  // Fetch exercises from Supabase by workout type with proper error handling
  const { data: supabaseExercises, isLoading, error: exercisesError } = useQuery<Exercise[]>({
    queryKey: ["supabase-exercises", workoutType],
    queryFn: async () => {
      if (!workoutType) return [];
      console.log(`🔍 Fetching exercises for workout type: ${workoutType}`);
      try {
        const exercises = await workoutService.getExercisesByType(workoutType);
        console.log(`✅ Found ${exercises.length} exercises for ${workoutType}`);
        return exercises;
      } catch (error) {
        console.error(`❌ Failed to fetch exercises for ${workoutType}:`, error);
        throw new Error(`Failed to load ${workoutType} exercises. Please try again.`);
      }
    },
    enabled: !!workoutType,
    retry: 2,
    retryDelay: 1000
  });

  // Convert Supabase exercises to legacy format for UI compatibility
  const allExercises: LegacyExercise[] = (supabaseExercises || []).map(exercise => ({
    exerciseName: exercise.exercise_name,
    equipmentType: exercise.equipment_type || [],
    category: exercise.category,
    workoutType: exercise.workout_type || workoutType,
    variation: exercise.variation || '',
    weight: exercise.default_weight_lbs || 0,
    restTime: `${exercise.rest_time_seconds || 60}s`,
    reps: exercise.default_reps || 10,
    primaryMuscles: [], // Would need to fetch from exercise_primary_muscles table
    secondaryMuscles: [] // Would need to fetch from exercise_secondary_muscles table
  }));

  // Available exercises (already filtered by workout type from Supabase)
  const availableExercises = allExercises;

  // Auto-select exercises when they load
  useEffect(() => {
    if (availableExercises.length > 0 && selectedExerciseIds.length === 0 && supabaseExercises) {
      // Use the actual Supabase exercise IDs for selection
      const defaultExerciseIds = supabaseExercises.slice(0, 6).map(exercise => exercise.id);
      setSelectedExerciseIds(defaultExerciseIds);
    }
  }, [availableExercises, selectedExerciseIds.length, supabaseExercises]);

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
          console.log('🔄 Retrying workout session...');
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
      console.log('🚀 Starting workout with Supabase...');
      console.log('Selected exercise IDs:', selectedExerciseIds);

      // Create legacy exercise objects for the workout session
      const selectedExercises = selectedExerciseIds
        .map(id => supabaseExercises?.find(ex => ex.id === id))
        .filter(Boolean)
        .map(exercise => ({
          id: exercise!.id,
          name: exercise!.exercise_name,
          primaryMuscles: [], // TODO: Fetch from muscles tables
          secondaryMuscles: [],
          equipment: exercise!.equipment_type || [],
          restTime: exercise!.rest_time_seconds || 60,
          difficulty: exercise!.difficulty_level || 'beginner',
          workoutType: exercise!.workout_type || workoutType
        }));

      await startWorkout(workoutType, selectedExercises);
      setWorkoutStarted(true);
      console.log('✅ Workout started successfully');
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
      
      // Handle session conflict with proper dialog
      if (error instanceof SessionConflictError) {
        console.log('🔄 Session conflict detected, showing dialog...');
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
      console.log('🗑️ Abandoning previous session and starting new workout...');
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
      console.log('🔄 Resuming previous workout session...');
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
    console.log('❌ User cancelled session conflict resolution');
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

            {supabaseExercises?.map((exercise, index) => {
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
                        <h3 className="font-semibold">{exercise.exercise_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.category} • {exercise.difficulty_level}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{exercise.category}</Badge>
                          {exercise.equipment_type?.map((eq, idx) => (
                            <Badge key={idx} variant="outline">{eq}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {exercise.default_weight_lbs && (
                          <div className="text-sm text-muted-foreground">
                            {exercise.default_weight_lbs} lbs
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