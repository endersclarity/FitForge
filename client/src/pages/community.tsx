import { CommunityFeatures } from "@/components/community-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Challenge, SocialPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Trophy,
  Target,
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  Plus,
  TrendingUp,
  Award,
  Flame,
} from "lucide-react";

export default function Community() {
  const { user } = useAuth();

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: socialPosts = [] } = useQuery<(SocialPost & { user: any })[]>({
    queryKey: ["/api/social/posts"],
  });

  const communityStats = {
    totalMembers: 45672,
    activeChallenges: challenges.filter(c => c.isActive).length,
    completedWorkouts: 892344,
    totalCaloriesBurned: 15672890,
  };

  const leaderboard = [
    { rank: 1, name: "Sarah Chen", points: 2847, avatar: "SC" },
    { rank: 2, name: "Mike Rodriguez", points: 2756, avatar: "MR" },
    { rank: 3, name: "Emma Johnson", points: 2698, avatar: "EJ" },
    { rank: 4, name: "Alex Thompson", points: 2634, avatar: "AT" },
    { rank: 5, name: "Lisa Wang", points: 2587, avatar: "LW" },
  ];

  const featuredChallenges = challenges.filter(c => c.isActive).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">FitForge Community</h1>
            <p className="text-xl text-muted-foreground">
              Connect, compete, and achieve greatness together
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-1">
                  {communityStats.totalMembers.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-accent mx-auto mb-4" />
                <div className="text-3xl font-bold text-accent mb-1">
                  {communityStats.activeChallenges}
                </div>
                <p className="text-sm text-muted-foreground">Live Challenges</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 text-secondary mx-auto mb-4" />
                <div className="text-3xl font-bold text-secondary mb-1">
                  {(communityStats.completedWorkouts / 1000).toFixed(0)}K
                </div>
                <p className="text-sm text-muted-foreground">Workouts Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-orange-500 mb-1">
                  {(communityStats.totalCaloriesBurned / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Challenges</h2>
            <Button className="gradient-bg">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredChallenges.map((challenge) => (
              <Card key={challenge.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">{challenge.name}</h3>
                    <Badge className="bg-primary/10 text-primary">
                      {Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {challenge.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {challenge.participants?.toLocaleString()} participants
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {challenge.target} {challenge.unit}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full btn-secondary">
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Weekly Leaderboard */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-accent" />
                  Weekly Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((leader) => (
                    <div key={leader.rank} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        leader.rank === 1 ? 'bg-yellow-500 text-white' :
                        leader.rank === 2 ? 'bg-gray-400 text-white' :
                        leader.rank === 3 ? 'bg-orange-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {leader.rank}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {leader.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{leader.name}</p>
                        <p className="text-xs text-muted-foreground">{leader.points} points</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View Full Leaderboard
                </Button>
              </CardContent>
            </Card>

            {/* Activity Feed Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Community Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socialPosts.length > 0 ? (
                  <div className="space-y-6">
                    {socialPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="border-b border-border pb-4 last:border-b-0">
                        <div className="flex items-center mb-3">
                          <Avatar className="w-8 h-8 mr-3">
                            <AvatarFallback className="text-xs">
                              {post.user.firstName?.[0]}{post.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {post.user.firstName} {post.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {post.likes}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No activity yet</p>
                    <Button className="mt-4 gradient-bg">
                      Share Your Progress
                    </Button>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4">
                  View Full Feed
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Features Component */}
      <CommunityFeatures />
    </div>
  );
}
