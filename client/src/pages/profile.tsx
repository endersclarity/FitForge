import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats/latest"],
  });

  const fitnessGoals = {
    weeklyWorkouts: 4,
    targetWeight: userStats?.targetWeight || 180,
    dailyCalories: 2200,
  };

  const preferences = {
    workoutReminders: true,
    nutritionTracking: true,
    socialSharing: false,
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
              onClick={() => setIsEditing(!isEditing)}
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
                    value={user?.firstName || ''} 
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={user?.lastName || ''} 
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={user?.email || ''} 
                  disabled={!isEditing}
                  type="email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input 
                    id="height" 
                    value={userStats?.height || ''} 
                    disabled={!isEditing}
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Current Weight (lbs)</Label>
                  <Input 
                    id="weight" 
                    value={userStats?.weight || ''} 
                    disabled={!isEditing}
                    type="number"
                  />
                </div>
              </div>
              {isEditing && (
                <Button className="w-full gradient-bg">
                  Save Changes
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
                  value={fitnessGoals.weeklyWorkouts} 
                  disabled={!isEditing}
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                <Input 
                  id="targetWeight" 
                  value={fitnessGoals.targetWeight} 
                  disabled={!isEditing}
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="dailyCalories">Daily Calorie Goal</Label>
                <Input 
                  id="dailyCalories" 
                  value={fitnessGoals.dailyCalories} 
                  disabled={!isEditing}
                  type="number"
                />
              </div>
              {isEditing && (
                <Button className="w-full gradient-bg">
                  Update Goals
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
                  {userStats?.totalWorkouts || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-2">
                  {Math.round((userStats?.totalCaloriesBurned || 0) / 1000)}k
                </div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {Math.round((userStats?.totalWorkoutMinutes || 0) / 60)}h
                </div>
                <p className="text-sm text-muted-foreground">Training Time</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {userStats?.currentStreak || 0}
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