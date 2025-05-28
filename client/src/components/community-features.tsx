import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Users, Calendar, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function CommunityFeatures() {
  const [likedPosts, setLikedPosts] = useState(new Set<number>());

  // Mock data - in real app this would come from API
  const challenges = [
    {
      id: 1,
      name: "January Cardio Blitz",
      description: "Complete 20 cardio sessions this month. Win exclusive NFT badges!",
      participants: 12847,
      progress: 16,
      target: 20,
      timeLeft: "3 days left",
      color: "primary",
    },
    {
      id: 2,
      name: "Mindful Movement",
      description: "Practice yoga or mobility work for 10 minutes daily for 30 days.",
      participants: 8432,
      progress: 7,
      target: 30,
      timeLeft: "2 weeks left",
      color: "accent",
    },
  ];

  const socialPosts = [
    {
      id: 1,
      user: { name: "Sarah Anderson", initials: "SA" },
      time: "2 hours ago",
      content: "Just crushed a new deadlift PR! 💪 The AI form analysis helped me perfect my technique. Thanks FitForge! #PersonalRecord #Strength",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      likes: 24,
      comments: 8,
    },
    {
      id: 2,
      user: { name: "Mike Johnson", initials: "MJ" },
      time: "5 hours ago",
      content: "Week 4 of the mindful movement challenge complete! 🧘‍♂️ The progress tracking keeps me motivated every day.",
      likes: 18,
      comments: 5,
      challenge: {
        name: "Mindful Movement",
        completed: 28,
        total: 30,
        progress: 93.3,
      },
    },
  ];

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-accent";
    if (progress >= 50) return "bg-primary";
    return "bg-secondary";
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Join the FitForge Community</h2>
        <p className="text-xl text-muted-foreground">
          Connect, compete, and celebrate with fitness enthusiasts worldwide
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Global Challenges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl">Active Challenges</CardTitle>
            <Button variant="ghost" className="text-primary font-semibold">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="border hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold">{challenge.name}</h4>
                    <Badge 
                      className={
                        challenge.color === "primary" ? "bg-primary/10 text-primary" :
                        challenge.color === "accent" ? "bg-accent/10 text-accent" :
                        "bg-secondary/10 text-secondary"
                      }
                    >
                      {challenge.timeLeft}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {challenge.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-2xl font-bold text-primary mr-1">
                        {challenge.participants.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">participants</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Your Progress</div>
                      <div className="text-lg font-bold">
                        {challenge.progress}/{challenge.target}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={(challenge.progress / challenge.target) * 100}
                    className="mb-4"
                  />
                  <Button 
                    className={`w-full ${
                      challenge.progress > 0 ? "gradient-bg" : "btn-secondary"
                    }`}
                  >
                    {challenge.progress > 0 ? "Continue Challenge" : "Join Challenge"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Social Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl">Community Feed</CardTitle>
            <Button variant="ghost" className="text-primary font-semibold">
              Post Update
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {socialPosts.map((post) => (
              <div key={post.id} className="border-b border-border pb-6 last:border-b-0">
                <div className="flex items-center mb-4">
                  <Avatar className="mr-3">
                    <AvatarFallback className="bg-primary text-white font-semibold">
                      {post.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{post.user.name}</h4>
                    <span className="text-sm text-muted-foreground">{post.time}</span>
                  </div>
                </div>
                <p className="text-foreground mb-4">{post.content}</p>
                
                {post.image && (
                  <img
                    src={post.image}
                    alt="Workout achievement"
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                )}

                {post.challenge && (
                  <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-accent">
                          {post.challenge.completed}/{post.challenge.total}
                        </div>
                        <div className="text-sm text-muted-foreground">Days Completed</div>
                      </div>
                      <div className="w-16 h-16">
                        <svg className="w-16 h-16 progress-ring">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="hsl(var(--accent) / 0.3)"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="hsl(var(--accent))"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray="175.9"
                            strokeDashoffset={175.9 * (1 - post.challenge.progress / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className={`p-0 h-auto ${
                      likedPosts.has(post.id) ? "text-red-500" : ""
                    }`}
                  >
                    <Heart 
                      className={`w-4 h-4 mr-1 ${
                        likedPosts.has(post.id) ? "fill-current" : ""
                      }`} 
                    />
                    {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full">
              Load More Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
