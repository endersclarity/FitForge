import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useLocation } from "wouter";
import { Play, Dumbbell, Heart, Zap, Target, Calendar } from "lucide-react";

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

  const handleStartWorkout = (workoutId: string) => {
    console.log('🎯 handleStartWorkout called with:', workoutId);
    // Navigate to workout session with the selected workout type
    const targetUrl = `/start-workout?type=${workoutId}`;
    console.log('🧭 Navigating to:', targetUrl);
    setLocation(targetUrl);
    console.log('✅ setLocation called successfully');
  };

  // Test function to verify component is working
  React.useEffect(() => {
    console.log('🏋️ Workouts component mounted successfully');
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

      {/* Workout Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workoutTypes.map((workout) => {
            const IconComponent = workout.icon;
            
            return (
              <Card 
                key={workout.id}
                className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${workout.color}`}
                onClick={(e) => {
                  console.log('🖱️ Card clicked for workout:', workout.id);
                  console.log('🖱️ Click event:', e.type);
                  e.preventDefault();
                  handleStartWorkout(workout.id);
                }}
                onMouseDown={() => console.log('🖱️ Mouse down on card:', workout.id)}
                onMouseUp={() => console.log('🖱️ Mouse up on card:', workout.id)}
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
                            <Badge key={variation} variant="secondary" className="text-xs">
                              Variation {variation}
                            </Badge>
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
                      console.log('🔘 Button clicked for workout:', workout.id);
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
      </div>
    </div>
  );
}