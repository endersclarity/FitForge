import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, CheckCircle, Plus } from "lucide-react";
import { useWorkoutSessionV2, type Exercise } from "@/hooks/use-workout-session-v2";

interface ExerciseSelectorProps {
  onBack: () => void;
}

export function ExerciseSelector({ onBack }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { addExercise, session } = useWorkoutSessionV2();

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

  const isExerciseSelected = (exercise: Exercise) => {
    return session.exercises.some(ex => ex.exerciseName === exercise.exerciseName);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 py-6 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                onClick={onBack}
                variant="ghost" 
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Select Exercises</h1>
                <p className="text-muted-foreground">
                  {session.exercises.length} exercises selected
                </p>
              </div>
            </div>
            
            {session.exercises.length > 0 && (
              <Button 
                onClick={onBack}
                className="gradient-bg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done ({session.exercises.length})
              </Button>
            )}
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
          <div className="flex gap-2 flex-wrap">
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

        {/* Selected Exercises Preview */}
        {session.exercises.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selected Exercises ({session.exercises.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {session.exercises.map((exercise, index) => (
                  <div key={exercise.exerciseId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="font-medium">{exercise.exerciseName}</span>
                    <Badge variant="secondary">{exercise.exercise.difficulty}</Badge>
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading exercises...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredExercises.map((exercise, index) => {
                  const isSelected = isExerciseSelected(exercise);
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{exercise.exerciseName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exercise.category} • {exercise.difficulty} • {exercise.equipment.join(", ")}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {exercise.primaryMuscles.slice(0, 3).map((muscle, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {muscle.muscle}
                              </Badge>
                            ))}
                            {exercise.primaryMuscles.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{exercise.primaryMuscles.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {isSelected ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Added
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredExercises.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises found</p>
                    <p className="text-sm">Try adjusting your search or filter</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ExerciseSelector;