import React, { useState } from 'react';

interface Exercise {
  id: string;
  exerciseName: string;
  primaryMuscles: string[];
  workoutType: string;
}

interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutExercise extends Exercise {
  sets: Set[];
}

interface WorkoutSessionProps {
  onBack: () => void;
}

export function WorkoutSession({ onBack }: WorkoutSessionProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const addExercise = (exercise: Exercise) => {
    const workoutExercise: WorkoutExercise = {
      ...exercise,
      sets: [{ id: '1', weight: 0, reps: 0, completed: false }]
    };
    setExercises(prev => [...prev, workoutExercise]);
    setShowExerciseSelector(false);
  };

  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, { 
            id: (ex.sets.length + 1).toString(), 
            weight: 0, 
            reps: 0, 
            completed: false 
          }] }
        : ex
    ));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: ex.sets.map(set => 
            set.id === setId ? { ...set, [field]: value } : set
          )}
        : ex
    ));
  };

  const completeSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: ex.sets.map(set => 
            set.id === setId ? { ...set, completed: !set.completed } : set
          )}
        : ex
    ));
  };

  if (showExerciseSelector) {
    const ExerciseSelector = React.lazy(() => import('./ExerciseSelector').then(module => ({ default: module.ExerciseSelector })));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ExerciseSelector
          onBack={() => setShowExerciseSelector(false)}
          onSelectExercise={addExercise}
          selectedExercises={exercises}
        />
      </React.Suspense>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={onBack} style={{ marginRight: '10px', padding: '8px 16px' }}>
            ← Back
          </button>
          <h1 style={{ display: 'inline', fontSize: '24px', fontWeight: 'bold' }}>
            Workout Session
          </h1>
        </div>
        <button
          onClick={() => setShowExerciseSelector(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Exercise
        </button>
      </div>

      {/* Workout Content */}
      {exercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <h2>No exercises added yet</h2>
          <p>Click "Add Exercise" to start your workout!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={exercise.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white'
              }}
            >
              {/* Exercise Header */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
                  {exercise.exerciseName}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {exercise.primaryMuscles.map((muscle, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#f0f0f0',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 80px', gap: '10px', alignItems: 'center', fontWeight: 'bold', marginBottom: '8px' }}>
                  <span>Set</span>
                  <span>Weight</span>
                  <span>Reps</span>
                  <span>Done</span>
                </div>
                
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 80px', gap: '10px', alignItems: 'center' }}>
                    <span>{setIndex + 1}</span>
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                      placeholder="Weight"
                      style={{
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="Reps"
                      style={{
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => completeSet(exercise.id, set.id)}
                      style={{
                        backgroundColor: set.completed ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {set.completed ? '✓' : '○'}
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => addSet(exercise.id)}
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px dashed #ccc',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  + Add Set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Summary */}
      {exercises.length > 0 && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Workout Summary</h3>
          <p>Exercises: {exercises.length}</p>
          <p>Total Sets: {exercises.reduce((total, ex) => total + ex.sets.length, 0)}</p>
          <p>Completed Sets: {exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0)}</p>
        </div>
      )}
    </div>
  );
}