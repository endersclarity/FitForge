import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Dumbbell, Target, ChevronRight, Activity } from "lucide-react";
import { workoutService } from "@/services/supabase-workout-service";
import type { Exercise } from "@/lib/supabase";

interface ExerciseWithDetails {
  id: string;
  exerciseName: string;
  name?: string; // For compatibility
  category: string;
  movementPattern: string;
  workoutType: string;
  workout_type?: string; // For compatibility
  equipmentType: string[];
  equipment?: string; // For compatibility
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  difficulty: string;
  difficultyLevel?: string;
  description?: string;
  restTimeSeconds?: number;
  rest_time_seconds?: number;
  defaultSets?: number;
  default_sets?: number;
  defaultReps?: number;
  default_reps?: number;
}

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithDetails | null>(null);

  // Fetch exercises from Supabase
  const { data: exercisesData, isLoading, error: exercisesError } = useQuery<Exercise[]>({
    queryKey: ["supabase-all-exercises"],
    queryFn: async () => {
      console.log('🔍 Fetching all exercises from Supabase...');
      try {
        const exercises = await workoutService.getAllExercises();
        console.log(`✅ Found ${exercises.length} exercises`);
        return exercises;
      } catch (error) {
        console.error('❌ Failed to fetch exercises:', error);
        throw new Error('Failed to load exercises. Please try again.');
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  // Convert Supabase exercises to the expected format
  const exercises: ExerciseWithDetails[] = (exercisesData || []).map(exercise => ({
    id: exercise.id,
    exerciseName: exercise.exercise_name,
    name: exercise.exercise_name, // For compatibility
    category: exercise.category,
    movementPattern: exercise.movement_pattern || '',
    workoutType: exercise.workout_type || '',
    workout_type: exercise.workout_type, // For compatibility
    equipmentType: exercise.equipment_type || [],
    equipment: exercise.equipment_type?.[0] || '', // For compatibility - take first equipment
    primaryMuscles: [], // Would need to fetch from exercise_primary_muscles table
    secondaryMuscles: [], // Would need to fetch from exercise_secondary_muscles table
    difficulty: exercise.difficulty_level || 'beginner',
    difficultyLevel: exercise.difficulty_level || 'beginner',
    description: exercise.description || '',
    restTimeSeconds: exercise.rest_time_seconds || 60,
    rest_time_seconds: exercise.rest_time_seconds || 60,
    defaultSets: 3, // Default value since this field doesn't exist in Exercise type
    default_sets: 3, // Default value since this field doesn't exist in Exercise type
    defaultReps: exercise.default_reps || 10,
    default_reps: exercise.default_reps || 10
  }));

  // Get unique values for filters
  const workoutTypes = useMemo(() => {
    const types = new Set(exercises.map(e => e.workoutType || e.workout_type).filter(Boolean));
    return Array.from(types).sort();
  }, [exercises]);

  const equipmentTypes = useMemo(() => {
    const types = new Set<string>();
    exercises.forEach(e => {
      if (e.equipmentType?.length) {
        e.equipmentType.forEach(eq => types.add(eq));
      } else if (e.equipment) {
        types.add(e.equipment);
      }
    });
    return Array.from(types).sort();
  }, [exercises]);

  const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      const exerciseName = exercise.exerciseName || exercise.name || '';
      if (searchQuery && !exerciseName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Workout type filter
      const workoutType = exercise.workoutType || exercise.workout_type;
      if (selectedWorkoutType !== "all" && workoutType !== selectedWorkoutType) {
        return false;
      }

      // Equipment filter
      const hasEquipment = exercise.equipmentType?.includes(selectedEquipment) || exercise.equipment === selectedEquipment;
      if (selectedEquipment !== "all" && !hasEquipment) {
        return false;
      }

      // Difficulty filter (case-insensitive)
      const difficulty = (exercise.difficultyLevel || exercise.difficulty || '').toLowerCase();
      if (selectedDifficulty !== "all" && difficulty !== selectedDifficulty.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedWorkoutType, selectedEquipment, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkoutTypeColor = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "abs":
        return "text-purple-600";
      case "backbiceps":
        return "text-blue-600";
      case "chesttriceps":
        return "text-orange-600";
      case "legs":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Exercise Database</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Explore {exercises.length} exercises to build your perfect workout
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Workout Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workout Types</SelectItem>
              {workoutTypes.map(type => (
                <SelectItem key={type} value={type || ''}>
                  {(type || '').replace(/([A-Z])/g, ' $1').trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              {equipmentTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              {difficultyLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedWorkoutType !== "all" || selectedEquipment !== "all" || selectedDifficulty !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedWorkoutType("all");
                setSelectedEquipment("all");
                setSelectedDifficulty("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredExercises.length} of {exercises.length} exercises
          </div>
        </div>
      </section>

      {/* Exercise Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exercises from Supabase...</p>
          </div>
        ) : exercisesError ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-lg text-muted-foreground mb-2">Unable to Load Exercises</p>
              <p className="text-sm text-muted-foreground mb-4">
                {exercisesError instanceof Error ? exercisesError.message : 'An unexpected error occurred'}
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="mr-2">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/workouts'}>
                  Back to Workouts
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredExercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">No exercises found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{exercise.exerciseName || exercise.name}</CardTitle>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(exercise.difficultyLevel || exercise.difficulty) && (
                      <Badge className={getDifficultyColor(exercise.difficultyLevel || exercise.difficulty)}>
                        {exercise.difficultyLevel || exercise.difficulty}
                      </Badge>
                    )}
                    {exercise.category && (
                      <Badge variant="outline">{exercise.category}</Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {(exercise.workoutType || exercise.workout_type) && (
                      <div className="flex items-center gap-2">
                        <Target className={`w-4 h-4 ${getWorkoutTypeColor(exercise.workoutType || exercise.workout_type)}`} />
                        <span className="text-muted-foreground">
                          {((exercise.workoutType || exercise.workout_type) || '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    )}
                    {(exercise.equipmentType?.length || exercise.equipment) && (
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {exercise.equipmentType?.join(', ') || exercise.equipment}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {exercise.defaultSets || exercise.default_sets || 3} sets × {exercise.defaultReps || exercise.default_reps || 10} reps
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedExercise?.exerciseName || selectedExercise?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedExercise && (
            <div className="space-y-6 pt-4">
              {/* Exercise Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.difficulty && (
                    <Badge className={getDifficultyColor(selectedExercise.difficulty)}>
                      {selectedExercise.difficulty}
                    </Badge>
                  )}
                  {selectedExercise.category && (
                    <Badge variant="outline">{selectedExercise.category}</Badge>
                  )}
                  {selectedExercise.workout_type && (
                    <Badge variant="secondary">
                      {selectedExercise.workout_type.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Equipment</p>
                    <p className="font-medium">{selectedExercise.equipment || 'Bodyweight'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Rest Time</p>
                    <p className="font-medium">{selectedExercise.rest_time_seconds || 60}s</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Default Sets</p>
                    <p className="font-medium">{selectedExercise.default_sets || 3}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Default Reps</p>
                    <p className="font-medium">{selectedExercise.default_reps || 10}</p>
                  </div>
                </div>
              </div>

              {/* Muscle Groups */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Target Muscles</h3>
                <p className="text-sm text-muted-foreground">
                  Primary and secondary muscle engagement data coming soon
                </p>
              </div>

              {/* Instructions */}
              {selectedExercise.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <p className="text-muted-foreground">{selectedExercise.description}</p>
                </div>
              )}

              {/* Tips */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Tips</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Focus on proper form over heavy weight</li>
                  <li>Control the movement throughout the entire range</li>
                  <li>Breathe consistently - exhale on exertion</li>
                  <li>Rest adequately between sets</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}