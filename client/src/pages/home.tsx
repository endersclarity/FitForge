import { HeroSection } from "@/components/hero-section";
import { DashboardOverview } from "@/components/dashboard-overview";
import { WorkoutLibrary } from "@/components/workout-library";
import { LiveTracking } from "@/components/live-tracking";
import { ProgressAnalytics } from "@/components/progress-analytics";
import { CommunityFeatures } from "@/components/community-features";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DashboardOverview />
      <WorkoutLibrary />
      <LiveTracking />
      <ProgressAnalytics />
      <CommunityFeatures />
      <Footer />
    </div>
  );
}
