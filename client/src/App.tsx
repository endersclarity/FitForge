import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WorkoutSessionProvider } from "@/hooks/use-workout-session";
import { Navigation } from "@/components/navigation";
import { LiveWorkoutSession } from "@/components/live-workout-session";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Progress from "@/pages/progress";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import Nutrition from "@/pages/nutrition";
import StartWorkout from "@/pages/start-workout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/workouts">
          <ProtectedRoute>
            <Workouts />
          </ProtectedRoute>
        </Route>
        <Route path="/start-workout">
          <ProtectedRoute>
            <StartWorkout />
          </ProtectedRoute>
        </Route>
        <Route path="/progress">
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        </Route>
        <Route path="/community">
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        </Route>
        <Route path="/workout-session">
          <ProtectedRoute>
            <LiveWorkoutSession />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/nutrition">
          <ProtectedRoute>
            <Nutrition />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WorkoutSessionProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WorkoutSessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
