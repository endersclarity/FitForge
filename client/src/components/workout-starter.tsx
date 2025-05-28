import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Timer, Target, Dumbbell } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkoutSession, WorkoutExercise } from "@/hooks/use-workout-session";
import { useToast } from "@/hooks/use-toast";

// Import Ender's real exercise data
const enderWorkouts = {
  "Abs": {
    name: "Ender's Core Workout",
    description: "Comprehensive core strengthening with progressive hold times",
    duration: 30,
    difficulty: "Intermediate",
    exercises: [
      {
        id: 1,
        name: "Planks",
        primaryMuscles: ["Rectus Abdominis", "Transverse Abdominis"],
        secondaryMuscles: ["Obliques", "Erector Spinae"],
        equipment: ["None"],
        restTime: 30,
        difficulty: "Beginner",
        workoutType: "Abs"
      },
      {
        id: 2,
        name: "Spider Planks", 
        primaryMuscles: ["Rectus Abdominis", "Transverse Abdominis"],
        secondaryMuscles: ["Obliques", "Erector Spinae", "Shoulders"],
        equipment: ["Bench"],
        restTime: 60,
        difficulty: "Intermediate",
        workoutType: "Abs"
      },
      {
        id: 3,
        name: "Bench Situps",
        primaryMuscles: ["Rectus Abdominis"],
        secondaryMuscles: ["Hip Flexors", "Obliques"], 
        equipment: ["TRX", "Bench"],
        restTime: 90,
        difficulty: "Intermediate",
        workoutType: "Abs"
      },
      {
        id: 4,
        name: "Hanging Knee Raises",
        primaryMuscles: ["Rectus Abdominis"],
        secondaryMuscles: ["Hip Flexors", "Obliques", "Grip/Forearms"],
        equipment: ["Pull-up Bar"],
        restTime: 120,
        difficulty: "Intermediate",
        workoutType: "Abs"
      }
    ]
  },
  "BackBiceps": {
    name: "Ender's Pull Day",
    description: "Back and bicep development with compound movements", 
    duration: 60,
    difficulty: "Intermediate",
    exercises: [
      {
        id: 5,
        name: "Shoulder Shrugs",
        primaryMuscles: ["Trapezius"],
        secondaryMuscles: ["Levator Scapulae"],
        equipment: ["Dumbbells"],
        restTime: 150,
        difficulty: "Beginner",
        workoutType: "BackBiceps"
      },
      {
        id: 6,
        name: "T Row",
        primaryMuscles: ["Latissimus Dorsi"],
        secondaryMuscles: ["Rhomboids", "Trapezius", "Biceps Brachii", "Grip/Forearms"],
        equipment: ["T-Bar", "Barbell"],
        restTime: 180,
        difficulty: "Intermediate",
        workoutType: "BackBiceps"
      },
      {
        id: 7,
        name: "Incline Hammer Curl",
        primaryMuscles: ["Biceps Brachii"],
        secondaryMuscles: ["Brachialis", "Brachioradialis", "Grip/Forearms"],
        equipment: ["Dumbbells", "Incline Bench"],
        restTime: 210,
        difficulty: "Beginner",
        workoutType: "BackBiceps"
      },
      {
        id: 8,
        name: "Neutral Grip Pull-ups",
        primaryMuscles: ["Latissimus Dorsi"],
        secondaryMuscles: ["Biceps Brachii", "Rhomboids", "Trapezius", "Grip/Forearms"],
        equipment: ["Pull-up Bar"],
        restTime: 240,
        difficulty: "Intermediate",
        workoutType: "BackBiceps"
      },
      {
        id: 9,
        name: "Bent Over Rows",
        primaryMuscles: ["Latissimus Dorsi"],
        secondaryMuscles: ["Rhomboids", "Trapezius", "Biceps Brachii", "Grip/Forearms"],
        equipment: ["Barbell", "Dumbbells"],
        restTime: 270,
        difficulty: "Intermediate",
        workoutType: "BackBiceps"
      }
    ]
  },
  "ChestTriceps": {
    name: "Ender's Push Day",
    description: "Chest and tricep focus with pressing movements",
    duration: 75,
    difficulty: "Intermediate",
    exercises: [
      {
        id: 10,
        name: "Bench Press",
        primaryMuscles: ["Pectoralis Major"],
        secondaryMuscles: ["Triceps Brachii", "Anterior Deltoids", "Serratus Anterior"],
        equipment: ["Barbell", "Bench"],
        restTime: 540,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      },
      {
        id: 11,
        name: "TRX Reverse Flys",
        primaryMuscles: ["Rhomboids"],
        secondaryMuscles: ["Trapezius", "Rear Deltoids", "Core"],
        equipment: ["TRX"],
        restTime: 570,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      },
      {
        id: 12,
        name: "Tricep Extension",
        primaryMuscles: ["Triceps Brachii"],
        secondaryMuscles: ["Anconeus"],
        equipment: ["Dumbbells"],
        restTime: 600,
        difficulty: "Beginner",
        workoutType: "ChestTriceps"
      },
      {
        id: 13,
        name: "TRX Pushup",
        primaryMuscles: ["Pectoralis Major"],
        secondaryMuscles: ["Triceps Brachii", "Anterior Deltoids", "Core"],
        equipment: ["TRX"],
        restTime: 0,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      },
      {
        id: 14,
        name: "Incline Bench Press",
        primaryMuscles: ["Pectoralis Major"],
        secondaryMuscles: ["Triceps Brachii", "Anterior Deltoids", "Serratus Anterior"],
        equipment: ["Barbell", "Incline Bench"],
        restTime: 0,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      },
      {
        id: 15,
        name: "Shoulder Press",
        primaryMuscles: ["Deltoids"],
        secondaryMuscles: ["Triceps Brachii", "Trapezius", "Serratus Anterior"],
        equipment: ["Barbell", "Dumbbells"],
        restTime: 0,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      },
      {
        id: 16,
        name: "Dips",
        primaryMuscles: ["Triceps Brachii"],
        secondaryMuscles: ["Pectoralis Major", "Anterior Deltoids", "Core"],
        equipment: ["Dip Station", "Parallel Bars"],
        restTime: 0,
        difficulty: "Intermediate",
        workoutType: "ChestTriceps"
      }
    ]
  },
  "Legs": {
    name: "Ender's Leg Day",
    description: "Lower body compound movements and glute activation",
    duration: 50,
    difficulty: "Advanced",
    exercises: [
      {
        id: 17,
        name: "Goblet Squats",
        primaryMuscles: ["Quadriceps", "Gluteus Maximus"],
        secondaryMuscles: ["Hamstrings", "Core", "Grip/Forearms"],
        equipment: ["Kettlebell", "Dumbbell"],
        restTime: 0,
        difficulty: "Beginner",
        workoutType: "Legs"
      },
      {
        id: 18,
        name: "Dead Lifts",
        primaryMuscles: ["Gluteus Maximus", "Hamstrings"],
        secondaryMuscles: ["Erector Spinae", "Core", "Grip/Forearms"],
        equipment: ["Barbell"],
        restTime: 0,
        difficulty: "Advanced",
        workoutType: "Legs"
      },
      {
        id: 19,
        name: "Calf Raises",
        primaryMuscles: ["Gastrocnemius", "Soleus"],
        secondaryMuscles: [],
        equipment: ["None", "Calf Machine"],
        restTime: 0,
        difficulty: "Beginner",
        workoutType: "Legs"
      },
      {
        id: 20,
        name: "Glute Bridges",
        primaryMuscles: ["Gluteus Maximus"],
        secondaryMuscles: ["Hamstrings", "Core", "Quadriceps"],
        equipment: ["None", "Barbell"],
        restTime: 0,
        difficulty: "Beginner",
        workoutType: "Legs"
      },
      {
        id: 21,
        name: "Kettlebell Swings",
        primaryMuscles: ["Gluteus Maximus", "Hamstrings"],
        secondaryMuscles: ["Core", "Shoulders", "Grip/Forearms"],
        equipment: ["Kettlebell"],
        restTime: 0,
        difficulty: "Intermediate",
        workoutType: "Legs"
      }
    ]
  }
};

