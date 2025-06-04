import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWorkoutSessionV2, type SetLog } from "@/hooks/use-workout-session-v2";
import { useUserProfile } from "@/hooks/use-user-profile";
import ProfileSetupDialog from "@/components/ProfileSetupDialog";
import AdditionalWeightInput from "@/components/workout/AdditionalWeightInput";
import { 
  Plus, 
  Minus, 
  CheckCircle, 
  Timer, 
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Save,
  Weight,
  User,
  Info
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
  
  // User profile for body weight auto-population
  const { 
    bodyStats, 
    hasBodyWeight, 
    isProfileCompleteForBodyweight,
    updateBodyStats,
    saveAdditionalWeightPreference,
    getAdditionalWeightPreference
  } = useUserProfile();
  
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [restTime, setRestTime] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ weight?: string; reps?: string }>({});
  
  // Bodyweight exercise state
  const [isBodyweight, setIsBodyweight] = useState<boolean>(false);
  const [isCheckingBodyweight, setIsCheckingBodyweight] = useState<boolean>(false);
  const [showProfileDialog, setShowProfileDialog] = useState<boolean>(false);
  const [autoPopulatedWeight, setAutoPopulatedWeight] = useState<number | null>(null);
  const [showAdditionalWeight, setShowAdditionalWeight] = useState<boolean>(false);
  const [additionalWeight, setAdditionalWeight] = useState<number>(0);
  const [additionalEquipment, setAdditionalEquipment] = useState<string>('dumbbells');
  
  // Error state for component-level issues
  const [componentError, setComponentError] = useState<string | null>(null);
  
  // Quick increment values
  const weightIncrements = [2.5, 5, 10, 25, 45];
  const repIncrements = [1, 2, 5];

  // Check if current exercise is bodyweight exercise with comprehensive error handling
  useEffect(() => {
    const checkBodyweight = async () => {
      // Enhanced validation for exercise data
      if (!exercise?.exerciseId) {
        setIsBodyweight(false);
        setIsCheckingBodyweight(false);
        return;
      }

      // Validate exercise ID format
      const exerciseId = exercise.exerciseId;
      if (typeof exerciseId !== 'string' && typeof exerciseId !== 'number') {
        console.warn('Invalid exercise ID format:', exerciseId);
        setIsBodyweight(false);
        setIsCheckingBodyweight(false);
        return;
      }
      
      setIsCheckingBodyweight(true);
      setComponentError(null); // Clear previous errors
      
      try {
        // Add timeout for API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`/api/exercises/is-bodyweight/${exerciseId}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // Validate response structure
          if (typeof data === 'object' && data !== null && 'isBodyweight' in data) {
            const exerciseIsBodyweight = Boolean(data.isBodyweight);
            setIsBodyweight(exerciseIsBodyweight);
            
            // Clear any previous errors on success
            if (componentError?.includes('Failed to detect exercise type')) {
              setComponentError(null);
            }
          } else {
            throw new Error('Invalid response format from bodyweight detection API');
          }
        } else {
          // Handle different HTTP error codes
          let errorMessage = 'Failed to detect exercise type.';
          
          if (response.status === 404) {
            errorMessage = 'Exercise not found in database.';
          } else if (response.status === 500) {
            errorMessage = 'Server error during exercise detection.';
          } else if (response.status >= 400 && response.status < 500) {
            errorMessage = 'Invalid exercise data provided.';
          }
          
          throw new Error(`${errorMessage} (Status: ${response.status})`);
        }
      } catch (error) {
        console.error('Error checking if exercise is bodyweight:', error);
        
        // Handle different error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setComponentError('Network error: Could not connect to exercise database. Using manual detection.');
        } else if (error instanceof Error && error.name === 'AbortError') {
          setComponentError('Request timeout: Exercise detection took too long. Using manual detection.');
        } else {
          setComponentError('Failed to detect exercise type. Using manual detection.');
        }
        
        // Enhanced fallback detection with error handling
        try {
          const equipmentTypes: any = exercise.exercise?.equipment || exercise.exercise?.equipmentType || [];
          let fallbackIsBodyweight = false;
          
          if (Array.isArray(equipmentTypes)) {
            fallbackIsBodyweight = equipmentTypes.some((eq: any) => {
              if (typeof eq === 'string') {
                return eq.toLowerCase().includes('bodyweight') || eq.toLowerCase().includes('body weight');
              } else if (typeof eq === 'object' && eq !== null && eq.name) {
                return typeof eq.name === 'string' && 
                       (eq.name.toLowerCase().includes('bodyweight') || eq.name.toLowerCase().includes('body weight'));
              }
              return false;
            });
          } else if (typeof equipmentTypes === 'string') {
            fallbackIsBodyweight = equipmentTypes.toLowerCase().includes('bodyweight') || 
                                   equipmentTypes.toLowerCase().includes('body weight');
          }
          
          // Additional fallback: check exercise name for bodyweight indicators
          if (!fallbackIsBodyweight && exercise.exerciseName) {
            const exerciseName = exercise.exerciseName.toLowerCase();
            const bodyweightKeywords = ['push-up', 'pushup', 'pull-up', 'pullup', 'chin-up', 'chinup', 
                                        'dip', 'squat', 'lunge', 'plank', 'burpee', 'mountain climber'];
            fallbackIsBodyweight = bodyweightKeywords.some(keyword => exerciseName.includes(keyword));
          }
          
          setIsBodyweight(fallbackIsBodyweight);
          
          // Update error message to indicate fallback was successful
          if (fallbackIsBodyweight) {
            setComponentError('Exercise detected as bodyweight using fallback method. Auto-population enabled.');
          }
          
        } catch (fallbackError) {
          console.error('Fallback bodyweight detection failed:', fallbackError);
          setIsBodyweight(false); // Default to not bodyweight if all detection fails
          setComponentError('Could not determine exercise type. Please enter weight manually.');
        }
      } finally {
        setIsCheckingBodyweight(false);
      }
    };

    checkBodyweight();
  }, [exercise?.exerciseId, exercise?.exercise, exercise?.exerciseName, componentError]);

  // Load saved additional weight preferences for bodyweight exercises with enhanced error handling
  useEffect(() => {
    if (!isBodyweight || !exercise?.exerciseId || isCheckingBodyweight) return;

    try {
      // Enhanced exercise ID validation
      const exerciseId = exercise.exerciseId;
      if (exerciseId === null || exerciseId === undefined) {
        console.warn('Exercise ID is null or undefined, skipping preference loading');
        return;
      }

      const exerciseIdString = exerciseId.toString();
      if (!exerciseIdString || exerciseIdString.trim() === '') {
        console.warn('Exercise ID converts to empty string, skipping preference loading');
        return;
      }

      // Attempt to load saved preferences with error boundaries
      let savedPreference;
      try {
        savedPreference = getAdditionalWeightPreference(exerciseIdString);
      } catch (prefError) {
        console.warn('Error calling getAdditionalWeightPreference:', prefError);
        return; // Exit gracefully if preference function fails
      }
      
      if (savedPreference) {
        // Enhanced validation with detailed logging
        const additionalWeight = savedPreference.additionalWeight;
        const equipment = savedPreference.equipment;
        
        // Validate additional weight with edge case handling
        const validAdditionalWeight = typeof additionalWeight === 'number' 
          && !isNaN(additionalWeight)
          && Number.isFinite(additionalWeight)
          && additionalWeight >= 0 
          && additionalWeight <= 500;
        
        // Validate equipment with comprehensive options
        const validEquipmentOptions = ['dumbbells', 'weighted_vest', 'weight_belt', 'backpack'];
        const validEquipment = typeof equipment === 'string' 
          && equipment.trim() !== ''
          && validEquipmentOptions.includes(equipment);
        
        if (validAdditionalWeight && validEquipment) {
          try {
            setAdditionalWeight(additionalWeight);
            setAdditionalEquipment(equipment);
            
            // Only show additional weight input if user previously used additional weight
            if (additionalWeight > 0) {
              setShowAdditionalWeight(true);
            }
            
            console.log(`Loaded additional weight preference: ${additionalWeight} lbs (${equipment}) for exercise ${exerciseIdString}`);
          } catch (stateError) {
            console.warn('Error setting preference state:', stateError);
            // Reset to safe defaults if state update fails
            setAdditionalWeight(0);
            setAdditionalEquipment('dumbbells');
            setShowAdditionalWeight(false);
          }
        } else {
          console.warn('Invalid saved preference data, using defaults:', {
            exerciseId: exerciseIdString,
            additionalWeight,
            validAdditionalWeight,
            equipment,
            validEquipment,
            savedPreference
          });
          
          // Use safe defaults for invalid preferences
          setAdditionalWeight(0);
          setAdditionalEquipment('dumbbells');
          setShowAdditionalWeight(false);
        }
      } else {
        // No saved preferences - set defaults explicitly
        setAdditionalWeight(0);
        setAdditionalEquipment('dumbbells');
        setShowAdditionalWeight(false);
      }
    } catch (error) {
      console.warn('Failed to load additional weight preferences:', error);
      
      // Set safe defaults on any error
      try {
        setAdditionalWeight(0);
        setAdditionalEquipment('dumbbells');
        setShowAdditionalWeight(false);
      } catch (defaultError) {
        console.error('Failed to set default preference values:', defaultError);
        // This is a critical state error - component may not function properly
      }
      
      // This is non-blocking - continue without saved preferences
    }
  }, [isBodyweight, exercise?.exerciseId, isCheckingBodyweight, getAdditionalWeightPreference]);

  // Auto-populate weight for bodyweight exercises
  useEffect(() => {
    if (!isBodyweight || isCheckingBodyweight) return;
    
    // Only skip if weight was manually entered (not from auto-population)
    if (weight && !autoPopulatedWeight) return;

    try {
      if (hasBodyWeight && bodyStats?.bodyWeight) {
        // Validate body weight data
        const bodyWeight = bodyStats.bodyWeight;
        if (typeof bodyWeight === 'number' && bodyWeight > 0 && bodyWeight <= 500) {
          // Validate additional weight
          const validAdditionalWeight = typeof additionalWeight === 'number' 
            && additionalWeight >= 0 
            && additionalWeight <= 500;
          
          if (validAdditionalWeight) {
            const totalWeight = bodyWeight + additionalWeight;
            // Final validation on total weight
            if (totalWeight > 0 && totalWeight <= 1000) {
              setWeight(totalWeight.toString());
              setAutoPopulatedWeight(bodyWeight);
            } else {
              console.warn('Total weight out of valid range:', totalWeight);
              setWeight(bodyWeight.toString()); // Fallback to body weight only
              setAutoPopulatedWeight(bodyWeight);
            }
          } else {
            console.warn('Invalid additional weight, using body weight only:', additionalWeight);
            setWeight(bodyWeight.toString());
            setAutoPopulatedWeight(bodyWeight);
          }
        } else {
          console.warn('Invalid body weight data:', bodyWeight);
          // Don't auto-populate with invalid data
        }
      } else if (isBodyweight && !hasBodyWeight) {
        // Show profile setup for bodyweight exercises when body weight is missing
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error('Error in bodyweight auto-population:', error);
      // Don't auto-populate if there's an error - let user enter manually
    }
  }, [isBodyweight, hasBodyWeight, bodyStats?.bodyWeight, weight, isCheckingBodyweight, additionalWeight]);

  // Pre-populate with previous set data if available (non-bodyweight or if no auto-population)
  useEffect(() => {
    const lastSet = exercise?.sets[exercise.sets.length - 1];
    if (lastSet && !weight && !reps && (!isBodyweight || !hasBodyWeight)) {
      setWeight(lastSet.weight.toString());
      setReps(lastSet.reps.toString());
      setRestTime(lastSet.restTime || 60);
    }
  }, [exercise, weight, reps, isBodyweight, hasBodyWeight]);

  const validateInputs = (): boolean => {
    const newErrors: { weight?: string; reps?: string } = {};
    
    try {
      // Weight validation with enhanced checks
      const trimmedWeight = weight.trim();
      if (!trimmedWeight) {
        newErrors.weight = 'Weight is required';
      } else {
        const weightNum = parseFloat(trimmedWeight);
        if (isNaN(weightNum)) {
          newErrors.weight = 'Weight must be a valid number';
        } else if (weightNum <= 0) {
          newErrors.weight = 'Weight must be greater than 0';
        } else if (weightNum > 1000) {
          newErrors.weight = 'Weight cannot exceed 1000 lbs';
        } else if (weightNum < 0.1) {
          newErrors.weight = 'Weight must be at least 0.1 lbs';
        } else if (!Number.isFinite(weightNum)) {
          newErrors.weight = 'Weight must be a finite number';
        }
        
        // Special validation for bodyweight exercises
        if (isBodyweight && bodyStats?.bodyWeight && !newErrors.weight) {
          const bodyWeight = bodyStats.bodyWeight;
          if (weightNum < bodyWeight * 0.5) {
            newErrors.weight = `Weight seems too low for bodyweight exercise (your body weight: ${bodyWeight} lbs)`;
          } else if (weightNum > bodyWeight + 500) {
            newErrors.weight = `Weight seems too high for bodyweight exercise (max recommended: ${bodyWeight + 500} lbs)`;
          }
        }
      }
      
      // Reps validation with enhanced checks
      const trimmedReps = reps.trim();
      if (!trimmedReps) {
        newErrors.reps = 'Reps are required';
      } else {
        const repsNum = parseInt(trimmedReps, 10);
        if (isNaN(repsNum)) {
          newErrors.reps = 'Reps must be a valid number';
        } else if (repsNum <= 0) {
          newErrors.reps = 'Reps must be greater than 0';
        } else if (repsNum > 100) {
          newErrors.reps = 'Reps cannot exceed 100';
        } else if (!Number.isInteger(repsNum)) {
          newErrors.reps = 'Reps must be a whole number';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
      
    } catch (error) {
      console.error('Error during input validation:', error);
      setErrors({ weight: 'Validation error occurred', reps: 'Please check your inputs' });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    setErrors({}); // Clear any previous errors
    
    try {
      // Parse and validate data one more time before submission
      const weightNum = parseFloat(weight.trim());
      const repsNum = parseInt(reps.trim(), 10);
      
      // Final sanity checks
      if (!Number.isFinite(weightNum) || !Number.isFinite(repsNum)) {
        throw new Error('Invalid weight or reps values');
      }
      
      if (weightNum <= 0 || repsNum <= 0) {
        throw new Error('Weight and reps must be positive');
      }
      
      const setData = {
        weight: weightNum,
        reps: repsNum,
        restTime: Math.max(0, restTime), // Ensure rest time is non-negative
        completed: true
      };
      
      // Validate set data structure
      if (!setData.weight || !setData.reps) {
        throw new Error('Invalid set data structure');
      }
      
      // Submit the set
      await completeSet(exerciseIndex, setData);
      
      // Call optional callback with error handling
      if (onSetCompleted) {
        try {
          await onSetCompleted(setData);
        } catch (callbackError) {
          console.warn('Set callback failed, but set was logged successfully:', callbackError);
          // Don't block the main flow if callback fails
        }
      }
      
      // Reset form for next set only after successful submission
      setWeight('');
      setReps('');
      setErrors({});
      
      // Clear auto-population state for next set
      setAutoPopulatedWeight(null);
      
    } catch (error) {
      console.error('Failed to log set:', error);
      
      // Set user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while logging the set';
      
      setErrors({ 
        weight: errorMessage.includes('weight') ? errorMessage : undefined,
        reps: errorMessage.includes('reps') ? errorMessage : undefined
      });
      
      // If no specific field error, show general error
      if (!errorMessage.includes('weight') && !errorMessage.includes('reps')) {
        setErrors({ weight: 'Failed to log set. Please try again.' });
      }
      
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
    const currentReps = parseInt(reps, 10) || 0;
    const newReps = Math.max(0, currentReps + increment);
    setReps(newReps.toString());
  };

  const handleProfileSave = async (bodyStatsData: any) => {
    try {
      await updateBodyStats(bodyStatsData);
      setShowProfileDialog(false);
      
      // Auto-populate weight after profile is saved
      if (bodyStatsData.bodyWeight && isBodyweight) {
        setWeight(bodyStatsData.bodyWeight.toString());
        setAutoPopulatedWeight(bodyStatsData.bodyWeight);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const resetAutoPopulation = () => {
    setAutoPopulatedWeight(null);
    setWeight('');
    setShowAdditionalWeight(false);
    setAdditionalWeight(0);
  };

  const handleAdditionalWeightChange = async (totalWeight: number, additionalWt: number, equipment: string) => {
    try {
      // Enhanced validation for parameters
      if (typeof totalWeight !== 'number' || isNaN(totalWeight) || !Number.isFinite(totalWeight)) {
        console.warn('Invalid totalWeight parameter:', totalWeight);
        return;
      }
      
      if (typeof additionalWt !== 'number' || isNaN(additionalWt) || !Number.isFinite(additionalWt)) {
        console.warn('Invalid additionalWeight parameter:', additionalWt);
        return;
      }
      
      if (typeof equipment !== 'string' || equipment.trim() === '') {
        console.warn('Invalid equipment parameter:', equipment);
        return;
      }
      
      // Validate business logic constraints
      if (additionalWt < 0 || additionalWt > 500) {
        console.warn('Additional weight out of valid range:', additionalWt);
        return;
      }
      
      if (totalWeight < 0 || totalWeight > 1000) {
        console.warn('Total weight out of valid range:', totalWeight);
        return;
      }
      
      // Ensure this is actually a bodyweight exercise before processing
      if (!isBodyweight) {
        console.warn('Attempted to set additional weight on non-bodyweight exercise');
        return;
      }
      
      // Validate bodyStats availability
      if (!bodyStats?.bodyWeight) {
        console.warn('Body weight not available for additional weight calculation');
        setComponentError('Body weight required for additional weight calculation. Please add your body weight first.');
        return;
      }
      
      // Validate that totalWeight calculation makes sense
      const expectedTotal = bodyStats.bodyWeight + additionalWt;
      if (Math.abs(totalWeight - expectedTotal) > 0.1) { // Allow small floating point differences
        console.warn('Total weight calculation mismatch:', {
          provided: totalWeight,
          expected: expectedTotal,
          bodyWeight: bodyStats.bodyWeight,
          additional: additionalWt
        });
        // Use calculated value instead of provided value
        totalWeight = expectedTotal;
      }
      
      // Update state with validated values
      try {
        setWeight(totalWeight.toString());
        setAdditionalWeight(additionalWt);
        setAdditionalEquipment(equipment);
      } catch (stateError) {
        console.error('Failed to update component state:', stateError);
        setComponentError('Failed to update weight values. Please try again.');
        return;
      }
      
      // Save preference for this exercise with comprehensive error handling
      if (exercise?.exerciseId) {
        try {
          const exerciseIdString = exercise.exerciseId.toString();
          if (!exerciseIdString || exerciseIdString.trim() === '') {
            throw new Error('Invalid exercise ID for preference saving');
          }
          
          await saveAdditionalWeightPreference(exerciseIdString, additionalWt, equipment);
          
          console.log(`Saved additional weight preference: ${additionalWt} lbs (${equipment}) for exercise ${exerciseIdString}`);
        } catch (error) {
          console.warn('Failed to save additional weight preference:', error);
          
          // Show user-friendly error message but don't block workflow
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              setComponentError('Could not save weight preference (network issue). Preference will be remembered this session.');
            } else {
              setComponentError('Could not save weight preference. It will be remembered this session.');
            }
          }
          
          // Clear error after a few seconds so it doesn't persist
          setTimeout(() => {
            setComponentError(null);
          }, 5000);
        }
      } else {
        console.warn('No exercise ID available for preference saving');
      }
    } catch (error) {
      console.error('Critical error in handleAdditionalWeightChange:', error);
      setComponentError('Error updating additional weight. Please try refreshing the page.');
    }
  };

  const calculateEstimatedOneRM = (): number | null => {
    try {
      // Enhanced validation for weight and reps inputs
      if (!weight || weight.trim() === '') {
        return null;
      }
      
      if (!reps || reps.trim() === '') {
        return null;
      }
      
      const weightNum = parseFloat(weight.trim());
      const repsNum = parseInt(reps.trim(), 10);
      
      // Comprehensive validation
      if (isNaN(weightNum) || isNaN(repsNum)) {
        return null;
      }
      
      if (!Number.isFinite(weightNum) || !Number.isFinite(repsNum)) {
        return null;
      }
      
      if (weightNum <= 0 || repsNum <= 0) {
        return null;
      }
      
      // Business logic validation
      if (weightNum > 1000 || repsNum > 100) {
        return null; // Unrealistic values
      }
      
      try {
        const oneRM = calculateOneRepMax(weightNum, repsNum);
        
        // Validate the calculated result
        if (typeof oneRM !== 'number' || isNaN(oneRM) || !Number.isFinite(oneRM) || oneRM <= 0) {
          console.warn('Invalid 1RM calculation result:', oneRM);
          return null;
        }
        
        return oneRM;
      } catch (calculationError) {
        console.warn('Error in 1RM calculation:', calculationError);
        return null;
      }
    } catch (error) {
      console.warn('Error in calculateEstimatedOneRM:', error);
      return null;
    }
  };

  const resetForm = () => {
    try {
      setWeight('');
      setReps('');
      setRestTime(60);
      setErrors({});
      
      // Clear auto-population state
      setAutoPopulatedWeight(null);
      
      // Don't reset additional weight preferences - those should persist
      // Only reset if user explicitly wants to clear additional weight
    } catch (error) {
      console.error('Error resetting form:', error);
      // If state updates fail, at least try to clear errors
      try {
        setErrors({});
      } catch (errorResetError) {
        console.error('Failed to reset errors:', errorResetError);
      }
    }
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
      {/* Component Error Alert - Enhanced Mobile Layout */}
      {componentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="flex-1 text-sm">{componentError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComponentError(null)}
                className="h-8 touch-manipulation self-end sm:self-auto"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State for Bodyweight Detection - Enhanced with Progress */}
      {isCheckingBodyweight && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-800">
                  Analyzing exercise type...
                </span>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
            {/* Bodyweight Exercise Alert - Enhanced Mobile Layout */}
            {isBodyweight && !hasBodyWeight && (
              <Alert className="border-orange-200 bg-orange-50">
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-orange-800">
                        This is a bodyweight exercise.
                      </span>
                      <p className="text-xs text-orange-700 mt-1">
                        Add your body weight to enable automatic weight population and progress tracking.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setShowProfileDialog(true)}
                      className="h-10 sm:h-8 touch-manipulation bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <User className="w-4 h-4 mr-2 sm:mr-1" />
                      <span className="sm:text-xs">Add Body Weight</span>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Bodyweight Auto-Population Info - Enhanced Mobile Layout */}
            {isBodyweight && hasBodyWeight && autoPopulatedWeight && (
              <Alert className="border-green-200 bg-green-50">
                <Weight className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-green-800">
                        Auto-populated with your body weight ({autoPopulatedWeight} lbs)
                        {additionalWeight > 0 && (
                          <span className="block sm:inline">
                            {' '}+ {additionalWeight} lbs ({additionalEquipment.replace('_', ' ')})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!showAdditionalWeight && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAdditionalWeight(true)}
                          className="text-xs h-8 touch-manipulation"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Add Weight</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetAutoPopulation}
                        className="text-xs h-8 touch-manipulation"
                      >
                        <span className="hidden sm:inline">Manual Entry</span>
                        <span className="sm:hidden">Manual</span>
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Additional Weight Input for Bodyweight Exercises */}
            {isBodyweight && hasBodyWeight && showAdditionalWeight && bodyStats?.bodyWeight && (
              <AdditionalWeightInput
                bodyWeight={bodyStats.bodyWeight}
                onWeightChange={handleAdditionalWeightChange}
                initialAdditionalWeight={additionalWeight}
                initialEquipment={additionalEquipment}
                disabled={isSubmitting}
              />
            )}

            {/* Weight Input */}
            <div className="space-y-3">
              <Label htmlFor="weight" className="text-base font-semibold flex items-center gap-2">
                <Weight className="w-4 h-4" />
                Weight (lbs)
                {isBodyweight && autoPopulatedWeight && (
                  <Badge variant="secondary" className="text-xs">
                    Body Weight
                  </Badge>
                )}
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
                    className={`text-lg h-12 sm:h-10 ${errors.weight ? 'border-red-500' : ''}`}
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                  )}
                </div>
                
                {/* Weight Quick Adjustments */}
                <div className="hidden sm:flex flex-col gap-1">
                  {weightIncrements.slice(0, 3).map(inc => (
                    <Button
                      key={inc}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustWeight(inc)}
                      className="w-12 h-8 text-xs touch-manipulation"
                    >
                      +{inc}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* More Weight Options - Mobile Grid Layout */}
              <div className="grid grid-cols-3 sm:flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustWeight(-2.5)}
                  className="text-xs h-10 sm:h-8 touch-manipulation"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  2.5
                </Button>
                {/* Show first 3 increments on mobile, all on desktop */}
                {weightIncrements.slice(0, 2).map(inc => (
                  <Button
                    key={inc}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(inc)}
                    className="text-xs h-10 sm:h-8 touch-manipulation"
                  >
                    +{inc}
                  </Button>
                ))}
                {/* Show remaining increments only on desktop */}
                {weightIncrements.slice(2).map(inc => (
                  <Button
                    key={inc}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(inc)}
                    className="text-xs h-10 sm:h-8 touch-manipulation hidden sm:inline-flex"
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
                    className={`text-lg h-12 sm:h-10 ${errors.reps ? 'border-red-500' : ''}`}
                  />
                  {errors.reps && (
                    <p className="text-red-500 text-sm mt-1">{errors.reps}</p>
                  )}
                </div>
                
                {/* Reps Quick Adjustments */}
                <div className="hidden sm:flex flex-col gap-1">
                  {repIncrements.map(inc => (
                    <Button
                      key={inc}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustReps(inc)}
                      className="w-12 h-8 text-xs touch-manipulation"
                    >
                      +{inc}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Mobile Reps Adjustments */}
              <div className="grid grid-cols-4 sm:flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustReps(-1)}
                  className="text-xs h-10 sm:h-8 touch-manipulation"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  1
                </Button>
                {repIncrements.map(inc => (
                  <Button
                    key={inc}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustReps(inc)}
                    className="text-xs h-10 sm:h-8 touch-manipulation"
                  >
                    +{inc}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rest Time */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Rest Time (seconds)
              </Label>
              <div className="grid grid-cols-3 sm:flex gap-2">
                {[30, 60, 90, 120, 180].map(time => (
                  <Button
                    key={time}
                    type="button"
                    variant={restTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRestTime(time)}
                    className="h-10 sm:h-8 touch-manipulation"
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
                className="flex-1 h-14 sm:h-12 text-lg touch-manipulation"
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
                className="h-14 sm:h-12 w-14 sm:w-auto touch-manipulation"
              >
                <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
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
            
            {/* Set Summary with Enhanced Volume Calculation */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Volume:</span>
                  <span className="font-bold ml-2">
                    {exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0).toLocaleString()} lbs
                  </span>
                  {/* Enhanced Volume Breakdown for Bodyweight + Additional Weight */}
                  {isBodyweight && bodyStats?.bodyWeight && exercise.sets.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const userBodyWeight = bodyStats.bodyWeight || 0;
                        const bodyWeightVolume = exercise.sets.reduce((sum, set) => {
                          // Calculate body weight portion (assuming additional weight was added on top)
                          const bodyWeightPortion = Math.min(set.weight, userBodyWeight);
                          return sum + (bodyWeightPortion * set.reps);
                        }, 0);
                        const additionalVolume = exercise.sets.reduce((sum, set) => {
                          const additionalPortion = Math.max(0, set.weight - userBodyWeight);
                          return sum + (additionalPortion * set.reps);
                        }, 0);
                        
                        if (additionalVolume > 0) {
                          return `Body: ${bodyWeightVolume.toLocaleString()} + Additional: ${additionalVolume.toLocaleString()}`;
                        }
                        return `Body weight volume: ${bodyWeightVolume.toLocaleString()} lbs`;
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Max Weight:</span>
                  <span className="font-bold ml-2">
                    {formatWeight(Math.max(...exercise.sets.map(s => s.weight)))}
                  </span>
                  {/* Enhanced Weight Breakdown */}
                  {isBodyweight && bodyStats?.bodyWeight && exercise.sets.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const userBodyWeight = bodyStats.bodyWeight || 0;
                        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
                        const maxAdditional = Math.max(0, maxWeight - userBodyWeight);
                        
                        if (maxAdditional > 0) {
                          return `${userBodyWeight} lbs + ${maxAdditional} lbs`;
                        }
                        return `Body weight only`;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Setup Dialog for Body Weight */}
      <ProfileSetupDialog
        isOpen={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        currentBodyStats={bodyStats || undefined}
        onSave={handleProfileSave}
        mode="setup"
        quickBodyWeightOnly={true}
        workoutContext={{
          exerciseName: exercise?.exerciseName,
          isBodyweightExercise: isBodyweight,
          currentSet: exercise?.sets.length ? exercise.sets.length + 1 : 1
        }}
      />
    </div>
  );
}

export default SetLogger;