import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWorkoutSessionV2, type SetLog } from "@/hooks/use-workout-session-v2";
import { 
  Plus, 
  Minus, 
  CheckCircle, 
  Timer, 
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Save
} from "lucide-react";
import { formatWeight, calculateOneRepMax } from "@/lib/utils";

interface SetLoggerProps {
  exerciseIndex: number;
  onSetCompleted?: (setData: Omit<SetLog, 'setNumber' | 'timestamp'>) => void;
  showHistory?: boolean;
}

export function SetLogger({ exerciseIndex, onSetCompleted, showHistory = true }: SetLoggerProps) {
  const { session, completeSet, updateSet, currentExercise } = useWorkoutSessionV2();
  const exercise = session.exercises[exerciseIndex];
  
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [restTime, setRestTime] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ weight?: string; reps?: string }>({});
  
  // Quick increment values
  const weightIncrements = [2.5, 5, 10, 25, 45];
  const repIncrements = [1, 2, 5];

  useEffect(() => {
    // Pre-populate with previous set data if available
    const lastSet = exercise?.sets[exercise.sets.length - 1];
    if (lastSet && !weight && !reps) {
      setWeight(lastSet.weight.toString());
      setReps(lastSet.reps.toString());
      setRestTime(lastSet.restTime || 60);
    }
  }, [exercise, weight, reps]);

  const validateInputs = (): boolean => {
    const newErrors: { weight?: string; reps?: string } = {};
    
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      newErrors.weight = 'Weight must be a positive number';
    } else if (weightNum > 1000) {
      newErrors.weight = 'Weight cannot exceed 1000 lbs';
    }
    
    if (!reps || isNaN(repsNum) || repsNum <= 0) {
      newErrors.reps = 'Reps must be a positive number';
    } else if (repsNum > 100) {
      newErrors.reps = 'Reps cannot exceed 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    
    try {
      const setData = {
        weight: parseFloat(weight),
        reps: parseInt(reps),
        restTime,
        completed: true
      };
      
      completeSet(exerciseIndex, setData);
      
      // Call optional callback
      if (onSetCompleted) {
        onSetCompleted(setData);
      }
      
      // Reset form for next set
      setWeight('');
      setReps('');
      setErrors({});
      
    } catch (error) {
      console.error('Failed to log set:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustWeight = (increment: number) => {
    const currentWeight = parseFloat(weight) || 0;
    const newWeight = Math.max(0, currentWeight + increment);
    setWeight(newWeight.toString());
  };

  const adjustReps = (increment: number) => {
    const currentReps = parseInt(reps) || 0;
    const newReps = Math.max(0, currentReps + increment);
    setReps(newReps.toString());
  };

  const calculateEstimatedOneRM = (): number | null => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (weightNum > 0 && repsNum > 0) {
      return calculateOneRepMax(weightNum, repsNum);
    }
    return null;
  };

  const resetForm = () => {
    setWeight('');
    setReps('');
    setRestTime(60);
    setErrors({});
  };

  if (!exercise) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">No exercise selected for logging</p>
        </CardContent>
      </Card>
    );
  }

  const estimatedOneRM = calculateEstimatedOneRM();
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const nextSetNumber = exercise.sets.length + 1;

  return (
    <div className="space-y-4">
      {/* Current Exercise Header */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div>
              <span className="text-lg">{exercise.exerciseName}</span>
              <Badge className="ml-2 bg-primary">
                Set {nextSetNumber}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {exercise.sets.length} completed
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Set Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Log Set {nextSetNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Weight Input */}
            <div className="space-y-3">
              <Label htmlFor="weight" className="text-base font-semibold">
                Weight (lbs)
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1000"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    className={`text-lg h-12 ${errors.weight ? 'border-red-500' : ''}`}
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                  )}
                </div>
                
                {/* Weight Quick Adjustments */}
                <div className="flex flex-col gap-1">
                  {weightIncrements.slice(0, 3).map(inc => (
                    <Button
                      key={inc}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustWeight(inc)}
                      className="w-12 h-8 text-xs"
                    >
                      +{inc}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* More Weight Options */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustWeight(-2.5)}
                  className="text-xs"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  2.5
                </Button>
                {weightIncrements.slice(3).map(inc => (
                  <Button
                    key={inc}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(inc)}
                    className="text-xs"
                  >
                    +{inc}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-3">
              <Label htmlFor="reps" className="text-base font-semibold">
                Repetitions
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    id="reps"
                    type="number"
                    min="0"
                    max="100"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="Enter reps"
                    className={`text-lg h-12 ${errors.reps ? 'border-red-500' : ''}`}
                  />
                  {errors.reps && (
                    <p className="text-red-500 text-sm mt-1">{errors.reps}</p>
                  )}
                </div>
                
                {/* Reps Quick Adjustments */}
                <div className="flex flex-col gap-1">
                  {repIncrements.map(inc => (
                    <Button
                      key={inc}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustReps(inc)}
                      className="w-12 h-8 text-xs"
                    >
                      +{inc}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustReps(-1)}
                  className="text-xs"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  1
                </Button>
              </div>
            </div>

            {/* Rest Time */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Rest Time (seconds)
              </Label>
              <div className="flex gap-2">
                {[30, 60, 90, 120, 180].map(time => (
                  <Button
                    key={time}
                    type="button"
                    variant={restTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRestTime(time)}
                  >
                    {time}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Calculated Metrics */}
            {estimatedOneRM && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Estimated 1RM:</span>
                  <span className="text-blue-700 dark:text-blue-300 font-bold">
                    {formatWeight(estimatedOneRM)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !weight || !reps}
                className="flex-1 h-12 text-lg"
              >
                {isSubmitting ? (
                  <Timer className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? 'Logging...' : 'Complete Set'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="h-12"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Previous Sets History */}
      {showHistory && exercise.sets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              Previous Sets ({exercise.sets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exercise.sets.map((set, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Set {set.setNumber}</Badge>
                    <span className="font-mono text-lg">
                      {formatWeight(set.weight)} × {set.reps}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {set.restTime && (
                      <span className="text-sm text-muted-foreground">
                        {set.restTime}s rest
                      </span>
                    )}
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Set Summary */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Volume:</span>
                  <span className="font-bold ml-2">
                    {exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0).toLocaleString()} lbs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Weight:</span>
                  <span className="font-bold ml-2">
                    {formatWeight(Math.max(...exercise.sets.map(s => s.weight)))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SetLogger;