import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Minus, 
  Save,
  Timer,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface RealSetLoggerProps {
  exerciseId: string;
  exerciseName: string;
  sessionId: string | number;
  currentSets: any[];
  targetSets: number;
  onSetLogged: (setData: any) => void;
}

export function RealSetLogger({ 
  exerciseId, 
  exerciseName, 
  sessionId, 
  currentSets = [],
  targetSets = 3,
  onSetLogged 
}: RealSetLoggerProps) {
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  // Rest timer state
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  
  // Auto-suggest previous weight
  useEffect(() => {
    const lastSet = currentSets[currentSets.length - 1];
    if (lastSet && !weight) {
      setWeight(lastSet.weight.toString());
    }
  }, [currentSets]);
  
  // Rest timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft]);

  const handleLogSet = async () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (isNaN(weightNum) || isNaN(repsNum) || repsNum <= 0) {
      return;
    }
    
    setIsLogging(true);
    
    try {
      const setData = {
        setNumber: currentSets.length + 1,
        weight: weightNum,
        reps: repsNum,
        completed: true,
        rpe: rpe,
        notes: notes.trim() || undefined,
        restTimeSeconds: restTime
      };
      
      await onSetLogged(setData);
      
      // Clear form for next set
      setReps('');
      setNotes('');
      setRpe(7);
      
      // Start rest timer if not the last set
      if (currentSets.length + 1 < targetSets) {
        setIsResting(true);
        setRestSecondsLeft(restTime);
      }
    } catch (error) {
      console.error('Failed to log set:', error);
    } finally {
      setIsLogging(false);
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
  const previousSet = currentSets[currentSets.length - 1];
  const nextSetNumber = currentSets.length + 1;
  const completedSets = currentSets.filter(set => set.completed).length;
  
  return (
    <div className="space-y-4">
      {/* Set Number and Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Log Set {nextSetNumber}</h3>
          <p className="text-sm text-muted-foreground">
            {completedSets}/{targetSets} sets completed
          </p>
        </div>
        <Badge variant={completedSets >= targetSets ? "default" : "secondary"}>
          {completedSets >= targetSets ? "Complete" : "In Progress"}
        </Badge>
      </div>

      {/* Previous set reference */}
      {previousSet && (
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Previous Set:</p>
          <p>{previousSet.weight} lbs × {previousSet.reps} reps = {(previousSet.weight * previousSet.reps).toFixed(0)} lbs volume</p>
        </div>
      )}
      
      {/* Weight input */}
      <div>
        <Label htmlFor="weight">Weight (lbs)</Label>
        <div className="flex gap-2 mt-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustWeight(-5)}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="weight"
            type="number"
            step="5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="text-center text-lg font-semibold"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustWeight(5)}
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
      
      {/* RPE input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>RPE (Rate of Perceived Exertion)</Label>
          <span className="text-sm font-medium">{rpe}/10</span>
        </div>
        <Slider
          value={[rpe]}
          onValueChange={([value]) => setRpe(value)}
          min={1}
          max={10}
          step={1}
          className="mt-1"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Very Easy</span>
          <span>Max Effort</span>
        </div>
      </div>
      
      {/* Volume display */}
      {currentVolume > 0 && (
        <div className="bg-primary/10 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Volume: {currentVolume.toFixed(0)} lbs
            </span>
          </div>
        </div>
      )}
      
      {/* Rest Timer Settings */}
      <div>
        <Label htmlFor="restTime">Rest Time (seconds)</Label>
        <Select value={restTime.toString()} onValueChange={(value) => setRestTime(parseInt(value))}>
          <SelectTrigger id="restTime" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">1 minute</SelectItem>
            <SelectItem value="90">1.5 minutes</SelectItem>
            <SelectItem value="120">2 minutes</SelectItem>
            <SelectItem value="180">3 minutes</SelectItem>
            <SelectItem value="300">5 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
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
          disabled={!weight || !reps || isLogging || completedSets >= targetSets}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLogging ? 'Logging...' : 'Log Set'}
        </Button>
      </div>
      
      {/* Rest timer */}
      {isResting && (
        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Rest Timer</span>
            </div>
            <span className="text-2xl font-bold">{restSecondsLeft}s</span>
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
      {currentSets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Completed Sets</h4>
          {currentSets.map((set, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Set {set.setNumber}
              </span>
              <span className="font-medium">
                {set.weight} lbs × {set.reps} = {(set.weight * set.reps).toFixed(0)} lbs
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}