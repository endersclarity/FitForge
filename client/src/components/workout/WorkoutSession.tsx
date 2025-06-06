import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { ExerciseSelector } from "./ExerciseSelector";
import { RealSetLogger } from "./RealSetLogger";
import { WorkoutProgressErrorBoundary } from "../workout-progress-error-boundary";
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  TrendingUp,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  Dumbbell
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface WorkoutSessionProps {
  workoutType?: string;
  selectedExercises?: string[];
}

export function WorkoutSession({ workoutType = "Custom Workout", selectedExercises = [] }: WorkoutSessionProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  const {
    session,
    loading,
    startWorkout,
    logSet,
    endWorkout,
    error
  } = useWorkoutSession();

  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Dumbbell 
            aria-label="Loading workout session"
            role="status"
            className="w-12 h-12 mx-auto mb-4 animate-pulse" 
          />
          <p className="text-lg">Loading workout session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show exercise selector if requested
  if (showExerciseSelector) {
    return (
      <ExerciseSelector 
        onBack={() => setShowExerciseSelector(false)} 
      />
    );
  }

  // If session is completed, show completion screen
  if (session && session.status === 'completed') {
    const stats = {
      duration: session.endTime 
        ? formatDuration(session.endTime.getTime() - session.startTime.getTime())
        : formatDuration(Date.now() - session.startTime.getTime()),
      totalSets: session.exercises.reduce((total, ex) => total + ex.sets.length, 0),
      totalVolume: session.totalVolume,
      exercisesCompleted: session.exercises.filter(ex => ex.sets.length > 0).length
    };

    return (
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-r from-green-500/20 via-blue-500/10 to-purple-500/20 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
              <h1 className="text-4xl font-bold mb-4">Workout Complete! 🎉</h1>
              <p className="text-xl text-muted-foreground">
                Great job on completing your {session.workoutType} workout!
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Timer className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{stats.duration}</div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{stats.totalSets}</div>
                  <div className="text-sm text-muted-foreground">Sets Completed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{Math.round(stats.totalVolume)}</div>
                  <div className="text-sm text-muted-foreground">Total Volume (lbs)</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{stats.exercisesCompleted}</div>
                  <div className="text-sm text-muted-foreground">Exercises</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  size="lg" 
                  className="gradient-bg text-white font-semibold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={() => window.location.href = '/workouts'}
                  variant="outline"
                  size="lg"
                >
                  Start Another Workout
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Your workout has been saved and logged automatically.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If no session exists, show start screen
  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Ready to Start Your Workout?</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Begin tracking your {workoutType} session
            </p>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Selected Exercises</h3>
                {selectedExercises.length > 0 ? (
                  <div className="space-y-2">
                    {selectedExercises.map((exerciseId, index) => (
                      <div key={exerciseId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-medium">Exercise {index + 1}</span>
                        <Badge variant="secondary">Ready</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No exercises selected yet</p>
                )}
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => startWorkout(workoutType, selectedExercises.map(id => ({ id, name: `Exercise ${id}`, primaryMuscles: [], secondaryMuscles: [], equipment: [], restTime: 60, difficulty: 'medium', workoutType })))}
                  size="lg" 
                  className="gradient-bg text-white font-semibold"
                  disabled={selectedExercises.length === 0}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Workout
                </Button>
                <Button 
                  onClick={() => setShowExerciseSelector(true)}
                  variant="outline"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Select Exercises
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Get current exercise for focused logging
  const currentExercise = session.exercises?.[currentExerciseIndex];

  // Active workout interface
  return (
    <div className="min-h-screen bg-background">
      {/* Workout Header */}
      <section className="bg-gradient-to-r from-green-500/10 to-blue-500/10 py-6 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                {session.status === 'paused' && <Pause className="w-6 h-6 mr-2 text-orange-500" />}
                {session.status === 'in_progress' && <Play className="w-6 h-6 mr-2 text-green-500" />}
                {session.status === 'completed' && <CheckCircle className="w-6 h-6 mr-2 text-green-600" />}
                {session.workoutType} Session
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Timer className="w-4 h-4 mr-1" />
                  {session?.startTime ? formatDuration(Date.now() - session.startTime.getTime()) : "00:00"}
                </span>
                <span>{session?.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0} sets completed</span>
                <span>Volume: {Math.round(session.totalVolume || 0)} lbs</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => endWorkout()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finish Workout
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Workout Progress</span>
              <span>{Math.round((session?.exercises?.filter(ex => ex.completed).length || 0) / (session?.exercises?.length || 1) * 100)}%</span>
            </div>
            <Progress value={(session?.exercises?.filter(ex => ex.completed).length || 0) / (session?.exercises?.length || 1) * 100} className="h-2" />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Exercise Card with Set Logger */}
        {currentExercise && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">{currentExercise.exerciseName}</span>
                  <Badge variant="secondary" className="ml-2">
                    Current Exercise
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Exercise {currentExerciseIndex + 1} of {session.exercises?.length || 0}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Exercise Details */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold mb-2">Target</h4>
                  <div className="space-y-1 text-sm">
                    <div>Sets: 3</div>
                    <div>Reps: 12</div>
                    <div>Weight: 0 lbs</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <div className="space-y-1 text-sm">
                    <div>Sets: {currentExercise.sets?.length || 0}/3</div>
                    <div>Completed: {currentExercise.sets?.length || 0}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Volume</h4>
                  <div className="text-2xl font-bold text-primary">
                    {currentExercise.sets?.reduce((total, set) => 
                      total + (set.weight * set.reps), 0) || 0} lbs
                  </div>
                </div>
              </div>

              {/* Real Set Logger */}
              <WorkoutProgressErrorBoundary 
                context="set-logging"
                fallback={
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-destructive">Set Logging Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Unable to load set logging interface. Your workout progress is still saved.
                      </p>
                      <Button onClick={() => window.location.reload()} className="w-full">
                        Refresh to Try Again
                      </Button>
                    </CardContent>
                  </Card>
                }
              >
                <RealSetLogger 
                  exerciseId={currentExercise.exerciseId}
                  exerciseName={currentExercise.exerciseName}
                  sessionId={session.sessionId}
                  currentSets={currentExercise.sets || []}
                  targetSets={3}
                  onSetLogged={(setData) => {
                    logSet(setData.weight, setData.reps, setData.equipment || 'bodyweight');
                  }}
                />
              </WorkoutProgressErrorBoundary>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                  disabled={currentExerciseIndex === 0}
                  variant="outline"
                >
                  Previous Exercise
                </Button>
                <Button 
                  onClick={() => setCurrentExerciseIndex(Math.min((session.exercises?.length || 1) - 1, currentExerciseIndex + 1))}
                  disabled={currentExerciseIndex >= (session.exercises?.length || 1) - 1}
                  variant="outline"
                >
                  Next Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Workout Overview</span>
              <Badge variant="outline">{session.exercises?.length || 0} exercises</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.exercises?.map((exercise, index) => {
                const isCurrent = index === currentExerciseIndex;
                const completedSets = exercise.sets?.length || 0;
                const totalSets = 3;
                const isCompleted = completedSets >= totalSets;
                
                return (
                  <div 
                    key={exercise.exerciseId}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      isCurrent ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          {exercise.exerciseName}
                          {isCurrent && <Badge className="ml-2 bg-primary">Current</Badge>}
                          {isCompleted && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {completedSets}/{totalSets} sets completed
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {exercise.sets?.reduce((total, set) => 
                            total + (set.weight * set.reps), 0) || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">lbs volume</div>
                      </div>
                    </div>
                  </div>
                );
              }) || []}
            </div>
            
            {(!session.exercises || session.exercises.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exercises in this session</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default WorkoutSession;