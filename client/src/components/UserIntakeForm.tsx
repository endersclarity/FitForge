import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { User, Target, Activity, Calendar } from 'lucide-react';
import { userPreferencesService, ExtendedUserPreferences } from '@/services/user-preferences-service';
import { useQueryClient } from '@tanstack/react-query';

interface UserIntakeFormProps {
  currentData?: {
    bodyStats?: {
      bodyWeight?: number;
      height?: number;
      age?: number;
      gender?: string;
    };
    targetGoals?: {
      targetWeight?: number;
      dailyCalorieGoal?: number;
      dailyProteinGoal?: number;
    };
    workoutFrequency?: number;
    sessionDuration?: number;
  };
  onComplete?: () => void;
}

export function UserIntakeForm({ currentData, onComplete }: UserIntakeFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Body Stats
    bodyWeight: currentData?.bodyStats?.bodyWeight || '',
    height: currentData?.bodyStats?.height || '',
    age: currentData?.bodyStats?.age || '',
    gender: currentData?.bodyStats?.gender || '',
    
    // Target Goals
    targetWeight: currentData?.targetGoals?.targetWeight || '',
    dailyCalorieGoal: currentData?.targetGoals?.dailyCalorieGoal || '',
    dailyProteinGoal: currentData?.targetGoals?.dailyProteinGoal || '',
    
    // Workout Preferences
    workoutFrequency: currentData?.workoutFrequency || '',
    sessionDuration: currentData?.sessionDuration || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First, get existing preferences to merge with new data
      const currentPreferences = await userPreferencesService.getUserPreferences('1');
      
      // Create complete preferences object with proper type safety
      const updatedPreferences: Partial<ExtendedUserPreferences> = {
        // Preserve existing preferences or use sensible defaults
        goals: currentPreferences?.goals || ["general_fitness"],
        experienceLevel: currentPreferences?.experienceLevel || "beginner",
        availableEquipment: currentPreferences?.availableEquipment || ["bodyweight"],
        coachingEnabled: currentPreferences?.coachingEnabled ?? true,
        achievementNotifications: currentPreferences?.achievementNotifications ?? true,
        bodyweightExerciseConfigs: currentPreferences?.bodyweightExerciseConfigs || [],
        
        // Update with form data
        bodyStats: formData.bodyWeight || formData.height || formData.age || formData.gender ? {
          bodyWeight: formData.bodyWeight ? Number(formData.bodyWeight) : undefined,
          height: formData.height ? Number(formData.height) : undefined,
          age: formData.age ? Number(formData.age) : undefined,
          gender: formData.gender as "male" | "female" | "other" | undefined,
          updatedAt: new Date().toISOString()
        } : undefined,
        targetGoals: {
          targetWeight: Number(formData.targetWeight) || 0,
          targetStrengthIncrease: 30, // Default 30% strength increase goal
          dailyCalorieGoal: Number(formData.dailyCalorieGoal) || 2200,
          dailyProteinGoal: Number(formData.dailyProteinGoal) || 150
        },
        workoutFrequency: Number(formData.workoutFrequency) || 3,
        sessionDuration: Number(formData.sessionDuration) || 45,
        onboardingCompleted: true
      };

      await userPreferencesService.updateUserPreferences('1', updatedPreferences);
      
      // Refresh user preferences query
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      // User-friendly error handling
      alert('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Body Stats</h3>
      <p className="text-muted-foreground mb-6">
        Help us personalize your fitness experience with your basic stats
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bodyWeight">Current Weight (lbs)</Label>
          <Input
            id="bodyWeight"
            type="number"
            placeholder="174"
            value={formData.bodyWeight}
            onChange={(e) => handleInputChange('bodyWeight', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="height">Height (inches)</Label>
          <Input
            id="height"
            type="number"
            placeholder="70"
            value={formData.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="30"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Target Goals</h3>
      <p className="text-muted-foreground mb-6">
        Set your fitness and nutrition targets to track progress
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
          <Input
            id="targetWeight"
            type="number"
            placeholder="180"
            value={formData.targetWeight}
            onChange={(e) => handleInputChange('targetWeight', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="dailyCalorieGoal">Daily Calorie Goal</Label>
          <Input
            id="dailyCalorieGoal"
            type="number"
            placeholder="2200"
            value={formData.dailyCalorieGoal}
            onChange={(e) => handleInputChange('dailyCalorieGoal', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="dailyProteinGoal">Daily Protein Goal (g)</Label>
          <Input
            id="dailyProteinGoal"
            type="number"
            placeholder="150"
            value={formData.dailyProteinGoal}
            onChange={(e) => handleInputChange('dailyProteinGoal', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Workout Preferences</h3>
      <p className="text-muted-foreground mb-6">
        Help us recommend the right workout schedule for you
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workoutFrequency">Workouts per Week</Label>
          <Input
            id="workoutFrequency"
            type="number"
            placeholder="3"
            min="1"
            max="7"
            value={formData.workoutFrequency}
            onChange={(e) => handleInputChange('workoutFrequency', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
          <Input
            id="sessionDuration"
            type="number"
            placeholder="45"
            value={formData.sessionDuration}
            onChange={(e) => handleInputChange('sessionDuration', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Your Profile
          </CardTitle>
          <Badge variant="outline">
            Step {step} of {totalSteps}
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={() => setStep(Math.min(totalSteps, step + 1))}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gradient-bg"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}