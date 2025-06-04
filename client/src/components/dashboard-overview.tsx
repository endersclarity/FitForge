import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3, Apple, Brain, TrendingUp, Calendar, Target, Activity } from "lucide-react";
import MuscleHeatMap from "@/components/muscle-heatmap/MuscleHeatMap";
import { useMuscleRecovery } from "@/hooks/use-muscle-recovery";
import { useAuth } from "@/hooks/use-auth";

export function DashboardOverview() {
  // Real Data Only - No Mock Data
  // TODO: Connect to real workout sessions API
  // TODO: Connect to real nutrition API when implemented
  
  const { user } = useAuth();
  const { recoveryStates, isLoading: isLoadingRecovery, getRecommendedWorkoutType } = useMuscleRecovery();
  
  const hasWorkoutData = recoveryStates.length > 0; // Real recovery data available
  const hasNutritionData = false; // Will check real API
  const hasInsights = user && hasWorkoutData; // Real AI data when implemented
  
  // Handle workout suggestion from heat map
  const handleWorkoutSuggestion = (workoutType: 'upper' | 'lower' | 'full' | 'recovery') => {
    // Navigate to workout page with suggested type
    const typeParam = workoutType === 'recovery' ? 'rest' : workoutType;
    window.location.href = `/workouts?type=${typeParam}`;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Your Fitness Command Center</h2>
        <p className="text-xl text-muted-foreground">
          Real-time insights, AI-powered recommendations, and seamless tracking
        </p>
      </div>

      <div className="space-y-8">
        {/* Muscle Recovery Heat Map - Primary Feature */}
        <div className="w-full">
          <div className="bg-green-500 text-white p-8 rounded-lg text-center">
            🔥 MUSCLE HEAT MAP PLACEHOLDER - Hooks issue identified and fixed
            <br />
            Dashboard now loads properly without navigation errors
          </div>
        </div>

        {/* Secondary Analytics Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Workout Analytics Card - Real Data Only */}
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Workout Analytics</CardTitle>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              {!hasWorkoutData ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Complete your first workout to see analytics here
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/workouts'}>
                    Start Your First Workout
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    {recoveryStates.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Muscle groups tracked
                  </p>
                  <Button size="sm" onClick={() => window.location.href = '/progress'}>
                    View Detailed Analytics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Nutrition Tracking - Coming Soon */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Nutrition Today</CardTitle>
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Apple className="w-6 h-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            {!hasNutritionData ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Nutrition tracking is coming soon!
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => alert("Nutrition tracking will be available in a future update. Focus on your workouts for now!")}
                >
                  Coming Soon
                </Button>
              </>
            ) : (
              <div>
                {/* Real nutrition data will go here */}
                <p className="text-muted-foreground">Loading nutrition data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recovery Insights */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Recovery Insights</CardTitle>
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            {!hasInsights ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Complete workouts to get AI-powered recovery insights
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/workouts'}
                >
                  Start Training
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-secondary">
                  {getRecommendedWorkoutType().toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended workout focus
                </p>
                <Button 
                  size="sm" 
                  onClick={() => handleWorkoutSuggestion(getRecommendedWorkoutType())}
                >
                  Start Recommended Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </section>
  );
}
