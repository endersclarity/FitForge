# Module: Database Schema

## Purpose & Responsibility
Defines the complete data architecture for FitForge, including universal exercise data and user-specific data tables. This module ensures every feature has a clear data source and all user interactions are properly stored and retrievable.

## Interfaces
* `UniversalExerciseData`: Global exercise information shared across all users
  * `getExerciseById(id)`: Returns exercise details, muscles, equipment
  * `searchExercises(criteria)`: Find exercises by muscle group, equipment, type
* `UserSpecificData`: Personal user data and workout logs
  * `getUserBodyStats(userId)`: Current weight, body fat, muscle mass
  * `getUserGoals(userId)`: Target weight, workout frequency, strength goals
  * `getWorkoutHistory(userId)`: Complete workout session logs
* Input: User forms, workout session data, goal setting
* Output: Structured data for progress calculations and display

## Implementation Details
* Files: 
  * `shared/schema.ts` - Zod validation schemas
  * `server/fileStorage.ts` - JSON file operations
  * `data/users/{userId}/` - User-specific data directories
* Important algorithms: 
  * Personal record calculation from workout history
  * Progress tracking formulas (current vs target)
  * Exercise progression recommendations
* Data Models
  * `UniversalExercise`: name, equipment, primaryMuscles[], secondaryMuscles[], musclePercentages
  * `UserBodyStats`: userId, date, weight, bodyFat, muscleMass, energyLevel
  * `UserGoals`: userId, targetWeight, weeklyWorkouts, strengthGoals[]
  * `WorkoutSession`: userId, date, exercises[], sets[], reps[], weight[], duration
  * `ExerciseHistory`: userId, exerciseId, dates[], maxWeights[], volumes[]

## Current Implementation Status
* Completed: Basic JSON file storage, workout session logging
* In Progress: Universal exercise database schema design
* Pending: User goals data entry, body stats tracking, progress calculation formulas

## Implementation Plans & Tasks
* `implementation_plan_universal_exercise_database.md`
  * Design exercise schema with muscle percentages
  * Import comprehensive exercise database
  * Create exercise search and filtering system
* `implementation_plan_user_data_architecture.md`
  * User body stats entry and tracking
  * Goal setting and progress formulas
  * Workout history analysis and insights

## Mini Dependency Tracker
---mini_tracker_start---
Requires: User input forms, API endpoints
Blocks: Progress calculations, data display components
---mini_tracker_end---