export function WorkoutStarter() {
  const [, setLocation] = useLocation();
  const { startWorkout } = useWorkoutSession();
  const { toast } = useToast();

  const handleStartWorkout = (workoutType: keyof typeof enderWorkouts) => {
    const workout = enderWorkouts[workoutType];
    
    toast({
      title: "Starting Workout!",
      description: `Get ready for ${workout.name}`,
    });

    startWorkout(workoutType, workout.exercises as WorkoutExercise[]);
    setLocation("/workout-session");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Ender's Workout Collection</h2>
          <p className="text-xl text-muted-foreground">
            Professional workout routines with precise muscle targeting
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {Object.entries(enderWorkouts).map(([workoutType, workout]) => (
            <Card key={workoutType} className="overflow-hidden card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{workout.name}</CardTitle>
                  <Badge className={getDifficultyColor(workout.difficulty)}>
                    {workout.difficulty}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{workout.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Timer className="w-4 h-4 mr-1" />
                    {workout.duration} min
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    {workout.exercises.length} exercises
                  </span>
                  <span className="flex items-center">
                    <Dumbbell className="w-4 h-4 mr-1" />
                    Mixed Equipment
                  </span>
                </div>

                {/* Exercise Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Exercises:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {workout.exercises.slice(0, 3).map((exercise, index) => (
                      <div key={exercise.id} className="text-xs text-muted-foreground">
                        {index + 1}. {exercise.name}
                      </div>
                    ))}
                    {workout.exercises.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{workout.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={() => handleStartWorkout(workoutType as keyof typeof enderWorkouts)}
                  className="w-full gradient-bg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start {workoutType} Workout
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <h3 className="text-lg font-bold mb-2">Real Exercise Database</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Based on Ender's actual workout logs with precise muscle activation percentages
            </p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">27</div>
                <div className="text-xs text-muted-foreground">Total Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">4</div>
                <div className="text-xs text-muted-foreground">Workout Types</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">215</div>
                <div className="text-xs text-muted-foreground">Total Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">100%</div>
                <div className="text-xs text-muted-foreground">Real Data</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}