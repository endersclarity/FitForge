import { HeroSection } from "@/components/hero-section";
import { DashboardOverview } from "@/components/dashboard-overview";
import { LiveTracking } from "@/components/live-tracking";
import { ProgressAnalytics } from "@/components/progress-analytics";
import { CommunityFeatures } from "@/components/community-features";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 Authenticated user detected, redirecting to dashboard...');
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FitForge...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, this will redirect - but show loading to avoid flash
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show marketing page for non-authenticated users
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DashboardOverview />
      <LiveTracking />
      <ProgressAnalytics />
      <CommunityFeatures />
      <Footer />
    </div>
  );
}
