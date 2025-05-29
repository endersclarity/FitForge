import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Play, Search, Dumbbell, Filter } from "lucide-react";

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

export default function Workouts() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

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

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!selectedExercises.find(ex => ex.exerciseName === exercise.exerciseName)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleFinishWorkout = () => {
    // For now, just reset - we'll add actual logging later
    setWorkoutStarted(false);
    setSelectedExercises([]);
    alert(`Workout complete! You selected ${selectedExercises.length} exercises.`);
  };

  if (!workoutStarted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Ready to Work Out?</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose from {exercises.length} exercises and start tracking your progress
            </p>
            <Button 
              onClick={handleStartWorkout}
              size="lg" 
              className="gradient-bg text-white font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Workout
            </Button>
          </div>
        </section>

        {/* Exercise Preview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                Exercise Library Preview
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Workout Started - Exercise Selection Mode
  return (
    <div className="min-h-screen bg-background">
      {/* Workout Header */}
      <section className="bg-gradient-to-r from-green-500/10 to-blue-500/10 py-6 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Workout in Progress</h1>
              <p className="text-muted-foreground">Selected {selectedExercises.length} exercises</p>
            </div>
            <Button 
              onClick={handleFinishWorkout}
              variant="outline"
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Finish Workout
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises or muscles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {workoutTypes.map(type => (
              <Button
                key={type}
                variant={selectedCategory === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(type)}
              >
                {type === "all" ? "All" : type}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Exercises */}
        {selectedExercises.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selected Exercises ({selectedExercises.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {selectedExercises.map((exercise, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="font-medium">{exercise.exerciseName}</span>
                    <Badge variant="secondary">{exercise.difficulty}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Exercise Library ({filteredExercises.length} exercises)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading exercises...</p>
            ) : (
              <div className="grid gap-3">
                {filteredExercises.map((exercise, index) => {
                  const isSelected = selectedExercises.find(ex => ex.exerciseName === exercise.exerciseName);
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{exercise.exerciseName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exercise.category} • {exercise.difficulty} • {exercise.equipment.join(", ")}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {exercise.primaryMuscles.map((muscle, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {muscle.muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge className="bg-green-500 text-white">Selected</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}