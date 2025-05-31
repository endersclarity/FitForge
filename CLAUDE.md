# FitForge - Real Data-Driven Fitness Ecosystem Configuration

## Project Commands
- `npm run dev`: Start development server (backend + frontend on port 5000)
- `npm run frontend`: Vite dev server on port 3000 (frontend only)
- `npm run build`: Production build with Vite
- `npm run check`: TypeScript validation (MANDATORY before commits)
- `npm test`: Run progressive overload service tests
- `npm run electron-dev`: Desktop app development mode

## Code Style & Conventions
- **TypeScript**: Full coverage required - no any types allowed
- **React**: Functional components with hooks, no class components
- **UI Components**: Use Radix UI + Tailwind CSS design system from `client/src/components/ui/`
- **State Management**: React Query + custom hooks pattern, avoid Redux
- **API Design**: RESTful endpoints with proper HTTP methods and status codes
- **Data First**: Every feature starts with database schema design
- **No Mock Data**: All data must come from real user input or show clear formulas

## Real Data Architecture Philosophy
- **MANDATORY**: Every feature must be driven by real user-entered data
- **MANDATORY**: Show formulas and data sources transparently
- **MANDATORY**: No mock data anywhere in the application
- **Database First**: Design data schema before building UI components
- **Formula Transparency**: Display calculations and their data sources
- **Missing Data Handling**: Clear indicators and entry paths when data doesn't exist

## Development Workflow
1. **Database Schema First**: Design data models before building features
2. **User Data Entry**: Build input forms before display components
3. **Real Data Validation**: Use Zod schemas for all user input
4. **Formula Implementation**: Create transparent calculations from real data
5. **Missing Data UX**: Show clear paths for users to enter required data
6. **TypeScript Validation**: Run `npm run check` before all commits
7. **Real User Testing**: Test with actual user input scenarios

## Testing & Quality Assurance
- **Primary Testing**: Use MCP BrowserMCP for real user flow testing
- **Data Validation**: Test with real user input, not mock data
- **Missing Data Scenarios**: Test behavior when users haven't entered data
- **Formula Accuracy**: Verify calculations match expected mathematical formulas
- **TypeScript**: Zero compilation errors allowed
- **WSL Development**: Test at WSL IP address, not localhost

## Architecture References
- **MANDATORY**: Reference `memory-bank/system_manifest_data_driven.md` for data architecture
- **Database Schema**: See `memory-bank/database_schema_module.md`
- **User Data Entry**: See `memory-bank/user_data_entry_module.md`
- **Progress Calculations**: See `memory-bank/progress_calculations_module.md`
- **Implementation Plans**: See `memory-bank/implementation_plan_real_data_architecture.md`

## Repository Notes
- **Real Data Only**: No mock data, fake users, or simulated workouts
- **Formula-Based Progress**: All metrics calculated from real user input
- **Transparent Calculations**: Users see how their progress is calculated
- **Missing Data Handling**: Clear indicators and entry flows for required data
- **Database-First Design**: Every feature starts with data schema definition

## Key Data Flows
1. **User Input** → Validation → Storage → Calculation → Display
2. **Exercise Database** → User Selection → Workout Logging → Progress Analysis
3. **Body Stats Entry** → Goal Comparison → Progress Calculation → Trend Display
4. **Workout History** → Volume Analysis → AI Recommendations → User Guidance

## WSL Development Environment
- **Server Access**: Always use WSL IP address (not localhost) for Windows browser testing
- **Port Configuration**: Single port 5000 for unified development experience
- **Real Data Storage**: JSON files in user-specific directories under `data/users/`
- **Hot Reload**: tsx for backend, Vite for frontend with automatic recompilation

## Important Notes
- **No Mock Data Policy**: Any mock data found must be immediately removed
- **Real User Dependency**: Features only work with actual user-entered data
- **Formula Transparency**: All calculations show their formulas and data sources
- **Database First**: Design data schema before implementing any feature