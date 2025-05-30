# Real Data Architecture Design

## Overview
Replace the current in-memory fake data system with persistent file-based storage for real user workout data.

## Directory Structure
```
data/
├── users/
│   ├── {userId}/
│   │   ├── profile.json          # User profile data
│   │   ├── workouts.json         # All workout sessions
│   │   ├── body-stats.json       # Weight, body fat, etc.
│   │   └── goals.json            # User fitness goals
│   └── index.json                # User lookup index
├── exercises/
│   └── database.json             # Global exercise database
└── backup/
    └── {date}/                   # Daily backups
```

## Data Models

### Workout Session
```typescript
interface WorkoutSession {
  id: string;                     // UUID
  userId: string;
  startTime: string;              // ISO 8601
  endTime?: string;               // ISO 8601
  workoutType: string;            // "ChestTriceps", "BackBiceps", etc.
  exercises: ExerciseLog[];
  totalVolume: number;            // Sum of all weight * reps
  caloriesBurned: number;         // Calculated
  notes?: string;
  rating?: number;                // 1-5 user satisfaction
  status: "in_progress" | "completed" | "abandoned";
}

interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  sets: SetLog[];
  restTimes: number[];            // Rest between sets in seconds
  formScore?: number;             // Average form score
}

interface SetLog {
  setNumber: number;
  weight: number;                 // in kg
  reps: number;
  timestamp: string;              // ISO 8601
  formScore?: number;             // 1-10 form quality
  notes?: string;
  equipment?: string;             // "barbell", "dumbbell", etc.
}
```

### User Body Stats
```typescript
interface BodyStats {
  id: string;
  date: string;                   // ISO 8601 date only
  weight?: number;                // kg
  bodyFat?: number;               // percentage
  muscleMass?: number;            // kg
  restingHeartRate?: number;      // bpm
  sleepHours?: number;
  energyLevel?: number;           // 1-10
  notes?: string;
}
```

### User Goals
```typescript
interface UserGoals {
  weightGoal?: {
    target: number;               // kg
    deadline?: string;            // ISO 8601 date
  };
  bodyFatGoal?: {
    target: number;               // percentage
    deadline?: string;
  };
  strengthGoals?: {
    [exerciseName: string]: {
      target: number;             // kg
      currentMax?: number;        // kg
      deadline?: string;
    };
  };
  weeklyWorkoutTarget?: number;   // sessions per week
}
```

## API Endpoints

### Workout Management

#### Start Workout
```
POST /api/workouts/start
Body: {
  workoutType: string;
  plannedExercises?: string[];    // Exercise names
}
Response: {
  sessionId: string;
  startTime: string;
}
```

#### Log Set
```
POST /api/workouts/:sessionId/sets
Body: {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  equipment?: string;
  formScore?: number;
  notes?: string;
}
Response: {
  success: boolean;
  totalVolume: number;            // Updated session volume
  setId: string;
}
```

#### Complete Workout
```
PUT /api/workouts/:sessionId/complete
Body: {
  rating?: number;
  notes?: string;
}
Response: {
  summary: {
    duration: number;             // minutes
    totalVolume: number;
    exerciseCount: number;
    setCount: number;
    caloriesBurned: number;
    personalRecords: string[];    // New PRs achieved
  }
}
```

#### Get Workout History
```
GET /api/workouts/history
Query params:
  - limit?: number (default: 50)
  - offset?: number
  - from?: string (ISO date)
  - to?: string (ISO date)
  - workoutType?: string
Response: {
  workouts: WorkoutSession[];
  total: number;
  hasMore: boolean;
}
```

### Body Stats Management

#### Log Body Stats
```
POST /api/body-stats
Body: {
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  energyLevel?: number;
  notes?: string;
}
Response: {
  id: string;
  date: string;
}
```

#### Get Body Stats History
```
GET /api/body-stats
Query params:
  - limit?: number
  - from?: string
  - to?: string
Response: {
  stats: BodyStats[];
}
```

### Progress Analytics

#### Get Progress Metrics
```
GET /api/progress/metrics
Query params:
  - period: "1M" | "3M" | "6M" | "1Y" | "ALL"
Response: {
  muscle: {
    start: number;
    current: number;
    change: number;
    changePercent: number;
  };
  bodyFat: {
    start: number;
    current: number;
    change: number;
    changePercent: number;
  };
  strength: {
    exercises: {
      [name: string]: {
        start: number;
        current: number;
        change: number;
        changePercent: number;
      }
    };
    overall: {
      changePercent: number;
    };
  };
  consistency: {
    workoutsPerWeek: number;
    streak: number;
    totalWorkouts: number;
  };
}
```

## File Storage Implementation

### FileStorage Class
```typescript
class FileStorage {
  private dataDir = path.join(process.cwd(), 'data');
  
  async saveWorkoutSession(userId: string, session: WorkoutSession): Promise<void> {
    const userDir = path.join(this.dataDir, 'users', userId);
    await fs.ensureDir(userDir);
    
    const workoutsPath = path.join(userDir, 'workouts.json');
    const workouts = await this.readJsonFile(workoutsPath, []);
    workouts.push(session);
    
    await this.writeJsonFile(workoutsPath, workouts);
    await this.createBackup(userId, 'workouts', workouts);
  }
  
  async getWorkoutSessions(userId: string, filters?: WorkoutFilters): Promise<WorkoutSession[]> {
    const workoutsPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
    const workouts = await this.readJsonFile(workoutsPath, []);
    
    // Apply filters
    let filtered = workouts;
    if (filters?.from) {
      filtered = filtered.filter(w => new Date(w.startTime) >= new Date(filters.from!));
    }
    if (filters?.to) {
      filtered = filtered.filter(w => new Date(w.startTime) <= new Date(filters.to!));
    }
    if (filters?.workoutType) {
      filtered = filtered.filter(w => w.workoutType === filters.workoutType);
    }
    
    return filtered;
  }
  
  private async readJsonFile<T>(path: string, defaultValue: T): Promise<T> {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch {
      return defaultValue;
    }
  }
  
  private async writeJsonFile(path: string, data: any): Promise<void> {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
  }
  
  private async createBackup(userId: string, type: string, data: any): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const backupDir = path.join(this.dataDir, 'backup', date, userId);
    await fs.ensureDir(backupDir);
    
    const backupPath = path.join(backupDir, `${type}-${Date.now()}.json`);
    await this.writeJsonFile(backupPath, data);
  }
}
```

## Migration Strategy

1. **Detect Existing Data**: Check if user has any data in the current system
2. **Create Data Directory**: Initialize file structure on first run
3. **Import Existing Data**: If any real data exists, migrate it to new format
4. **Archive Fake Data**: Move any fake/generated data to a separate archive
5. **Initialize Empty State**: Start users fresh with real data logging

## Benefits

1. **Data Persistence**: Survives server restarts
2. **Easy Backup**: Simple file copying for backups
3. **User Privacy**: Each user's data in separate files
4. **Debugging**: Human-readable JSON format
5. **Export Ready**: Already in structured format for CSV/JSON export
6. **Version Control Friendly**: Can track changes in data structure

## Implementation Priority

1. Create FileStorage class with basic read/write
2. Implement workout session endpoints
3. Update frontend to use real logging
4. Remove fake data generation
5. Add backup and recovery features