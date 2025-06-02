# FitForge Goal System Architecture

## Overview

The FitForge Goal System enables users to set specific, measurable fitness targets with transparent progress tracking based on real user data. The system supports three goal types: weight loss, strength gain, and body composition changes.

## Key Principles

### 1. Real Data-Driven Progress
- All progress calculations use actual user-entered data
- No mock data or simulated progress
- Transparent formulas with data source attribution

### 2. Formula Transparency
- Users see exactly how their progress is calculated
- Data sources are clearly identified: "Based on X measurements over Y days"
- Mathematical formulas are displayed alongside results

### 3. Missing Data Handling
- Clear indicators when insufficient data exists for progress calculations
- Actionable suggestions for data entry to enable progress tracking
- Graceful degradation when data is unavailable

## Database Schema

### user_goals Table

```sql
CREATE TABLE user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal Definition
  goal_type goal_type_enum NOT NULL, -- 'weight_loss', 'strength_gain', 'body_composition'
  title varchar(255) NOT NULL,
  description text,
  deadline date NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  -- Target Values (goal-type specific)
  target_weight numeric(5,2), -- For weight_loss goals
  target_body_fat numeric(4,1), -- For body_composition goals (percentage)
  target_exercise_weight numeric(6,2), -- For strength_gain goals
  target_reps integer, -- For strength_gain goals
  exercise_id varchar(255), -- For strength_gain goals
  
  -- Progress Tracking
  current_weight numeric(5,2), -- Current weight for reference
  is_active boolean DEFAULT true,
  is_achieved boolean DEFAULT false,
  achieved_at timestamp,
  
  -- Row Level Security
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Row Level Security Policies
CREATE POLICY "Users can only access their own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);
```

## Core Services

### 1. Goal Progress Engine (`goal-progress-engine.ts`)

Calculates progress with transparent formulas and data source attribution.

#### Weight Loss Progress
```typescript
// Formula: (start_weight - current_weight) / (start_weight - target_weight) × 100%
// Data Source: Weight measurements from user profile and body stats
const progress = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100;
```

#### Strength Gain Progress
```typescript
// Formula: (current_max - start_max) / (target_weight - start_max) × 100%
// Data Source: Workout session data for specific exercise
const progress = ((currentMax - startMax) / (targetWeight - startMax)) * 100;
```

#### Body Composition Progress
```typescript
// Formula: (start_bf - current_bf) / (start_bf - target_bf) × 100%
// Data Source: Body composition measurements
const progress = ((startBodyFat - currentBodyFat) / (startBodyFat - targetBodyFat)) * 100;
```

### 2. Supabase Goal Service (`supabase-goal-service.ts`)

Handles CRUD operations with comprehensive validation and type safety.

#### Key Functions
- `createGoal(goalData)` - Create new goal with Zod validation
- `getUserGoals(filters, sort)` - Retrieve user goals with filtering
- `updateGoal(goalId, updates)` - Update goal with partial data
- `deleteGoal(goalId)` - Soft delete goal
- `subscribeToUserGoals(callback)` - Real-time goal updates

#### Validation Schemas
```typescript
export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(255),
  goal_type: z.enum(['weight_loss', 'strength_gain', 'body_composition']),
  deadline: z.date().refine(date => date > new Date()),
  target_weight: z.number().positive().optional(),
  target_body_fat: z.number().min(1).max(50).optional(),
  target_exercise_weight: z.number().positive().optional(),
  target_reps: z.number().int().positive().optional(),
  exercise_id: z.string().optional(),
}).refine(validateGoalTypeRequirements);
```

## UI Components

### 1. Goal Form (`GoalForm.tsx`)

Interactive form for creating goals with type-specific field validation.

#### Features
- Dynamic form fields based on goal type selection
- Real-time validation with Zod schemas
- Date picker integration for deadline selection
- Exercise selection for strength goals
- Helpful error messages and field requirements

### 2. Goal Dashboard (`GoalDashboard.tsx`)

Main interface for viewing and managing goals.

#### Features
- Goal overview with progress visualization
- Missing data indicators and suggestions
- Tabbed organization (Active, Achieved, All)
- Quick goal creation shortcuts
- Progress charts with formula transparency

### 3. Goal Progress Chart (`ProgressChart.tsx`)

Visual progress display with formula transparency.

#### Features
- Recharts integration for timeline visualization
- Formula display showing calculation methodology
- Data source attribution
- Progress milestones and achievements
- Projected completion date calculations

## Data Integration Points

### 1. Weight Loss Goals
- **Data Source**: User body stats and weight measurements
- **Integration**: Connects to user profile weight tracking
- **Missing Data**: Shows clear entry path to body stats page

### 2. Strength Goals
- **Data Source**: Workout session data for specific exercises
- **Integration**: Links to exercise performance in workout logs
- **Missing Data**: Suggests completing workouts with target exercise

### 3. Body Composition Goals
- **Data Source**: Body measurement entries (body fat percentage)
- **Integration**: Connects to body stats tracking system
- **Missing Data**: Guides to body composition measurement entry

