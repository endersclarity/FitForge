# Implement 5-Day Muscle Recovery Tracking with Fatigue Percentages

## User Story
As a user, I want to know how recovered my muscles are from previous workouts so I can decide which muscle groups are safe to train and which need more recovery time.

## Description
Implement a sophisticated recovery tracking system that:
- Tracks muscle fatigue based on workout intensity and time elapsed
- Uses 5-day complete recovery cycle with graduated percentages
- Shows optimal training windows (30%-80% fatigue range)
- Warns against overtraining (80%+ fatigue) or under-training (<30% fatigue)

## Technical Foundation
Based on existing research:
- 5-day complete recovery cycle documented in research
- Muscle activation percentages available in exercise database
- Recovery algorithms planned in `docs/PROGRESSION_ALGORITHMS_IMPLEMENTATION.md`

## Recovery Algorithm
```typescript
interface MuscleRecoveryState {
  muscleGroup: string
  lastWorkoutDate: Date
  workoutIntensity: number  // 0-1 scale based on RPE or % of max
  currentFatiguePercentage: number
  recoveryStatus: 'overworked' | 'optimal' | 'undertrained'
  daysUntilOptimal: number
}

// Recovery calculation
function calculateRecovery(lastWorkout: Date, intensity: number): number {
  const daysElapsed = (Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
  const baseRecovery = Math.min(daysElapsed / 5, 1.0)  // 5-day complete recovery
  const intensityFactor = 0.5 + (intensity * 0.5)  // Intensity affects recovery time
  return Math.max(0, 100 - (baseRecovery * intensityFactor * 100))
}
```

## Acceptance Criteria
- [ ] Track last workout date and intensity for each muscle group
- [ ] Calculate current fatigue percentage for all major muscle groups
- [ ] Display recovery status with clear categories:
  - **Red (80-100%)**: Needs recovery, avoid training
  - **Green (30-80%)**: Optimal training window
  - **Blue (0-30%)**: Undertrained, encouraged to work out
- [ ] Show "days until optimal" for overworked muscles
- [ ] Integrate with exercise selection to highlight recommended muscle groups
- [ ] Update automatically after completing workouts

## User Workflow Integration
- Show recovery status on dashboard
- Filter exercise recommendations by recovery status
- Warn users when selecting exercises for overworked muscle groups
- Encourage training for undertrained muscle groups

## Related Files
- `data/exercises/universal-exercise-database.json` - Muscle group data
- `docs/PROGRESSION_ALGORITHMS_IMPLEMENTATION.md` - Recovery algorithms
- `memory-bank/progress_calculations_module.md` - Calculation formulas

## Labels
enhancement, algorithm, recovery-tracking, health-safety

## Priority
High