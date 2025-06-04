import { Exercise } from '../types/fitness';

// Pre-built exercise database - domain-specific and comprehensive
export const exerciseDatabase: Exercise[] = [
  {
    id: 'pushup',
    name: 'Push-up',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders', 'abs'],
    equipment: 'bodyweight',
    type: 'strength',
    difficulty: 2,
    instructions: [
      'Start in a plank position with hands slightly wider than shoulders',
      'Lower your body until chest nearly touches the floor',
      'Push back up to starting position',
      'Keep core tight throughout the movement'
    ],
    tips: [
      'Keep your body in a straight line',
      'Don\'t let hips sag or pike up',
      'Control the descent - don\'t drop down'
    ],
    commonMistakes: [
      'Flaring elbows too wide',
      'Not going through full range of motion',
      'Holding breath during movement'
    ]
  },
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves'],
    equipment: 'bodyweight',
    type: 'strength',
    difficulty: 2,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower by pushing hips back and bending knees',
      'Descend until thighs are parallel to floor',
      'Drive through heels to return to standing'
    ],
    tips: [
      'Keep chest up and back straight',
      'Knees track over toes, don\'t cave inward',
      'Go as deep as mobility allows'
    ],
    commonMistakes: [
      'Knees caving inward',
      'Rising onto toes',
      'Rounding the back'
    ]
  },
  {
    id: 'pullup',
    name: 'Pull-up',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'bodyweight',
    type: 'strength',
    difficulty: 4,
    instructions: [
      'Hang from bar with overhand grip',
      'Pull body up until chin clears the bar',
      'Lower with control to full arm extension',
      'Repeat for desired reps'
    ],
    tips: [
      'Engage lats by pulling shoulders down',
      'Don\'t swing or use momentum',
      'Full range of motion is key'
    ],
    commonMistakes: [
      'Not achieving full range of motion',
      'Using momentum to swing up',
      'Neglecting controlled descent'
    ]
  },
  {
    id: 'deadlift_bodyweight',
    name: 'Single Leg Deadlift',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back', 'abs'],
    equipment: 'bodyweight',
    type: 'strength',
    difficulty: 3,
    instructions: [
      'Stand on one leg with slight knee bend',
      'Hinge at hips, lowering torso while extending free leg back',
      'Reach toward floor with opposite hand',
      'Return to standing by driving hips forward'
    ],
    tips: [
      'Keep back straight throughout movement',
      'Focus on balance and control',
      'Slight bend in standing leg is okay'
    ],
    commonMistakes: [
      'Rounding the back',
      'Losing balance',
      'Not engaging the core'
    ]
  },
  {
    id: 'plank',
    name: 'Plank',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['shoulders', 'back'],
    equipment: 'bodyweight',
    type: 'strength',
    difficulty: 2,
    instructions: [
      'Start in push-up position',
      'Lower to forearms keeping elbows under shoulders',
      'Hold body in straight line from head to heels',
      'Breathe normally and hold position'
    ],
    tips: [
      'Don\'t let hips sag or pike up',
      'Engage core by pulling belly button to spine',
      'Keep head in neutral position'
    ],
    commonMistakes: [
      'Holding breath',
      'Sagging hips',
      'Raising hips too high'
    ]
  },
  {
    id: 'burpee',
    name: 'Burpee',
    primaryMuscles: ['chest', 'quadriceps'],
    secondaryMuscles: ['shoulders', 'triceps', 'abs'],
    equipment: 'bodyweight',
    type: 'cardio',
    difficulty: 3,
    instructions: [
      'Start standing, then squat down and place hands on floor',
      'Jump feet back to plank position',
      'Perform a push-up (optional)',
      'Jump feet back to squat, then jump up with arms overhead'
    ],
    tips: [
      'Land softly when jumping',
      'Maintain good push-up form if included',
      'Pace yourself - quality over speed'
    ],
    commonMistakes: [
      'Poor push-up form',
      'Landing hard on jumps',
      'Rushing through movements'
    ]
  },
  {
    id: 'mountain_climber',
    name: 'Mountain Climber',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['shoulders', 'quadriceps'],
    equipment: 'bodyweight',
    type: 'cardio',
    difficulty: 2,
    instructions: [
      'Start in push-up/plank position',
      'Bring one knee toward chest',
      'Quickly switch legs, like running in place',
      'Keep core engaged throughout'
    ],
    tips: [
      'Keep hips level, don\'t pike up',
      'Land lightly on feet',
      'Maintain plank position in upper body'
    ],
    commonMistakes: [
      'Raising hips too high',
      'Going too fast and losing form',
      'Not engaging core'
    ]
  },
  {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    primaryMuscles: ['calves'],
    secondaryMuscles: ['shoulders', 'quadriceps'],
    equipment: 'bodyweight',
    type: 'cardio',
    difficulty: 1,
    instructions: [
      'Start standing with feet together, arms at sides',
      'Jump while spreading feet and raising arms overhead',
      'Jump back to starting position',
      'Repeat in continuous motion'
    ],
    tips: [
      'Land softly on balls of feet',
      'Keep core engaged',
      'Maintain good posture throughout'
    ],
    commonMistakes: [
      'Landing too hard',
      'Poor arm coordination',
      'Leaning forward'
    ]
  }
];

// Pre-built workout templates
export const workoutTemplates = [
  {
    id: 'beginner_bodyweight',
    name: 'Beginner Bodyweight Circuit',
    description: 'Perfect for fitness beginners or home workouts',
    targetMuscleGroups: ['chest', 'quadriceps', 'abs'] as const,
    estimatedDuration: 20,
    difficulty: 1 as const,
    exercises: [
      { exerciseId: 'pushup', sets: 2, reps: 8, restTime: 60 },
      { exerciseId: 'squat', sets: 2, reps: 12, restTime: 60 },
      { exerciseId: 'plank', sets: 2, reps: 30, restTime: 60 },
      { exerciseId: 'jumping_jack', sets: 2, reps: 20, restTime: 60 }
    ]
  },
  {
    id: 'intermediate_strength',
    name: 'Intermediate Strength Training',
    description: 'Challenging strength-focused workout',
    targetMuscleGroups: ['chest', 'back', 'quadriceps', 'abs'] as const,
    estimatedDuration: 35,
    difficulty: 3 as const,
    exercises: [
      { exerciseId: 'pushup', sets: 3, reps: 15, restTime: 90 },
      { exerciseId: 'pullup', sets: 3, reps: 8, restTime: 120 },
      { exerciseId: 'squat', sets: 3, reps: 20, restTime: 90 },
      { exerciseId: 'deadlift_bodyweight', sets: 3, reps: 10, restTime: 90 },
      { exerciseId: 'plank', sets: 3, reps: 45, restTime: 60 }
    ]
  },
  {
    id: 'cardio_blast',
    name: 'Cardio Blast',
    description: 'High-intensity cardio for fat burning',
    targetMuscleGroups: ['abs', 'quadriceps', 'calves'] as const,
    estimatedDuration: 15,
    difficulty: 4 as const,
    exercises: [
      { exerciseId: 'burpee', sets: 4, reps: 8, restTime: 45 },
      { exerciseId: 'mountain_climber', sets: 4, reps: 20, restTime: 30 },
      { exerciseId: 'jumping_jack', sets: 4, reps: 30, restTime: 30 },
      { exerciseId: 'squat', sets: 4, reps: 15, restTime: 45 }
    ]
  }
];