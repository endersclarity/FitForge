// FitForge Goals List Component
// Display user goals with progress tracking and management actions

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Target, 
  Plus, 
  Scale, 
  Dumbbell, 
  Activity, 
  Calendar, 
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { 
  getUserGoals, 
  deleteGoal, 
  markGoalAsAchieved,
  Goal, 
  GoalType, 
  GoalServiceError 
} from '@/services/supabase-goal-service';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';

interface GoalsListProps {
  onCreateGoal?: () => void;
  onEditGoal?: (goalId: string) => void;
}

export function GoalsList({ onCreateGoal, onEditGoal }: GoalsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const goalsData = await getUserGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to load goals:', error);
      toast({
        title: 'Error Loading Goals',
        description: 'Could not load your goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setIsDeleting(goalId);
      await deleteGoal(goalId);
      
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been permanently deleted.',
      });
      
      // Remove from local state
      setGoals(goals.filter(goal => goal.id !== goalId));
      
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof GoalServiceError ? error.message : 'Could not delete goal.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMarkAchieved = async (goalId: string) => {
    try {
      const updatedGoal = await markGoalAsAchieved(goalId);
      
      toast({
        title: 'Congratulations! 🎉',
        description: 'Goal marked as achieved! Great work on reaching your target.',
      });
      
      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
      
    } catch (error) {
      console.error('Failed to mark goal as achieved:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof GoalServiceError ? error.message : 'Could not update goal.',
        variant: 'destructive',
      });
    }
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'weight_loss': return <Scale className="h-5 w-5" />;
      case 'strength_gain': return <Dumbbell className="h-5 w-5" />;
      case 'body_composition': return <Activity className="h-5 w-5" />;
    }
  };

  const getGoalTypeColor = (type: GoalType) => {
    switch (type) {
      case 'weight_loss': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'strength_gain': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'body_composition': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatGoalType = (type: GoalType) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-2xl font-semibold mb-2">No Goals Set Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start your fitness journey by setting specific, measurable goals. 
          Track your progress with real data and transparent calculations.
        </p>
        <Button onClick={onCreateGoal} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Your First Goal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Fitness Goals</h2>
          <p className="text-muted-foreground">
            {goals.filter(g => g.is_active && !g.is_achieved).length} active • {' '}
            {goals.filter(g => g.is_achieved).length} achieved
          </p>
        </div>
        <Button onClick={onCreateGoal}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.target_date);
          const isOverdue = daysRemaining < 0;
          const isAchieved = goal.is_achieved;
          
          return (
            <Card key={goal.id} className={`${!goal.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getGoalTypeIcon(goal.goal_type)}
                    <div>
                      <CardTitle className="text-lg">{goal.goal_title}</CardTitle>
                      <CardDescription className="text-sm">
                        {formatGoalType(goal.goal_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className={getGoalTypeColor(goal.goal_type)}>
                      {formatGoalType(goal.goal_type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(goal.current_progress_percentage)}%
                    </span>
                  </div>
                  <Progress 
                    value={goal.current_progress_percentage} 
                    className="h-2"
                  />
                  {isAchieved && (
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Achieved!</span>
                    </div>
                  )}
                </div>

                {/* Target Info */}
                <div className="space-y-2 text-sm">
                  {goal.goal_type === 'weight_loss' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span>{goal.start_weight_lbs}lbs → {goal.target_weight_lbs}lbs</span>
                    </div>
                  )}
                  {goal.goal_type === 'strength_gain' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span>{goal.target_weight_for_exercise_lbs}lbs</span>
                    </div>
                  )}
                  {goal.goal_type === 'body_composition' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span>{goal.target_body_fat_percentage}% body fat</span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Target:</span>
                  <span>{format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
                  {!isAchieved && (
                    <Badge 
                      variant={isOverdue ? "destructive" : "outline"}
                      className="ml-auto"
                    >
                      {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                    </Badge>
                  )}
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getPriorityColor(goal.priority_level)}>
                    {goal.priority_level} priority
                  </Badge>
                  {!goal.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {onEditGoal && (
                    <Button variant="outline" size="sm" onClick={() => onEditGoal(goal.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {!isAchieved && goal.is_active && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkAchieved(goal.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isDeleting === goal.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{goal.goal_title}"? 
                          This action cannot be undone and all progress data will be lost.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Goal
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}