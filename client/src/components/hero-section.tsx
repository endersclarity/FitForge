import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { FeatureComingSoonDialog } from "@/components/ui/feature-coming-soon-dialog";
import { useState } from "react";
import { Play } from "lucide-react";

export function HeroSection() {
  const { user } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <section className="relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1000"
          alt="Modern fitness gym with equipment"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/30 dark:from-dark/90 dark:via-dark/60 dark:to-dark/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Transform Your{" "}
              <span className="text-gradient">Fitness Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience the future of fitness with AI-powered workouts, real-time form analysis,
              and personalized training that adapts to your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button className="btn-primary">View Dashboard</Button>
                  </Link>
                  <Link href="/workouts">
                    <Button variant="outline" className="btn-secondary">
                      Browse Workouts
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button className="btn-primary">Start Your Journey</Button>
                  </Link>
                  <Link href="/workouts">
                    <Button 
                      variant="outline" 
                      className="btn-secondary"
                    >
                      Explore Workouts
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDemoModal(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Real Progress Card - No Dummy Data */}
          {user && (
            <Card className="glass-effect animate-fade-in">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Start Tracking?</h3>
                <p className="text-muted-foreground mb-6">
                  Complete your first workout to see real progress data here
                </p>
                <Link href="/workouts">
                  <Button className="btn-primary">
                    Log Your First Workout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Watch Demo Coming Soon Modal */}
      <FeatureComingSoonDialog
        open={showDemoModal}
        onOpenChange={setShowDemoModal}
        featureName="Interactive Demo"
        description="A video walkthrough of FitForge's key features including AI-powered workouts, progress tracking, and personalized goal setting is coming soon!"
      />
    </section>
  );
}
