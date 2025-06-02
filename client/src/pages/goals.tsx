// FitForge Goals Page
// Main goals dashboard with overview and management

import React from 'react';
import { useLocation } from 'wouter';
import { Target } from 'lucide-react';
import { GoalDashboard } from '@/components/goals/GoalDashboard';
import { useAuth } from '@/hooks/use-auth';

export default function GoalsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  if (!user) {
    setLocation('/auth');
    return null;
  }

  const handleCreateGoal = () => {
    setLocation('/goals/new');
  };

  const handleViewGoal = (goalId: string) => {
    setLocation(`/goals/${goalId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Fitness Goals</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Set specific, measurable fitness targets and track your progress with real data. 
            All calculations are transparent and based on your actual workouts and measurements.
          </p>
        </div>

        {/* Main Dashboard */}
        <GoalDashboard 
          onCreateGoal={handleCreateGoal}
          onViewGoal={handleViewGoal}
        />
      </div>
    </div>
  );
}