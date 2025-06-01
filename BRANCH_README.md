# BRANCH: feature/workout-logging-flow

## 🎯 BRANCH OBJECTIVE
Enable users to log actual workouts with real data storage and retrieval throughout the entire application ecosystem.

**PRIMARY GOAL**: Implement complete end-to-end workout logging flow that replaces all fake/mock data with real user input and persistent storage.

## 🎯 SUCCESS CRITERIA

### CORE FLOW COMPLETION
- [ ] Users can browse exercise categories on workouts page (abs, chest, legs, etc.)
- [ ] Users can view exercise variations within each category
- [ ] Users can select individual exercises and configure sets/weight/reps
- [ ] Users can hit "Start Workout" and enter live workout session
- [ ] Users can log actual performed weight and reps for each set
- [ ] Workout data is saved to persistent database with user association
- [ ] Logged workout data populates progress metrics throughout the site

### DATA PERSISTENCE & RETRIEVAL
- [ ] All workout sessions stored in database with proper schema
- [ ] Exercise sets logged with actual weight, reps, and completion status
- [ ] Workout history accessible via API endpoints
- [ ] Progress calculations based on real logged data
- [ ] No mock/fake data anywhere in workout flow

### USER EXPERIENCE
- [ ] Smooth navigation from workouts page → exercise selection → live session
- [ ] Clear progress tracking during workout session
- [ ] Exercise rest timer and set completion feedback
- [ ] Workout completion summary with logged data
- [ ] Historical workout data visible in progress charts

## 📋 DELIVERABLES

### 1. Database Schema Updates
**Files**: `shared/schema.ts`, `server/storage.ts`
- [ ] Enhanced workout session schema with exercise details
- [ ] Set logging schema (weight, reps, completion, notes)
- [ ] User workout history indexing
- [ ] Exercise performance tracking tables

### 2. API Endpoints
**Files**: `server/routes.ts`, `server/workoutRoutes.ts`
- [ ] `POST /api/workout-sessions/start` - Begin new workout session
- [ ] `PATCH /api/workout-sessions/:id/exercises/:exerciseId/sets` - Log individual sets
- [ ] `POST /api/workout-sessions/:id/complete` - Finish workout session
- [ ] `GET /api/workout-sessions/:id/progress` - Real-time session progress
- [ ] `GET /api/users/:userId/workout-history` - Historical workout data
- [ ] `GET /api/exercises/:exerciseId/personal-records` - User PRs for exercise

### 3. Frontend Components
**Files**: `client/src/pages/`, `client/src/components/workout/`
- [ ] Enhanced exercise selection with real database integration
- [ ] Live workout session component with set logging
- [ ] Exercise timer and rest period management
- [ ] Workout completion flow with data persistence
- [ ] Progress charts populated from real workout data

### 4. Real Data Integration
**Files**: `client/src/services/`, `client/src/hooks/`
- [ ] Workout session state management hook
- [ ] Real-time set logging service
- [ ] Progress calculation service using logged data
- [ ] Exercise history and PR tracking
- [ ] Data migration from any existing mock data

## 🗓️ IMPLEMENTATION TIMELINE

### Phase 1: Database Foundation (Days 1-2)
- [ ] Update workout session schema with exercise logging structure
- [ ] Create set logging tables with weight/reps/notes
- [ ] Implement data storage API endpoints
- [ ] Test data persistence and retrieval

### Phase 2: Live Workout Session (Days 3-4)
- [ ] Build live workout session component
- [ ] Implement set logging with real-time updates
- [ ] Add exercise timer and rest period management
- [ ] Create workout completion flow

### Phase 3: Data Integration (Days 5-6)
- [ ] Connect progress charts to real workout data
- [ ] Implement personal record tracking
- [ ] Add workout history views
- [ ] Remove all mock data dependencies

### Phase 4: User Experience Polish (Day 7)
- [ ] Smooth navigation flow testing
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] User feedback and completion indicators

## 🔧 TECHNICAL SPECIFICATIONS

### Database Schema Design
```typescript
// Enhanced Workout Session
interface WorkoutSession {
  id: string;
  userId: string;
  workoutType: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'paused';
  exercises: ExerciseLog[];
  totalVolume: number;
  duration?: number;
  notes?: string;
}

// Exercise Performance Log
interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  formScore?: number;
  notes?: string;
}

// Individual Set Logging
interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  restTimeSeconds?: number;
  rpe?: number; // Rate of Perceived Exertion
  notes?: string;
  timestamp: Date;
}
```

### API Endpoint Specifications
```typescript
// Start workout session
POST /api/workout-sessions/start
Body: { workoutType: string, exerciseIds: string[] }
Response: { sessionId: string, exercises: ExerciseTemplate[] }

// Log individual set
PATCH /api/workout-sessions/:sessionId/exercises/:exerciseId/sets/:setNumber
Body: { weight: number, reps: number, completed: boolean }
Response: { success: boolean, progressUpdate: object }

// Complete workout
POST /api/workout-sessions/:sessionId/complete
Body: { rating?: number, notes?: string }
Response: { session: WorkoutSession, summary: WorkoutSummary }
```

