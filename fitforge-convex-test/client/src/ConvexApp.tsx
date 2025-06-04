import React from 'react';
import { ConvexWorkoutList } from './components/ConvexWorkoutList';

export default function ConvexApp() {
  // Using a test user ID for demonstration
  const testUserId = "test-user-123";

  return (
    <div className="min-h-screen bg-gray-50">
      <ConvexWorkoutList userId={testUserId} />
    </div>
  );
}