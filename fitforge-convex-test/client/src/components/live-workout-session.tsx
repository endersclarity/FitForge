import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Square, 
  Timer, 
  Target, 
  Check,
  ChevronRight,
  Trophy,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutSession } from "@/hooks/use-workout-session";

export function LiveWorkoutSession() {
  console.log('🏋️ LiveWorkoutSession component loading...');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { 
    session, 
    logSet, 
    completeExercise, 
    nextExercise, 
    endWorkout,
    calculateSessionStats 
  } = useWorkoutSession();
  
  const [currentSets, setCurrentSets] = useState<{ [exerciseIndex: number]: { weight: number, reps: number, equipment: string } }>({});
  
  // Equipment options from your database
  const equipmentOptions = [
    "Bodyweight", "Dumbbell", "Kettlebell", "Barbell", "TRX", 
    "Cable", "Pull-up Bar", "Bench", "Plybox", "Countertop", "OYA"
  ];
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Redirect if no active session (with delay to allow session creation)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!session) {
        console.log("⚠️ NO SESSION FOUND - REDIRECTING TO WORKOUTS");
        setLocation("/workouts");
      }
    }, 1000); // Give 1 second for session to be created
    
    return () => clearTimeout(timeout);
  }, [session, setLocation]);

  // Session timer
  useEffect(() => {
    if (session?.status === "in_progress") {
      const interval = setInterval(() => {
        setSessionDuration(Date.now() - session.startTime.getTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.status, session?.startTime]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            toast({
              title: "Rest Complete!",
              description: "Ready for your next set",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isResting, restTimer, toast]);

  // Remove the old handleLogSet function since we're now using individual exercise logging

  const handleCompleteExercise = () => {
    if (!session) return;

    completeExercise();
    
    if (session.currentExerciseIndex < session.exercises.length - 1) {
      nextExercise();
      toast({
        title: "Exercise Complete!",
        description: "Moving to next exercise",
      });
    } else {
      endWorkout();
      toast({
        title: "Workout Complete! 🎉",
        description: "Outstanding work!",
      });
    }

    setIsResting(false);
    setRestTimer(0);
  };

  const getRestTimeForExercise = (exerciseName: string): number => {
    // Map exercise names to rest times based on Ender's data
    const restTimes: Record<string, number> = {
      "Planks": 30,
      "Spider Planks": 60,
      "Bench Situps": 90,
      "Hanging Knee Raises": 120,
      "Shoulder Shrugs": 150,
      "T Row": 180,
      "Incline Hammer Curl": 210,
      "Neutral Grip Pull-ups": 240,
      "Bent Over Rows": 270,
      "Bench Press": 540,
      "TRX Reverse Flys": 570,
      "Tricep Extension": 600,
      "TRX Pushup": 90,
      "Incline Bench Press": 120,
      "Shoulder Press": 150,
      "Dips": 180,
      "Goblet Squats": 90,
      "Dead Lifts": 120,
      "Calf Raises": 60,
      "Glute Bridges": 90,
      "Kettlebell Swings": 120
    };
    return restTimes[exerciseName] || 60;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkoutDisplayName = (workoutType: string) => {
    const names: Record<string, string> = {
      "Abs": "Ender's Core Workout",
      "BackBiceps": "Ender's Pull Day",
      "ChestTriceps": "Ender's Push Day", 
      "Legs": "Ender's Leg Day"
    };
    return names[workoutType] || workoutType;
  };

  const getDifficultyFromExercise = (exerciseName: string): string => {
    const difficulties: Record<string, string> = {
      "Planks": "Beginner",
      "Spider Planks": "Intermediate",
      "Bench Situps": "Intermediate",
      "Hanging Knee Raises": "Intermediate",
      "Shoulder Shrugs": "Beginner",
      "T Row": "Intermediate",
      "Incline Hammer Curl": "Beginner",
      "Neutral Grip Pull-ups": "Intermediate",
      "Bent Over Rows": "Intermediate",
      "Bench Press": "Intermediate",
      "TRX Reverse Flys": "Intermediate",
      "Tricep Extension": "Beginner",
      "TRX Pushup": "Intermediate",
      "Incline Bench Press": "Intermediate",
      "Shoulder Press": "Intermediate",
      "Dips": "Intermediate",
      "Goblet Squats": "Beginner",
      "Dead Lifts": "Advanced",
      "Calf Raises": "Beginner",
      "Glute Bridges": "Beginner",
      "Kettlebell Swings": "Intermediate"
    };
    return difficulties[exerciseName] || "Intermediate";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">No active workout session found.</p>
            <Button onClick={() => setLocation("/workouts")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const progress = ((session.currentExerciseIndex) / session.exercises.length) * 100;
  const stats = calculateSessionStats();

  if (session.status === "completed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle className="text-2xl">Workout Complete!</CardTitle>
            <p className="text-muted-foreground">Outstanding work! 💪</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.totalVolume}</div>
                <div className="text-sm text-muted-foreground">Total Volume (lbs)</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-accent">{stats.estimatedCalories}</div>
                <div className="text-sm text-muted-foreground">Calories Burned</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-secondary">{formatTime(stats.duration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{stats.totalSets}</div>
                <div className="text-sm text-muted-foreground">Total Sets</div>
              </div>
            </div>
            <Button onClick={() => setLocation("/workouts")} className="w-full">
              Back to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{getWorkoutDisplayName(session.workoutType)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {session.exercises.length} exercises • Work at your own pace
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold">{formatTime(sessionDuration)}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <Button 
                  onClick={() => endWorkout()}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Workout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* All Exercises Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {session.exercises.map((exercise, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{exercise.exerciseName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={exercise.completed ? "default" : "secondary"} className="text-xs">
                      {exercise.completed ? "Complete" : `${exercise.sets.length} sets`}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary text-xs">
                      {getDifficultyFromExercise(exercise.exerciseName)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Set Logging */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Log Set #{exercise.sets.length + 1}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={currentSets[index]?.weight || ""}
                        onChange={(e) => setCurrentSets(prev => ({ 
                          ...prev, 
                          [index]: { ...prev[index], weight: Number(e.target.value) } 
                        }))}
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        value={currentSets[index]?.reps || ""}
                        onChange={(e) => setCurrentSets(prev => ({ 
                          ...prev, 
                          [index]: { ...prev[index], reps: Number(e.target.value) } 
                        }))}
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Equipment</Label>
                    <Select 
                      value={currentSets[index]?.equipment || ""}
                      onValueChange={(value) => setCurrentSets(prev => ({ 
                        ...prev, 
                        [index]: { ...prev[index], equipment: value } 
                      }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentOptions.map((equipment) => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(currentSets[index]?.weight || 0) > 0 && (currentSets[index]?.reps || 0) > 0 && (
                    <div className="p-2 bg-muted/30 rounded text-xs">
                      Volume: {(currentSets[index]?.weight || 0) * (currentSets[index]?.reps || 0)} lbs
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      const currentSet = currentSets[index];
                      if (!currentSet || currentSet.reps <= 0) return;
                      
                      // Temporarily set the session's current exercise index to this exercise
                      const originalIndex = session.currentExerciseIndex;
                      session.currentExerciseIndex = index;
                      
                      // Use the existing logSet function with selected equipment
                      logSet(currentSet.weight, currentSet.reps, currentSet.equipment || "Bodyweight");
                      
                      // Restore the original index (though it doesn't really matter now)
                      session.currentExerciseIndex = originalIndex;
                      
                      // Clear this exercise's input
                      setCurrentSets(prev => ({ 
                        ...prev, 
                        [index]: { weight: 0, reps: 0, equipment: currentSet.equipment || "Bodyweight" } 
                      }));

                      toast({
                        title: "Set Logged!",
                        description: `${exercise.exerciseName}: ${currentSet.reps} reps @ ${currentSet.weight}lbs (${currentSet.equipment})`,
                      });
                    }} 
                    disabled={(currentSets[index]?.reps || 0) <= 0 || !(currentSets[index]?.equipment)}
                    className="w-full"
                    size="sm"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Log Set
                  </Button>
                </div>

                {/* Previous Sets */}
                {exercise.sets.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-xs">Previous Sets</h5>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex justify-between items-center p-1 bg-muted/20 rounded text-xs">
                          <span>Set {set.setNumber}: {set.reps} @ {set.weight}lbs</span>
                          <span className="text-muted-foreground">{set.volume}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise Controls */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const updatedSession = { ...session };
                      updatedSession.exercises[index].completed = !exercise.completed;
                      // Note: This is a simplified update - in reality you'd use the context methods
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {exercise.completed ? "Reopen" : "Mark Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{session.totalVolume}</div>
                <div className="text-xs text-muted-foreground">Total Volume (lbs)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">{session.estimatedCalories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">
                  {session.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Sets</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-500">
                  {session.exercises.filter(ex => ex.completed).length} / {session.exercises.length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}