### Frontend State Management
```typescript
// Workout session hook
const useWorkoutSession = (sessionId: string) => {
  const [session, setSession] = useState<WorkoutSession>();
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  
  const logSet = async (exerciseId: string, setData: SetLog) => {
    // API call + optimistic update
  };
  
  const completeWorkout = async (notes?: string) => {
    // Save final session data
  };
  
  return { session, currentExercise, logSet, completeWorkout };
};
```

## 🚨 CRITICAL REQUIREMENTS

### No Mock Data Policy
- **MANDATORY**: Remove all fake/mock workout data from the application
- **MANDATORY**: Every progress metric must be calculated from real user input
- **MANDATORY**: Show clear "No data" states when users haven't logged workouts
- **MANDATORY**: Display data source formulas transparently

### Data Architecture Compliance
- **MANDATORY**: Follow `memory-bank/system_manifest_data_driven.md` architecture
- **MANDATORY**: Use existing Universal Exercise Database from `data/exercises/`
- **MANDATORY**: Store user data in structured JSON files under `data/users/{userId}/`
- **MANDATORY**: Implement proper Zod schema validation for all user input

### Real User Experience
- **MANDATORY**: Test with actual workout logging scenarios
- **MANDATORY**: Handle missing data gracefully with clear user guidance
- **MANDATORY**: Show progress calculations with transparent formulas
- **MANDATORY**: Enable users to see their workout history and improvements

## 🧪 TESTING SCENARIOS

### End-to-End User Flow
1. New user visits workouts page
2. Selects "Chest & Triceps" workout
3. Reviews auto-selected exercises and adjusts weights
4. Starts workout session
5. Logs 3 sets of each exercise with actual weight/reps
6. Completes workout with rating and notes
7. Views workout summary with logged data
8. Checks progress page to see new data in charts

### Data Validation Scenarios
1. Invalid weight/reps input handling
2. Session state persistence across page refreshes
3. Multiple concurrent workout sessions (error handling)
4. Workout completion without logging all sets
5. Historical data accuracy and calculation verification

### Edge Cases
1. User starts workout but doesn't complete it
2. Network connectivity issues during logging
3. Large workout sessions with 10+ exercises
4. Users with no previous workout history
5. Exercise database integration with missing exercises

## 📊 MERGE CRITERIA

### Functional Requirements
- [ ] Complete workout logging flow works end-to-end
- [ ] All workout data persists in database correctly
- [ ] Progress metrics populated from real logged data
- [ ] No mock data remaining in application
- [ ] Exercise database integration functional

### Technical Requirements
- [ ] TypeScript compilation passes with no errors
- [ ] All API endpoints respond correctly
- [ ] Database schema supports full feature set
- [ ] Error handling implemented for edge cases
- [ ] Performance acceptable for 100+ exercise sessions

### User Experience Requirements
- [ ] Navigation flow is smooth and intuitive
- [ ] Workout session provides clear progress feedback
- [ ] Data entry forms are user-friendly
- [ ] Historical workout data is easily accessible
- [ ] Progress charts show meaningful insights

## 🔗 BRANCH DEPENDENCIES

### Existing Assets
- ✅ Universal Exercise Database (38 exercises with muscle percentages)
- ✅ Basic workout session schema in `shared/schema.ts`
- ✅ File-based storage system in `server/fileStorage.ts`
- ✅ Exercise API endpoints in `server/routes/exercises.ts`
- ✅ Frontend components in `client/src/components/ui/`

### Integration Points
- **Exercise Database**: Use existing Universal Exercise Database
- **User Authentication**: Leverage existing auth system (user ID 1 for testing)
- **File Storage**: Extend existing JSON file storage for workout sessions
- **Progress Charts**: Connect to existing chart components in progress page
- **Navigation**: Use existing routing system with proper state management

## 📝 NOTES

### Development Environment
- WSL IP Address: Use for Windows browser testing
- Port 5000: Unified development server (backend + frontend)
- Real Data Only: No mock data policy strictly enforced
- Database First: Design data schema before implementing UI

### Implementation Strategy
1. Start with backend database schema and API endpoints
2. Build minimal frontend components for data entry
3. Test with real user data scenarios immediately
4. Iterate based on actual user workflow testing
5. Polish UX after core functionality is proven

### Risk Mitigation
- Backup existing data before schema changes
- Implement data validation at API level
- Test database operations thoroughly
- Monitor performance with large datasets
- Plan rollback strategy if issues arise

---

**BRANCH STATUS**: 🟡 In Progress  
**ESTIMATED COMPLETION**: 7 days  
**CRITICAL PATH**: Database schema → API endpoints → Live workout session → Data integration  
**SUCCESS METRIC**: Users can log real workouts and see progress from their actual data