import React, { useState } from 'react';

interface Exercise {
  id: string;
  exerciseName: string;
  primaryMuscles: string[];
  workoutType: string;
}

interface ExerciseSelectorProps {
  onBack: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises: Exercise[];
}

export function ExerciseSelector({ onBack, onSelectExercise, selectedExercises }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock exercise data - in real app this would come from API
  const exercises: Exercise[] = [
    { id: '1', exerciseName: 'Push-ups', primaryMuscles: ['Chest', 'Shoulders', 'Triceps'], workoutType: 'Chest' },
    { id: '2', exerciseName: 'Squats', primaryMuscles: ['Quadriceps', 'Glutes'], workoutType: 'Legs' },
    { id: '3', exerciseName: 'Pull-ups', primaryMuscles: ['Lats', 'Biceps'], workoutType: 'Back' },
    { id: '4', exerciseName: 'Deadlifts', primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'], workoutType: 'Legs' },
    { id: '5', exerciseName: 'Bench Press', primaryMuscles: ['Chest', 'Shoulders', 'Triceps'], workoutType: 'Chest' },
  ];

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscles.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || exercise.workoutType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique workout types for filtering
  const workoutTypes = ["all", ...Array.from(new Set(exercises.map(ex => ex.workoutType)))];

  const isExerciseSelected = (exercise: Exercise) => {
    return selectedExercises.some(ex => ex.id === exercise.id);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={{ marginRight: '10px', padding: '8px 16px' }}>
          ← Back
        </button>
        <h1 style={{ display: 'inline', fontSize: '24px', fontWeight: 'bold' }}>
          Select Exercises
        </h1>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minWidth: '200px'
          }}
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            border: '1px solid #ccc', 
            borderRadius: '4px'
          }}
        >
          {workoutTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Categories' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Exercise List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: isExerciseSelected(exercise) ? '#e3f2fd' : 'white',
              cursor: 'pointer'
            }}
            onClick={() => onSelectExercise(exercise)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
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
              {isExerciseSelected(exercise) && (
                <span style={{ color: 'green', fontSize: '20px' }}>✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No exercises found matching your criteria.
        </div>
      )}
    </div>
  );
}