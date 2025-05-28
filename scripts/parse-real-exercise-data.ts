// Parse Ender's real exercise data into proper database structure

export interface Exercise {
  id: number;
  name: string;
  workoutType: 'Push' | 'Pull' | 'Legs' | 'Core';
  primaryMuscleGroup: string;
  exerciseType: 'Compound' | 'Isolation';
  variation: 'A' | 'B' | 'A/B';
  equipment: string[];
  muscleActivation: Record<string, number>; // muscle name -> percentage
  restTime?: number; // seconds
}

// Helper function to parse muscle activation percentages
function parseMuscleActivation(muscleString: string): Record<string, number> {
  const muscles: Record<string, number> = {};
  const parts = muscleString.split(',');
  
  for (const part of parts) {
    const cleanPart = part.trim().replace(/_/g, ' ');
    const match = cleanPart.match(/^(.+):\s*(\d+)%$/);
    if (match) {
      const muscleName = match[1].trim();
      const percentage = parseInt(match[2]);
      muscles[muscleName] = percentage;
    }
  }
  
  return muscles;
}

// Helper function to determine primary muscle group
function getPrimaryMuscleGroup(workoutType: string, muscles: Record<string, number>): string {
  const muscleNames = Object.keys(muscles);
  
  switch (workoutType) {
    case 'ChestTriceps':
      if (muscleNames.some(m => m.includes('Pectoralis') || m.includes('Chest'))) return 'Chest';
      if (muscleNames.some(m => m.includes('Triceps'))) return 'Triceps';
      if (muscleNames.some(m => m.includes('Deltoid') || m.includes('Shoulder'))) return 'Shoulders';
      return 'Chest';
      
    case 'BackBiceps':
      if (muscleNames.some(m => m.includes('Latissimus') || m.includes('Rhomboids'))) return 'Lats';
      if (muscleNames.some(m => m.includes('Trapezius') || m.includes('Trap'))) return 'Traps';
      if (muscleNames.some(m => m.includes('Biceps'))) return 'Biceps';
      return 'Lats';
      
    case 'Legs':
      if (muscleNames.some(m => m.includes('Gluteus') || m.includes('Glute'))) return 'Glutes';
      if (muscleNames.some(m => m.includes('Quadriceps') || m.includes('Quad'))) return 'Quads';
      if (muscleNames.some(m => m.includes('Hamstrings') || m.includes('Hamstring'))) return 'Hamstrings';
      if (muscleNames.some(m => m.includes('Gastrocnemius') || m.includes('Soleus') || m.includes('Calf'))) return 'Calves';
      return 'Quads';
      
    case 'Abs':
      return 'Abs';
      
    default:
      return 'Unknown';
  }
}

// Helper function to determine exercise type
function getExerciseType(exerciseName: string, muscles: Record<string, number>): 'Compound' | 'Isolation' {
  const muscleCount = Object.keys(muscles).length;
  
  // Compound movements typically work multiple muscle groups
  const compoundKeywords = ['squat', 'deadlift', 'press', 'pull-up', 'chin-up', 'row', 'dip'];
  const isolationKeywords = ['curl', 'extension', 'raise', 'fly', 'shrug'];
  
  const nameCheck = exerciseName.toLowerCase();
  
  if (compoundKeywords.some(keyword => nameCheck.includes(keyword)) || muscleCount >= 3) {
    return 'Compound';
  }
  
  if (isolationKeywords.some(keyword => nameCheck.includes(keyword)) || muscleCount <= 2) {
    return 'Isolation';
  }
  
  return muscleCount >= 3 ? 'Compound' : 'Isolation';
}

// Parse time string to seconds
function parseRestTime(timeString: string): number {
  if (!timeString || timeString === 'n/a') return 60; // default 1 minute
  
  const match = timeString.match(/(\d+):(\d+)/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes * 60 + seconds;
  }
  
  return 60;
}

