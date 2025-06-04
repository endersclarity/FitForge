import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bodyStatsService, type BodyStats } from "@/services/supabase-body-stats-service";
import { 
  User, 
  Settings, 
  Target, 
  Activity, 
  Trophy,
  Calendar,
  Edit,
  Scale
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    height: '',
    weight: ''
  });
  const [bodyMetricsForm, setBodyMetricsForm] = useState({
    weight: '',
    height: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    calves: ''
  });
  const [goalsForm, setGoalsForm] = useState({
    weeklyWorkouts: 4,
    targetWeight: 180,
    dailyCalories: 2200
  });

  // Fetch latest body stats from Supabase
  const { data: latestBodyStats, isLoading: statsLoading, error: statsError } = useQuery<BodyStats | null>({
    queryKey: ["supabase-body-stats-latest", user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('🔍 Fetching latest body stats...');
      try {
        return await bodyStatsService.getLatestBodyStats(user.id);
      } catch (error) {
        console.error('❌ Failed to fetch body stats:', error);
        throw new Error('Failed to load body stats');
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch body stats history for progress tracking
  const { data: bodyStatsHistory = [] } = useQuery<BodyStats[]>({
    queryKey: ["supabase-body-stats-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await bodyStatsService.getBodyStatsHistory(user.id, 10);
      } catch (error) {
        console.error('❌ Failed to fetch body stats history:', error);
        return [];
      }
    },
    enabled: !!user
  });

  const fitnessGoals = {
    weeklyWorkouts: 4,
    targetWeight: latestBodyStats?.weight_lbs || 180,
    dailyCalories: 2200,
  };

  // Profile update mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateGoalsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/auth/goals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update goals');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: "Goals Updated!",
        description: "Your fitness goals have been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goals. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Body stats save mutation
  const saveBodyStatsMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('💪 Saving body stats...');
      return await bodyStatsService.logBodyStats({
        weight_lbs: data.weight ? parseFloat(data.weight) : undefined,
        body_fat_percentage: data.bodyFat ? parseFloat(data.bodyFat) : undefined,
        chest_inches: data.chest ? parseFloat(data.chest) : undefined,
        waist_inches: data.waist ? parseFloat(data.waist) : undefined,
        hips_inches: data.hips ? parseFloat(data.hips) : undefined,
        bicep_inches: data.biceps ? parseFloat(data.biceps) : undefined,
        thigh_inches: data.thighs ? parseFloat(data.thighs) : undefined,
        notes: data.notes || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-body-stats-latest'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-body-stats-history'] });
      setIsEditing(false);
      toast({
        title: "Body Metrics Saved!",
        description: "Your body measurements have been successfully recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save body metrics. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const handleEditToggle = () => {
    if (!isEditing) {
      // Initialize forms with current values when starting to edit
      setProfileForm({
        firstName: user?.email?.split('@')[0] || '', // Use email username since User doesn't have firstName
        lastName: '',
        email: user?.email || '',
        height: '170',
        weight: latestBodyStats?.weight_lbs?.toString() || ''
      });
      setGoalsForm({
        weeklyWorkouts: fitnessGoals.weeklyWorkouts,
        targetWeight: fitnessGoals.targetWeight,
        dailyCalories: fitnessGoals.dailyCalories
      });
      setBodyMetricsForm({
        weight: latestBodyStats?.weight_lbs?.toString() || '',
        height: '170', // Default height
        bodyFat: latestBodyStats?.body_fat_percentage?.toString() || '',
        chest: latestBodyStats?.chest_inches?.toString() || '',
        waist: latestBodyStats?.waist_inches?.toString() || '',
        hips: latestBodyStats?.hips_inches?.toString() || '',
        biceps: latestBodyStats?.bicep_inches?.toString() || '',
        thighs: latestBodyStats?.thigh_inches?.toString() || '',
        calves: '' // Not in Supabase schema
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handleUpdateGoals = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to update your goals.",
        variant: "destructive",
      });
      return;
    }
    updateGoalsMutation.mutate(goalsForm);
  };

  const handleSaveBodyMetrics = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to save body metrics.",
        variant: "destructive",
      });
      return;
    }
    saveBodyStatsMutation.mutate(bodyMetricsForm);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user ? user.email?.[0]?.toUpperCase() || "U" : "U"}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-xl text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {user ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleEditToggle}
              variant={isEditing ? "outline" : "default"}
              className={!isEditing ? "gradient-bg" : ""}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={isEditing ? profileForm.firstName : (user?.email?.split('@')[0] || '')} 
                    disabled={!isEditing}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={isEditing ? profileForm.lastName : ''} 
                    disabled={!isEditing}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={isEditing ? profileForm.email : (user?.email || '')} 
                  disabled={!isEditing}
                  type="email"
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input 
                    id="height" 
                    value={isEditing ? profileForm.height : '67'} 
                    disabled={!isEditing}
                    type="number"
                    onChange={(e) => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Current Weight (lbs)</Label>
                  <Input 
                    id="weight" 
                    value={isEditing ? profileForm.weight : (latestBodyStats?.weight_lbs?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    onChange={(e) => setProfileForm(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
              </div>
              {isEditing && (
                <Button 
                  className="w-full gradient-bg"
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Fitness Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-accent" />
                Fitness Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weeklyWorkouts">Weekly Workout Goal</Label>
                <Input 
                  id="weeklyWorkouts" 
                  value={isEditing ? goalsForm.weeklyWorkouts : fitnessGoals.weeklyWorkouts} 
                  disabled={!isEditing}
                  type="number"
                  onChange={(e) => setGoalsForm(prev => ({ ...prev, weeklyWorkouts: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                <Input 
                  id="targetWeight" 
                  value={isEditing ? goalsForm.targetWeight : fitnessGoals.targetWeight} 
                  disabled={!isEditing}
                  type="number"
                  onChange={(e) => setGoalsForm(prev => ({ ...prev, targetWeight: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="dailyCalories">Daily Calorie Goal</Label>
                <Input 
                  id="dailyCalories" 
                  value={isEditing ? goalsForm.dailyCalories : fitnessGoals.dailyCalories} 
                  disabled={!isEditing}
                  type="number"
                  onChange={(e) => setGoalsForm(prev => ({ ...prev, dailyCalories: Number(e.target.value) }))}
                />
              </div>
              {isEditing && (
                <Button 
                  className="w-full gradient-bg"
                  onClick={handleUpdateGoals}
                  disabled={updateGoalsMutation.isPending}
                >
                  {updateGoalsMutation.isPending ? 'Updating...' : 'Update Goals'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Body Metrics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="w-5 h-5 mr-2 text-purple-500" />
              Body Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Basic Measurements */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Basic Measurements</h4>
                <div>
                  <Label htmlFor="metric-weight">Weight (lbs)</Label>
                  <Input 
                    id="metric-weight" 
                    value={isEditing ? bodyMetricsForm.weight : (latestBodyStats?.weight_lbs?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Enter weight"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="metric-height">Height (inches)</Label>
                  <Input 
                    id="metric-height" 
                    value={isEditing ? bodyMetricsForm.height : ''} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Enter height"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="body-fat">Body Fat %</Label>
                  <Input 
                    id="body-fat" 
                    value={isEditing ? bodyMetricsForm.bodyFat : (latestBodyStats?.body_fat_percentage?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Enter body fat %"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, bodyFat: e.target.value }))}
                  />
                </div>
              </div>

              {/* Circumference Measurements */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Circumference (inches)</h4>
                <div>
                  <Label htmlFor="chest">Chest</Label>
                  <Input 
                    id="chest" 
                    value={isEditing ? bodyMetricsForm.chest : (latestBodyStats?.chest_inches?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Chest measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, chest: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="waist">Waist</Label>
                  <Input 
                    id="waist" 
                    value={isEditing ? bodyMetricsForm.waist : (latestBodyStats?.waist_inches?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Waist measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, waist: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hips">Hips</Label>
                  <Input 
                    id="hips" 
                    value={isEditing ? bodyMetricsForm.hips : (latestBodyStats?.hips_inches?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Hips measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, hips: e.target.value }))}
                  />
                </div>
              </div>

              {/* Muscle Measurements */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Muscle Groups (inches)</h4>
                <div>
                  <Label htmlFor="biceps">Biceps</Label>
                  <Input 
                    id="biceps" 
                    value={isEditing ? bodyMetricsForm.biceps : (latestBodyStats?.bicep_inches?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Biceps measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, biceps: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="thighs">Thighs</Label>
                  <Input 
                    id="thighs" 
                    value={isEditing ? bodyMetricsForm.thighs : (latestBodyStats?.thigh_inches?.toString() || '')} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Thighs measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, thighs: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="calves">Calves</Label>
                  <Input 
                    id="calves" 
                    value={isEditing ? bodyMetricsForm.calves : ''} 
                    disabled={!isEditing}
                    type="number"
                    placeholder="Calves measurement"
                    onChange={(e) => setBodyMetricsForm(prev => ({ ...prev, calves: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 text-center">
                <Button 
                  className="gradient-bg"
                  onClick={handleSaveBodyMetrics}
                  disabled={saveBodyStatsMutation.isPending}
                >
                  {saveBodyStatsMutation.isPending ? 'Saving...' : 'Save Body Metrics'}
                </Button>
              </div>
            )}

            {!isEditing && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Track your body composition changes over time. Click "Edit Profile" to update measurements.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-secondary" />
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">
                  24
                </div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-2">
                  12k
                </div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary mb-2">
                  36h
                </div>
                <p className="text-sm text-muted-foreground">Training Time</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  7
                </div>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}