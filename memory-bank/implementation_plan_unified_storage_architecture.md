# Implementation Plan: Unified Storage Architecture

**Parent Module(s)**: [backend_module.md], [database_schema_module.md]
**Status**: [x] Planned / [ ] In Progress / [ ] Completed / [ ] Deferred

## 1. Objective / Goal
Resolve the current storage architecture mismatch where workouts save to simple logs (`/data/workout-logs/`) but Progress tab expects structured sessions (`/data/users/{userId}/workouts.json`). Standardize on fileStorage format for seamless workout data flow.

## 2. Affected Components / Files
*   **Code:**
    *   `server/routes/log-workout.ts` - Update workout completion to use fileStorage directly
    *   `server/fileStorage.ts` - Enhance to handle structured workout sessions
    *   `client/src/services/supabase-workout-service.ts` - Remove conversion dependencies
    *   `client/src/pages/progress.tsx` - Ensure compatibility with unified format
*   **Documentation:**
    *   `ARCHITECTURE.md` - Update storage documentation
    *   `WEB_EVALUATION_REPORT.md` - Document resolution of Issue #27
*   **Data Structures / Schemas:**
    *   Workout Session Schema - Standardize structure across all storage methods
    *   Exercise Log Format - Ensure consistency between logging and progress display

## 3. High-Level Approach / Design Decisions
*   **Approach:** Migrate all workout storage to use structured sessions format directly, eliminating the need for data converters
*   **Design Decisions:**
    *   Standardize on Excel-like structured data architecture for all workout storage
    *   Maintain backward compatibility with existing workout logs during transition
    *   Use fileStorage as single source of truth for workout data
*   **Data Flow:**
    *   Workout Completion → Direct fileStorage Write → Progress Display (no conversion)

## 4. Task Decomposition (Roadmap Steps)
*   [ ] [Update Workout Completion](task_update_workout_completion.md): Modify logging to use fileStorage directly
*   [ ] [Enhance FileStorage](task_enhance_file_storage.md): Add structured session support
*   [ ] [Remove Converters](task_remove_converter_code.md): Eliminate architectural debt
*   [ ] [Test Unified Flow](task_test_unified_flow.md): Verify complete workflow integrity

## 5. Task Sequence / Build Order
1. Enhance FileStorage - *Reason: Foundation for other tasks*
2. Update Workout Completion - *Reason: Core functionality change*
3. Test Unified Flow - *Reason: Validation of changes*
4. Remove Converters - *Reason: Clean up after successful migration*

## 6. Prioritization within Sequence
*   Enhance FileStorage: P1 (Critical Path)
*   Update Workout Completion: P1 (Critical Path)
*   Test Unified Flow: P1 (Quality Gate)
*   Remove Converters: P2 (Cleanup)

## 7. Open Questions / Risks
*   Migration strategy for existing workout logs in `/data/workout-logs/`
*   Performance impact of structured data storage vs simple logs
*   Backup and recovery procedures for unified storage format