// Raw exercise data from Ender's spreadsheet
const rawExerciseData = [
  { equipment: 'Bodyweight', weights: 'Bodyweight', rest: '0:30', name: 'Planks', variation: 'A', muscles: 'Rectus_Abdominis:_65%,_Transverse_Abdominis:_40%,_Obliques:_20%,_Erector_Spinae:_10%', workoutType: 'Abs' },
  { equipment: 'Bench', weights: '1', rest: '1:00', name: 'Spider_Planks', variation: 'A', muscles: 'Rectus_Abdominis:_60%,_Transverse_Abdominis:_30%,_Obliques:_30%,_Erector_Spinae:_10%,_Shoulders:_10%', workoutType: 'Abs' },
  { equipment: 'TRX', weights: '5', rest: '1:30', name: 'Bench_Situps', variation: 'A', muscles: 'Rectus_Abdominis:_60%,_Hip_Flexors:_25%,_Obliques:_15%', workoutType: 'Abs' },
  { equipment: 'Kettlebell', weights: '10', rest: '2:00', name: 'Hanging_Knee_Raises', variation: 'A', muscles: 'Rectus_Abdominis:_80%,_Hip_Flexors:_23%,_Obliques:_40%,_Grip/Forearms:_10%', workoutType: 'Abs' },
  
  { equipment: 'Dumbbell', weights: '15', rest: '2:30', name: 'Shoulder_Shrugs', variation: 'A/B', muscles: 'Trapezius:_80%,_Levator_Scapulae:_20%', workoutType: 'BackBiceps' },
  { equipment: 'OYA', weights: '20', rest: '3:00', name: 'T_Row', variation: 'B', muscles: 'Latissimus_Dorsi:_85%,_Rhomboids:_25%,_Trapezius:_15%,_Biceps_Brachii:_12%,_Grip/Forearms:_8%', workoutType: 'BackBiceps' },
  { equipment: 'Pull-up_Bar', weights: '25', rest: '3:30', name: 'Incline_Hammer_Curl', variation: 'B', muscles: 'Biceps_Brachii:_70%,_Brachialis:_20%,_Brachioradialis:_10%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: 'Countertop', weights: '30', rest: '4:00', name: 'Neutral_Grip_Pull-ups', variation: 'B', muscles: 'Latissimus_Dorsi:_85%,_Biceps_Brachii:_25%,_Rhomboids:_15%,_Trapezius:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: 'Plybox', weights: '35', rest: '4:30', name: 'Bent_Over_Rows', variation: 'A', muscles: 'Latissimus_Dorsi:_90%,_Rhomboids:_25%,_Trapezius:_20%,_Biceps_Brachii:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '40', rest: '5:00', name: 'Row', variation: 'B', muscles: 'Latissimus_Dorsi:_85%,_Rhomboids:_25%,_Trapezius:_20%,_Biceps_Brachii:_15%,_Core:_10%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '45', rest: '5:30', name: 'Renegade_Rows', variation: 'A/B', muscles: 'Latissimus_Dorsi:_70%,_Rhomboids:_25%,_Trapezius:_20%,_Biceps_Brachii:_15%,_Core:_30%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '50', rest: '6:00', name: 'Single_Arm_Upright_Row', variation: 'A/B', muscles: 'Trapezius:_60%,_Deltoids:_40%,_Biceps_Brachii:_20%,_Core:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '55', rest: '6:30', name: 'TRX_Bicep_Curl', variation: 'A/B', muscles: 'Biceps_Brachii:_80%,_Brachialis:_15%,_Brachioradialis:_5%,_Core:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '60', rest: '7:00', name: 'Chin-Ups', variation: 'B', muscles: 'Latissimus_Dorsi:_85%,_Biceps_Brachii:_30%,_Rhomboids:_20%,_Trapezius:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '65', rest: '7:30', name: 'Face_Pull', variation: 'A/B', muscles: 'Trapezius:_50%,_Rhomboids:_40%,_Rear_Deltoids:_40%,_Rotator_Cuff:_15%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '70', rest: '8:00', name: 'Concentration_Curl', variation: 'A', muscles: 'Biceps_Brachii:_90%,_Brachialis:_10%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  { equipment: '', weights: '75', rest: '8:30', name: 'Wide_Grip_Pullups', variation: 'A', muscles: 'Latissimus_Dorsi:_90%,_Biceps_Brachii:_20%,_Rhomboids:_15%,_Trapezius:_15%,_Grip/Forearms:_10%', workoutType: 'BackBiceps' },
  
  { equipment: '', weights: '80', rest: '9:00', name: 'Bench_Press', variation: 'A', muscles: 'Pectoralis_Major:_85%,_Triceps_Brachii:_25%,_Anterior_Deltoids:_30%,_Serratus_Anterior:_10%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '85', rest: '9:30', name: 'Trx_Reverse_Flys', variation: 'A/B', muscles: 'Rhomboids:_70%,_Trapezius:_40%,_Rear_Deltoids:_30%,_Core:_15%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '90', rest: '10:00', name: 'Tricep_Extension', variation: 'A', muscles: 'Triceps_Brachii:_85%,_Anconeus:_30%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '95', rest: '', name: 'TRX_Pushup', variation: 'A', muscles: 'Pectoralis_Major:_80%,_Triceps_Brachii:_30%,_Anterior_Deltoids:_25%,_Core:_25%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '100', rest: '', name: 'Single_Arm_Bench', variation: 'A/B', muscles: 'Pectoralis_Major:_80%,_Triceps_Brachii:_25%,_Anterior_Deltoids:_25%,_Core:_20%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '105', rest: '', name: 'Single_Arm_Incline', variation: 'A/B', muscles: 'Pectoralis_Major:_75%,_Triceps_Brachii:_25%,_Anterior_Deltoids:_30%,_Core:_20%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '110', rest: '', name: 'Pullover', variation: 'A/B', muscles: 'Latissimus_Dorsi:_65%,_Pectoralis_Major:_35%,_Triceps_Brachii:_25%,_Serratus_Anterior:_15%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '115', rest: '', name: 'Claps', variation: 'A/B', muscles: 'Pectoralis_Major:_80%,_Triceps_Brachii:_20%,_Anterior_Deltoids:_20%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '120', rest: '', name: 'Pushup', variation: 'A/B', muscles: 'Pectoralis_Major:_80%,_Triceps_Brachii:_30%,_Anterior_Deltoids:_25%,_Core:_15%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '125', rest: '', name: 'Incline_Bench_Press', variation: 'B', muscles: 'Pectoralis_Major:_75%,_Triceps_Brachii:_25%,_Anterior_Deltoids:_35%,_Serratus_Anterior:_10%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '130', rest: '', name: 'Shoulder_Press', variation: 'A/B', muscles: 'Deltoids:_80%,_Triceps_Brachii:_30%,_Trapezius:_20%,_Serratus_Anterior:_15%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '135', rest: '', name: 'Dips', variation: 'B', muscles: 'Pectoralis_Major:_65%,_Triceps_Brachii:_70%,_Anterior_Deltoids:_30%,_Core:_10%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '140', rest: '', name: 'Kettlebell_Halos', variation: 'A/B', muscles: 'Deltoids:_60%,_Trapezius:_30%,_Triceps_Brachii:_25%,_Core:_30%,_Grip/Forearms:_15%', workoutType: 'ChestTriceps' },
  { equipment: '', weights: '145', rest: '', name: 'Kettlebell_Press', variation: 'A/B', muscles: 'Deltoids:_70%,_Triceps_Brachii:_40%,_Core:_35%,_Grip/Forearms:_15%', workoutType: 'ChestTriceps' },
  
  { equipment: '', weights: '150', rest: '', name: 'Goblet_Squats', variation: 'A', muscles: 'Quadriceps:_65%,_Gluteus_Maximus:_50%,_Hamstrings:_20%,_Core:_25%,_Grip/Forearms:_5%', workoutType: 'Legs' },
  { equipment: '', weights: '155', rest: '', name: 'Dead_Lifts', variation: 'A', muscles: 'Hamstrings:_70%,_Gluteus_Maximus:_90%,_Erector_Spinae:_60%,_Core:_30%,_Grip/Forearms:_25%', workoutType: 'Legs' },
  { equipment: '', weights: '160', rest: '', name: 'Calf_Raises', variation: 'A', muscles: 'Gastrocnemius:_80%,_Soleus:_70%', workoutType: 'Legs' },
  { equipment: '', weights: '165', rest: '', name: 'Glute_Bridges', variation: 'B', muscles: 'Gluteus_Maximus:_90%,_Hamstrings:_40%,_Core:_20%,_Quadriceps:_10%', workoutType: 'Legs' },
  { equipment: '', weights: '170', rest: '', name: 'Box_Step-ups', variation: 'B', muscles: 'Quadriceps:_65%,_Gluteus_Maximus:_85%,_Hamstrings:_30%,_Erector_Spinae:_15%', workoutType: 'Legs' },
  { equipment: '', weights: '175', rest: '', name: 'Stiff_Legged_Deadlifts', variation: 'B', muscles: 'Gluteus_Maximus:_75%,_Hamstrings:_85%,_Erector_Spinae:_50%,_Core:_25%,_Grip/Forearms:_15%', workoutType: 'Legs' },
  { equipment: '', weights: '180', rest: '', name: 'Kettlebell_Swings', variation: 'A/B', muscles: 'Gluteus_Maximus:_80%,_Hamstrings:_70%,_Core:_40%,_Shoulders:_15%,_Grip/Forearms:_15%', workoutType: 'Legs' }
];

// Equipment mapping - which equipment can be used for which exercises
const equipmentMapping: Record<string, string[]> = {
  'Planks': ['Bodyweight'],
  'Spider_Planks': ['Bench', 'TRX'],
  'Bench_Situps': ['TRX', 'Bench'],
  'Hanging_Knee_Raises': ['Pull-up Bar', 'Kettlebell'],
  
  'Shoulder_Shrugs': ['Dumbbell', 'Barbell', 'Kettlebell'],
  'T_Row': ['T-Bar', 'Barbell', 'OYA'],
  'Incline_Hammer_Curl': ['Dumbbell', 'Cable'],
  'Neutral_Grip_Pull-ups': ['Pull-up Bar', 'Countertop'],
  'Bent_Over_Rows': ['Barbell', 'Dumbbell', 'Plybox'],
  'Row': ['Cable', 'Resistance Band', 'Barbell'],
  'Renegade_Rows': ['Dumbbell', 'Kettlebell'],
  'Single_Arm_Upright_Row': ['Dumbbell', 'Cable', 'Kettlebell'],
  'TRX_Bicep_Curl': ['TRX'],
  'Chin-Ups': ['Pull-up Bar'],
  'Face_Pull': ['Cable', 'Resistance Band'],
  'Concentration_Curl': ['Dumbbell'],
  'Wide_Grip_Pullups': ['Pull-up Bar'],
  
  'Bench_Press': ['Barbell', 'Dumbbell'],
  'Trx_Reverse_Flys': ['TRX'],
  'Tricep_Extension': ['Dumbbell', 'Cable', 'EZ-Bar'],
  'TRX_Pushup': ['TRX'],
  'Single_Arm_Bench': ['Dumbbell'],
  'Single_Arm_Incline': ['Dumbbell'],
  'Pullover': ['Dumbbell', 'Cable'],
  'Claps': ['Bodyweight'],
  'Pushup': ['Bodyweight'],
  'Incline_Bench_Press': ['Barbell', 'Dumbbell'],
  'Shoulder_Press': ['Barbell', 'Dumbbell'],
  'Dips': ['Bodyweight', 'Dip Station'],
  'Kettlebell_Halos': ['Kettlebell'],
  'Kettlebell_Press': ['Kettlebell'],
  
  'Goblet_Squats': ['Kettlebell', 'Dumbbell'],
  'Dead_Lifts': ['Barbell', 'Dumbbell'],
  'Calf_Raises': ['Bodyweight', 'Dumbbell', 'Barbell'],
  'Glute_Bridges': ['Bodyweight', 'Barbell', 'Dumbbell'],
  'Box_Step-ups': ['Bodyweight', 'Dumbbell', 'Kettlebell'],
  'Stiff_Legged_Deadlifts': ['Barbell', 'Dumbbell'],
  'Kettlebell_Swings': ['Kettlebell']
};

// Process raw data into proper exercise structure
export const processedExercises: Exercise[] = rawExerciseData.map((raw, index) => {
  const muscles = parseMuscleActivation(raw.muscles);
  const name = raw.name.replace(/_/g, ' ');
  const workoutType = raw.workoutType === 'Abs' ? 'Core' : 
                     raw.workoutType === 'BackBiceps' ? 'Pull' : 
                     raw.workoutType === 'ChestTriceps' ? 'Push' : 
                     raw.workoutType as 'Push' | 'Pull' | 'Legs' | 'Core';
  
  return {
    id: index + 1,
    name,
    workoutType,
    primaryMuscleGroup: getPrimaryMuscleGroup(raw.workoutType, muscles),
    exerciseType: getExerciseType(name, muscles),
    variation: raw.variation as 'A' | 'B' | 'A/B',
    equipment: equipmentMapping[raw.name] || ['Bodyweight'],
    muscleActivation: muscles,
    restTime: parseRestTime(raw.rest)
  };
});

// Create muscle group mappings
export const muscleGroupMappings = {
  Push: ['Chest', 'Shoulders', 'Triceps'],
  Pull: ['Lats', 'Traps', 'Biceps', 'Rhomboids'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  Core: ['Abs', 'Obliques', 'Lower Back']
};

// Export everything
export {
  rawExerciseData,
  equipmentMapping,
  parseMuscleActivation,
  getPrimaryMuscleGroup,
  getExerciseType,
  parseRestTime
};

console.log(`Processed ${processedExercises.length} exercises from real data`);
console.log('Workout types:', [...new Set(processedExercises.map(e => e.workoutType))]);
console.log('Primary muscle groups:', [...new Set(processedExercises.map(e => e.primaryMuscleGroup))]);
console.log('Exercise types:', [...new Set(processedExercises.map(e => e.exerciseType))]);