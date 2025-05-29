import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { 
  User, 
  Settings, 
  Target, 
  Activity, 
  Trophy,
  Calendar,
  Edit
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
  const [goalsForm, setGoalsForm] = useState({
    weeklyWorkouts: 4,
    targetWeight: 180,
    dailyCalories: 2200
  });

  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery<UserStats>({
    queryKey: ["/api/user-stats/latest"],
  });

  const fitnessGoals = {
    weeklyWorkouts: 4,
    targetWeight: userStats?.weight || 180,
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

  // Handle form submissions
  const handleEditToggle = () => {
    if (!isEditing) {
      // Initialize forms with current values when starting to edit
      setProfileForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        height: '170',
        weight: userStats?.weight?.toString() || ''
      });
      setGoalsForm({
        weeklyWorkouts: fitnessGoals.weeklyWorkouts,
        targetWeight: fitnessGoals.targetWeight,
        dailyCalories: fitnessGoals.dailyCalories
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


  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : "U"}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-xl text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {user ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
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
                    value={isEditing ? profileForm.firstName : (user?.firstName || '')} 
                    disabled={!isEditing}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={isEditing ? profileForm.lastName : (user?.lastName || '')} 
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
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input 
                    id="height" 
                    value={isEditing ? profileForm.height : '170'} 
                    disabled={!isEditing}
                    type="number"
                    onChange={(e) => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Current Weight (lbs)</Label>
                  <Input 
                    id="weight" 
                    value={isEditing ? profileForm.weight : (userStats?.weight || '')} 
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