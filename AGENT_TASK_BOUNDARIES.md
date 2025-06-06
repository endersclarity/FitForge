# 🚨 AGENT TASK BOUNDARIES - STRICT ISOLATION PROTOCOL

## 🎯 AGENT ASSIGNMENTS (NO OVERLAP ALLOWED)

### **Agent A - UI Components & Mobile**
**EXCLUSIVE DOMAIN:**
- `client/src/components/ui/` - All UI components
- `client/src/components/mobile-*` - Mobile-specific components  
- `client/src/hooks/use-mobile*` - Mobile hooks
- `client/src/index.css` - Global styles (mobile responsiveness)

**FORBIDDEN ZONES:**
- ❌ NO server/ files
- ❌ NO services/ files
- ❌ NO shared/ files
- ❌ NO pages/ files (except mobile-specific)

### **Agent B - New Pages & Goal System**
**EXCLUSIVE DOMAIN:**
- `client/src/pages/goals/` - Goal-related pages
- `client/src/pages/exercise-library.tsx` - Exercise library page
- `client/src/components/goals/` - Goal-specific components

**FORBIDDEN ZONES:**
- ❌ NO server/ files
- ❌ NO services/ files  
- ❌ NO shared/ files
- ❌ NO ui/ components

### **Agent C - Services & Analytics**
**EXCLUSIVE DOMAIN:**
- `client/src/services/` - All service files
- `client/src/hooks/use-*` (data-related hooks only)
- Analytics and data processing logic

**FORBIDDEN ZONES:**
- ❌ NO server/ files
- ❌ NO pages/ files
- ❌ NO ui/ components

### **Agent D - API & Backend**
**EXCLUSIVE DOMAIN:**
- `server/` - All backend files
- API routes and middleware
- Database schemas in `shared/` (coordination required)

**FORBIDDEN ZONES:**
- ❌ NO client/ files
- ❌ NO components/
- ❌ NO pages/

## 🔄 COORDINATION RULES

### **Shared File Protocol**
If ANY file needs to be modified by multiple agents:
1. **STOP WORK** immediately
2. **Report conflict** in coordination channel
3. **Wait for operator approval** before proceeding

### **Common Conflict Files (WATCH LIST)**
- `server/routes.ts` - Only Agent D
- `shared/schema.ts` - Requires coordination
- `client/src/services/local-workout-service.ts` - Only Agent C

### **Merge Protocol**
- Agents commit frequently to their feature branches
- NO agent merges to master without operator approval
- Operator coordinates all merges to prevent conflicts

## ⚠️ VIOLATION CONSEQUENCES
- Immediate work stoppage
- Rollback to last safe commit
- Task reassignment

**THIS DOCUMENT IS BINDING FOR ALL AGENTS**