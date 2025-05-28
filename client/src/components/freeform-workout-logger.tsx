import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus,
  Dumbbell,
  Timer,
  Target,
  Check,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Real exercise data structure from API
interface Exercise {
  exerciseName: string;
  equipmentType: string;
  category: 'Compound' | 'Isolation' | 'Explosive' | 'Functional';
  movementType: string;
  workoutType: string;
  variation: 'A' | 'B' | 'A/B';
  weight: number | string;
  restTime?: string;
  reps: number;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles?: Array<{ muscle: string; percentage: number }>;
  equipment: string[];
  difficulty: string;
}

interface WorkoutSet {
  id: string;
  exerciseName: string;
  equipment: string;
  weight: number;
  reps: number;
  timestamp: Date;
  volume: number;
  formScore?: number;
  notes?: string;
  ghostText?: {
    targetWeight?: number;
    targetReps?: number;
    previousWeight?: number;
    previousReps?: number;
    previousDate?: string;
  };
}

export function FreeformWorkoutLogger() {
  const { toast } = useToast();
  
  // State for exercises from API
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filters - show ALL exercises first, then filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Exercise selection
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  
  // Set logging
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [formScore, setFormScore] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Session data
  const [loggedSets, setLoggedSets] = useState<WorkoutSet[]>([]);
  const [sessionStartTime] = useState<Date>(new Date());
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionSaving, setSessionSaving] = useState(false);

  // Ghost text for previous performance
  const [ghostText, setGhostText] = useState<{
    targetWeight?: number;
    targetReps?: number;
    previousWeight?: number;
    previousReps?: number;
    previousDate?: string;
  }>({});

  // Fetch exercises from API - show ALL 38 exercises first
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises');
        if (response.ok) {
          const data = await response.json();
          setExercises(data);
          console.log(`Loaded ${data.length} exercises from API`);
        } else {
          toast({
            title: "Error loading exercises",
            description: "Could not fetch exercise database",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        toast({
          title: "Error loading exercises", 
          description: "Could not connect to exercise database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [toast]);

  // Session recovery - check for incomplete sessions on load
  useEffect(() => {
    const checkForIncompleteSession = async () => {
      try {
        const response = await fetch('/api/workout-sessions');
        if (response.ok) {
          const sessions = await response.json();
          const incompleteSession = sessions.find((s: any) => s.completionStatus === "in_progress");
          
          if (incompleteSession) {
            setCurrentSessionId(incompleteSession.id);
            
            // Restore sets from session data
            if (incompleteSession.exercises && incompleteSession.exercises.length > 0) {
              const restoredSets: WorkoutSet[] = [];
              incompleteSession.exercises.forEach((exercise: any) => {
                exercise.sets.forEach((set: any, index: number) => {
                  restoredSets.push({
                    id: `restored-${exercise.exerciseName}-${index}`,
                    exerciseName: exercise.exerciseName,
                    equipment: set.equipment,
                    weight: set.weight,
                    reps: set.reps,
                    timestamp: new Date(set.timestamp),
                    volume: set.volume,
                    formScore: set.formScore,
                    notes: set.notes
                  });
                });
              });
              setLoggedSets(restoredSets);
              
              toast({
                title: "Session Restored",
                description: `Resumed workout with ${restoredSets.length} sets`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking for incomplete session:', error);
      }
    };

    // Only check after exercises are loaded
    if (exercises.length > 0) {
      checkForIncompleteSession();
    }
  }, [exercises.length, toast]);

  // Fetch ghost text when exercise is selected
  useEffect(() => {
    if (selectedExercise) {
      const fetchPreviousData = async () => {
        try {
          const response = await fetch(`/api/exercises/${encodeURIComponent(selectedExercise.exerciseName)}/previous`);
          if (response.ok) {
            const data = await response.json();
            setGhostText(data);
            // Pre-fill with target values
            if (data.weight) setWeight(data.weight.toString());
            if (data.reps) setReps(data.reps.toString());
          }
        } catch (error) {
          console.error('Error fetching previous exercise data:', error);
        }
      };
      
      fetchPreviousData();
    } else {
      setGhostText({});
    }
  }, [selectedExercise]);

  // Filtered exercises - search and filter applied to ALL exercises
  const filteredExercises = exercises.filter(exercise => {
    // Search filter
    if (searchTerm && !exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Dropdown filters
    if (selectedWorkoutType && exercise.workoutType !== selectedWorkoutType) return false;
    if (selectedEquipmentType && exercise.equipmentType !== selectedEquipmentType) return false;
    if (selectedDifficulty && exercise.difficulty !== selectedDifficulty) return false;
    if (selectedCategory && exercise.category !== selectedCategory) return false;
    
    return true;
  });

  // Get unique values for filter dropdowns
  const availableWorkoutTypes = [...new Set(exercises.map(ex => ex.workoutType))];
  const availableEquipmentTypes = [...new Set(exercises.map(ex => ex.equipmentType))];
  const availableDifficulties = [...new Set(exercises.map(ex => ex.difficulty))];
  const availableCategories = [...new Set(exercises.map(ex => ex.category))];

  // Session management functions
  const createWorkoutSession = async (): Promise<number | null> => {
    try {
      setSessionSaving(true);
      
      // Find the "Freeform Workout" ID (it should be the last one created)
      const workoutsResponse = await fetch('/api/workouts');
      if (!workoutsResponse.ok) throw new Error('Failed to fetch workouts');
      
      const workouts = await workoutsResponse.json();
      const freeformWorkout = workouts.find((w: any) => w.name === "Freeform Workout");
      
      if (!freeformWorkout) {
        throw new Error('Freeform workout not found');
      }

      const sessionData = {
        workoutId: freeformWorkout.id,
        startTime: sessionStartTime.toISOString(),
        completionStatus: "in_progress",
        exercises: [],
        notes: "Freeform workout session"
      };

      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) throw new Error('Failed to create workout session');
      
      const session = await response.json();
      setCurrentSessionId(session.id);
      
      console.log('Created workout session:', session.id);
      return session.id;
    } catch (error) {
      console.error('Error creating workout session:', error);
      toast({
        title: "Session Save Error",
        description: "Could not create workout session",
        variant: "destructive"
      });
      return null;
    } finally {
      setSessionSaving(false);
    }
  };

  const updateWorkoutSession = async (sessionId: number, sets: WorkoutSet[]) => {
    try {
      setSessionSaving(true);
      
      // Group sets by exercise name
      const exerciseGroups = sets.reduce((groups, set) => {
        if (!groups[set.exerciseName]) {
          groups[set.exerciseName] = [];
        }
        groups[set.exerciseName].push({
          weight: set.weight,
          reps: set.reps,
          equipment: set.equipment,
          volume: set.volume,
          formScore: set.formScore,
          notes: set.notes,
          timestamp: set.timestamp.toISOString()
        });
        return groups;
      }, {} as Record<string, any[]>);

      // Convert to exercises array format
      const exercisesData = Object.entries(exerciseGroups).map(([exerciseName, sets]) => ({
        exerciseName,
        sets
      }));

      const totalVolume = sets.reduce((sum, set) => sum + set.volume, 0);
      const averageFormScore = sets.filter(s => s.formScore).length > 0 
        ? sets.filter(s => s.formScore).reduce((sum, s) => sum + (s.formScore || 0), 0) / sets.filter(s => s.formScore).length
        : null;

      const updateData = {
        exercises: exercisesData,
        totalDuration: Math.round((Date.now() - sessionStartTime.getTime()) / 60000), // in minutes
        caloriesBurned: Math.round(totalVolume * 0.1), // estimate
        formScore: averageFormScore
      };

      const response = await fetch(`/api/workout-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update workout session');
      
      console.log('Updated workout session:', sessionId);
    } catch (error) {
      console.error('Error updating workout session:', error);
      toast({
        title: "Auto-Save Error",
        description: "Could not save workout progress",
        variant: "destructive"
      });
    } finally {
      setSessionSaving(false);
    }
  };

  const completeWorkoutSession = async (sessionId: number) => {
    try {
      const updateData = {
        endTime: new Date().toISOString(),
        completionStatus: "completed"
      };

      const response = await fetch(`/api/workout-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to complete workout session');
      
      toast({
        title: "Workout Completed! 🎉",
        description: "Your session has been saved successfully",
      });
    } catch (error) {
      console.error('Error completing workout session:', error);
      toast({
        title: "Completion Error",
        description: "Could not mark workout as complete",
        variant: "destructive"
      });
    }
  };

  const handleLogSet = async () => {
    if (!selectedExercise || !selectedEquipment || !weight || !reps) {
      toast({
        title: "Missing Information",
        description: "Please select exercise, equipment, weight, and reps",
        variant: "destructive",
      });
      return;
    }

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const formScoreNum = formScore ? parseFloat(formScore) : undefined;
    
    if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
      toast({
        title: "Invalid Input",
        description: "Weight and reps must be positive numbers",
        variant: "destructive",
      });
      return;
    }

    if (formScoreNum && (formScoreNum < 1 || formScoreNum > 10)) {
      toast({
        title: "Invalid Form Score",
        description: "Form score must be between 1-10",
        variant: "destructive",
      });
      return;
    }

    const newSet: WorkoutSet = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseName: selectedExercise.exerciseName,
      equipment: selectedEquipment,
      weight: weightNum,
      reps: repsNum,
      timestamp: new Date(),
      volume: weightNum * repsNum,
      formScore: formScoreNum,
      notes: notes || undefined,
      ghostText
    };

    const updatedSets = [...loggedSets, newSet];
    setLoggedSets(updatedSets);
    
    // Create session on first set, or update existing session
    let sessionId = currentSessionId;
    if (!sessionId && updatedSets.length === 1) {
      sessionId = await createWorkoutSession();
    }
    
    // Auto-save the session with the new set
    if (sessionId) {
      await updateWorkoutSession(sessionId, updatedSets);
    }
    
    // Clear inputs for next set but keep exercise/equipment selected
    setWeight('');
    setReps('');
    setFormScore('');
    setNotes('');

    toast({
      title: "Set Logged!",
      description: `${selectedExercise.exerciseName}: ${repsNum} reps @ ${weightNum}lbs (${newSet.volume} volume)`,
    });
  };

  const handleDeleteSet = async (setId: string) => {
    const updatedSets = loggedSets.filter(set => set.id !== setId);
    setLoggedSets(updatedSets);
    
    // Update the session if it exists
    if (currentSessionId && updatedSets.length > 0) {
      await updateWorkoutSession(currentSessionId, updatedSets);
    }
    
    toast({
      title: "Set Deleted",
      description: "Set removed from workout",
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedWorkoutType('');
    setSelectedEquipmentType('');
    setSelectedDifficulty('');
    setSelectedCategory('');
    setSelectedExercise(null);
    setSelectedEquipment('');
    setWeight('');
    setReps('');
    setFormScore('');
    setNotes('');
  };

  const totalVolume = loggedSets.reduce((sum, set) => sum + set.volume, 0);
  const uniqueExercises = [...new Set(loggedSets.map(set => set.exerciseName))].length;
  const averageFormScore = loggedSets.filter(s => s.formScore).length > 0 
    ? loggedSets.filter(s => s.formScore).reduce((sum, s) => sum + (s.formScore || 0), 0) / loggedSets.filter(s => s.formScore).length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading exercise database...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Freeform Workout Logger</CardTitle>
            <p className="text-muted-foreground">
              Choose from {exercises.length} real exercises with precise muscle targeting
            </p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Exercise Selection Column */}
          <div className="space-y-6">
            
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Exercise</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredExercises.length} of {exercises.length} exercises
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search exercises by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Workout Type</Label>
                    <Select value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        {availableWorkoutTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type} ({exercises.filter(e => e.workoutType === type).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Equipment</Label>
                    <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All equipment</SelectItem>
                        {availableEquipmentTypes.map(equipment => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment} ({exercises.filter(e => e.equipmentType === equipment).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All levels</SelectItem>
                        {availableDifficulties.map(difficulty => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty} ({exercises.filter(e => e.difficulty === difficulty).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {availableCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category} ({exercises.filter(e => e.category === category).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={resetFilters} variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Exercise List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredExercises.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredExercises.map((exercise, index) => (
                      <div
                        key={`${exercise.exerciseName}-${index}`}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExercise?.exerciseName === exercise.exerciseName 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedExercise(exercise);
                          setSelectedEquipment(''); // Reset equipment when exercise changes
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{exercise.exerciseName}</h4>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {exercise.workoutType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {exercise.equipmentType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {exercise.difficulty}
                            </Badge>
                            {exercise.variation !== 'A/B' && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.variation}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <div>Primary: {exercise.primaryMuscles.map(m => `${m.muscle} ${m.percentage}%`).join(', ')}</div>
                          <div>Equipment: {exercise.equipment.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises match your current filters.</p>
                    <p className="text-sm">Try adjusting your search or filters above.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Selection */}
            {selectedExercise && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipment for {selectedExercise.exerciseName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedExercise.equipment.map(equipment => (
                        <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Set Logging Column */}
          <div className="space-y-6">
            
            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Session Stats
                  {sessionSaving && (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-primary mr-1"></div>
                      Saving...
                    </div>
                  )}
                  {currentSessionId && !sessionSaving && (
                    <div className="text-xs text-green-600">✓ Auto-saved</div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{loggedSets.length}</div>
                    <div className="text-xs text-muted-foreground">Sets</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">{totalVolume}</div>
                    <div className="text-xs text-muted-foreground">Volume (lbs)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">{uniqueExercises}</div>
                    <div className="text-xs text-muted-foreground">Exercises</div>
                  </div>
                </div>
                {averageFormScore > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-500">{averageFormScore.toFixed(1)}/10</div>
                    <div className="text-xs text-muted-foreground">Avg Form Score</div>
                  </div>
                )}

                {/* Session duration */}
                <div className="text-center pt-2 border-t">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round((Date.now() - sessionStartTime.getTime()) / 60000)} min
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>

                {/* Complete workout button */}
                {loggedSets.length > 0 && currentSessionId && (
                  <Button 
                    onClick={() => completeWorkoutSession(currentSessionId)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete Workout
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Set Logging Form */}
            {selectedExercise && selectedEquipment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Log Set</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedExercise.exerciseName} using {selectedEquipment}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Ghost text display */}
                  {ghostText.targetWeight && ghostText.targetReps && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-sm font-medium text-primary">Target (+3%)</div>
                      <div className="text-sm text-muted-foreground">
                        {ghostText.targetWeight}lbs × {ghostText.targetReps} reps
                        {ghostText.previousWeight && ghostText.previousReps && (
                          <span className="block">
                            Previous: {ghostText.previousWeight}lbs × {ghostText.previousReps} reps
                            {ghostText.previousDate && ` on ${new Date(ghostText.previousDate).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder={ghostText.targetWeight ? ghostText.targetWeight.toString() : "0"}
                        step="0.5"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reps">Reps</Label>
                      <Input
                        id="reps"
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder={ghostText.targetReps ? ghostText.targetReps.toString() : "0"}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="formScore">Form Score (1-10)</Label>
                      <Input
                        id="formScore"
                        type="number"
                        value={formScore}
                        onChange={(e) => setFormScore(e.target.value)}
                        placeholder="Optional"
                        min="1"
                        max="10"
                        step="0.5"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleLogSet} 
                        className="w-full gradient-bg"
                        disabled={!weight || !reps}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Log Set
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How did it feel?"
                    />
                  </div>

                  {weight && reps && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm font-medium">
                        Set Volume: {parseFloat(weight) * parseInt(reps)} lbs
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Est. Calories: {Math.round(parseFloat(weight) * parseInt(reps) * 0.1)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Logged Sets */}
            {loggedSets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Sets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {loggedSets.map((set, index) => (
                      <div key={set.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{set.exerciseName}</div>
                          <div className="text-xs text-muted-foreground">
                            {set.reps} reps @ {set.weight}lbs ({set.equipment})
                            {set.formScore && ` • Form: ${set.formScore}/10`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Volume: {set.volume} • {set.timestamp.toLocaleTimeString()}
                          </div>
                          {set.notes && (
                            <div className="text-xs text-muted-foreground italic">"{set.notes}"</div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDeleteSet(set.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}