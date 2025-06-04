# System: FitForge - Real Data-Driven Fitness Ecosystem

## Purpose
Complete AI-powered fitness tracking platform with real-time workout logging, progressive overload algorithms, goal tracking, and comprehensive analytics - all driven by actual user data with transparent formulas.

## Status: PRODUCTION VALIDATED ✅
**Date**: 2025-06-03T18:15:00Z  
**Validation**: Web evaluation confirms all core systems operational with real data  
**Foundation**: Workout history logging system complete - advanced features ready for development

## Architecture
```
[Client/Frontend] <-> [Node.js Server] <-> [Services] <-> [Storage Systems]
        |                    |             |              |
        |                    |             |              +-- [Supabase Database]
        |                    |             |              +-- [Local File Storage]
        |                    |             |              +-- [SQLite (fitforge.db)]
        |                    |             |
        |                    |             +-- [Workout Service]
        |                    |             +-- [Exercise Database]
        |                    |             +-- [Progressive Overload Engine]
        |                    |             +-- [Goal Progress Engine]
        |                    |             +-- [Body Stats Service]
        |                    |             +-- [User Profile Service]
        |                    |
        |                    +-- [Authentication Middleware]
        |                    +-- [Express Routes]
        |                    +-- [WebSocket Support]
        |
        +-- [React Components]
        +-- [Workout Session UI]
        +-- [Progress Analytics]
        +-- [Goal Management]
        +-- [Exercise Browser]
```

## Module Registry
- [Frontend (`frontend_module.md`)]: React/TypeScript UI with Radix UI components
- [Backend (`backend_module.md`)]: Node.js Express server with TypeScript
- [Database Schema (`database_schema_module.md`)]: Supabase/SQLite data models
- [Progressive Overload AI (`module_progressive_overload_ai.md`)]: Smart progression algorithms
- [Goal System (`goal_system_module.md`)]: Goal tracking and progress calculations
- [Exercise Database (`exercise_database_module.md`)]: Universal exercise catalog
- [User Data Entry (`user_data_entry_module.md`)]: Data collection and validation

## Development Workflow
1. Design database schema and data models first
2. Create TypeScript types and validation schemas
3. Implement backend services with real data integration
4. Build React components with proper data fetching
5. Test with real user input scenarios
6. Validate calculations and formulas
7. Document data sources and dependencies

## Version: 1.0 | Status: Active Development

## Current Focus
- ✅ **Issue #26 Complete**: Auto-populate body weight for bodyweight exercises
- ✅ **User Profile System**: Foundation infrastructure for data collection
- ✅ **Unified Storage Architecture**: GitHub Issue #27 resolved
- ✅ **Real Data-Driven Progress**: Complete workout → progress display flow operational
- ✅ **Formula Transparency**: Calculation accuracy with data attribution

## Recently Completed
- **User Profile Infrastructure**: Complete ProfileSetupDialog and body weight management
- **Bodyweight Exercise Detection**: API-based detection with fallback mechanisms  
- **Auto-Population Logic**: Weight field auto-fills for bodyweight exercises
- **Additional Weight Support**: Dumbbells, weighted vest, weight belt, backpack options
- **Volume Calculation Integration**: Total weight included in all progress metrics
- **Preference Persistence**: Additional weight preferences saved per exercise