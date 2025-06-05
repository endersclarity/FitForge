import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-supabase-auth";
import { workoutService } from "@/services/supabase-workout-service";
import type { Exercise } from "@/lib/supabase";

export default function TestSupabase() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGetExercises = async () => {
    setLoading(true);
    try {
      log('Testing getExercisesByType...');
      const legExercises = await workoutService.getExercisesByType('Legs');
      setExercises(legExercises);
      log(`✅ Found ${legExercises.length} leg exercises`);
    } catch (error) {
      log(`❌ Error getting exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testStartWorkout = async () => {
    if (!user) {
      log('❌ User not authenticated');
      return;
    }

    setLoading(true);
    try {
      log('Testing startWorkout...');
      const result = await workoutService.startWorkout({
        workoutType: 'Legs',
        exerciseIds: exercises.slice(0, 3).map(ex => ex.id),
        sessionName: 'Test Legs Workout'
      });
      log(`✅ Started workout session: ${result.session.id}`);
      log(`✅ Loaded ${result.exercises.length} exercises for workout`);
    } catch (error) {
      log(`❌ Error starting workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Supabase Integration Test</h1>
        
        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div>
                <p>✅ Signed in as: {user.email}</p>
                <Button onClick={signOut} variant="outline">Sign Out</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Email:</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Password:</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="space-x-2">
                  <Button onClick={() => signIn(email, password)}>Sign In</Button>
                  <Button onClick={() => signUp(email, password, 'Test User')} variant="outline">Sign Up</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Loading Test */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Database Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testGetExercises} disabled={loading}>
              {loading ? 'Loading...' : 'Test Get Leg Exercises'}
            </Button>
            {exercises.length > 0 && (
              <div>
                <p>Found {exercises.length} exercises:</p>
                <ul className="list-disc list-inside text-sm">
                  {exercises.slice(0, 5).map(ex => (
                    <li key={ex.id}>{ex.exerciseName} - {ex.category}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Session Test */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Session Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testStartWorkout} 
              disabled={loading || !user || exercises.length === 0}
            >
              {loading ? 'Starting...' : 'Test Start Workout'}
            </Button>
            {!user && <p className="text-sm text-muted-foreground">Sign in first</p>}
            {exercises.length === 0 && <p className="text-sm text-muted-foreground">Load exercises first</p>}
          </CardContent>
        </Card>

        {/* Results Log */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p>No test results yet...</p>
              ) : (
                results.map((result, index) => (
                  <div key={index}>{result}</div>
                ))
              )}
            </div>
            <Button 
              onClick={() => setResults([])} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Clear Log
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}