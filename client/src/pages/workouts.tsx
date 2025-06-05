import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Play, Dumbbell, Heart, Zap, Target, Calendar, Search, Filter, Activity, Clock, Weight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

// Workout type definitions based on your CSV data
const workoutTypes = [
  {
    id: "abs",
    name: "Abs",
    icon: Target,
    description: "Core strengthening and abdominal exercises",
    variations: ["A", "B"],
    exercises: ["Planks", "Spider Planks", "Bench Situps", "Hanging Knee Raises"],
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    iconColor: "text-blue-500"
  },
  {
    id: "backbiceps", 
    name: "Back & Biceps",
    icon: Dumbbell,
    description: "Pull exercises targeting back and bicep muscles",
    variations: ["A", "B"],
    exercises: ["Bent Over Rows", "Chin-Ups", "Bicep Curls", "T Row"],
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
    iconColor: "text-green-500"
  },
  {
    id: "chesttriceps",
    name: "Chest & Triceps", 
    icon: Heart,
    description: "Push exercises for chest and tricep development",
    variations: ["A", "B"],
    exercises: ["Bench Press", "TRX Pushup", "Tricep Extension", "Dips"],
    color: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
    iconColor: "text-red-500"
  },
  {
    id: "legs",
    name: "Legs",
    icon: Zap,
    description: "Lower body strength and power exercises", 
    variations: ["A", "B"],
    exercises: ["Goblet Squats", "Dead Lifts", "Glute Bridges", "Calf Raises"],
    color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
    iconColor: "text-purple-500"
  },
  {
    id: "warmup",
    name: "Warm-up",
    icon: Calendar,
    description: "Dynamic movements to prepare for training",
    variations: ["A", "B"],
    exercises: ["Kettlebell Swings", "Kettlebell Halos", "Stiff Legged Deadlifts"],
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20", 
    iconColor: "text-orange-500"
  }
];

export default function Workouts() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({
    abs: "A",
    backbiceps: "A", 
    chesttriceps: "A",
    legs: "A",
    warmup: "A"
  });

  // Fetch workout history from unified storage
  const { data: workoutHistoryResponse, isLoading } = useQuery({
    queryKey: ["workout-history"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch("/api/workouts/history", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error("Failed to fetch workout history");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch workout history:", error);
        return { workouts: [], total: 0, hasMore: false };
      }
    }
  });

  const completedWorkouts = React.useMemo(() => {
    const workouts = workoutHistoryResponse?.workouts || [];
    return workouts.filter((workout: any) => workout.sessionType === 'completed');
  }, [workoutHistoryResponse]);

  // Filter workouts based on search and category
  const filteredWorkouts = useMemo(() => {
    return workoutTypes.filter(workout => {
      const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.exercises.some(exercise => exercise.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || 
        workout.id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleStartWorkout = (workoutId: string) => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Navigate to workout session with the selected workout type and variation
    const variation = selectedVariations[workoutId];
    const targetUrl = `/start-workout?type=${workoutId}&variation=${variation}`;
    if (process.env.NODE_ENV === 'development') {
    }
    setLocation(targetUrl);
    if (process.env.NODE_ENV === 'development') {
    }
  };

  const handleVariationChange = (workoutId: string, variation: string) => {
    setSelectedVariations(prev => ({
      ...prev,
      [workoutId]: variation
    }));
  };

  // Test function to verify component is working
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Choose Your Workout</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Select from pre-built workout routines with multiple variations
          </p>
        </div>
      </section>

      {/* Filter Controls */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search workouts, exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workouts</SelectItem>
                  <SelectItem value="abs">Abs</SelectItem>
                  <SelectItem value="backbiceps">Back & Biceps</SelectItem>
                  <SelectItem value="chesttriceps">Chest & Triceps</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="warmup">Warm-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredWorkouts.length} of {workoutTypes.length} workouts
          </div>
        </div>

        {/* Workout Cards */}
        {filteredWorkouts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => {
            const IconComponent = workout.icon;
            
            return (
              <Card 
                key={workout.id}
                className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${workout.color}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleStartWorkout(workout.id);
                }}
                onMouseDown={() => {}}
                onMouseUp={() => {}}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-background/50 ${workout.iconColor}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{workout.name}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          {workout.variations.map((variation) => (
                            <Button
                              key={variation}
                              variant={selectedVariations[workout.id] === variation ? "default" : "secondary"}
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVariationChange(workout.id, variation);
                              }}
                            >
                              Variation {variation}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4">
                    {workout.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Sample Exercises:</h4>
                    <div className="flex flex-wrap gap-1">
                      {workout.exercises.slice(0, 3).map((exercise, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {exercise}
                        </Badge>
                      ))}
                      {workout.exercises.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workout.exercises.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartWorkout(workout.id);
                    }}
                    className="w-full"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Workout
                  </Button>
                </CardContent>
              </Card>
            );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workouts found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filter settings
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold mb-4">Your Workout Arsenal</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-sm text-muted-foreground">Workout Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">Variations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">35+</div>
                  <div className="text-sm text-muted-foreground">Total Exercises</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout History Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Your Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading workout history...</p>
                </div>
              ) : completedWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No completed workouts yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start a workout above to begin building your history
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedWorkouts.slice(0, 5).map((workout: any) => {
                    const workoutDate = new Date(workout.startTime);
                    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                    
                    return (
                      <Card key={workout.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {workout.workoutType ? 
                                    workout.workoutType.replace(/([A-Z])/g, ' $1').trim() : 
                                    'Workout Session'}
                                </h4>
                                <Badge variant="secondary" className="text-xs">Completed</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {workoutDate.toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {workout.totalDuration || 0} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Dumbbell className="w-4 h-4" />
                                  {exercises.length} exercises
                                </span>
                                <span className="flex items-center gap-1">
                                  <Weight className="w-4 h-4" />
                                  {workout.totalVolume?.toLocaleString() || 0} lbs
                                </span>
                              </div>
                              {exercises.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {exercises.slice(0, 3).map((exercise: any, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {exercise.exerciseName}
                                      </Badge>
                                    ))}
                                    {exercises.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{exercises.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {completedWorkouts.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/progress')}
                      >
                        View All Workout History
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}