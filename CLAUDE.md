# FitForge - AI-Powered Fitness Ecosystem Configuration

## Project Commands
- `npm run dev`: Start development server (backend + frontend on port 5000)
- `npm run frontend`: Vite dev server on port 3000 (frontend only)
- `npm run build`: Production build with Vite
- `npm run electron-dev`: Desktop app development mode
- `npm run check`: TypeScript validation
- `npm run db:push`: Drizzle schema push
- `npm test`: Run progressive overload service tests

## Code Style & Conventions
- **TypeScript**: Full coverage required - no any types allowed
- **React**: Functional components with hooks, no class components
- **UI Components**: Use Radix UI + Tailwind CSS design system from `client/src/components/ui/`
- **State Management**: React Query + custom hooks pattern, avoid Redux
- **API Design**: RESTful endpoints with proper HTTP methods and status codes
- **File Organization**: Feature-based modules with clear separation of concerns
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files

## Architecture References
- **MANDATORY**: Always reference `ARCHITECTURE.md` before implementing features
- **MANDATORY**: Read `ARCHITECTURE.md` to understand project patterns and conventions
- **Component Patterns**: Follow established patterns from 86-file frontend analysis
- **API Patterns**: Use modular route organization (workoutRoutes, progressRoutes, etc.)
- **Data Flow**: React Query → Express API → JSON Storage → User Directories
- **Progressive Overload**: Reference `services/progressive-overload.ts` for AI recommendation patterns

## Testing Workflow
- **Primary Browser Testing**: Use MCP BrowserMCP for all user flow testing and debugging
- **Code Validation**: Run TypeScript validation before commits: `npm run check`
- **Unit Testing**: Execute progressive overload tests: `npm test`
- **Manual Testing**: WSL IP access at `ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1`:5000
- **End-to-End Flows**: Use MCP BrowserMCP to validate complete workout workflows
- **Desktop Testing**: Test desktop app functionality with `npm run electron-dev`

## Debugging Methodology 
- **Step 1: MCP BrowserMCP** - Test actual user flows to identify real UX issues
- **Step 2: Server Logs** - Monitor `server.log` for API call patterns and errors
- **Step 3: Code Analysis** - Review specific components/routes identified by browser testing
- **Step 4: Console Logs** - Use `mcp__browsermcp__browser_get_console_logs` for frontend errors
- **Proven Approach**: Browser testing reveals real issues; code analysis often finds theoretical problems
- **Avoid**: Custom browser automation scripts - MCP BrowserMCP is more reliable

## Repository Notes
- **Real Data Architecture**: Complete JSON file storage with user-specific directories
- **Production Ready**: 85% issue resolution rate with comprehensive feature set
- **Deployment URL**: WSL IP address port 5000 (not localhost due to WSL2 networking)
- **Desktop Distribution**: Electron wrapper for cross-platform desktop application
- **Progressive Overload AI**: Intelligent workout progression recommendations integrated

## Development Workflow
1. **Always start with `/load`** to understand current project context
2. **Use `/implement`** for feature development following Zen van Riel 3-step methodology
3. **Reference `ARCHITECTURE.md`** for component patterns and development conventions
4. **Run `/quality`** before commits to ensure tests pass and code quality
5. **Use `/process`** to enforce proper git workflow and GitHub integration
6. **Use MCP BrowserMCP** for comprehensive browser testing and user flow validation

## Key Architectural Insights
- **Modular API Design**: Separate route files by feature domain for maintainability
- **Component Reusability**: 45 Radix UI components provide consistent design system
- **Type Safety**: Zod schemas ensure runtime validation matches TypeScript types
- **Progressive Enhancement**: Real data architecture enables meaningful analytics
- **Cross-Platform**: Electron wrapper provides native desktop experience

## WSL Development Environment
- **Server Access**: Always use WSL IP address (not localhost) for Windows browser testing
- **Port Configuration**: Single port 5000 for unified development experience
- **File Storage**: JSON files in user-specific directories under `data/users/`
- **Hot Reload**: tsx for backend, Vite for frontend with automatic recompilation

## Important Notes
- **Real Workout Data**: All fake data replaced with actual user input systems
- **Onboarding System**: 5-step guided experience with user preference management
- **Achievement Tracking**: Milestone progression system integrated with user goals
- **Export Functionality**: CSV export with real workout data for external analysis