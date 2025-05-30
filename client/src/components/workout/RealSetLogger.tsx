import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRealWorkoutSession } from "@/hooks/use-real-workout-session";
import { 
  Plus, 
  Minus, 
  Save,
  ChevronLeft,
  ChevronRight,
  Timer,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export function RealSetLogger() {
  const { session, logSet, completeExercise, goToNextExercise, goToPreviousExercise, isLoading } = useRealWorkoutSession();
  
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('barbell');
  const [formScore, setFormScore] = useState<number>(8);
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  
  // Rest timer state
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  
  const currentExercise = session.exercises[session.currentExerciseIndex];
  
  if (!currentExercise) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No exercise selected</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleLogSet = async () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (isNaN(weightNum) || isNaN(repsNum) || repsNum <= 0) {
      return;
    }
    
    await logSet(
      weightNum,
      repsNum,
      equipment,
      formScore,
      notes || undefined
    );
    
    // Clear form for next set
    setWeight('');
    setReps('');
    setNotes('');
    setFormScore(8);
    
    // Start rest timer if not the last set
    if (currentExercise.currentSet < currentExercise.targetSets) {
      setIsResting(true);
      setRestTime(60);
    }
  };
  
  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    setWeight(Math.max(0, current + delta).toString());
  };
  
  const adjustReps = (delta: number) => {
    const current = parseInt(reps) || 0;
    setReps(Math.max(1, current + delta).toString());
  };
  
  // Calculate volume for current set
  const currentVolume = (parseFloat(weight) || 0) * (parseInt(reps) || 0);
  
  // Get previous set data for reference
  const previousSet = currentExercise.sets[currentExercise.sets.length - 1];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{currentExercise.exerciseName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Set {currentExercise.currentSet} of {currentExercise.targetSets}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousExercise}
              disabled={session.currentExerciseIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextExercise}
              disabled={session.currentExerciseIndex === session.exercises.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Previous set reference */}
        {previousSet && (
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Previous Set:</p>
            <p>{previousSet.weight}kg × {previousSet.reps} reps = {(previousSet.weight * previousSet.reps).toFixed(0)}kg volume</p>
          </div>
        )}
        
        {/* Weight input */}
        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustWeight(-2.5)}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="weight"
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className="text-center text-lg font-semibold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustWeight(2.5)}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Reps input */}
        <div>
          <Label htmlFor="reps">Reps</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustReps(-1)}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
              className="text-center text-lg font-semibold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustReps(1)}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Equipment selection */}
        <div>
          <Label htmlFor="equipment">Equipment</Label>
          <Select value={equipment} onValueChange={setEquipment}>
            <SelectTrigger id="equipment" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barbell">Barbell</SelectItem>
              <SelectItem value="dumbbell">Dumbbell</SelectItem>
              <SelectItem value="machine">Machine</SelectItem>
              <SelectItem value="cable">Cable</SelectItem>
              <SelectItem value="bodyweight">Bodyweight</SelectItem>
              <SelectItem value="band">Resistance Band</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Form score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Form Quality</Label>
            <span className="text-sm font-medium">{formScore}/10</span>
          </div>
          <Slider
            value={[formScore]}
            onValueChange={([value]) => setFormScore(value)}
            min={1}
            max={10}
            step={1}
            className="mt-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Poor</span>
            <span>Perfect</span>
          </div>
        </div>
        
        {/* Volume display */}
        {currentVolume > 0 && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Volume: {currentVolume.toFixed(0)}kg
              </span>
            </div>
          </div>
        )}
        
        {/* Notes toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotes(!showNotes)}
          className="w-full"
          type="button"
        >
          {showNotes ? 'Hide Notes' : 'Add Notes'}
        </Button>
        
        {showNotes && (
          <Textarea
            placeholder="Any notes about this set..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleLogSet}
            disabled={!weight || !reps || isLoading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Log Set
          </Button>
          
          {currentExercise.currentSet > currentExercise.targetSets && (
            <Button
              variant="outline"
              onClick={completeExercise}
              disabled={isLoading}
            >
              Complete Exercise
            </Button>
          )}
        </div>
        
        {/* Rest timer */}
        {isResting && (
          <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Rest Timer</span>
              </div>
              <span className="text-2xl font-bold">{restTime}s</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResting(false)}
              className="w-full mt-2"
            >
              Skip Rest
            </Button>
          </div>
        )}
        
        {/* Completed sets */}
        {currentExercise.sets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Completed Sets</h4>
            {currentExercise.sets.map((set, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>Set {set.setNumber}</span>
                <span className="font-medium">
                  {set.weight}kg × {set.reps} = {(set.weight * set.reps).toFixed(0)}kg
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}