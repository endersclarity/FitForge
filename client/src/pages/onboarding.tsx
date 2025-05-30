import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { UserGoal, ExperienceLevel, Equipment, UserPreferences } from '../../../shared/user-profile';
import { ArrowRight, Target, Dumbbell, Clock, CheckCircle } from 'lucide-react';

const GOAL_OPTIONS: { value: UserGoal; label: string; description: string; icon: string }[] = [
  { value: 'strength', label: 'Build Strength', description: 'Get stronger with heavy compound lifts', icon: '💪' },
  { value: 'muscle_gain', label: 'Gain Muscle', description: 'Increase muscle mass and size', icon: '🏋️' },
  { value: 'weight_loss', label: 'Lose Weight', description: 'Burn fat and improve body composition', icon: '🔥' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Overall health and wellness', icon: '❤️' },
  { value: 'endurance', label: 'Build Endurance', description: 'Improve cardiovascular fitness', icon: '🏃' },
  { value: 'flexibility', label: 'Increase Flexibility', description: 'Improve mobility and range of motion', icon: '🧘' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to structured fitness (0-6 months)' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience with consistent training (6+ months)' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced with structured programs (2+ years)' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; description: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed' },
  { value: 'dumbbell', label: 'Dumbbells', description: 'Adjustable or fixed weight dumbbells' },
  { value: 'barbell', label: 'Barbell', description: 'Olympic barbell with plates' },
  { value: 'kettlebell', label: 'Kettlebells', description: 'Various weight kettlebells' },
  { value: 'resistance_band', label: 'Resistance Bands', description: 'Loop or tube resistance bands' },
  { value: 'cable', label: 'Cable Machine', description: 'Adjustable cable system' },
  { value: 'machine', label: 'Weight Machines', description: 'Gym machines for isolation exercises' },
  { value: 'pull_up_bar', label: 'Pull-up Bar', description: 'Fixed or doorway pull-up bar' },
  { value: 'bench', label: 'Weight Bench', description: 'Adjustable or flat bench' },
  { value: 'squat_rack', label: 'Squat Rack', description: 'Power rack or squat stands' },
  { value: 'medicine_ball', label: 'Medicine Ball', description: 'Weighted training ball' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { completeOnboarding } = useUserPreferences();
  
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    goals: [],
    experienceLevel: 'beginner',
    availableEquipment: [],
    workoutFrequency: 3,
    sessionDuration: 45,
    coachingEnabled: true,
    achievementNotifications: true,
  });

  const totalSteps = 5;

  const handleGoalToggle = (goal: UserGoal) => {
    const currentGoals = formData.goals || [];
    if (currentGoals.includes(goal)) {
      setFormData({
        ...formData,
        goals: currentGoals.filter((g: UserGoal) => g !== goal)
      });
    } else {
      setFormData({
        ...formData,
        goals: [...currentGoals, goal]
      });
    }
  };

  const handleEquipmentToggle = (equipment: Equipment) => {
    const currentEquipment = formData.availableEquipment || [];
    if (currentEquipment.includes(equipment)) {
      setFormData({
        ...formData,
        availableEquipment: currentEquipment.filter((e: Equipment) => e !== equipment)
      });
    } else {
      setFormData({
        ...formData,
        availableEquipment: [...currentEquipment, equipment]
      });
    }
  };

  const handleComplete = async () => {
    try {
      const completePreferences: UserPreferences = {
        goals: formData.goals || ['general_fitness'],
        experienceLevel: formData.experienceLevel || 'beginner',
        availableEquipment: formData.availableEquipment || ['bodyweight'],
        workoutFrequency: formData.workoutFrequency || 3,
        sessionDuration: formData.sessionDuration || 45,
        onboardingCompleted: true,
        coachingEnabled: formData.coachingEnabled || true,
        achievementNotifications: formData.achievementNotifications || true,
      };

      await completeOnboarding(completePreferences);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Welcome step
      case 2: return (formData.goals?.length || 0) > 0;
      case 3: return formData.experienceLevel !== undefined;
      case 4: return (formData.availableEquipment?.length || 0) > 0;
      case 5: return true; // Preferences step
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 text-6xl">🎯</div>
              <CardTitle className="text-3xl">Welcome to FitForge!</CardTitle>
              <CardDescription className="text-lg">
                Let's set up your personalized fitness experience in just a few steps.
                This will help us recommend the perfect workouts for your goals and equipment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Personalized workout recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    AI-powered progressive overload coaching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Achievement tracking and motivation
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Workouts tailored to your available time
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>What are your fitness goals?</CardTitle>
              <CardDescription>
                Select all that apply. This helps us recommend the right workouts and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_OPTIONS.map((goal) => (
                  <div
                    key={goal.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.goals?.includes(goal.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGoalToggle(goal.value)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{goal.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{goal.label}</h3>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      </div>
                      {formData.goals?.includes(goal.value) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>What's your experience level?</CardTitle>
              <CardDescription>
                This helps us recommend appropriate exercises and progression rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.experienceLevel}
                onValueChange={(value) => setFormData({ ...formData, experienceLevel: value as ExperienceLevel })}
              >
                <div className="space-y-4">
                  {EXPERIENCE_OPTIONS.map((level) => (
                    <div key={level.value} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                      <Label htmlFor={level.value} className="flex-1 cursor-pointer">
                        <div className="font-semibold">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>What equipment do you have access to?</CardTitle>
              <CardDescription>
                Select all equipment you can use. We'll recommend workouts that match what you have.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <div key={equipment.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={equipment.value}
                      checked={formData.availableEquipment?.includes(equipment.value)}
                      onCheckedChange={() => handleEquipmentToggle(equipment.value)}
                    />
                    <Label htmlFor={equipment.value} className="flex-1 cursor-pointer">
                      <div className="font-medium">{equipment.label}</div>
                      <div className="text-sm text-gray-600">{equipment.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Workout preferences</CardTitle>
              <CardDescription>
                Let's customize your workout schedule and coaching preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">How many times per week do you want to work out?</Label>
                <div className="mt-3">
                  <Slider
                    value={[formData.workoutFrequency || 3]}
                    onValueChange={(value) => setFormData({ ...formData, workoutFrequency: value[0] })}
                    max={7}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>1 day</span>
                    <span className="font-medium">{formData.workoutFrequency} days</span>
                    <span>7 days</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">How long do you want each workout to be?</Label>
                <div className="mt-3">
                  <Slider
                    value={[formData.sessionDuration || 45]}
                    onValueChange={(value) => setFormData({ ...formData, sessionDuration: value[0] })}
                    max={120}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>15 min</span>
                    <span className="font-medium">{formData.sessionDuration} minutes</span>
                    <span>2 hours</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="coaching"
                    checked={formData.coachingEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, coachingEnabled: checked as boolean })}
                  />
                  <Label htmlFor="coaching" className="cursor-pointer">
                    <div className="font-medium">Enable AI coaching</div>
                    <div className="text-sm text-gray-600">Get real-time tips and progressive overload suggestions</div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="achievements"
                    checked={formData.achievementNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, achievementNotifications: checked as boolean })}
                  />
                  <Label htmlFor="achievements" className="cursor-pointer">
                    <div className="font-medium">Achievement notifications</div>
                    <div className="text-sm text-gray-600">Get notified when you unlock new achievements</div>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Setup Progress</span>
            <span className="text-sm font-medium text-gray-600">{currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex justify-center mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Complete Setup
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}