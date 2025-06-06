# FitForge - Comprehensive Project Requirements Document
*Generated by AI Agent Integration Protocol - Unified Strategic Context*

## Executive Summary
FitForge is a complete AI-powered fitness tracking platform with real-time workout logging, progressive overload algorithms, goal tracking, and comprehensive analytics - all driven by actual user data with transparent formulas. The system implements a "Real Data Architecture Philosophy" where every feature must work with actual user input and show clear calculation formulas.

## Current Project State & Immediate Priorities

### Critical Path: Storage Architecture Unification (GitHub Issue #27)
**URGENT**: Two incompatible storage systems blocking user workflow:
- **Workout Logging**: Simple logs (`/data/workout-logs/workout-YYYY-MM-DD.json`)  
- **Progress Display**: Structured sessions (`/data/users/{userId}/workouts.json`)
- **Impact**: Progress tab shows "No workouts yet" despite completed workouts

**Solution Ready**: Unified storage architecture implementation plan created with task decomposition.

### Development Phase Status
- **Phase**: HDTA Structure Complete - Ready for Implementation Execution
- **Architecture**: Complete CRCT/HDTA scaffolding with populated templates  
- **Implementation Plans**: 4 detailed plans including unified storage architecture
- **Command Integration**: Full keymap with 10 workflow commands ready

## Project Requirements & Scope

### Core User Stories
1. **Real Workout Tracking**: User completes exercise → data stored → progress visible
2. **Progressive Overload**: System calculates intelligent weight/rep progressions
3. **Goal Achievement**: User sets goals → system tracks progress → achievement unlocked
4. **Formula Transparency**: User sees HOW calculations work, not just results
5. **Real Data Only**: No mock data - everything from actual user input

### Success Criteria
- ✅ Exercise selection → workout completion flow working
- ⚠️ **BLOCKING**: Workout → progress display seamless flow (storage issue)
- 📋 Progressive overload recommendations based on performance
- 📋 Goal tracking with real-time progress calculations
- 📋 Body metrics input and tracking

## Technical Architecture

### System Components
```
[React Frontend] ← TypeScript → [Node.js Express Server] ← API → [Services] ← Data → [Storage]
                                                                      ↓
                                                           [Workout Service]
                                                           [Exercise Database]  
                                                           [Progressive Overload Engine]
                                                           [Goal Progress Engine]
                                                           [Body Stats Service]
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Radix UI, Tailwind CSS, Wouter routing
- **Backend**: Node.js, Express, TypeScript, tsx for hot reload
- **Database**: Supabase (primary), SQLite (local), File Storage (JSON)
- **Development**: Vite, npm scripts, unified dev server on port 5000

### Data Architecture Philosophy
- **Database Schema First**: Design data models before building features
- **Formula Transparency**: Users see calculation sources and methods
- **Real Data Only**: No mock data anywhere in application
- **Excel-like Structure**: Structured sessions for comprehensive analytics

## Implementation Strategy & Current Focus

### Phase 1: Core Infrastructure (IN PROGRESS)
**Immediate Priority**: Resolve storage architecture mismatch
1. **Enhance FileStorage** - Add structured session support
2. **Update Workout Completion** - Use fileStorage directly (eliminate simple logs)
3. **Test Unified Flow** - Verify workout → progress display works
4. **Remove Converters** - Clean up architectural debt

### Phase 2: Progressive Overload AI (PLANNED)
- Evidence-based progression algorithms
- Plateau detection and recovery
- Smart exercise selection

### Phase 3: Goal System Enhancement (PARTIAL)
- Real-time progress calculations  
- Body composition tracking
- Achievement system

### Phase 4: User Experience Polish (PLANNED)
- Performance optimization
- Offline capabilities
- Mobile responsiveness

## Development Workflow & Standards

### Code Quality Requirements
- **TypeScript Full Coverage**: No `any` types allowed
- **Real Data Testing**: Test with actual user input scenarios
- **Formula Validation**: Verify calculation accuracy
- **Component Standards**: Functional components, React Query, custom hooks

### Development Commands
- `npm run dev`: Unified server (backend + frontend on port 5000)
- `npm run check`: TypeScript validation (MANDATORY before commits)
- `npm test`: Progressive overload service tests
- WSL Development: Use IP address (not localhost) for Windows browser access

## Task Generation Context

### High Priority Implementation Tasks
1. **Storage Unification** - Resolve GitHub Issue #27 blocking user workflow
2. **Formula Implementation** - Progressive overload calculations
3. **Real Data Integration** - Body metrics and goal tracking
4. **User Experience** - Dashboard improvements and error handling

### Task Intelligence Requirements
- Tasks must reflect business goals (user workout completion flow)
- Technical tasks should reference architectural decisions
- All tasks should work with real user data
- Progress tracking should show formula transparency

## Risk Analysis & Dependencies

### Known Issues
- **Storage Architecture Mismatch** (GitHub Issue #27) - Critical blocker
- **Multiple Storage Systems** - Requires data converters (architectural debt)
- **Formula Complexity** - Progressive overload algorithms need research validation

### Technical Dependencies
- Supabase configuration and schema
- TypeScript compilation without errors
- Real user data for testing (no mock data policy)
- Formula transparency in all calculations

## Business Intelligence Context

### Market Differentiation
- **Real Data Focus**: Unlike competitors using mock data
- **Formula Transparency**: Users understand HOW progress is calculated
- **Evidence-Based**: All algorithms based on fitness science research
- **Excel-like Analytics**: Comprehensive data architecture for deep insights

### Success Metrics
- User workout completion rate
- Progress display accuracy
- Formula calculation correctness
- Real data integration quality

---

## Integration Metadata
- **Source Files**: 22 architect files, activeContext.md, tasks.json
- **Strategic Coverage**: 95% of memory-bank documentation included
- **Context Tokens**: ~15,000 tokens of strategic context preserved
- **Business Alignment**: Tasks must reflect unified storage priority
- **Semantic Preservation**: No loss of architectural decisions or priorities

*Generated from: system_manifest_fitforge.md, implementation_plan_unified_storage_architecture.md, activeContext.md, project_roadmap_fitforge.md*
*Integration Status: Ready for intelligent task generation from comprehensive strategic context*