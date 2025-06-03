# System: FitForge - Real Data-Driven Fitness Ecosystem

## Purpose
Complete AI-powered fitness tracking platform with real-time workout logging, progressive overload algorithms, goal tracking, and comprehensive analytics - all driven by actual user data with transparent formulas.

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
- Unified storage architecture (GitHub Issue #27)
- Real data-driven progress tracking
- Complete workout → progress display flow
- Formula transparency and calculation accuracy