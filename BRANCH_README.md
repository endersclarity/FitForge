# Feature Branch: Auto-Populate Body Weight for Bodyweight Exercises

**Branch**: `feature/auto-populate-bodyweight-issue-26`  
**GitHub Issue**: #26  
**Created**: 2025-06-03  
**Status**: 🚀 Ready to Start

## 🎯 Success Criteria

### Core Functionality
- [ ] **Bodyweight Detection**: Automatically detect bodyweight exercises from exercise database
- [ ] **Auto-Population**: Weight field auto-fills with user's current body weight
- [ ] **Clear Labeling**: Display weight as "200 lbs (body weight)" for transparency
- [ ] **Additional Weight**: "+ Additional Weight" option for extra equipment (dumbbells, weighted vest)
- [ ] **Total Weight Calculation**: `bodyWeight + additionalWeight` for accurate volume
- [ ] **Missing Data Handling**: Prompt users who haven't entered body weight
- [ ] **Equipment Preferences**: Save additional weight preferences per exercise

### User Experience
- [ ] **Seamless Integration**: Works with existing workout logging flow
- [ ] **Accurate Volume**: Body weight included in volume calculations
- [ ] **Progressive Overload**: Total weight (body + additional) used for progression
- [ ] **Clear Feedback**: Users understand what weight is being calculated

### Technical Implementation
- [ ] **User Profile System**: Body weight storage and retrieval
- [ ] **Exercise Database Integration**: Identify bodyweight exercises via `equipmentType`
- [ ] **SetLogger Enhancement**: Modified weight entry component
- [ ] **Type Safety**: Full TypeScript coverage for new interfaces

## 📋 Implementation Plan

### Phase 1: Foundation (Days 1-2)
1. **User Profile Infrastructure**
   - Extend user preferences system for body weight storage
   - Create body weight entry/update UI component
   - Implement data persistence and retrieval

2. **Exercise Database Enhancement**
   - Verify bodyweight exercise identification in universal database
   - Add utility functions to detect bodyweight exercises
   - Test with common bodyweight exercises (push-ups, pull-ups, step-ups)

### Phase 2: Core Logic (Days 3-4)
3. **SetLogger Component Enhancement**
   - Detect when current exercise is bodyweight-based
   - Auto-populate weight field with user's body weight
   - Display clear labeling: "X lbs (body weight)"

4. **Additional Weight System**
   - Add "+ Additional Weight" input field
   - Equipment type selector (dumbbell, weighted vest, etc.)
   - Calculate and display total weight

### Phase 3: Integration (Days 5-6)
5. **Volume Calculation Updates**
   - Ensure total weight (body + additional) used in volume calculations
   - Update progressive overload calculations
   - Test with real workout scenarios

6. **Missing Data Handling**
   - Detect users without body weight in profile
   - Create streamlined body weight entry flow
   - Handle edge cases gracefully

### Phase 4: Polish & Testing (Day 7)
7. **User Experience Refinement**
   - Save additional weight preferences per exercise
   - Optimize UI flow and feedback
   - Test with multiple bodyweight exercise types

8. **Quality Assurance**
   - TypeScript validation (`npm run check`)
   - Real user flow testing with browser automation
   - Edge case testing and error handling

## 🏗️ Technical Architecture

### Data Models
```typescript
interface UserProfile {
  bodyWeight: number;  // User's current body weight in lbs
  bodyWeightUnit: 'lbs' | 'kg';
  lastUpdated: string;
}

interface BodyweightExerciseConfig {
  baseWeight: number;          // User's body weight
  additionalWeight: number;    // Extra equipment weight
  totalWeight: number;         // baseWeight + additionalWeight
  additionalEquipment?: string; // "dumbbell", "weighted vest", etc.
}

interface ExerciseSetWithBodyweight extends ExerciseSet {
  isBodyweight: boolean;
  bodyweightConfig?: BodyweightExerciseConfig;
}
```

### Key Files to Modify
- `client/src/hooks/use-user-preferences.tsx` - User profile data
- `client/src/components/workout/SetLogger.tsx` - Weight entry component
- `data/exercises/universal-exercise-database.json` - Exercise equipment types
- `client/src/services/supabase-workout-service.ts` - Workout logging service

## 🎯 Business Value

### User Benefits
- **Reduced Friction**: No manual weight entry for bodyweight exercises
- **Accurate Tracking**: Body weight included in volume calculations
- **Better Progression**: Progressive overload accounts for total weight
- **Equipment Flexibility**: Support for weighted bodyweight exercises

### Foundation Benefits
- **User Profile System**: Infrastructure for other features requiring user data
- **Data Collection**: Establishes pattern for user data entry and management
- **Calculation Framework**: Foundation for body composition and goal tracking

## 📊 Progress Tracking

### Completion Status: 0% (0 of 8 tasks complete)

**Current Status**: Branch created, ready to begin implementation

**Estimated Timeline**: 7 days
- Setup & Foundation: 2 days
- Core Implementation: 2 days  
- Integration & Testing: 2 days
- Polish & QA: 1 day

**Next Steps**:
1. Set up user profile body weight infrastructure
2. Test bodyweight exercise detection in exercise database
3. Begin SetLogger component modifications

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **New User**: User without body weight logs bodyweight exercise
2. **Existing User**: User with body weight logs bodyweight exercise
3. **Additional Weight**: User adds dumbbells to bodyweight exercise
4. **Equipment Preferences**: User's additional weight choices are remembered
5. **Volume Calculations**: Verify body weight included in volume metrics

### Automated Testing
- TypeScript compilation validation
- Component rendering tests for new UI elements
- User preference data persistence tests
- Exercise detection utility function tests

---

**Branch Focus**: Building the foundation for user data collection through bodyweight exercise auto-population, enabling future features that require user profile data.

**Key Dependencies**: User profile/preferences system enhancement, exercise database integration

**Success Metric**: Seamless bodyweight exercise logging with automatic weight population and accurate volume calculations including body weight.