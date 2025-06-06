import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useNavigationErrorHandler } from "@/components/navigation-error-boundary";
import { Dumbbell, Moon, Sun, Bell, Menu, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FeatureComingSoonDialog } from "@/components/ui/feature-coming-soon-dialog";

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const { handleNavigationError } = useNavigationErrorHandler();

  // Safe navigation handler with error recovery
  const handleNavigation = (path: string) => {
    try {
      // Close mobile menu if open
      setMobileMenuOpen(false);
      
      // Add small delay to ensure state updates
      setTimeout(() => {
        // The Link component will handle the navigation
        // This is just for additional error tracking
        console.log(`🧭 Navigating to: ${path}`);
      }, 0);
    } catch (error) {
      console.error('Navigation error:', error);
      handleNavigationError(error as Error, '/dashboard');
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/workouts", label: "Workouts" },
    { path: "/exercises", label: "Exercises" },
    { path: "/start-workout", label: "Start Workout" },
    { path: "/goals", label: "Goals" },
    { path: "/progress", label: "Progress" },
    { path: "/community", label: "Community" },
  ];

  const isActive = (path: string) => location === path;

  const UserAvatar = () => (
    <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
      <span className="text-white text-sm font-semibold">
        {user ? user.email?.[0]?.toUpperCase() || "U" : "U"}
      </span>
    </div>
  );

  return (
    <>
    <nav className="bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[56px]">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">FitForge</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[44px] flex items-center touch-manipulation ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                {/* Notifications */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex relative min-h-[44px] min-w-[44px] touch-manipulation"
                  onClick={() => setShowNotificationsModal(true)}
                  aria-label="View notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></span>
                </Button>

                {/* Mobile menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden min-h-[48px] min-w-[48px] touch-manipulation"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[300px]">
                    <div className="flex flex-col space-y-2 mt-6">
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={`px-4 py-4 rounded-lg text-base font-medium transition-colors duration-200 min-h-[48px] flex items-center touch-manipulation active:scale-[0.98] ${
                            isActive(item.path)
                              ? "text-primary bg-primary/10 border-l-4 border-primary"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10"
                          }`}
                          role="menuitem"
                          aria-current={isActive(item.path) ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                      
                      {/* Mobile-only navigation items */}
                      <div className="border-t border-border mt-4 pt-4">
                        <Link
                          href="/profile"
                          onClick={() => handleNavigation("/profile")}
                          className="px-4 py-4 rounded-lg text-base font-medium transition-colors duration-200 min-h-[48px] flex items-center touch-manipulation active:scale-[0.98] text-muted-foreground hover:text-primary hover:bg-primary/5"
                          role="menuitem"
                        >
                          <User className="mr-3 h-5 w-5" />
                          Profile
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowNotificationsModal(true);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start px-4 py-4 text-base font-medium min-h-[48px] touch-manipulation"
                        >
                          <Bell className="mr-3 h-5 w-5" />
                          Notifications
                          <span className="ml-auto w-3 h-3 bg-red-500 rounded-full"></span>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}

            {/* Theme toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User menu or auth buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="min-h-[44px] min-w-[44px] touch-manipulation"
                    aria-label="User menu"
                  >
                    <UserAvatar />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Fitness Enthusiast</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="min-h-[44px] touch-manipulation"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button 
                    size="sm" 
                    className="gradient-bg min-h-[44px] touch-manipulation"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    
    {/* Notifications Coming Soon Modal */}
    <FeatureComingSoonDialog
      open={showNotificationsModal}
      onOpenChange={setShowNotificationsModal}
      featureName="Notifications"
      description="Real-time workout notifications, goal reminders, and achievement alerts are coming soon!"
    />
    </>
  );
}
