import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { WizardData } from "../goal-wizard";
import type { Exercise } from "@/lib/supabase";
import {
  Scale,
  Dumbbell,
  TrendingDown,
  Target,
  Activity,
  AlertCircle,
  Info,
  Calculator
} from "lucide-react";

interface TargetMetricsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: string[];
}

export function TargetMetrics({ data, updateData }: TargetMetricsProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Fetch exercises for strength goals
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      const response = await fetch('/api/exercises');
      if (!response.ok) throw new Error('Failed to fetch exercises');
      const result = await response.json();
      return result.data?.exercises || [];
    },
    enabled: data.goalType === 'strength_gain'
  });

  // Update selected exercise when exercise ID changes
  useEffect(() => {
    if (data.targetExerciseId && exercises.length > 0) {
      const exercise = exercises.find(ex => ex.id === data.targetExerciseId);
      setSelectedExercise(exercise || null);
    }
  }, [data.targetExerciseId, exercises]);

  // Calculate goal metrics
  const calculateWeightLossMetrics = () => {
    if (!data.startWeightLbs || !data.targetWeightLbs) return null;
    
    const weightToLose = data.startWeightLbs - data.targetWeightLbs;
    const percentageLoss = (weightToLose / data.startWeightLbs) * 100;
    const weeksNeeded = Math.ceil(weightToLose / 1.5); // 1-2 lbs per week is healthy
    
    return {
      weightToLose,
      percentageLoss,
      weeksNeeded,
      isHealthyRate: weightToLose <= data.startWeightLbs * 0.2 // Max 20% body weight
    };
  };

  const renderWeightLossMetrics = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentWeight" className="text-base font-semibold">
            Current Weight (lbs) *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Your starting weight for tracking progress
          </p>
          <div className="relative">
            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="currentWeight"
              type="number"
              placeholder="Enter current weight"
              value={data.startWeightLbs || ''}
              onChange={(e) => updateData({ startWeightLbs: parseFloat(e.target.value) || undefined })}
              className="pl-10"
              min="50"
              max="500"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="targetWeight" className="text-base font-semibold">
            Target Weight (lbs) *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Your desired weight goal
          </p>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="targetWeight"
              type="number"
              placeholder="Enter target weight"
              value={data.targetWeightLbs || ''}
              onChange={(e) => updateData({ targetWeightLbs: parseFloat(e.target.value) || undefined })}
              className="pl-10"
              min="50"
              max="500"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentBodyFat" className="text-base font-semibold">
            Current Body Fat % (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            If known, helps track body composition
          </p>
          <Input
            id="currentBodyFat"
            type="number"
            placeholder="e.g., 20"
            value={data.startBodyFatPercentage || ''}
            onChange={(e) => updateData({ startBodyFatPercentage: parseFloat(e.target.value) || undefined })}
            min="5"
            max="50"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="targetBodyFat" className="text-base font-semibold">
            Target Body Fat % (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Your body fat percentage goal
          </p>
          <Input
            id="targetBodyFat"
            type="number"
            placeholder="e.g., 15"
            value={data.targetBodyFatPercentage || ''}
            onChange={(e) => updateData({ targetBodyFatPercentage: parseFloat(e.target.value) || undefined })}
            min="5"
            max="50"
            step="0.1"
          />
        </div>
      </div>

      {/* Weight Loss Calculations */}
      {data.startWeightLbs && data.targetWeightLbs && (() => {
        const metrics = calculateWeightLossMetrics();
        if (!metrics) return null;

        return (
          <Card className={`${metrics.isHealthyRate ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Goal Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-semibold text-lg">{metrics.weightToLose.toFixed(1)}</div>
                  <div className="text-muted-foreground">lbs to lose</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-semibold text-lg">{metrics.percentageLoss.toFixed(1)}%</div>
                  <div className="text-muted-foreground">body weight</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-semibold text-lg">{metrics.weeksNeeded}</div>
                  <div className="text-muted-foreground">weeks needed</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="font-semibold text-lg">{(metrics.weightToLose / metrics.weeksNeeded).toFixed(1)}</div>
                  <div className="text-muted-foreground">lbs/week</div>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                metrics.isHealthyRate ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {metrics.isHealthyRate ? (
                  <Info className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {metrics.isHealthyRate 
                    ? 'This is a healthy and achievable weight loss goal!'
                    : 'Consider a more gradual approach - losing 1-2 lbs per week is recommended.'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );

  const renderStrengthMetrics = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Select Exercise *
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose the exercise you want to improve
        </p>
        <Select 
          value={data.targetExerciseId || ''} 
          onValueChange={(value) => updateData({ targetExerciseId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an exercise..." />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {exercise.category}
                  </Badge>
                  {exercise.exerciseName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedExercise && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{selectedExercise.exerciseName}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Category: {selectedExercise.category}</span>
                  <span>•</span>
                  <span>Equipment: {selectedExercise.equipmentType.join(', ')}</span>
                  <span>•</span>
                  <span>Difficulty: {selectedExercise.difficultyLevel}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Primary muscles:</span> {selectedExercise.primaryMuscles.join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentMaxWeight" className="text-base font-semibold">
            Current Max Weight (lbs)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Your current best weight for this exercise
          </p>
          <Input
            id="currentMaxWeight"
            type="number"
            placeholder="Enter current max"
            value={data.startExerciseMaxWeightLbs || ''}
            onChange={(e) => updateData({ startExerciseMaxWeightLbs: parseFloat(e.target.value) || undefined })}
            min="0"
            step="5"
          />
        </div>

        <div>
          <Label htmlFor="currentMaxReps" className="text-base font-semibold">
            Current Max Reps
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Most reps you can do with good form
          </p>
          <Input
            id="currentMaxReps"
            type="number"
            placeholder="Enter current max reps"
            value={data.startExerciseMaxReps || ''}
            onChange={(e) => updateData({ startExerciseMaxReps: parseFloat(e.target.value) || undefined })}
            min="1"
            step="1"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Choose Your Target (select at least one)
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetWeight" className="text-base font-semibold">
              Target Weight (lbs)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Weight you want to lift
            </p>
            <Input
              id="targetWeight"
              type="number"
              placeholder="Enter target weight"
              value={data.targetWeightForExerciseLbs || ''}
              onChange={(e) => updateData({ targetWeightForExerciseLbs: parseFloat(e.target.value) || undefined })}
              min="0"
              step="5"
            />
          </div>

          <div>
            <Label htmlFor="targetReps" className="text-base font-semibold">
              Target Reps
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Number of reps you want to achieve
            </p>
            <Input
              id="targetReps"
              type="number"
              placeholder="Enter target reps"
              value={data.targetRepsForExercise || ''}
              onChange={(e) => updateData({ targetRepsForExercise: parseFloat(e.target.value) || undefined })}
              min="1"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Strength Goal Analysis */}
      {(data.targetWeightForExerciseLbs || data.targetRepsForExercise) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Strength Goal Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.targetWeightForExerciseLbs && data.startExerciseMaxWeightLbs && (
              <div className="p-3 bg-white rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +{(data.targetWeightForExerciseLbs - data.startExerciseMaxWeightLbs).toFixed(0)} lbs
                  </div>
                  <div className="text-sm text-muted-foreground">Weight increase goal</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(((data.targetWeightForExerciseLbs - data.startExerciseMaxWeightLbs) / data.startExerciseMaxWeightLbs) * 100).toFixed(1)}% improvement
                  </div>
                </div>
              </div>
            )}
            
            {data.targetRepsForExercise && data.startExerciseMaxReps && (
              <div className="p-3 bg-white rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    +{data.targetRepsForExercise - data.startExerciseMaxReps} reps
                  </div>
                  <div className="text-sm text-muted-foreground">Rep increase goal</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(((data.targetRepsForExercise - data.startExerciseMaxReps) / data.startExerciseMaxReps) * 100).toFixed(1)}% improvement
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderBodyCompositionMetrics = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentWeight" className="text-base font-semibold">
            Current Weight (lbs) *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Starting point for body composition tracking
          </p>
          <Input
            id="currentWeight"
            type="number"
            placeholder="Enter current weight"
            value={data.startWeightLbs || ''}
            onChange={(e) => updateData({ startWeightLbs: parseFloat(e.target.value) || undefined })}
            min="50"
            max="500"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="targetWeight" className="text-base font-semibold">
            Target Weight (lbs)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Desired weight (may stay same for recomposition)
          </p>
          <Input
            id="targetWeight"
            type="number"
            placeholder="Enter target weight"
            value={data.targetWeightLbs || ''}
            onChange={(e) => updateData({ targetWeightLbs: parseFloat(e.target.value) || undefined })}
            min="50"
            max="500"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentBodyFat" className="text-base font-semibold">
            Current Body Fat % *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Essential for body composition goals
          </p>
          <Input
            id="currentBodyFat"
            type="number"
            placeholder="e.g., 20"
            value={data.startBodyFatPercentage || ''}
            onChange={(e) => updateData({ startBodyFatPercentage: parseFloat(e.target.value) || undefined })}
            min="5"
            max="50"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="targetBodyFat" className="text-base font-semibold">
            Target Body Fat % *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Your body composition goal
          </p>
          <Input
            id="targetBodyFat"
            type="number"
            placeholder="e.g., 15"
            value={data.targetBodyFatPercentage || ''}
            onChange={(e) => updateData({ targetBodyFatPercentage: parseFloat(e.target.value) || undefined })}
            min="5"
            max="50"
            step="0.1"
          />
        </div>
      </div>

      {/* Body Composition Analysis */}
      {data.startBodyFatPercentage && data.targetBodyFatPercentage && data.startWeightLbs && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Body Composition Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {(data.startBodyFatPercentage - data.targetBodyFatPercentage).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">fat to lose</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {((data.startWeightLbs * data.startBodyFatPercentage / 100) - 
                    (data.startWeightLbs * data.targetBodyFatPercentage / 100)).toFixed(1)}
                </div>
                <div className="text-muted-foreground">lbs fat loss</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {(data.startWeightLbs * (100 - data.startBodyFatPercentage) / 100).toFixed(1)}
                </div>
                <div className="text-muted-foreground">current muscle</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {((data.targetWeightLbs || data.startWeightLbs) * (100 - data.targetBodyFatPercentage) / 100).toFixed(1)}
                </div>
                <div className="text-muted-foreground">target muscle</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render appropriate metrics based on goal type
  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">
          {data.goalType === 'weight_loss' && 'Weight Loss Targets'}
          {data.goalType === 'strength_gain' && 'Strength Training Targets'}
          {data.goalType === 'body_composition' && 'Body Composition Targets'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Set specific, measurable targets to track your progress effectively
        </p>
      </div>

      {data.goalType === 'weight_loss' && renderWeightLossMetrics()}
      {data.goalType === 'strength_gain' && renderStrengthMetrics()}
      {data.goalType === 'body_composition' && renderBodyCompositionMetrics()}
    </div>
  );
}