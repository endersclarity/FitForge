# Implement Exercise Selection by Muscle Group with Activation Data

## User Story
As a user, I want to browse exercises by the muscle groups I want to target, see which muscles each exercise activates, and understand the intensity of activation for each muscle.

## Description
Create an intelligent exercise browser that:
- Groups exercises by primary muscle targets (legs, chest, back, etc.)
- Shows detailed muscle activation percentages for each exercise
- Filters exercises based on equipment available
- Displays both primary and secondary muscle activation

## Technical Foundation
Data already exists:
- Complete exercise database with muscle activation percentages in `data/exercises/universal-exercise-database.json`
- Muscle group classifications and equipment types
- Primary and secondary muscle activation data with percentages

## Acceptance Criteria
- [ ] Exercise browser with muscle group tabs/filters (Legs, Chest, Back, Shoulders, Arms, Core)
- [ ] Each exercise card shows:
  - Primary muscles with activation percentages
  - Secondary muscles with activation percentages  
  - Equipment required
  - Difficulty level
- [ ] Filter by available equipment
- [ ] Sort by muscle activation intensity
- [ ] Search within muscle groups
- [ ] Integration with recovery status (highlight exercises for well-recovered muscles)

## UI Design
```
[Legs] [Chest] [Back] [Shoulders] [Arms] [Core]

Equipment Filter: [All] [Bodyweight] [Dumbbells] [Barbell] [Resistance Bands]

📋 Box Step-ups                    🏷️ Beginner
Primary: Quadriceps (65%), Glutes (25%)
Secondary: Calves (10%)
Equipment: Bodyweight + Box
[Select Exercise]

📋 Bulgarian Split Squats          🏷️ Intermediate  
Primary: Quadriceps (70%), Glutes (20%)
Secondary: Hamstrings (10%)
Equipment: Bodyweight + Bench
[Select Exercise]
```

## Implementation Details
- Use existing exercise database structure
- Group exercises by `workoutType` field
- Display `primaryMuscles` and `secondaryMuscles` with percentages
- Filter by `equipmentType` array
- Sort by muscle activation percentage or difficulty level

## User Workflow Integration
- Integrate with the "feeling like I want to work out legs" user story
- Show recovery status indicators next to muscle groups
- Quick exercise selection for spontaneous workouts
- Equipment-based filtering for home gym setups

## Related Files
- `data/exercises/universal-exercise-database.json` - Complete exercise data
- `client/src/pages/exercises.tsx` - Current exercise page
- `client/src/components/workout/ExerciseSelector.tsx` - Exercise selection component

## Labels
enhancement, ui/ux, exercise-selection

## Priority
Medium