import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Camera, Plus, Clock, MessageSquare, Share2, CheckCircle, Users } from "lucide-react";

export function LiveTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentReps, setCurrentReps] = useState(8);
  const [formScore, setFormScore] = useState(92);
  const [currentSet, setCurrentSet] = useState(3);

  // Simulate real-time updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      // Simulate rep counting
      if (Math.random() > 0.7) {
        setCurrentReps(prev => Math.min(prev + 1, 12));
      }

      // Simulate form score fluctuation
      setFormScore(prev => {
        const change = (Math.random() - 0.5) * 4;
        return Math.max(85, Math.min(98, prev + change));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const formScoreColor = formScore >= 90 ? "text-accent" : formScore >= 80 ? "text-primary" : "text-orange-500";

  const performanceIndicators = [
    {
      label: "Range of Motion",
      status: "Excellent",
      icon: CheckCircle,
      color: "text-accent bg-accent/10",
    },
    {
      label: "Tempo",
      status: "Perfect",
      icon: Clock,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Balance",
      status: "Good",
      icon: Users,
      color: "text-secondary bg-secondary/10",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Real-Time Form Analysis</h2>
        <p className="text-xl text-muted-foreground">
          AI-powered motion capture ensures perfect technique every rep
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Camera Interface */}
        <div className="relative">
          <div className="bg-background border rounded-2xl overflow-hidden aspect-video relative">
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450"
              alt="AI form analysis in action"
              className="w-full h-full object-cover"
            />

            {/* AI Overlay Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Skeleton tracking points */}
              <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              <div 
                className="absolute top-1/3 left-1/2 w-3 h-3 bg-accent rounded-full animate-pulse"
                style={{ transform: "translate(-20px, 10px)" }}
              ></div>
              <div 
                className="absolute top-1/3 left-1/2 w-3 h-3 bg-accent rounded-full animate-pulse"
                style={{ transform: "translate(20px, 10px)" }}
              ></div>

              {/* Form feedback box */}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-xl p-4 border">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-accent mr-2" />
                  <span className="font-semibold">Good Form!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your core engaged and maintain straight back
                </p>
              </div>

              {/* Rep counter */}
              <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm rounded-xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{currentReps}</div>
                <div className="text-sm opacity-80">REPS</div>
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex justify-center mt-6 space-x-4">
            <Button
              size="icon"
              className={`w-12 h-12 rounded-full ${isTracking ? 'bg-destructive' : 'bg-primary'}`}
              onClick={() => setIsTracking(!isTracking)}
            >
              {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Current Set Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{currentSet}</div>
                  <div className="text-muted-foreground">Current Set</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent mb-2">12</div>
                  <div className="text-muted-foreground">Target Reps</div>
                </div>
              </div>

              {/* Form Score */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Form Score</span>
                  <span className={`text-2xl font-bold ${formScoreColor}`}>
                    {Math.round(formScore)}%
                  </span>
                </div>
                <Progress value={formScore} className="h-3" />
              </div>

              {/* Performance Indicators */}
              <div className="space-y-4">
                {performanceIndicators.map((indicator, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 ${indicator.color} rounded-xl`}>
                    <div className="flex items-center">
                      <indicator.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{indicator.label}</span>
                    </div>
                    <Badge variant="secondary">{indicator.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Weight
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Rest Timer
                </Button>
                <Button variant="outline" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
