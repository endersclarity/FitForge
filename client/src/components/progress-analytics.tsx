import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Medal, TrendingUp, Download } from "lucide-react";
import { useState } from "react";

export function ProgressAnalytics() {
  const [timePeriod, setTimePeriod] = useState("1M");
  
  // Mock data - in real app this would come from API
  const progressData = [
    { month: "Jan", muscle: 15, fat: 20 },
    { month: "Feb", muscle: 18, fat: 18 },
    { month: "Mar", muscle: 22, fat: 16 },
    { month: "Apr", muscle: 25, fat: 14 },
    { month: "May", muscle: 28, fat: 12 },
    { month: "Jun", muscle: 30, fat: 10 },
  ];

  const handleExportData = () => {
    // TODO: Implement data export functionality
    const csvData = progressData.map(item => 
      `${item.month},${item.muscle},${item.fat}`
    ).join('\n');
    
    const blob = new Blob([`Month,Muscle,Fat\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitness-progress.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const achievements = [
    {
      icon: Trophy,
      title: "Personal Record",
      description: "New bench press PR: 225 lbs",
      date: "2 days ago",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Flame,
      title: "Streak Master",
      description: "30-day workout streak achieved!",
      date: "1 week ago",
      color: "text-accent bg-accent/10",
    },
    {
      icon: Medal,
      title: "Form Expert",
      description: "Perfect form score for 10 workouts",
      date: "2 weeks ago",
      color: "text-secondary bg-secondary/10",
    },
  ];

  const keyMetrics = [
    { label: "Muscle Gained", value: "+3.2kg", color: "text-primary bg-primary/10" },
    { label: "Body Fat Lost", value: "-2.1%", color: "text-accent bg-accent/10" },
    { label: "Strength Increase", value: "+18%", color: "text-secondary bg-secondary/10" },
  ];

  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Track Your Evolution</h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive analytics powered by machine learning predictions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Body Composition Analysis */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl">Body Composition Trends</CardTitle>
              <div className="flex space-x-2">
                {["1M", "3M", "1Y"].map((period) => (
                  <Button 
                    key={period}
                    size="sm" 
                    variant={timePeriod === period ? "default" : "outline"}
                    onClick={() => setTimePeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Chart Area */}
              <div className="h-64 relative mb-6">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Muscle mass line */}
                  <polyline
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    points="20,160 80,155 140,150 200,145 260,140 320,135 380,130"
                  />

                  {/* Body fat line */}
                  <polyline
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    points="20,120 80,125 140,120 200,115 260,110 320,105 380,100"
                  />

                  {/* Data points */}
                  <circle cx="380" cy="130" r="4" fill="hsl(var(--primary))" />
                  <circle cx="380" cy="100" r="4" fill="hsl(var(--accent))" />
                </svg>

                {/* Legend */}
                <div className="absolute bottom-0 left-0 flex space-x-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-primary rounded mr-2"></div>
                    <span className="text-sm text-muted-foreground">Muscle Mass</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-accent rounded mr-2"></div>
                    <span className="text-sm text-muted-foreground">Body Fat %</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-6">
                {keyMetrics.map((metric, index) => (
                  <div key={index} className={`text-center p-4 ${metric.color} rounded-xl`}>
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${achievement.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <achievement.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <span className="text-xs text-muted-foreground">{achievement.date}</span>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-6">
                View All Achievements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
