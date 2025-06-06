/**
 * 📱 MOBILE COMPONENT INTERFACES - AGENT A
 * TypeScript definitions for mobile-optimized UI components
 * Ready for consumption by Agent B, C, and D
 */

import * as React from "react";
import { VariantProps } from "class-variance-authority";

// ================================
// BUTTON COMPONENT INTERFACES
// ================================

/**
 * Mobile-Optimized Button Variants
 * All variants guarantee ≥44px touch targets
 */
export declare const buttonVariants: {
  variant: {
    default: string;
    destructive: string;
    outline: string;
    secondary: string;
    ghost: string;
    link: string;
  };
  size: {
    default: string; // h-11 min-h-[44px] - Mobile optimized
    sm: string;      // h-11 min-h-[44px] - Upgraded from 40px
    lg: string;      // h-12 min-h-[48px] - Comfortable touch
    icon: string;    // h-12 w-12 min-h-[48px] min-w-[48px] - Upgraded
  };
};

/**
 * Button Props with Mobile Optimizations
 * Includes touch-manipulation and accessibility features
 */
export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component (Slot pattern) */
  asChild?: boolean;
  /** 
   * Mobile touch target is automatically applied
   * Minimum 44px guaranteed, 48px for icons
   */
}

/**
 * Mobile Button Component
 * Auto-includes: touch-manipulation, select-none, active:scale-[0.98]
 */
export declare const Button: React.ForwardRefExoticComponent<
  MobileButtonProps & React.RefAttributes<HTMLButtonElement>
>;

// ================================
// NAVIGATION COMPONENT INTERFACES  
// ================================

/**
 * Mobile Navigation Item
 */
export interface MobileNavItem {
  path: string;
  label: string;
  /** Auto-applied: min-h-[48px] touch targets */
}

/**
 * Mobile Navigation Props
 * Includes mobile Sheet menu and responsive breakpoints
 */
export interface MobileNavigationProps {
  /** Navigation items with mobile touch optimization */
  navItems?: MobileNavItem[];
  /** Mobile menu state (auto-managed) */
  mobileMenuOpen?: boolean;
  /** Theme support with mobile-optimized toggle */
  theme?: "light" | "dark";
}

/**
 * Mobile Navigation Component
 * Features: 48px touch targets, Sheet menu, accessibility
 */
export declare const Navigation: React.FC<MobileNavigationProps>;

// ================================
// MOBILE PATTERN INTERFACES
// ================================

/**
 * Mobile Touch Target Standards
 */
export interface MobileTouchTarget {
  /** Minimum touch target size */
  minHeight: "44px";
  /** Comfortable touch target size */
  comfortableHeight: "48px";
  /** Required classes for touch optimization */
  touchClasses: "touch-manipulation select-none active:scale-[0.98]";
}

/**
 * Mobile Responsive Breakpoints
 */
export interface MobileBreakpoints {
  xs: "320px";  // Extra small phones
  sm: "640px";  // Small tablets  
  md: "768px";  // Tablets/small laptops
  lg: "1024px"; // Laptops
  xl: "1280px"; // Desktops
}

/**
 * Mobile Accessibility Standards
 */
export interface MobileAccessibility {
  /** Required ARIA label for interactive elements */
  ariaLabel: string;
  /** Touch target minimum size compliance */
  touchTargetCompliant: boolean;
  /** Screen reader support */
  screenReaderOptimized: boolean;
  /** Keyboard navigation support */
  keyboardAccessible: boolean;
}

// ================================
// AGENT INTEGRATION TYPES
// ================================

/**
 * For Agent B - Goal Pages Integration
 */
export interface GoalPageMobileComponents {
  /** Mobile-optimized buttons for goal wizard */
  GoalButton: typeof Button;
  /** Navigation with /goals mobile support */
  GoalNavigation: typeof Navigation;
  /** Mobile form patterns */
  mobileFormPatterns: MobileTouchTarget;
}

/**
 * For Agent C - Service Component Integration  
 */
export interface ServiceMobileComponents {
  /** Buttons for service actions (analytics, etc.) */
  ServiceButton: typeof Button;
  /** Mobile-optimized loading states */
  mobileLoadingPatterns: MobileTouchTarget;
  /** Touch-friendly service controls */
  mobileTouchPatterns: MobileTouchTarget;
}

/**
 * For Agent D - API Integration
 */
export interface APIMobileComponents {
  /** Buttons for API actions */
  APIButton: typeof Button;
  /** Mobile notification components */
  mobileNotificationPattern: MobileTouchTarget;
  /** Touch-optimized API feedback */
  mobileAPIFeedback: MobileTouchTarget;
}

// ================================
// COMPONENT EXPORT GUARANTEES
// ================================

/**
 * Integration Guarantees for Other Agents
 */
export interface ComponentIntegrationGuarantees {
  /** No breaking changes to existing APIs */
  backwardCompatible: true;
  /** All components mobile-optimized */
  mobileOptimized: true;
  /** TypeScript support maintained */
  typeScriptCompliant: true;
  /** Accessibility features included */
  accessibilityCompliant: true;
  /** Performance optimized */
  performanceOptimized: true;
}

// ================================
// USAGE EXAMPLES FOR AGENTS
// ================================

/**
 * Example Usage for Agent B (Goals)
 */
declare const AgentBExample: {
  goalWizardButton: React.ReactElement<MobileButtonProps>;
  goalNavigationUsage: React.ReactElement<MobileNavigationProps>;
};

/**
 * Example Usage for Agent C (Services) 
 */
declare const AgentCExample: {
  analyticsButton: React.ReactElement<MobileButtonProps>;
  serviceActionButton: React.ReactElement<MobileButtonProps>;
};

/**
 * Example Usage for Agent D (API)
 */
declare const AgentDExample: {
  apiTriggerButton: React.ReactElement<MobileButtonProps>;
  notificationButton: React.ReactElement<MobileButtonProps>;
};