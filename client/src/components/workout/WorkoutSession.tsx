import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWorkoutSessionV2, useWorkoutProgress, useCurrentExercise } from "@/hooks/use-workout-session-v2";
import { ExerciseSelector } from "./ExerciseSelector";
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  TrendingUp,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface WorkoutSessionProps {
  onSelectExercises?: () => void;
}

export function WorkoutSession({ onSelectExercises }: WorkoutSessionProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  const {
    session,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    completeWorkout,
    resetWorkout,
    isWorkoutActive,
  } = useWorkoutSessionV2();
  
  const progress = useWorkoutProgress();
  const currentExercise = useCurrentExercise();

  // Show exercise selector if requested
  if (showExerciseSelector) {
    return (
      <ExerciseSelector onBack={() => setShowExerciseSelector(false)} />
    );
  }

  // If no workout has been started, show the start screen
  if (session.status === 'not_started') {
    return (
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Ready to Start Your Workout?</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose your exercises and start tracking your progress
            </p>
            
            {session.exercises.length === 0 ? (
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowExerciseSelector(true)}
                  size="lg" 
                  className="gradient-bg text-white font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Select Exercises
                </Button>
                <p className="text-sm text-muted-foreground">
                  Add exercises to your workout before starting
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Workout Preview</h3>
                  <div className="space-y-2">
                    {session.exercises.map((exercise, index) => (
                      <div key={exercise.exerciseId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-medium">{exercise.exerciseName}</span>
                        <Badge variant="secondary">{exercise.exercise.difficulty}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={startWorkout}
                    size="lg" 
                    className="gradient-bg text-white font-semibold"
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
                    Add More Exercises
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

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
                Workout {session.status === 'completed' ? 'Complete' : 'in Progress'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Timer className="w-4 h-4 mr-1" />
                  {formatDuration(progress.duration)}
                </span>
                <span>{progress.completedExercises}/{progress.totalExercises} exercises</span>
                <span>{progress.completedSets} sets completed</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {session.status === 'in_progress' && (
                <Button onClick={pauseWorkout} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {session.status === 'paused' && (
                <Button onClick={resumeWorkout} className="bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button 
                onClick={completeWorkout}
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
              <span>{Math.round(progress.progressPercentage)}%</span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Exercise Card */}
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
                  Exercise {session.currentExerciseIndex + 1} of {session.exercises.length}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Exercise Info</h4>
                  <div className="space-y-1 text-sm">
                    <div>Category: {currentExercise.exercise.category}</div>
                    <div>Difficulty: {currentExercise.exercise.difficulty}</div>
                    <div>Equipment: {currentExercise.exercise.equipment.join(", ")}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Primary Muscles</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentExercise.exercise.primaryMuscles.map((muscle, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {muscle.muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Sets Completed</h4>
                  <div className="text-2xl font-bold text-primary">
                    {currentExercise.sets.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentExercise.sets.filter(set => set.completed).length} completed
                  </div>
                </div>
              </div>
              
              {/* Sets Log */}
              {currentExercise.sets.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Sets Logged</h4>
                  <div className="space-y-2">
                    {currentExercise.sets.map((set, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>Set {set.setNumber}</span>
                        <span className="font-mono">{set.weight} lbs × {set.reps} reps</span>
                        {set.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Exercises</span>
              <Button onClick={() => setShowExerciseSelector(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.exercises.map((exercise, index) => {
                const isCurrent = index === session.currentExerciseIndex;
                const isCompleted = exercise.completedAt;
                
                return (
                  <div 
                    key={exercise.exerciseId}
                    className={`p-4 border rounded-lg transition-colors ${
                      isCurrent ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          {exercise.exerciseName}
                          {isCurrent && <Badge className="ml-2 bg-primary">Current</Badge>}
                          {isCompleted && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.exercise.category} • {exercise.exercise.difficulty}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">{exercise.sets.length}</div>
                        <div className="text-sm text-muted-foreground">sets</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {session.exercises.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exercises added yet</p>
                <p className="text-sm">Click "Add Exercise" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Controls */}
        <div className="mt-6 flex justify-center gap-4">
          <Button 
            onClick={resetWorkout} 
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Workout
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutSession;