import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Clock, Flame, Dumbbell, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useWorkoutSession, WorkoutExercise } from "@/hooks/use-workout-session";
import { useToast } from "@/hooks/use-toast";
import { Workout } from "@shared/schema";

export function WorkoutLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  
  const [, setLocation] = useLocation();
  const { startWorkout } = useWorkoutSession();

  // DEBUG: Test basic click functionality
  const testClick = () => {
    alert("🔥 DEBUG: Basic click functionality WORKS!");
    console.log("🔥 DEBUG: Basic click test successful");
  };
  const { toast } = useToast();

  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  // Debug logging to see what we're getting
  console.log("🎯 WORKOUT LIBRARY DEBUG:");
  console.log("🎯 isLoading:", isLoading);
  console.log("🎯 workouts array:", workouts);
  console.log("🎯 workouts length:", workouts.length);
  console.log("🎯 first workout:", workouts[0]);

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workout.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === "all" || workout.difficulty === selectedLevel;
    
    const matchesDuration = selectedDuration === "all" || 
      (selectedDuration === "15-30" && workout.duration >= 15 && workout.duration <= 30) ||
      (selectedDuration === "30-45" && workout.duration >= 30 && workout.duration <= 45) ||
      (selectedDuration === "45+" && workout.duration >= 45);

    return matchesSearch && matchesLevel && matchesDuration;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-accent/10 text-accent";
      case "intermediate":
        return "bg-primary/10 text-primary";
      case "advanced":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const convertWorkoutToExercises = (workout: Workout): WorkoutExercise[] => {
    console.log("🔄 CONVERTING WORKOUT:", workout);
    
    if (!workout.exercises || !Array.isArray(workout.exercises) || workout.exercises.length === 0) {
      console.error("❌ NO EXERCISES TO CONVERT");
      return [];
    }
    
    const converted = workout.exercises.map((ex: any, index: number) => {
      console.log(`🔄 CONVERTING EXERCISE ${index + 1}:`, ex);
      
      const exercise = {
        id: index + 1,
        name: ex.name || "Unknown Exercise",
        primaryMuscles: ex.primaryMuscles ? ex.primaryMuscles.split(", ") : [],
        secondaryMuscles: [],
        equipment: [ex.equipment || "Unknown"],
        restTime: getRestTimeForExercise(ex.name || ""),
        difficulty: workout.difficulty || "intermediate",
        workoutType: workout.category || "strength"
      };
      
      console.log(`✅ CONVERTED EXERCISE ${index + 1}:`, exercise);
      return exercise;
    });
    
    console.log("✅ ALL EXERCISES CONVERTED:", converted);
    return converted;
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
    return restTimes[exerciseName] || 90; // Default to 90 seconds
  };

  const handleStartWorkout = (workout: Workout) => {
    console.log("🔥🔥🔥 BUTTON CLICKED - STARTING WORKOUT:", workout.name);
    console.log("🔥 WORKOUT OBJECT:", JSON.stringify(workout, null, 2));
    console.log("🔥 RAW EXERCISES:", workout.exercises);
    
    // Check if we have authentication/session
    console.log("🔥 CHECKING AUTH/SESSION STATE...");
    console.log("🔥 startWorkout function exists:", typeof startWorkout);
    console.log("🔥 setLocation function exists:", typeof setLocation);
    
    if (!workout.exercises || !Array.isArray(workout.exercises) || workout.exercises.length === 0) {
      console.error("❌ NO EXERCISES IN WORKOUT!");
      toast({
        title: "Error",
        description: "This workout has no exercises configured",
        variant: "destructive"
      });
      return;
    }
    
    const exercises = convertWorkoutToExercises(workout);
    console.log("🔥 CONVERTED EXERCISES:", exercises);
    
    if (exercises.length === 0) {
      console.error("❌ CONVERSION FAILED!");
      toast({
        title: "Error",
        description: "Failed to convert workout exercises",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🔥 CALLING startWorkout WITH:", { name: workout.name, exercises });
    
    try {
      const result = startWorkout(workout.name, exercises);
      console.log("🔥 startWorkout RESULT:", result);
      console.log("🔥 WORKOUT SESSION STARTED, WAITING BEFORE NAVIGATION...");
      
      // Small delay to ensure session is properly set
      setTimeout(() => {
        console.log("🔥 NAVIGATING TO /workout-session");
        console.log("🔥 BEFORE setLocation - current location:", window.location.href);
        setLocation("/workout-session");
        console.log("🔥 AFTER setLocation call");
        
        // Double check navigation after a moment
        setTimeout(() => {
          console.log("🔥 POST-NAVIGATION CHECK - current location:", window.location.href);
        }, 200);
      }, 100);
      
      toast({
        title: "🔥 Workout Started!",
        description: `${workout.name} with ${exercises.length} exercises`,
      });
    } catch (error) {
      console.error("❌ START WORKOUT FAILED:", error);
      console.error("❌ ERROR STACK:", error instanceof Error ? error.stack : "No stack trace");
      toast({
        title: "Error", 
        description: "Failed to start workout session",
        variant: "destructive"
      });
    }
  };
  
  const handleSelectExerciseStart = (workout: Workout) => {
    // For now, just start the workout - we'll add exercise selection later
    handleStartWorkout(workout);
  };

  if (isLoading) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Discover Your Perfect Workout</h2>
            <p className="text-xl text-muted-foreground">AI-curated exercises tailored to your goals and equipment</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="w-full h-48 bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded animate-pulse mb-4" />
                  <div className="h-3 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Discover Your Perfect Workout</h2>
          <p className="text-xl text-muted-foreground">AI-curated exercises tailored to your goals and equipment</p>
          
          {/* CRITICAL DEBUG TEST */}
          <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 rounded">
            <Button 
              onClick={testClick}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              🚨 CLICK TEST - BASIC FUNCTIONALITY
            </Button>
          </div>
        </div>

        {/* DEBUG TEST BUTTON */}
        <Card className="p-6 mb-4 bg-red-100 border-red-300">
          <h3 className="font-bold text-red-800 mb-2">🚨 DEBUG TEST SECTION</h3>
          <p className="text-sm text-red-700 mb-4">Testing if JavaScript onClick handlers work at all:</p>
          <Button 
            onClick={() => {
              console.log("🧪 TEST BUTTON CLICKED - JAVASCRIPT IS WORKING!");
              alert("JavaScript onClick works! Problem is elsewhere.");
            }}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            TEST: Click Me (Should Show Alert)
          </Button>
          <p className="text-xs text-red-600 mt-2">
            Workouts found: {workouts.length} | Loading: {isLoading ? 'YES' : 'NO'}
          </p>
        </Card>

        {/* Search and Filter Bar */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search workouts, exercises, muscle groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Any Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Duration</SelectItem>
                  <SelectItem value="15-30">15-30 min</SelectItem>
                  <SelectItem value="30-45">30-45 min</SelectItem>
                  <SelectItem value="45+">45+ min</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gradient-bg">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </Card>

        {/* Workout Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWorkouts.map((workout) => (
            <Card key={workout.id} className="overflow-hidden card-hover">
              <img
                src={workout.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"}
                alt={workout.name}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{workout.name}</h3>
                  <Badge className={getDifficultyColor(workout.difficulty)}>
                    {capitalizeFirst(workout.difficulty)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {workout.description}
                </p>
                
                {/* SHOW ALL EXERCISES IN WORKOUT */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-sm">Exercises ({Array.isArray(workout.exercises) ? workout.exercises.length : 0}):</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Array.isArray(workout.exercises) && workout.exercises.map((exercise: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground flex justify-between items-center py-1 px-2 bg-muted/20 rounded">
                        <span className="font-medium">{exercise.name}</span>
                        <div className="flex gap-2 text-xs">
                          <span>{exercise.sets}x{exercise.reps}</span>
                          <span className="text-orange-500">{exercise.variation}</span>
                        </div>
                      </div>
                    )) || <p className="text-xs text-muted-foreground">No exercises found</p>}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {workout.duration} min
                    </span>
                    <span className="flex items-center">
                      <Flame className="w-4 h-4 mr-1" />
                      {workout.calories} cal
                    </span>
                    <span className="flex items-center">
                      <Dumbbell className="w-4 h-4 mr-1" />
                      {workout.equipment?.length ? "Equipment" : "Bodyweight"}
                    </span>
                  </div>
                </div>
                
                {/* EXERCISE SELECTION */}
                <div className="mb-4">
                  <Button 
                    onClick={(e) => {
                      console.log("🚨🚨🚨 BUTTON CLICK EVENT FIRED!");
                      console.log("🚨 Event object:", e);
                      console.log("🚨 Event target:", e.target);
                      console.log("🚨 Current target:", e.currentTarget);
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("🔥 BUTTON CLICKED FOR WORKOUT:", workout.id, workout.name);
                      console.log("🔥 About to call handleStartWorkout...");
                      handleStartWorkout(workout);
                      console.log("🔥 handleStartWorkout call completed");
                    }}
                    className="w-full gradient-bg mb-2"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Full Workout ({Array.isArray(workout.exercises) ? workout.exercises.length : 0} exercises)
                  </Button>
                  <Button 
                    onClick={(e) => {
                      console.log("🚨🚨🚨 SELECT EXERCISE BUTTON CLICK EVENT FIRED!");
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("🔥 SELECT EXERCISE CLICKED FOR:", workout.name);
                      handleSelectExerciseStart(workout);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Choose Starting Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWorkouts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No workouts found matching your criteria.</p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedLevel("all");
                setSelectedDuration("all");
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* View All Button */}
        {filteredWorkouts.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="btn-secondary">
              View All Workouts
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
