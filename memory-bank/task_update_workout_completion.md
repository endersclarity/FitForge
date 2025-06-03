# Task: Update Workout Completion
   **Parent:** `implementation_plan_unified_storage_architecture.md`

## Objective
Modify workout completion in `server/routes/log-workout.ts` to save workout data directly to structured sessions format using fileStorage, eliminating the current simple log approach.

## Context
Currently workout completion saves to simple format in `/data/workout-logs/workout-YYYY-MM-DD.json`. Progress tab expects structured sessions in `/data/users/{userId}/workouts.json`. This mismatch requires data converters and creates architectural complexity.

## Steps
1. Analyze current workout completion logic in `server/routes/log-workout.ts`
2. Review structured session format in `/data/users/{userId}/workouts.json`
3. Update workout completion endpoint to:
   - Generate structured session object from workout data
   - Save directly to user's workouts.json using fileStorage.saveUserWorkouts()
   - Include all required fields: session metadata, exercises, sets, progression data
4. Preserve workout metadata: duration, total volume, completion status
5. Ensure backward compatibility with existing workout logs during transition
6. Update response format to return structured session data

## Dependencies
- Requires: [Enhanced FileStorage with structured session support]
- Blocks: [Test Unified Flow], [Remove Converter Code]

## Expected Output
Updated `log-workout.ts` that saves workout completions directly to structured sessions format, eliminating the need for data conversion when displaying progress.