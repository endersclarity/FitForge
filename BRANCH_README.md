# Branch: Auto-Populate Body Weight for Bodyweight Exercises

**Issue**: [#26 Auto-Populate Body Weight for Bodyweight Exercises](https://github.com/endersclarity/FitForge/issues/26)  
**Branch**: `feature/auto-populate-body-weight-issue-26`  
**Created**: 2025-06-03  
**Type**: Enhancement - User Experience & Data Foundation

## 🎯 Success Criteria

### Core Functionality
- [ ] **Detect bodyweight exercises** from exercise database (`equipmentType: ["Bodyweight"]`)
- [ ] **Auto-populate weight field** with user's body weight from profile
- [ ] **Display clear weight indication** showing "200 lbs (body weight)" format
- [ ] **Provide additional weight option** for extra equipment (dumbbells, weighted vest)
- [ ] **Calculate total weight accurately** as `bodyWeight + additionalWeight`
- [ ] **Handle missing body weight** by prompting user for profile completion
- [ ] **Save additional weight preferences** per exercise for future sessions

### Data Infrastructure 
- [ ] **User profile system** for storing body weight and preferences
- [ ] **Profile completion workflow** when body weight is missing
- [ ] **Integration with existing volume calculations** (weight × reps × sets)
- [ ] **Data persistence** across sessions and page refreshes

### User Experience
- [ ] **Seamless workflow integration** with existing workout logging
- [ ] **Clear visual distinction** between body weight and additional weight
- [ ] **Progressive enhancement** - works without breaking existing functionality
- [ ] **Responsive design** across mobile and desktop interfaces

## 🏗️ Implementation Plan

### Phase 1: User Profile Foundation (Days 1-2)
```typescript
// Core data structures and storage
interface UserProfile {
  bodyWeight: number;
  heightFeet: number;
  heightInches: number;
  age: number;
  goals: {
    calorieTarget?: number;
    volumeIncreasePreference: number; // percentage
  };
}
```

**Tasks:**
- Create user profile schema and TypeScript interfaces
- Build profile storage system (JSON file-based for development)
- Design profile completion/editing UI components
- Implement profile data hooks and context providers

### Phase 2: Exercise Detection & Auto-Population (Days 3-4)
```typescript
// Exercise classification and weight logic
interface BodyweightExerciseConfig {
  baseWeight: number;
  additionalWeight: number;
  totalWeight: number;
  additionalEquipment?: string;
}
```

**Tasks:**
- Enhance exercise database queries to detect bodyweight exercises
- Modify SetLogger component to auto-populate weight for bodyweight exercises
- Add additional weight input UI with equipment selection
- Update volume calculation logic to use total weight

### Phase 3: Integration & Polish (Days 5-6)
**Tasks:**
- Integrate profile completion prompts into workout flow
- Add preference persistence for additional weights per exercise
- Implement data migration for existing users
- Add comprehensive error handling and edge cases
- Mobile responsiveness and UX polish

## 🧪 Testing Strategy

### Unit Testing
- [ ] User profile data validation and storage
- [ ] Exercise type detection algorithms
- [ ] Weight calculation logic (bodyweight + additional)
- [ ] Volume calculation accuracy

### Integration Testing
- [ ] Profile completion workflow end-to-end
- [ ] Workout logging with auto-populated weights
- [ ] Data persistence across browser sessions
- [ ] Migration from existing workout data

### User Experience Testing
- [ ] First-time user onboarding flow
- [ ] Existing user profile setup
- [ ] Bodyweight vs weighted exercise workflows
- [ ] Mobile device compatibility

## 📊 Foundation for Future Features

This implementation creates the **user data infrastructure** that enables:

- **Progressive Overload Algorithm** (Issue #23) - needs user weight and preferences
- **Chart.js Progress Dashboard** (Issue #13) - needs user metrics for context
- **Recovery Tracking** (Issue #24) - needs user body composition data
- **Smart Exercise Selection** (Issue #11) - needs user equipment and preferences

## 🎛️ Technical Architecture

### Data Flow
```
User Profile → Exercise Detection → Weight Auto-Population → Volume Calculation → Progress Tracking
```

### Key Components
- `useUserProfile()` - Profile data management hook
- `ProfileSetupDialog` - Profile completion UI
- `EnhancedSetLogger` - Modified workout logging with auto-population
- `BodyweightExerciseService` - Exercise classification and weight logic

### Integration Points
- Exercise database (`universal-exercise-database.json`)
- Workout session management (`use-workout-session.tsx`)
- User data storage (file-based system)
- Volume calculation services

## 🚀 Estimated Timeline

**Total Duration**: 6 days
- **Days 1-2**: User profile foundation and data structures
- **Days 3-4**: Exercise detection and auto-population logic  
- **Days 5-6**: Integration, testing, and polish

**Daily Commitment**: 4-6 hours focused development
**Complexity**: Medium (new data infrastructure + UI integration)

## ✅ Definition of Done

- [ ] All acceptance criteria from Issue #26 completed
- [ ] TypeScript compilation with zero errors (`npm run check`)
- [ ] Integration tests passing for user workflows
- [ ] Mobile-responsive design verified
- [ ] User profile system ready for future feature expansion
- [ ] Documentation updated with new user data architecture
- [ ] CodeRabbit review completed and approved
- [ ] Successfully merged to master with clean git history

---
**Branch Status**: 🟡 In Progress  
**Last Updated**: 2025-06-03  
**Next Milestone**: User profile schema and storage foundation