# Auto-Populate Body Weight for Bodyweight Exercises

## User Story
As a user, when I select a bodyweight exercise like box step-ups, I want my current body weight to automatically populate in the weight field, with the option to add additional weight if I'm carrying dumbbells or a weighted vest.

## Description
Implement automatic body weight detection and population for bodyweight exercises:
- Detect when an exercise is bodyweight-based
- Auto-fill weight field with user's current body weight
- Provide option to add additional weight (dumbbells, weighted vest, etc.)
- Calculate total weight for volume calculations

## Technical Foundation
- User body weight stored in profile/preferences
- Exercise database identifies bodyweight exercises via `equipmentType: ["Bodyweight"]`
- Volume calculation already implemented: `weight × reps × sets`

## Acceptance Criteria
- [ ] Detect bodyweight exercises from exercise database
- [ ] Auto-populate weight field with user's body weight from profile
- [ ] Show weight as "200 lbs (body weight)" for clarity
- [ ] Provide "+ Additional Weight" option for extra equipment
- [ ] Calculate total weight: `bodyWeight + additionalWeight`
- [ ] Handle users who haven't entered body weight (prompt for entry)
- [ ] Save additional weight preferences per exercise

## UI Design
```
📋 Box Step-ups

Weight: [200 lbs] (body weight)
+ Add additional weight: [0 lbs] [kettle bell ▼]

Reps: [15]
Sets: [3]

Total Volume: 9,000 lbs (200 lbs × 15 reps × 3 sets)
```

## Implementation Details
```typescript
interface BodyweightExerciseConfig {
  baseWeight: number  // User's body weight
  additionalWeight: number  // Extra equipment weight
  totalWeight: number  // baseWeight + additionalWeight
  additionalEquipment?: string  // "dumbbell", "weighted vest", etc.
}
```

## User Workflow Integration
- Seamless integration with the spontaneous workout story
- No manual weight entry needed for bodyweight exercises
- Accurate volume calculations including body weight
- Progressive overload calculations account for total weight

## Edge Cases
- User hasn't entered body weight → prompt for profile completion
- Exercise has multiple equipment options → detect bodyweight variant
- User wants to log bodyweight-only vs weighted versions separately

## Related Files
- `data/exercises/universal-exercise-database.json` - Exercise equipment types
- `client/src/components/workout/SetLogger.tsx` - Weight entry component
- `client/src/hooks/use-user-preferences.tsx` - User profile data
- User profile/preferences system for body weight storage

## Labels
enhancement, user-experience, workout-logging

## Priority
Medium