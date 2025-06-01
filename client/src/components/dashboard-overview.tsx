import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3, Apple, Brain, TrendingUp, Calendar, Target } from "lucide-react";

export function DashboardOverview() {
  // Real Data Only - No Mock Data
  // TODO: Connect to real workout sessions API
  // TODO: Connect to real nutrition API when implemented
  
  const hasWorkoutData = false; // Will check real API
  const hasNutritionData = false; // Will check real API

  const hasInsights = false; // Will check real AI data when implemented

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Your Fitness Command Center</h2>
        <p className="text-xl text-muted-foreground">
          Real-time insights, AI-powered recommendations, and seamless tracking
        </p>
      </div>

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
              <div>
                {/* Real workout analytics will go here */}
                <p className="text-muted-foreground">Loading workout data...</p>
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

        {/* AI Insights - Coming Soon */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">AI Insights</CardTitle>
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            {!hasInsights ? (
              <>
                <p className="text-muted-foreground mb-4">
                  AI-powered workout insights coming soon!
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => alert("AI insights will analyze your workout patterns and provide personalized recommendations in a future update!")}
                >
                  Coming Soon
                </Button>
              </>
            ) : (
              <div>
                {/* Real AI insights will go here */}
                <p className="text-muted-foreground">Loading AI insights...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
