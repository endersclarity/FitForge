# System: FitForge - AI-Powered Fitness Ecosystem

## Purpose
FitForge is a comprehensive fitness tracking platform that combines workout logging, progress analytics, and nutrition monitoring with live session tracking and community features.

## Architecture
```
[React Frontend] <-> [Express API] <-> [Drizzle ORM] <-> [PostgreSQL]
       |               |                    |
       |               |                    +-- [Enhanced Schema]
       |               +-- [Authentication] -- [Session Management]
       |               +-- [Workout APIs]
       |               +-- [Progress APIs]
       |               +-- [Nutrition APIs]
       +-- [Component Library] -- [Radix UI + Tailwind]
       +-- [Live Tracking] -- [WebSocket Sessions]
       +-- [Analytics] -- [Recharts]
       +-- [Routing] -- [Wouter]
```

## Module Registry
- [Frontend (`memory-bank/frontend_module.md`)]: React application with routing, components, and UI
- [Backend (`memory-bank/backend_module.md`)]: Express server with authentication and APIs
- [Database (`memory-bank/database_module.md`)]: Drizzle ORM with PostgreSQL and enhanced schema
- [Authentication (`memory-bank/auth_module.md`)]: User management and session handling
- [Workout System (`memory-bank/workout_module.md`)]: Live tracking, logging, and exercise management
- [Analytics (`memory-bank/analytics_module.md`)]: Progress tracking and data visualization
- [UI Components (`memory-bank/ui_module.md`)]: Reusable component library and theming

## Development Workflow
1. Review active context and branch goals
2. Create implementation plans for features
3. Fix button functionality and navigation
4. Integrate workout calculation logic
5. Test and validate functionality
6. Update documentation

## Version: 1.0.0 | Status: Phase 4 - Button Functionality Fixes