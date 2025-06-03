import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, User, Weight, Ruler, Calendar } from 'lucide-react';
import { BodyStats, BodyStatsSchema } from '../../../shared/user-profile';

interface ProfileSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentBodyStats?: BodyStats;
  onSave: (bodyStats: BodyStats) => Promise<void>;
  trigger?: React.ReactNode;
  mode?: 'setup' | 'edit';
  quickBodyWeightOnly?: boolean;
  workoutContext?: {
    exerciseName?: string;
    isBodyweightExercise?: boolean;
    currentSet?: number;
  };
}

interface FormData {
  bodyWeight: string;
  height: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
}

export function ProfileSetupDialog({ 
  isOpen, 
  onOpenChange, 
  currentBodyStats,
  onSave,
  trigger,
  mode = 'setup',
  quickBodyWeightOnly = false,
  workoutContext
}: ProfileSetupDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    bodyWeight: '',
    height: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-populate form with existing data
  useEffect(() => {
    if (currentBodyStats) {
      setFormData({
        bodyWeight: currentBodyStats.bodyWeight?.toString() || '',
        height: currentBodyStats.height?.toString() || '',
        age: currentBodyStats.age?.toString() || '',
        gender: currentBodyStats.gender || ''
      });
    }
  }, [currentBodyStats]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Body weight is required for bodyweight exercises
    if (!formData.bodyWeight) {
      newErrors.bodyWeight = 'Body weight is required for bodyweight exercise auto-population';
    } else {
      const weight = parseFloat(formData.bodyWeight);
      if (isNaN(weight) || weight < 50 || weight > 500) {
        newErrors.bodyWeight = 'Body weight must be between 50 and 500 pounds';
      }
    }

    // Height validation (optional but recommended)
    if (formData.height) {
      const height = parseFloat(formData.height);
      if (isNaN(height) || height < 36 || height > 96) {
        newErrors.height = 'Height must be between 36 and 96 inches (3-8 feet)';
      }
    }

    // Age validation (optional but recommended)
    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        newErrors.age = 'Age must be between 13 and 120 years';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const bodyStats: BodyStats = {
        bodyWeight: parseFloat(formData.bodyWeight),
        height: formData.height ? parseFloat(formData.height) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        updatedAt: new Date().toISOString()
      };

      // Validate with Zod
      const validatedStats = BodyStatsSchema.parse(bodyStats);
      
      await onSave(validatedStats);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving body stats:', error);
      if (error instanceof z.ZodError) {
        const zodErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            zodErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(zodErrors);
      } else {
        setErrors({ general: 'Failed to save profile data. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'edit' ? 'Edit Profile' : 'Complete Your Profile'}
        </DialogTitle>
        <DialogDescription>
          {workoutContext?.isBodyweightExercise && workoutContext?.exerciseName ? (
            <>
              📝 Currently logging: <strong>{workoutContext.exerciseName}</strong>
              {workoutContext.currentSet && ` (Set ${workoutContext.currentSet})`}
              <br />
              Add your body weight to auto-populate the weight field and continue your workout seamlessly.
            </>
          ) : quickBodyWeightOnly ? (
            'Add your body weight to enable automatic weight population for bodyweight exercises.'
          ) : mode === 'edit' ? (
            'Update your profile information for more accurate fitness tracking.'
          ) : (
            'Add your body measurements to unlock bodyweight exercise auto-population and better fitness tracking.'
          )}
        </DialogDescription>
      </DialogHeader>

      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Body Weight - Always Required */}
        <div className="space-y-2">
          <Label htmlFor="bodyWeight" className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            Body Weight (lbs) *
          </Label>
          <Input
            id="bodyWeight"
            type="number"
            min="50"
            max="500"
            step="0.1"
            placeholder="e.g., 150"
            value={formData.bodyWeight}
            onChange={(e) => setFormData({ ...formData, bodyWeight: e.target.value })}
            className={errors.bodyWeight ? 'border-red-500' : ''}
          />
          {errors.bodyWeight && (
            <p className="text-sm text-red-500">{errors.bodyWeight}</p>
          )}
          <p className="text-xs text-gray-500">
            Required for bodyweight exercises like push-ups, pull-ups, and squats
          </p>
        </div>

        {!quickBodyWeightOnly && (
          <>
            {/* Height - Optional */}
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Height (inches)
              </Label>
              <Input
                id="height"
                type="number"
                min="36"
                max="96"
                step="0.1"
                placeholder="e.g., 68 (5 feet 8 inches)"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && (
                <p className="text-sm text-red-500">{errors.height}</p>
              )}
              <p className="text-xs text-gray-500">
                Helps calculate BMI and more accurate fitness metrics
              </p>
            </div>

            {/* Age - Optional */}
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Age (years)
              </Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="120"
                placeholder="e.g., 25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
              <p className="text-xs text-gray-500">
                Used for age-based fitness recommendations
              </p>
            </div>

            {/* Gender - Optional */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Helps provide more personalized fitness recommendations
              </p>
            </div>
          </>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">
              Why we need this information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs text-blue-700">
              {quickBodyWeightOnly ? (
                <>
                  Your body weight will be automatically used for bodyweight exercises like push-ups, 
                  pull-ups, and squats to calculate accurate volume and track progress.
                </>
              ) : (
                <>
                  This information helps FitForge provide accurate weight auto-population for bodyweight 
                  exercises, calculate proper volume metrics, and give you personalized workout recommendations.
                  All data is stored locally and never shared.
                </>
              )}
            </CardDescription>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            {quickBodyWeightOnly ? 'Skip for now' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {workoutContext?.isBodyweightExercise ? 'Save & Continue Workout' : 
             mode === 'edit' ? 'Update Profile' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  // If trigger is provided, wrap in Dialog with trigger
  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  // Otherwise, render as controlled dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  );
}

export default ProfileSetupDialog;