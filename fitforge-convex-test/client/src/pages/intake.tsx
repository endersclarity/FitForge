import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserIntakeForm } from '@/components/UserIntakeForm';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function Intake() {
  const [, setLocation] = useLocation();
  
  // Fetch current user preferences
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences', '1'],
    queryFn: async () => {
      const response = await fetch('/api/users/preferences/1');
      if (!response.ok) throw new Error('Failed to fetch user preferences');
      return response.json();
    }
  });
  
  const handleComplete = () => {
    // Redirect to dashboard after completion
    setLocation('/dashboard');
  };
  
  // Show completion message if onboarding is already done
  if (userPreferences?.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Profile Complete!</h2>
            <p className="text-muted-foreground mb-4">
              Your profile is already set up. You can update your information anytime in settings.
            </p>
            <button 
              onClick={() => setLocation('/dashboard')}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to FitForge!</h1>
          <p className="text-xl text-muted-foreground">
            Let's set up your profile to personalize your fitness journey
          </p>
        </div>
      </section>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserIntakeForm 
          currentData={userPreferences}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}