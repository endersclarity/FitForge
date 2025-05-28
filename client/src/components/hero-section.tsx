import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export function HeroSection() {
  const { user } = useAuth();

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
                  <Button variant="outline" className="btn-secondary">
                    Watch Demo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Card */}
          {user && (
            <Card className="glass-effect animate-fade-in">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Today's Progress</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 relative">
                      <svg className="w-16 h-16 progress-ring">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-muted opacity-30"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="hsl(var(--primary))"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="175.9"
                          strokeDashoffset="52.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-foreground font-bold">70%</span>
                      </div>
                    </div>
                    <p className="font-medium">Workout Goal</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 relative">
                      <svg className="w-16 h-16 progress-ring">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-muted opacity-30"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="hsl(var(--accent))"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="175.9"
                          strokeDashoffset="35.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-foreground font-bold">80%</span>
                      </div>
                    </div>
                    <p className="font-medium">Calorie Goal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
