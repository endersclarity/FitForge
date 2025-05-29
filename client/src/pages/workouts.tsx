import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Play, Search, Dumbbell, Filter, ArrowLeft } from "lucide-react";
import { useWorkoutSessionV2, WorkoutSessionProvider } from "@/hooks/use-workout-session-v2";
import { WorkoutSession } from "@/components/workout/WorkoutSession";

interface Exercise {
  exerciseName: string;
  equipmentType: string;
  category: string;
  movementType: string;
  workoutType: string;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  equipment: string[];
  difficulty: string;
}

function WorkoutsContent() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const { addExercise, session, isWorkoutActive } = useWorkoutSessionV2();

  // Fetch all exercises from the database
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscles.some(m => m.muscle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || exercise.workoutType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique workout types for filtering
  const workoutTypes = ["all", ...Array.from(new Set(exercises.map(ex => ex.workoutType)))];

  const handleSelectExercise = (exercise: Exercise) => {
    // Check if exercise is already added to avoid duplicates
    const isAlreadyAdded = session.exercises.find(ex => ex.exerciseName === exercise.exerciseName);
    if (!isAlreadyAdded) {
      addExercise(exercise);
    }
  };

  // If workout is active or user is selecting exercises, show the workout session interface
  if (isWorkoutActive || showExerciseSelection) {
    return (
      <WorkoutSession 
        onSelectExercises={() => setShowExerciseSelection(true)}
      />
    );
  }

  // Default view - exercise selection
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Select Your Exercises</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose from {exercises.length} exercises to build your workout
          </p>
          <Button 
            onClick={() => setShowExerciseSelection(true)}
            size="lg" 
            className="gradient-bg text-white font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Selecting Exercises
          </Button>
        </div>
      </section>

      {/* Exercise Library */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Dumbbell className="w-5 h-5 mr-2" />
              Exercise Library ({exercises.length} exercises)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.slice(0, 6).map((exercise, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h4 className="font-semibold">{exercise.exerciseName}</h4>
                  <p className="text-sm text-muted-foreground">{exercise.category} • {exercise.difficulty}</p>
                  <div className="flex gap-1 mt-2">
                    {exercise.primaryMuscles.slice(0, 2).map((muscle, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {muscle.muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-4">
              ...and {exercises.length - 6} more exercises available
            </p>
            <div className="text-center mt-6">
              <Button onClick={() => setShowExerciseSelection(true)}>
                Browse All Exercises
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Workouts() {
  return (
    <WorkoutSessionProvider>
      <WorkoutsContent />
    </WorkoutSessionProvider>
  );
}