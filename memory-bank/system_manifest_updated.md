# System: FitForge - AI-Powered Fitness Ecosystem

## Purpose
FitForge is a comprehensive full-stack fitness platform that combines real workout tracking, progressive overload AI recommendations, and user onboarding features into a production-ready desktop application.

## Architecture
```
[React Frontend] <-> [Express API] <-> [JSON Storage] <-> [Electron Wrapper]
       |               |                    |
       |               |                    +-- [User Data Directories]
       |               |                    +-- [Exercise Database]
       |               |                    +-- [Workout Sessions]
       |               +-- [Authentication] -- [Session Management]
       |               +-- [Workout APIs] -- [15+ Endpoints]
       |               +-- [Progress APIs] -- [Analytics & Export]
       |               +-- [User Preferences] -- [Onboarding System]
       +-- [Radix UI + Tailwind] -- [45+ Components]
       +-- [React Query] -- [State Management]
       +-- [Progressive Overload AI] -- [Recommendation Engine]
       +-- [Wouter Routing] -- [Navigation System]
```

## Module Registry
- [Frontend (`client/src/`)]: React application with complete UI component library
- [Backend (`server/`)]: Express server with comprehensive API endpoints
- [Database (`shared/`)]: Enhanced schema with full exercise library integration
- [Authentication (`server/auth-middleware.ts`)]: Session-based user management
- [Workout System (`client/src/pages/workouts.tsx`)]: Real-time tracking with AI suggestions
- [Analytics (`client/src/components/progress-analytics.tsx`)]: Progress tracking with export
- [Onboarding (`client/src/pages/onboarding.tsx`)]: 5-step guided user preferences setup
- [Progressive Overload (`services/progressive-overload.ts`)]: AI-powered workout progression
- [Desktop App (`electron/`)]: Cross-platform Electron wrapper

## Development Workflow
1. Load project context with /load command
2. Use /implement for feature development (Zen van Riel method)
3. Run /quality for comprehensive testing and validation
4. Use /process for proper git workflow enforcement
5. Deploy with /ship for production readiness

## Current Implementation Status
- ✅ **Real Data Architecture**: Complete JSON file storage system with user directories
- ✅ **Progressive Overload AI**: Intelligent workout progression recommendations
- ✅ **Full-Stack Integration**: React + Express + authentication working seamlessly
- ✅ **User Onboarding**: 5-step guided experience with preferences management
- ✅ **Production Ready**: 85% issue resolution rate with comprehensive feature set
- ✅ **Desktop Distribution**: Electron wrapper with cross-platform support

## Version: 2.0.0 | Status: Production Ready - Comprehensive Fitness Ecosystem

## Next Phase Opportunities
1. **Database Migration**: Move from JSON to PostgreSQL using existing Drizzle schemas
2. **Real-time Features**: WebSocket integration for live workout sessions
3. **Mobile PWA**: Progressive Web App capabilities for mobile experience
4. **Analytics Enhancement**: Advanced machine learning insights and predictive analytics
5. **Community Features**: Social interactions and workout challenges