import { WorkoutLibrary } from "@/components/workout-library";
import { WorkoutStarter } from "@/components/workout-starter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Workout, WorkoutSession } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  Plus, 
  Play, 
  Clock, 
  Flame, 
  TrendingUp,
  Target,
  Activity,
  BarChart3
} from "lucide-react";

export default function Workouts() {
  const { user } = useAuth();

  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const { data: recentSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  const workoutStats = {
    totalWorkouts: recentSessions.length,
    weeklyWorkouts: recentSessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length,
    totalMinutes: recentSessions.reduce((total, session) => total + (session.totalDuration || 0), 0),
    totalCalories: recentSessions.reduce((total, session) => total + (session.caloriesBurned || 0), 0),
  };

  const categories = [
    {
      name: "Strength Training",
      count: workouts.filter(w => w.category === "strength").length,
      icon: Target,
      color: "bg-primary/10 text-primary",
    },
    {
      name: "Cardio",
      count: workouts.filter(w => w.category === "cardio").length,
      icon: Activity,
      color: "bg-accent/10 text-accent",
    },
    {
      name: "Yoga & Flexibility",
      count: workouts.filter(w => w.category === "yoga").length,
      icon: TrendingUp,
      color: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Your Workouts</h1>
              <p className="text-xl text-muted-foreground">
                AI-powered training tailored to your goals
              </p>
            </div>
            <Link href="/start-workout">
              <Button className="gradient-bg">
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
            </Link>
          </div>

          {/* Workout Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {workoutStats.totalWorkouts}
                </div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent mb-2">
                  {workoutStats.weeklyWorkouts}
                </div>
                <p className="text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {Math.round(workoutStats.totalMinutes / 60)}h
                </div>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {workoutStats.totalCalories}
                </div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {categories.map((category, index) => (
              <Card key={index} className="card-hover cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground">
                    {category.count} workout{category.count !== 1 ? 's' : ''} available
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Recent Sessions</h2>
              <Link href="/progress">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSessions.slice(0, 6).map((session) => (
                <Card key={session.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">Workout Session</h3>
                      <Badge variant={session.completionStatus === "completed" ? "default" : "secondary"}>
                        {session.completionStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Duration
                        </span>
                        <span className="font-medium">{session.totalDuration || 0} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-muted-foreground">
                          <Flame className="w-4 h-4 mr-1" />
                          Calories
                        </span>
                        <span className="font-medium">{session.caloriesBurned || 0}</span>
                      </div>
                      {session.formScore && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-muted-foreground">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Form Score
                          </span>
                          <span className="font-medium">{Math.round(session.formScore)}%</span>
                        </div>
                      )}
                      <p className="text-muted-foreground mt-2">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ender's Real Workouts */}
      <WorkoutStarter />
      
      {/* Workout Library */}
      <WorkoutLibrary />
    </div>
  );
}
