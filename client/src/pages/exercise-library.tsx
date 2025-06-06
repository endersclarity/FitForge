import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import type { Exercise } from "@/lib/supabase";
import {
  Search,
  Filter,
  Heart,
  Play,
  Clock,
  Target,
  Dumbbell,
  User,
  Star,
  Info,
  BookOpen,
  Grid3X3,
  List,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface ExerciseFilters {
  search: string;
  category: string;
  workoutType: string;
  equipment: string[];
  difficulty: string;
  muscleGroup: string;
  favorites: boolean;
}

interface ExerciseWithFavorite extends Exercise {
  isFavorite?: boolean;
}

// Available filter options
const CATEGORIES = [
  "All Categories",
  "Strength",
  "Cardio", 
  "Flexibility",
  "Plyometric",
  "Core",
  "Balance"
];

const WORKOUT_TYPES = [
  "All Types",
  "Strength",
  "Cardio",
  "Flexibility",
  "HIIT",
  "Yoga",
  "Pilates"
];

const EQUIPMENT_OPTIONS = [
  "Bodyweight",
  "Dumbbells", 
  "Barbell",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Cable Machine",
  "Smith Machine",
  "Leg Press"
];

const DIFFICULTY_LEVELS = [
  "All Levels",
  "Beginner",
  "Intermediate", 
  "Advanced"
];

const MUSCLE_GROUPS = [
  "All Muscles",
  "Chest",
  "Back", 
  "Shoulders",
  "Arms",
  "Legs",
  "Glutes",
  "Core",
  "Calves",
  "Forearms"
];

export default function ExerciseLibrary() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithFavorite | null>(null);
  const [filters, setFilters] = useState<ExerciseFilters>({
    search: "",
    category: "All Categories",
    workoutType: "All Types", 
    equipment: [],
    difficulty: "All Levels",
    muscleGroup: "All Muscles",
    favorites: false
  });

  // Load favorites from localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('exercise-favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('exercise-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Fetch exercises from API
  const { data: exercises = [], isLoading, error } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      console.log('🔍 Fetching exercises from API...');
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status}`);
        }
        const result = await response.json();
        console.log(`✅ Found ${result.data?.exercises?.length || 0} exercises`);
        return result.data?.exercises || [];
      } catch (error) {
        console.error('❌ Failed to fetch exercises:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  // Add favorites to exercises
  const exercisesWithFavorites = useMemo(() => {
    return exercises.map(exercise => ({
      ...exercise,
      isFavorite: favorites.has(exercise.id)
    }));
  }, [exercises, favorites]);

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    return exercisesWithFavorites.filter(exercise => {
      // Search filter
      if (filters.search && !exercise.exerciseName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category !== "All Categories" && exercise.category !== filters.category) {
        return false;
      }

      // Workout type filter
      if (filters.workoutType !== "All Types" && exercise.workoutType !== filters.workoutType) {
        return false;
      }

      // Equipment filter
      if (filters.equipment.length > 0) {
        const hasEquipment = filters.equipment.some(eq => 
          exercise.equipmentType.some(exerciseEq => 
            exerciseEq.toLowerCase().includes(eq.toLowerCase())
          )
        );
        if (!hasEquipment) return false;
      }

      // Difficulty filter
      if (filters.difficulty !== "All Levels" && exercise.difficultyLevel !== filters.difficulty.toLowerCase()) {
        return false;
      }

      // Muscle group filter
      if (filters.muscleGroup !== "All Muscles") {
        const hasMuscle = [...exercise.primaryMuscles, ...exercise.secondaryMuscles]
          .some(muscle => muscle.toLowerCase().includes(filters.muscleGroup.toLowerCase()));
        if (!hasMuscle) return false;
      }

      // Favorites filter
      if (filters.favorites && !exercise.isFavorite) {
        return false;
      }

      return true;
    });
  }, [exercisesWithFavorites, filters]);

  // Toggle favorite status
  const toggleFavorite = (exerciseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(exerciseId)) {
        newFavorites.delete(exerciseId);
      } else {
        newFavorites.add(exerciseId);
      }
      return newFavorites;
    });
  };

  // Update filter
  const updateFilter = (key: keyof ExerciseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle equipment filter
  const toggleEquipment = (equipment: string) => {
    setFilters(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(eq => eq !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All Categories",
      workoutType: "All Types",
      equipment: [],
      difficulty: "All Levels", 
      muscleGroup: "All Muscles",
      favorites: false
    });
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render exercise card
  const renderExerciseCard = (exercise: ExerciseWithFavorite) => (
    <Card 
      key={exercise.id} 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => setSelectedExercise(exercise)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {exercise.exerciseName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {exercise.category}
              </Badge>
              <Badge className={`text-xs ${getDifficultyColor(exercise.difficultyLevel)}`}>
                {exercise.difficultyLevel}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(exercise.id);
            }}
            className="shrink-0 ml-2"
          >
            <Heart 
              className={`h-4 w-4 ${exercise.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="h-3 w-3" />
            <span className="truncate">
              {exercise.equipmentType.join(", ")}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-3 w-3" />
            <span className="truncate">
              {exercise.primaryMuscles.slice(0, 2).join(", ")}
              {exercise.primaryMuscles.length > 2 && ` +${exercise.primaryMuscles.length - 2}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{Math.round(exercise.restTimeSeconds / 60)} min rest</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            {exercise.defaultReps} reps • {exercise.defaultWeightLbs} lbs
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  // Render exercise list item
  const renderExerciseListItem = (exercise: ExerciseWithFavorite) => (
    <Card 
      key={exercise.id}
      className="hover:shadow-sm transition-shadow cursor-pointer group"
      onClick={() => setSelectedExercise(exercise)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                {exercise.exerciseName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{exercise.category}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {exercise.primaryMuscles.slice(0, 2).join(", ")}
                </span>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                <span>{exercise.equipmentType[0]}</span>
              </div>
              <Badge className={`text-xs ${getDifficultyColor(exercise.difficultyLevel)}`}>
                {exercise.difficultyLevel}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(exercise.id);
            }}
            className="shrink-0"
          >
            <Heart 
              className={`h-4 w-4 ${exercise.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exercise library...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Unable to load exercises</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the exercise library.
              </p>
              <Button onClick={() => window.location.reload()} size="sm">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Exercise Library</h1>
              <p className="text-muted-foreground">
                Discover {exercises.length} exercises to enhance your fitness journey
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search exercises..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Favorites */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorites"
                    checked={filters.favorites}
                    onCheckedChange={(checked) => updateFilter('favorites', checked)}
                  />
                  <label htmlFor="favorites" className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 mr-1 text-red-500" />
                    Favorites Only
                  </label>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Muscle Group */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Muscle Group</label>
                  <Select value={filters.muscleGroup} onValueChange={(value) => updateFilter('muscleGroup', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(muscle => (
                        <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Equipment */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Equipment</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <div key={equipment} className="flex items-center space-x-2">
                        <Checkbox
                          id={equipment}
                          checked={filters.equipment.includes(equipment)}
                          onCheckedChange={() => toggleEquipment(equipment)}
                        />
                        <label htmlFor={equipment} className="text-sm">
                          {equipment}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Grid/List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {filteredExercises.length} Exercise{filteredExercises.length !== 1 ? 's' : ''}
                </h2>
                {favorites.size > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    {favorites.size} Favorite{favorites.size !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {/* Exercise Display */}
            {filteredExercises.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No exercises found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters to see more results.
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {filteredExercises.map(exercise => 
                  viewMode === "grid" 
                    ? renderExerciseCard(exercise)
                    : renderExerciseListItem(exercise)
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedExercise.exerciseName}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{selectedExercise.category}</Badge>
                    <Badge className={getDifficultyColor(selectedExercise.difficultyLevel)}>
                      {selectedExercise.difficultyLevel}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(selectedExercise.id)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${selectedExercise.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedExercise(null)}>
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Exercise Details */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Equipment</h4>
                  <p className="text-muted-foreground">
                    {selectedExercise.equipmentType.join(", ")}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Workout Type</h4>
                  <p className="text-muted-foreground">{selectedExercise.workoutType}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Primary Muscles</h4>
                  <p className="text-muted-foreground">
                    {selectedExercise.primaryMuscles.join(", ")}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Secondary Muscles</h4>
                  <p className="text-muted-foreground">
                    {selectedExercise.secondaryMuscles.length > 0 
                      ? selectedExercise.secondaryMuscles.join(", ")
                      : "None"
                    }
                  </p>
                </div>
              </div>

              {/* Default Settings */}
              <div>
                <h4 className="font-medium mb-2">Default Settings</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium">{selectedExercise.defaultReps}</div>
                    <div className="text-muted-foreground">Reps</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium">{selectedExercise.defaultWeightLbs}</div>
                    <div className="text-muted-foreground">lbs</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium">{Math.round(selectedExercise.restTimeSeconds / 60)}</div>
                    <div className="text-muted-foreground">min rest</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedExercise.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedExercise.description}</p>
                </div>
              )}

              {/* Form Cues */}
              {selectedExercise.formCues && selectedExercise.formCues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                    Form Cues
                  </h4>
                  <ul className="text-muted-foreground space-y-1">
                    {selectedExercise.formCues.map((cue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Notes */}
              {selectedExercise.safetyNotes && selectedExercise.safetyNotes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-orange-600" />
                    Safety Notes
                  </h4>
                  <ul className="text-muted-foreground space-y-1">
                    {selectedExercise.safetyNotes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Exercise
                </Button>
                <Button variant="outline" className="flex-1">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add to Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}