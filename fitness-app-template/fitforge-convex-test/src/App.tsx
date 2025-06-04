import { useState } from 'react';
import { RepCounter } from './components/fitness/RepCounter';
import { MuscleVisualizer } from './components/fitness/MuscleVisualizer';
import { WorkoutTimer } from './components/fitness/WorkoutTimer';
import { exerciseDatabase, workoutTemplates } from './data/exercises';
import { MuscleGroup } from './types/fitness';

function App() {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>(['chest', 'triceps']);
  const [currentReps, setCurrentReps] = useState(0);
  const [targetReps, setTargetReps] = useState(10);

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleRepComplete = (reps: number) => {
    setCurrentReps(reps);
    // Could trigger muscle visualization update here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Fitness App Template
        </h1>
        <p className="text-lg text-gray-600">
          Domain-Specific Components for Fitness Applications
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <strong>Approach 2:</strong> Pre-built fitness components with opinionated design
        </div>
      </div>

      {/* Demo Components */}
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        
        {/* Rep Counter Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Smart Rep Counter</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <RepCounter
                targetReps={targetReps}
                onComplete={handleRepComplete}
                onReset={() => setCurrentReps(0)}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Reps
                </label>
                <input
                  type="number"
                  value={targetReps}
                  onChange={(e) => setTargetReps(parseInt(e.target.value) || 10)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                  min="1"
                  max="100"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Visual progress indicator</li>
                  <li>Tap-to-count interaction</li>
                  <li>Auto-complete detection</li>
                  <li>Reset functionality</li>
                  <li>Fitness-specific animations</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Muscle Visualizer Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Interactive Muscle Visualizer</h2>
          <div>
            <MuscleVisualizer
              activeMuscles={selectedMuscles}
              intensity="medium"
              onMuscleClick={handleMuscleClick}
            />
            <div className="mt-4 text-center text-sm text-gray-600">
              Click on muscle groups to activate/deactivate them
            </div>
          </div>
        </section>

        {/* Workout Timer Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Workout Timer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <WorkoutTimer
              onTimerComplete={() => console.log('Rest complete!')}
              autoStart={false}
            />
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Workout and rest timer modes</li>
                  <li>Quick rest buttons (30s, 1m, 2m)</li>
                  <li>Auto-resume after rest</li>
                  <li>Visual status indicators</li>
                  <li>Workout stats tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Exercise Database Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pre-built Exercise Database</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exerciseDatabase.slice(0, 6).map(exercise => (
              <div key={exercise.id} className="workout-card">
                <h3 className="font-semibold text-gray-800 mb-2">{exercise.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`intensity-indicator intensity-${
                      exercise.difficulty <= 2 ? 'low' : 
                      exercise.difficulty <= 3 ? 'medium' : 'high'
                    }`}></div>
                    <span className="text-sm">Difficulty: {exercise.difficulty}/5</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Primary:</strong> {exercise.primaryMuscles.join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Equipment:</strong> {exercise.equipment}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {exercise.instructions[0]}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workout Templates Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pre-built Workout Templates</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {workoutTemplates.map(template => (
              <div key={template.id} className="workout-card">
                <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`intensity-indicator intensity-${
                      template.difficulty <= 2 ? 'low' : 
                      template.difficulty <= 3 ? 'medium' : 'high'
                    }`}></div>
                    <span className="text-sm">Difficulty: {template.difficulty}/5</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Duration:</strong> {template.estimatedDuration} minutes
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Exercises:</strong> {template.exercises.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Target:</strong> {template.targetMuscleGroups.join(', ')}
                  </div>
                </div>
                <button className="exercise-button w-full mt-3 text-sm">
                  Start Workout
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Approach 2: Domain-Specific Template
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">✅ What This Provides</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Pre-built fitness components</strong> (Rep Counter, Muscle Visualizer, Timer)</li>
                <li>• <strong>Domain-specific types</strong> (MuscleGroup, Exercise, WorkoutSession)</li>
                <li>• <strong>Opinionated styling</strong> (fitness-themed colors and animations)</li>
                <li>• <strong>Exercise database</strong> with instructions, tips, common mistakes</li>
                <li>• <strong>Workout templates</strong> for different fitness levels</li>
                <li>• <strong>Tailwind + fitness utilities</strong> for rapid UI development</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">🎯 Key Differences from Approach 1</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Fitness-first design:</strong> Components built specifically for workout tracking</li>
                <li>• <strong>Rich interactions:</strong> Rep counting, muscle visualization, timer management</li>
                <li>• <strong>Professional styling:</strong> Tailwind CSS with fitness-specific utilities</li>
                <li>• <strong>Complete data model:</strong> Comprehensive types for all fitness concepts</li>
                <li>• <strong>Ready-to-use:</strong> Copy components directly into your fitness app</li>
                <li>• <strong>Extensible:</strong> Built with customization and extension in mind</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Complexity Comparison</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">12</div>
                <div className="text-xs text-gray-600">Dependencies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">15min</div>
                <div className="text-xs text-gray-600">Setup Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">~90%</div>
                <div className="text-xs text-gray-600">Features Ready</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;