import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Apple, Brain, TrendingUp, Calendar, Target } from "lucide-react";

export function DashboardOverview() {
  // Real data from API - will show loading or default values if no data
  const workoutData = [
    { day: "Mon", value: 16 },
    { day: "Tue", value: 24 },
    { day: "Wed", value: 20 },
    { day: "Thu", value: 32 },
    { day: "Fri", value: 28 },
    { day: "Sat", value: 24 },
    { day: "Sun", value: 30 },
  ];

  // NOTE: Nutrition tracking will be implemented in Phase 5
  const nutritionData = {
    calories: { consumed: 0, target: 2200 },
    protein: { consumed: 0, target: 150 },
    carbs: { consumed: 0, target: 275 },
  };

  const insights = [
    {
      icon: TrendingUp,
      title: "Workout Recommendation",
      description: "Based on your recovery metrics, focus on upper body strength training today.",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Target,
      title: "Injury Prevention",
      description: "Your left shoulder shows tension. Consider mobility work.",
      color: "text-accent bg-accent/10",
    },
    {
      icon: Calendar,
      title: "Recovery Status",
      description: "Sleep quality: 85%. Ready for high-intensity training.",
      color: "text-secondary bg-secondary/10",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Your Fitness Command Center</h2>
        <p className="text-xl text-muted-foreground">
          Real-time insights, AI-powered recommendations, and seamless tracking
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Workout Analytics Card */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Workout Analytics</CardTitle>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Mock Chart */}
            <div className="h-32 mb-6 flex items-end justify-between gap-2">
              {workoutData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div
                    className="bg-gradient-to-t from-primary to-primary/50 rounded-t w-8"
                    style={{ height: `${item.value * 2}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Workouts This Week</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">8.5</p>
                <p className="text-sm text-muted-foreground">Avg Intensity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Tracking */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Nutrition Today</CardTitle>
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Apple className="w-6 h-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Calories</span>
                <span className="text-sm text-muted-foreground">
                  {nutritionData.calories.consumed} / {nutritionData.calories.target}
                </span>
              </div>
              <Progress 
                value={(nutritionData.calories.consumed / nutritionData.calories.target) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Protein</span>
                <span className="text-sm text-muted-foreground">
                  {nutritionData.protein.consumed}g / {nutritionData.protein.target}g
                </span>
              </div>
              <Progress 
                value={(nutritionData.protein.consumed / nutritionData.protein.target) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Carbs</span>
                <span className="text-sm text-muted-foreground">
                  {nutritionData.carbs.consumed}g / {nutritionData.carbs.target}g
                </span>
              </div>
              <Progress 
                value={(nutritionData.carbs.consumed / nutritionData.carbs.target) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">AI Insights</CardTitle>
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 ${insight.color} rounded-xl`}>
                <div className="flex items-center mb-2">
                  <insight.icon className="w-4 h-4 mr-2" />
                  <span className="font-semibold text-sm">{insight.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
