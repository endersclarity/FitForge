import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Play, ArrowLeft, Dumbbell, Clock, Target, Plus, Minus } from "lucide-react";
import { useWorkoutSession, WorkoutExercise, SessionConflictError, SessionConflictData } from "@/hooks/use-workout-session";
import { SessionConflictDialog } from "@/components/SessionConflictDialog";

interface Exercise {
  exerciseName: string;
  equipmentType: string;
  category: string;
  movementType: string;
  workoutType: string;
  variation: string;
  weight: number | string;
  restTime: string;
  reps: number;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  equipment: string[];
  difficulty: string;
}

interface ExerciseWithWeight extends Exercise {
  selectedWeight: number;
  targetReps: number;
}

export default function StartWorkout() {
  const [, setLocation] = useLocation();
  const { startWorkout, abandonActiveSession, resumeActiveSession } = useWorkoutSession();
  const [selectedVariation, setSelectedVariation] = useState<string>("A");
  const [selectedExercises, setSelectedExercises] = useState<ExerciseWithWeight[]>([]);
  const [showAllSelected, setShowAllSelected] = useState<boolean>(false);
  const [sessionConflict, setSessionConflict] = useState<SessionConflictData | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Get workout type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const workoutType = urlParams.get('type') || '';
  
  // Fetch all exercises from the database
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Filter exercises by workout type and variation
  const filteredExercises = exercises.filter(exercise => {
    const matchesType = exercise.workoutType.toLowerCase() === workoutType.toLowerCase();
    const matchesVariation = exercise.variation === selectedVariation || 
                            exercise.variation === "A/B";  // A/B exercises work for both variations
    return matchesType && matchesVariation;
  });

  // Workout type display names
  const workoutTypeNames: { [key: string]: string } = {
    'abs': 'Abs',
    'backbiceps': 'Back & Biceps', 
    'chesttriceps': 'Chest & Triceps',
    'legs': 'Legs',
    'warmup': 'Warm-up'
  };

  const workoutName = workoutTypeNames[workoutType] || workoutType;

  const handleExerciseToggle = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.find(ex => ex.exerciseName === exercise.exerciseName);
      if (isSelected) {
        return prev.filter(ex => ex.exerciseName !== exercise.exerciseName);
      } else {
        const exerciseWithWeight: ExerciseWithWeight = {
          ...exercise,
          selectedWeight: typeof exercise.weight === 'number' ? exercise.weight : 0,
          targetReps: exercise.reps || 10
        };
        return [...prev, exerciseWithWeight];
      }
    });
  };

  const handleWeightChange = (exerciseName: string, delta: number) => {
    setSelectedExercises(prev => 
      prev.map(ex => 
        ex.exerciseName === exerciseName 
          ? { ...ex, selectedWeight: Math.max(0, ex.selectedWeight + delta) }
          : ex
      )
    );
  };

  const handleRepsChange = (exerciseName: string, reps: number) => {
    setSelectedExercises(prev => 
      prev.map(ex => 
        ex.exerciseName === exerciseName 
          ? { ...ex, targetReps: Math.max(1, reps) }
          : ex
      )
    );
  };

  const handleStartWorkout = async () => {
    if (selectedExercises.length === 0) {
      alert("Please select at least one exercise to start your workout.");
      return;
    }
    
    setIsStarting(true);
    
    try {
      // Convert selected exercises to WorkoutExercise format
      const workoutExercises: WorkoutExercise[] = selectedExercises.map((exercise, index) => ({
        id: index + 1,
        name: exercise.exerciseName,
        primaryMuscles: exercise.primaryMuscles.map(m => m.muscle),
        secondaryMuscles: exercise.secondaryMuscles.map(m => m.muscle),
        equipment: exercise.equipment,
        restTime: exercise.restTime ? parseRestTimeToSeconds(exercise.restTime) : 60,
        difficulty: exercise.difficulty,
        workoutType: exercise.workoutType
      }));

      if (process.env.NODE_ENV !== 'production') {
        console.log("🏋️ Starting workout with exercises:", workoutExercises);
      }
      
      // Start the workout session
      await startWorkout(workoutName, workoutExercises);
      
      // Navigate to live workout session
      setLocation('/workout-session');
    } catch (error) {
      if (error instanceof SessionConflictError) {
        // Show session conflict dialog
        setSessionConflict(error.conflictData);
      } else {
        console.error('Error starting workout:', error);
        alert('Failed to start workout. Please try again.');
      }
    } finally {
      setIsStarting(false);
    }
  };
  
  const handleAbandonAndStart = async () => {
    if (!sessionConflict) return;
    
    setIsStarting(true);
    try {
      await abandonActiveSession();
      setSessionConflict(null);
      // Retry starting workout
      await handleStartWorkout();
    } catch (error) {
      console.error('Error abandoning session:', error);
      alert('Failed to abandon previous session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };
  
  const handleResumeExisting = async () => {
    setIsStarting(true);
    try {
      await resumeActiveSession();
      setSessionConflict(null);
      setLocation('/workout-session');
    } catch (error) {
      console.error('Error resuming session:', error);
      alert('Failed to resume previous session. Please try again.');
      setIsStarting(false);
    }
  };
  
  const handleCancelConflict = () => {
    setSessionConflict(null);
    setIsStarting(false);
  };

  const parseRestTimeToSeconds = (restTime: string): number => {
    // Parse rest time from formats like "1:30", "2:00", "30" etc.
    if (!restTime) return 60;
    
    if (restTime.includes(':')) {
      const [mins, secs] = restTime.split(':').map(Number);
      return (mins * 60) + secs;
    }
    
    return parseInt(restTime) || 60;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workoutType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No workout type selected</h1>
          <Button onClick={() => setLocation('/workouts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/workouts')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{workoutName} Workout</h1>
              <p className="text-xl text-muted-foreground">
                Choose your exercises and start training
              </p>
            </div>
            
            {/* Variation Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Variation:</span>
              {['A', 'B'].map((variation) => (
                <Button
                  key={variation}
                  variant={selectedVariation === variation ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVariation(variation)}
                >
                  {variation}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workout Summary */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {filteredExercises.length} exercises available
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {selectedExercises.length} selected
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {selectedExercises.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowAllSelected(!showAllSelected)}
                  >
                    {showAllSelected ? 'Select More Exercises' : 'Review Selected'}
                  </Button>
                )}
                <Button 
                  onClick={handleStartWorkout}
                  disabled={selectedExercises.length === 0 || isStarting}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isStarting ? 'Starting...' : `Start Workout (${selectedExercises.length})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content - either exercise selection or selected exercises */}
        {showAllSelected ? (
          /* Selected Exercises with Weight Controls */
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Your Selected Exercises ({selectedExercises.length})</h2>
            {selectedExercises.map((exercise, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{exercise.exerciseName}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {exercise.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exercise.equipmentType}
                      </Badge>
                      {exercise.restTime && (
                        <Badge variant="outline" className="text-xs">
                          Rest: {exercise.restTime}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExerciseToggle(exercise)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Weight Control */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Weight (lbs)</label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleWeightChange(exercise.exerciseName, -5)}
                        disabled={exercise.selectedWeight <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input 
                        type="number" 
                        value={exercise.selectedWeight}
                        onChange={(e) => {
                          const weight = parseInt(e.target.value) || 0;
                          setSelectedExercises(prev => 
                            prev.map(ex => 
                              ex.exerciseName === exercise.exerciseName 
                                ? { ...ex, selectedWeight: weight }
                                : ex
                            )
                          );
                        }}
                        className="w-20 text-center"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleWeightChange(exercise.exerciseName, 5)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Target Reps */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Reps</label>
                    <Input 
                      type="number" 
                      value={exercise.targetReps}
                      onChange={(e) => handleRepsChange(exercise.exerciseName, parseInt(e.target.value) || 1)}
                      className="w-20"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Primary Muscles */}
                  <div>
                    <p className="text-sm font-medium mb-2">Primary Muscles</p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.primaryMuscles.slice(0, 3).map((muscle, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {muscle.muscle} ({muscle.percentage}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Exercise Selection Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise, index) => {
              const isSelected = selectedExercises.find(ex => ex.exerciseName === exercise.exerciseName);
              
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleExerciseToggle(exercise)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{exercise.exerciseName}</span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {exercise.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Variation {exercise.variation}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Equipment */}
                      <div>
                        <p className="text-sm font-medium mb-1">Equipment:</p>
                        <p className="text-sm text-muted-foreground">{exercise.equipmentType}</p>
                      </div>
                      
                      {/* Primary Muscles */}
                      <div>
                        <p className="text-sm font-medium mb-1">Primary Muscles:</p>
                        <div className="flex flex-wrap gap-1">
                          {exercise.primaryMuscles.slice(0, 2).map((muscle, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {muscle.muscle}
                            </Badge>
                          ))}
                          {exercise.primaryMuscles.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{exercise.primaryMuscles.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Rest Time */}
                      {exercise.restTime && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Rest: {exercise.restTime}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">
              No exercises found for {workoutName} Variation {selectedVariation}
            </h3>
            <p className="text-muted-foreground mb-4">
              Try selecting a different variation or go back to choose another workout type.
            </p>
            <Button onClick={() => setLocation('/workouts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workouts
            </Button>
          </div>
        )}
      </div>
      
      {/* Session Conflict Dialog */}
      {sessionConflict && (
        <SessionConflictDialog
          open={!!sessionConflict}
          conflictData={sessionConflict}
          onAbandonAndStart={handleAbandonAndStart}
          onResumeExisting={handleResumeExisting}
          onCancel={handleCancelConflict}
          loading={isStarting}
        />
      )}
    </div>
  );
}