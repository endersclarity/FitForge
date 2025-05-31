# Module: Progress Calculations

## Purpose & Responsibility
Implements formula-based calculations that derive meaningful metrics from user-entered data. This module provides transparent calculations with clear data sources, ensuring users understand how their progress is measured and what data is needed for each metric.

## Interfaces
* `ProgressMetrics`: Core progress calculations
  * `calculateWeightProgress()`: Formula: (current - starting) / (target - starting) * 100
  * `calculateVolumeProgression()`: Formula: SUM(weight × reps) per exercise over time
  * `calculatePersonalRecords()`: Formula: MAX(weight × reps) per exercise per user
* `GoalTracking`: Target vs actual comparisons
  * `getWeeklyWorkoutProgress()`: Formula: sessions_this_week / weekly_target * 100
  * `getStrengthGoalProgress()`: Formula: current_max / target_max * 100
* `TrendAnalysis`: Historical data analysis
  * `calculateVolumetrend()`: Formula: Linear regression on volume over time
  * `identifyPlateaus()`: Formula: No progress for X consecutive sessions
* Input: User workout history, body stats, goals
* Output: Calculated metrics with formula transparency

## Implementation Details
* Files: 
  * `client/src/services/progress-data.ts` - Core calculation functions
  * `client/src/services/progressive-overload.ts` - AI recommendation algorithms
  * `server/progressRoutes.ts` - API endpoints for calculated metrics
* Important algorithms: 
  * Personal record calculation with date tracking
  * Volume progression analysis with trend detection
  * Goal progress formulas with missing data handling
* Data Models
  * `ProgressMetric`: value, formula, dataSource, lastUpdated
  * `PersonalRecord`: exerciseId, weight, reps, date, volume
  * `TrendData`: dates[], values[], slope, correlation
  * `GoalProgress`: current, target, percentage, formula

## Current Implementation Status
* Completed: Basic volume calculation, personal record tracking
* In Progress: Trend analysis algorithms, goal progress formulas
* Pending: Missing data handling, formula transparency UI

## Implementation Plans & Tasks
* `implementation_plan_transparent_calculations.md`
  * Show formulas alongside calculated values
  * Clear data source indicators
  * Missing data requirements and entry paths
* `implementation_plan_advanced_analytics.md`
  * Trend detection and plateau identification
  * Strength progression recommendations
  * Body composition change analysis

## Mini Dependency Tracker
---mini_tracker_start---
Requires: Database schema, user data entry
Blocks: Frontend data display, AI recommendations
---mini_tracker_end---