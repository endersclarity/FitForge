# Implement 3% Progressive Overload Algorithm with Dual Options

## User Story
As a user, when I complete a workout, I want to see exactly what a 3% volume increase would look like for my next session, with clear options to achieve this through either increased weight or increased reps.

## Description
Implement intelligent progressive overload recommendations that show users two clear paths to achieve a 3% volume increase:
1. **Option A**: Keep reps the same, increase weight by X pounds
2. **Option B**: Keep weight the same, increase reps by Y reps

## Technical Foundation
Based on existing research:
- Volume calculation: `weight × reps × sets`
- 3% progression rate documented in `docs/EVIDENCE_BASED_PROGRESSION_RESEARCH.md`
- Progressive overload service already exists in `services/progressive-overload.ts`

## Acceptance Criteria
- [ ] Calculate current workout volume (weight × reps × sets)
- [ ] Calculate 3% volume increase target
- [ ] Show two recommendation options after workout completion
- [ ] Weight option: `new_weight = current_weight × (1.03^(1/reps))`
- [ ] Reps option: `new_reps = current_reps × 1.03`
- [ ] Display recommendations in clear, actionable format
- [ ] Allow user to select preferred progression method

## Implementation Details
```typescript
interface ProgressionOptions {
  currentVolume: number
  targetVolume: number  // current * 1.03
  
  weightOption: {
    newWeight: number
    currentReps: number
    description: string  // "Increase weight to 205 lbs, keep 15 reps"
  }
  
  repsOption: {
    currentWeight: number
    newReps: number
    description: string  // "Keep 200 lbs, increase to 16 reps"
  }
}
```

## User Workflow Integration
- Display recommendations immediately after clicking "Finish Workout"
- Store user's preferred progression method for future recommendations
- Integrate with existing workout session completion flow

## Related Files
- `services/progressive-overload.ts` - Core progression algorithms
- `client/src/components/workout/ProgressiveOverloadSuggestion.tsx` - UI component
- `docs/EVIDENCE_BASED_PROGRESSION_RESEARCH.md` - Research foundation

## Labels
enhancement, algorithm, progressive-overload

## Priority
High