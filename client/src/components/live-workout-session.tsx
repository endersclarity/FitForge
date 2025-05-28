import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  
  const [currentSet, setCurrentSet] = useState({ weight: 0, reps: 0 });
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

  const handleLogSet = () => {
    if (!session || currentSet.reps <= 0) return;

    const currentExercise = session.exercises[session.currentExerciseIndex];
    
    logSet(currentSet.weight, currentSet.reps, "Default Equipment");
    setCurrentSet({ weight: 0, reps: 0 });

    // Start rest timer based on exercise
    const restTime = getRestTimeForExercise(currentExercise.exerciseName);
    if (restTime > 0) {
      setRestTimer(restTime);
      setIsResting(true);
    }

    toast({
      title: "Set Logged!",
      description: `${currentSet.reps} reps @ ${currentSet.weight}lbs - Volume: ${currentSet.weight * currentSet.reps}`,
    });
  };

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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{getWorkoutDisplayName(session.workoutType)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Exercise {session.currentExerciseIndex + 1} of {session.exercises.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatTime(sessionDuration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{currentExercise.exerciseName}</CardTitle>
              <Badge className="bg-primary/10 text-primary">
                {getDifficultyFromExercise(currentExercise.exerciseName)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Set Logging */}
            <div className="space-y-4">
              <h3 className="font-semibold">Log Set #{currentExercise.sets.length + 1}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={currentSet.weight || ""}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    value={currentSet.reps || ""}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, reps: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {currentSet.weight > 0 && currentSet.reps > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium">Set Volume: {currentSet.weight * currentSet.reps} lbs</div>
                  <div className="text-sm text-muted-foreground">
                    Est. Calories: {Math.round(currentSet.weight * currentSet.reps * 0.1)}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleLogSet} 
                disabled={currentSet.reps <= 0 || isResting}
                className="w-full gradient-bg"
              >
                <Check className="w-4 h-4 mr-2" />
                Log Set
              </Button>
            </div>

            {/* Rest Timer */}
            {isResting && (
              <Card className="bg-accent/10 border-accent">
                <CardContent className="p-4 text-center">
                  <Timer className="w-8 h-8 mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold text-accent">{restTimer}s</div>
                  <div className="text-sm text-muted-foreground">Rest Time Remaining</div>
                </CardContent>
              </Card>
            )}

            {/* Previous Sets */}
            {currentExercise.sets.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Previous Sets</h4>
                <div className="space-y-2">
                  {currentExercise.sets.map((set, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-sm">
                        Set {set.setNumber}: {set.reps} reps @ {set.weight}lbs
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Vol: {set.volume}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise Controls */}
            <div className="flex gap-3">
              <Button 
                onClick={handleCompleteExercise}
                disabled={currentExercise.sets.length === 0}
                className="flex-1"
                variant="outline"
              >
                {session.currentExerciseIndex === session.exercises.length - 1 ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Finish Workout
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Next Exercise
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{session.totalVolume}</div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">{session.estimatedCalories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">
                  {session.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Sets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}