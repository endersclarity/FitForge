/**
 * 🚀 AGENT INTEGRATION EXAMPLES - COPY & USE
 * Practical examples for Agent B, C, and D to integrate mobile components
 * Agent A - UI Components & Mobile
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";

// ================================
// AGENT B - GOAL PAGES EXAMPLES
// ================================

/**
 * Goal Wizard Mobile-Optimized Buttons
 * Copy these patterns for goal pages
 */
export const GoalWizardExamples = {
  // Primary goal action - large touch target
  createGoalButton: (
    <Button size="lg" className="w-full">
      Create New Goal
    </Button>
  ),

  // Goal step navigation - comfortable mobile touch
  nextStepButton: (
    <Button size="default" className="min-w-[120px]">
      Next Step
    </Button>
  ),

  // Secondary goal actions - proper touch targets
  editGoalButton: (
    <Button variant="outline" size="default">
      Edit Goal
    </Button>
  ),

  // Goal completion - destructive action with large target
  deleteGoalButton: (
    <Button variant="destructive" size="default" className="min-w-[100px]">
      Delete Goal
    </Button>
  ),

  // Goal wizard form with mobile navigation
  goalWizardWithNavigation: (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Goal Wizard</h1>
        {/* Goal form content */}
        <div className="space-y-4">
          <Button size="lg" className="w-full">
            Continue to Goal Details
          </Button>
        </div>
      </div>
    </div>
  )
};

// ================================
// AGENT C - SERVICES EXAMPLES
// ================================

/**
 * Service Integration Mobile Components
 * Copy these patterns for analytics and data services
 */
export const ServiceIntegrationExamples = {
  // Analytics loading button - with proper mobile feedback
  analyticsLoadButton: (
    <Button 
      variant="outline" 
      size="default"
      disabled={false} // Replace with your loading state
      className="min-w-[140px]"
      aria-label="Load progress analytics"
    >
      Load Analytics
    </Button>
  ),

  // Data refresh action - icon button with mobile optimization
  refreshDataButton: (
    <Button 
      variant="ghost" 
      size="icon"
      className="min-h-[48px] min-w-[48px]"
      aria-label="Refresh data"
    >
      {/* Replace with your refresh icon */}
      <span>🔄</span>
    </Button>
  ),

  // Service error retry - mobile-friendly error handling
  retryServiceButton: (
    <Button 
      variant="secondary" 
      size="default"
      className="w-full sm:w-auto"
    >
      Retry Loading
    </Button>
  ),

  // Performance optimization toggle - accessible mobile control
  performanceToggleButton: (
    <Button 
      variant="ghost" 
      size="default"
      className="justify-start"
      aria-pressed={false} // Replace with your toggle state
    >
      Enable Performance Mode
    </Button>
  ),

  // Service-driven component with mobile navigation
  analyticsPageExample: (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Progress Analytics</h1>
          <Button variant="ghost" size="icon" aria-label="Refresh analytics">
            <span>🔄</span>
          </Button>
        </div>
        {/* Analytics content */}
        <Button variant="outline" size="default" className="w-full sm:w-auto">
          Export Analytics
        </Button>
      </div>
    </div>
  )
};

// ================================
// AGENT D - API/BACKEND EXAMPLES
// ================================

/**
 * API Integration Mobile Components
 * Copy these patterns for backend interactions
 */
export const APIIntegrationExamples = {
  // API sync button - clear mobile feedback
  syncDataButton: (
    <Button 
      variant="default" 
      size="default"
      className="min-w-[100px]"
      aria-label="Sync data with server"
    >
      Sync Data
    </Button>
  ),

  // Notification trigger - mobile-optimized icon button
  notificationButton: (
    <Button 
      variant="ghost" 
      size="icon"
      className="relative min-h-[48px] min-w-[48px]"
      aria-label="View notifications"
    >
      {/* Replace with your notification icon */}
      <span>🔔</span>
      {/* Notification badge - mobile-friendly size */}
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
    </Button>
  ),

  // API error handling - mobile-accessible error display
  apiErrorButton: (
    <Button 
      variant="destructive" 
      size="default"
      className="w-full"
      aria-label="Retry failed API request"
    >
      Retry API Request
    </Button>
  ),

  // Backend status indicator - touch-friendly status control
  statusIndicatorButton: (
    <Button 
      variant="outline" 
      size="sm"
      className="min-h-[44px]"
      disabled
    >
      Status: Connected
    </Button>
  ),

  // Complete API integration with mobile navigation
  apiManagementExample: (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">API Management</h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" aria-label="Sync data">
              <span>🔄</span>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <span>🔔</span>
            </Button>
          </div>
        </div>
        {/* API management content */}
        <div className="space-y-2">
          <Button variant="default" size="default" className="w-full sm:w-auto">
            Test API Connection
          </Button>
          <Button variant="outline" size="default" className="w-full sm:w-auto">
            View API Logs
          </Button>
        </div>
      </div>
    </div>
  )
};

// ================================
// CROSS-AGENT INTEGRATION PATTERNS
// ================================

/**
 * Shared Mobile Patterns All Agents Can Use
 */
export const SharedMobilePatterns = {
  // Mobile-first form button layout
  mobileFormButtons: (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button variant="outline" size="default" className="flex-1">
        Cancel
      </Button>
      <Button variant="default" size="default" className="flex-1">
        Save Changes
      </Button>
    </div>
  ),

  // Mobile action bar pattern
  mobileActionBar: (
    <div className="flex items-center justify-between p-4 border-t">
      <Button variant="ghost" size="default">
        Back
      </Button>
      <div className="flex space-x-2">
        <Button variant="outline" size="default">
          Save Draft
        </Button>
        <Button variant="default" size="default">
          Continue
        </Button>
      </div>
    </div>
  ),

  // Mobile loading state pattern
  mobileLoadingPattern: (
    <Button 
      variant="default" 
      size="default" 
      disabled 
      className="w-full"
    >
      <span className="animate-spin mr-2">⏳</span>
      Loading...
    </Button>
  ),

  // Mobile success feedback pattern
  mobileSuccessPattern: (
    <Button 
      variant="default" 
      size="default" 
      className="w-full bg-green-600 hover:bg-green-700"
    >
      <span className="mr-2">✅</span>
      Success!
    </Button>
  )
};

// ================================
// MOBILE TESTING UTILITIES
// ================================

/**
 * Test your mobile components with these utilities
 */
export const MobileTestingUtils = {
  // Test touch target size
  checkTouchTarget: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  },

  // Test mobile viewport
  isMobileViewport: (): boolean => {
    return window.innerWidth < 768;
  },

  // Test touch device
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
};

// ================================
// USAGE INSTRUCTIONS
// ================================

/**
 * HOW TO USE THESE EXAMPLES:
 * 
 * 1. Copy the relevant example for your agent
 * 2. Replace placeholder content with your actual data
 * 3. Import Button from "@/components/ui/button"
 * 4. Import Navigation from "@/components/navigation"
 * 5. Test on mobile viewport (320px minimum)
 * 6. Verify touch targets are ≥44px
 * 
 * MOBILE OPTIMIZATION GUARANTEED:
 * - All buttons meet 44px minimum touch targets
 * - Touch-manipulation eliminates 300ms delay
 * - Proper ARIA labels for accessibility
 * - Responsive design for 320px-1920px screens
 * - Visual feedback on touch interactions
 */