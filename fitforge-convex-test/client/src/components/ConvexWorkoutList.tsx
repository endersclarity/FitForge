import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function ConvexWorkoutList({ userId }: { userId: string }) {
  // Real-time query - automatically updates when data changes
  const workouts = useQuery(api.workouts.getUserWorkouts, { userId });
  const exercises = useQuery(api.exercises.getAllExercises);
  
  // Mutations for creating/updating workouts
  const createWorkout = useMutation(api.workouts.createWorkout);
  const updateStatus = useMutation(api.workouts.updateWorkoutStatus);
  const seedExercises = useMutation(api.exercises.seedExercises);

  // Handle loading states
  if (workouts === undefined || exercises === undefined) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading Convex data...</p>
      </div>
    );
  }

  const handleCreateSampleWorkout = async () => {
    try {
      await createWorkout({
        userId,
        name: "Sample Convex Workout",
        exercises: [
          {
            exerciseId: "push-up",
            sets: [
              { reps: 10, completed: false },
              { reps: 10, completed: false },
              { reps: 10, completed: false },
            ]
          },
          {
            exerciseId: "squat",
            sets: [
              { reps: 15, completed: false },
              { reps: 15, completed: false },
            ]
          }
        ]
      });
    } catch (error) {
      console.error("Failed to create workout:", error);
    }
  };

  const handleSeedExercises = async () => {
    try {
      await seedExercises();
    } catch (error) {
      console.error("Failed to seed exercises:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">🚀 FitForge + Convex</h1>
        <p className="text-blue-100">Real-time backend with automatic sync and scaling</p>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{workouts.length}</div>
            <div className="text-sm text-blue-200">Workouts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{exercises.length}</div>
            <div className="text-sm text-blue-200">Exercises</div>
          </div>
          <div>
            <div className="text-2xl font-bold">∞</div>
            <div className="text-sm text-blue-200">Real-time</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Actions Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">⚡ Convex Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleSeedExercises}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
              disabled={exercises.length > 0}
            >
              {exercises.length > 0 ? "✅ Exercises Seeded" : "🌱 Seed Exercise Database"}
            </button>
            
            <button
              onClick={handleCreateSampleWorkout}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              ➕ Create Sample Workout
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">🎯 Convex Benefits:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Real-time data sync</li>
              <li>✅ Automatic scaling</li>
              <li>✅ No server management</li>
              <li>✅ Built-in optimistic updates</li>
              <li>✅ Type-safe queries/mutations</li>
            </ul>
          </div>
        </div>

        {/* Workouts List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">💪 Your Workouts</h2>
          
          {workouts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-4">No workouts yet!</p>
              <p className="text-sm">Create your first workout using Convex mutations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{workout.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      workout.status === "completed" ? "bg-green-100 text-green-800" :
                      workout.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {workout.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>📋 {workout.exercises.length} exercises</p>
                    <p>⏰ {new Date(workout.startTime || 0).toLocaleDateString()}</p>
                  </div>

                  {workout.status !== "completed" && (
                    <button
                      onClick={() => updateStatus({ 
                        workoutId: workout._id, 
                        status: "completed" 
                      })}
                      className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise Database Preview */}
      {exercises.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🏋️ Exercise Database (Convex)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {exercises.slice(0, 3).map((exercise) => (
              <div key={exercise._id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{exercise.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  🎯 {exercise.primaryMuscles.join(", ")}
                </p>
                <p className="text-xs text-gray-500">
                  📊 Difficulty: {exercise.difficulty}/5
                </p>
                <p className="text-xs text-gray-500">
                  🛠️ {exercise.equipment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="font-semibold text-amber-800 mb-2">🧪 Convex Testing Environment</h3>
        <p className="text-sm text-amber-700">
          This is a live demonstration of FitForge with Convex backend. 
          All data is real-time and automatically synced across clients. 
          Try creating workouts and watch them appear instantly!
        </p>
      </div>
    </div>
  );
}