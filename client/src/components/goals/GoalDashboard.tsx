// FitForge Goal Dashboard Component
// Comprehensive goal overview with progress tracking and missing data handling

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  FileX,
  Scale,
  Dumbbell,
  Activity,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { ProgressChart } from './ProgressChart';
import { GoalOnboarding } from './GoalOnboarding';
import { getUserGoals, Goal, GoalType } from '@/services/supabase-goal-service';
import { useGoalProgress } from '@/hooks/use-goal-progress';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';

interface GoalDashboardProps {
  onCreateGoal?: () => void;
  onViewGoal?: (goalId: string) => void;
}

interface DashboardStats {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  overdueGoals: number;
  averageProgress: number;
}

interface MissingDataSuggestion {
  type: 'weight' | 'workout' | 'body_composition';
  title: string;
  description: string;
  action: string;
  link: string;
  priority: 'high' | 'medium' | 'low';
}

export function GoalDashboard({ onCreateGoal, onViewGoal }: GoalDashboardProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    progressResults, 
    isCalculating, 
    error: progressError, 
    calculateMultipleProgress,
    refreshProgress 
  } = useGoalProgress();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalGoals: 0,
    activeGoals: 0,
    achievedGoals: 0,
    overdueGoals: 0,
    averageProgress: 0
  });
  const [missingDataSuggestions, setMissingDataSuggestions] = useState<MissingDataSuggestion[]>([]);

  // Load goals and calculate progress
  useEffect(() => {
    if (user) {
      loadGoalsAndProgress();
    }
  }, [user]);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && goals.length === 0 && !isLoading && !error) {
      const hasSeenOnboarding = localStorage.getItem(`goals_onboarding_${user.id}`) === 'completed';
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user, goals.length, isLoading]);

  const loadGoalsAndProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load goals
      const goalsData = await getUserGoals();
      setGoals(goalsData);

      // Calculate progress for all goals
      if (goalsData.length > 0) {
        await calculateMultipleProgress(goalsData);
      }

      // Calculate dashboard stats
      calculateStats(goalsData);

      // Generate missing data suggestions
      generateMissingDataSuggestions(goalsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load goals';
      setError(errorMessage);
      toast({
        title: 'Error Loading Dashboard',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (goalsList: Goal[]) => {
    const total = goalsList.length;
    const active = goalsList.filter(g => g.is_active && !g.is_achieved).length;
    const achieved = goalsList.filter(g => g.is_achieved).length;
    
    // Calculate overdue goals
    const today = new Date();
    const overdue = goalsList.filter(g => 
      g.is_active && 
      !g.is_achieved && 
      new Date(g.target_date) < today
    ).length;

    // Calculate average progress
    const totalProgress = goalsList.reduce((sum, goal) => sum + goal.current_progress_percentage, 0);
    const average = total > 0 ? Math.round(totalProgress / total) : 0;

    setStats({
      totalGoals: total,
      activeGoals: active,
      achievedGoals: achieved,
      overdueGoals: overdue,
      averageProgress: average
    });
  };

  const generateMissingDataSuggestions = (goalsList: Goal[]) => {
    const suggestions: MissingDataSuggestion[] = [];

    // Check for goals that need data
    const weightGoals = goalsList.filter(g => g.goal_type === 'weight_loss' && g.is_active);
    const strengthGoals = goalsList.filter(g => g.goal_type === 'strength_gain' && g.is_active);
    const bodyCompGoals = goalsList.filter(g => g.goal_type === 'body_composition' && g.is_active);

    if (weightGoals.length > 0) {
      suggestions.push({
        type: 'weight',
        title: 'Log Your Current Weight',
        description: `You have ${weightGoals.length} weight loss goal${weightGoals.length > 1 ? 's' : ''} that need weight measurements to track progress.`,
        action: 'Add Weight Measurement',
        link: '/profile/body-stats',
        priority: 'high'
      });
    }

    if (strengthGoals.length > 0) {
      suggestions.push({
        type: 'workout',
        title: 'Log Strength Workouts',
        description: `Track workouts with your target exercises to see strength progress for ${strengthGoals.length} goal${strengthGoals.length > 1 ? 's' : ''}.`,
        action: 'Start Workout',
        link: '/start-workout',
        priority: 'high'
      });
    }

    if (bodyCompGoals.length > 0) {
      suggestions.push({
        type: 'body_composition',
        title: 'Update Body Composition',
        description: `Log body fat percentage measurements to track ${bodyCompGoals.length} body composition goal${bodyCompGoals.length > 1 ? 's' : ''}.`,
        action: 'Add Body Measurements',
        link: '/profile/body-stats',
        priority: 'medium'
      });
    }

    setMissingDataSuggestions(suggestions);
  };

  const handleRefreshProgress = async () => {
    if (goals.length > 0) {
      await refreshProgress(goals);
      calculateStats(goals);
    }
  };

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`goals_onboarding_${user.id}`, 'completed');
    }
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    if (user) {
      localStorage.setItem(`goals_onboarding_${user.id}`, 'completed');
    }
    setShowOnboarding(false);
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'weight_loss': return <Scale className="h-4 w-4" />;
      case 'strength_gain': return <Dumbbell className="h-4 w-4" />;
      case 'body_composition': return <Activity className="h-4 w-4" />;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Scale className="h-5 w-5" />;
      case 'workout': return <Dumbbell className="h-5 w-5" />;
      case 'body_composition': return <Activity className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'low': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please log in to view your goals dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <div className="py-8">
        <GoalOnboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    );
  }

  // Empty state - no goals (for users who skipped onboarding)
  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Target className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">Welcome to Goal Tracking!</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start your fitness journey by setting specific, measurable goals. 
          Track progress with real data and transparent calculations.
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            <Button onClick={onCreateGoal} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Goal
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowOnboarding(true)}
            >
              <Target className="h-5 w-5 mr-2" />
              Learn About Goals
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            <Card className="text-center p-4">
              <Scale className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-medium">Weight Loss</h3>
              <p className="text-sm text-muted-foreground">Track weight with transparent progress formulas</p>
            </Card>
            
            <Card className="text-center p-4">
              <Dumbbell className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h3 className="font-medium">Strength Gain</h3>
              <p className="text-sm text-muted-foreground">Set PR targets based on workout data</p>
            </Card>
            
            <Card className="text-center p-4">
              <Activity className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h3 className="font-medium">Body Composition</h3>
              <p className="text-sm text-muted-foreground">Track body fat and muscle mass changes</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeGoals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.achievedGoals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Data Suggestions */}
      {missingDataSuggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Improve Your Progress Tracking
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missingDataSuggestions.map((suggestion, index) => (
              <Card key={index} className={`${getPriorityColor(suggestion.priority)} border`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getSuggestionIcon(suggestion.type)}
                    {suggestion.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLocation(suggestion.link)}
                    className="w-full"
                  >
                    {suggestion.action}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Goals Overview */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Goals</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshProgress}
            disabled={isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            Refresh Progress
          </Button>
          <Button onClick={onCreateGoal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({stats.activeGoals})
          </TabsTrigger>
          <TabsTrigger value="achieved">
            Achieved ({stats.achievedGoals})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Goals ({stats.totalGoals})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {goals
            .filter(goal => goal.is_active && !goal.is_achieved)
            .map(goal => {
              const progressResult = progressResults.get(goal.id);
              return (
                <div key={goal.id} onClick={() => onViewGoal?.(goal.id)} className="cursor-pointer">
                  {progressResult ? (
                    <ProgressChart 
                      goal={goal} 
                      progressResult={progressResult}
                      size="normal"
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          {getGoalTypeIcon(goal.goal_type)}
                          <div>
                            <h4 className="font-medium">{goal.goal_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Progress calculation pending...
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
        </TabsContent>
        
        <TabsContent value="achieved" className="space-y-4">
          {goals
            .filter(goal => goal.is_achieved)
            .map(goal => {
              const progressResult = progressResults.get(goal.id);
              return (
                <div key={goal.id} onClick={() => onViewGoal?.(goal.id)} className="cursor-pointer">
                  {progressResult ? (
                    <ProgressChart 
                      goal={goal} 
                      progressResult={progressResult}
                      size="compact"
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {getGoalTypeIcon(goal.goal_type)}
                          <div>
                            <h4 className="font-medium">{goal.goal_title}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Achieved
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {goals.map(goal => {
            const progressResult = progressResults.get(goal.id);
            return (
              <div key={goal.id} onClick={() => onViewGoal?.(goal.id)} className="cursor-pointer">
                {progressResult ? (
                  <ProgressChart 
                    goal={goal} 
                    progressResult={progressResult}
                    size="compact"
                  />
                ) : (
                  <Card className={!goal.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {getGoalTypeIcon(goal.goal_type)}
                        <div>
                          <h4 className="font-medium">{goal.goal_title}</h4>
                          <div className="flex gap-2 mt-1">
                            {goal.is_achieved && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Achieved
                              </Badge>
                            )}
                            {!goal.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Progress Error Alert */}
      {progressError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Progress Calculation Error</AlertTitle>
          <AlertDescription>{progressError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}