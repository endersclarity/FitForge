import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WorkoutSessionProvider } from "@/hooks/use-workout-session";
import { useDataMigration, MigrationStatus } from "@/hooks/use-data-migration";
import { Navigation } from "@/components/navigation";
// import { LiveWorkoutSession } from "@/components/live-workout-session";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Progress from "@/pages/progress";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import Nutrition from "@/pages/nutrition";
// import StartWorkout from "@/pages/start-workout";
import TestSupabase from "@/pages/test-supabase";
// import WorkoutDetail from "@/pages/workout-detail";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // ALWAYS skip authentication in development
  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Debug route changes
  React.useEffect(() => {
    console.log('🛣️ Route changed to:', location);
  }, [location]);
  
  // Initialize data migration system on app startup
  useDataMigration({
    autoMigrate: true,
    onMigrationComplete: (result) => {
      console.log(`✅ Data migration completed: v${result.fromVersion} → v${result.toVersion}`);
      if (result.migrationsApplied.length > 0) {
        console.log(`📝 Applied migrations: ${result.migrationsApplied.join(', ')}`);
      }
    },
    onMigrationError: (error) => {
      console.error('❌ Data migration failed:', error);
    }
  });

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
        {/* <Route path="/start-workout">
          <ProtectedRoute>
            <StartWorkout />
          </ProtectedRoute>
        </Route> */}
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
        {/* <Route path="/workout-session">
          <ProtectedRoute>
            <LiveWorkoutSession />
          </ProtectedRoute>
        </Route> */}
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
        <Route path="/test-supabase">
          <ProtectedRoute>
            <TestSupabase />
          </ProtectedRoute>
        </Route>
        {/* <Route path="/workout/:id">
          <ProtectedRoute>
            <WorkoutDetail />
          </ProtectedRoute>
        </Route> */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Migration status indicator (only shows when migration is needed/in progress) */}
      <MigrationStatus />
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