## Progress Calculation Logic

### Timeline Analysis
```typescript
interface ProgressCalculationResult {
  progress_percentage: number;
  days_remaining: number;
  total_days: number;
  is_on_track: boolean;
  is_overdue: boolean;
  projected_completion_date?: Date;
  weekly_progress_rate: number;
  
  // Transparency
  formula_used: string;
  data_source_description: string;
  data_points_used: number;
  
  // Recommendations
  suggestions: string[];
  missing_data_suggestions?: string[];
  insufficient_data: boolean;
}
```

### Progress Rate Calculation
- **Weekly Rate**: `progress_percentage / weeks_elapsed`
- **On Track Status**: `progress_percentage >= (time_elapsed / total_time) * 100`
- **Projected Completion**: `current_date + (remaining_progress / weekly_rate) * 7`

## API Endpoints

### RESTful Goal Management
```typescript
// Goal CRUD operations
POST   /api/goals              // Create new goal
GET    /api/goals              // Get user goals (with filters)
GET    /api/goals/:id          // Get specific goal
PUT    /api/goals/:id          // Update goal
DELETE /api/goals/:id          // Delete goal

// Progress calculation
GET    /api/goals/:id/progress // Get detailed progress calculation
POST   /api/goals/:id/achieve  // Mark goal as achieved
```

## Error Handling

### Validation Errors
- **Client-side**: Real-time validation with Zod schemas
- **Server-side**: Comprehensive validation before database operations
- **User feedback**: Clear, actionable error messages

### Missing Data Scenarios
- **Insufficient Data**: Clear indicators with next steps
- **Data Entry Guidance**: Direct links to relevant input forms
- **Progress Estimation**: Conservative estimates when data is limited

### Network & Database Errors
- **Retry Logic**: Automatic retry for transient failures
- **Offline Support**: Local caching of goal data
- **User Notification**: Toast messages for operation status

## Testing Strategy

### Unit Tests
- **Progress Calculation**: Formula accuracy with known test data
- **Validation**: Schema validation with edge cases
- **Data Transformation**: Input/output mapping correctness

### Integration Tests
- **Database Operations**: CRUD operations with real Supabase
- **Authentication**: User isolation and permissions
- **Real-time Updates**: Subscription and notification flows

### Component Tests
- **Form Validation**: User input scenarios and error states
- **Progress Display**: Chart rendering and data visualization
- **Responsive Design**: Mobile and desktop layout testing

## Performance Considerations

### Database Optimization
- **Indexes**: On `user_id`, `goal_type`, `created_at`, `is_active`
- **Query Efficiency**: Selective loading with proper filtering
- **Connection Pooling**: Supabase connection management

### Client-side Performance
- **Lazy Loading**: Component-based code splitting
- **Data Caching**: React Query for server state management
- **Progressive Enhancement**: Core functionality without JavaScript

### Real-time Updates
- **Supabase Subscriptions**: Efficient change notifications
- **Optimistic Updates**: Immediate UI feedback
- **Conflict Resolution**: Last-writer-wins with user notification

## Security

### Row Level Security (RLS)
```sql
-- Users can only access their own goals
CREATE POLICY "user_goals_isolation" ON user_goals
  FOR ALL USING (auth.uid() = user_id);
```

### Input Validation
- **Type Safety**: TypeScript interfaces for all data structures
- **Schema Validation**: Zod schemas for runtime validation
- **SQL Injection**: Parameterized queries via Supabase client

### Authentication
- **JWT Tokens**: Supabase authentication integration
- **Session Management**: Automatic token refresh
- **User Context**: Consistent user ID across all operations

## Deployment Considerations

### Environment Variables
```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Migrations
- **Schema Evolution**: Version-controlled SQL migrations
- **Data Migration**: Safe transformation of existing goal data
- **Rollback Strategy**: Reversible schema changes

### Monitoring
- **Progress Calculation Errors**: Track calculation failures
- **User Engagement**: Goal creation and completion rates
- **Data Quality**: Missing data pattern analysis

## Future Enhancements

### Advanced Features
- **Goal Templates**: Pre-configured goal types with suggested targets
- **Social Sharing**: Progress sharing with friends and community
- **AI Recommendations**: Personalized goal suggestions based on progress

### Analytics
- **Progress Insights**: Detailed analysis of goal achievement patterns
- **Comparative Analysis**: Progress comparison across similar users
- **Predictive Modeling**: Success probability based on historical data

### Integration
- **Wearable Devices**: Automatic data import from fitness trackers
- **Third-party Apps**: Integration with nutrition and fitness apps
- **Coach Dashboard**: Professional oversight and guidance features

## Conclusion

The FitForge Goal System provides a comprehensive, data-driven approach to fitness goal tracking with complete transparency in progress calculations. The architecture prioritizes user data integrity, formula transparency, and graceful handling of missing data scenarios while maintaining high performance and security standards.