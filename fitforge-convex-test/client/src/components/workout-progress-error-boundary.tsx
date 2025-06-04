import React, { Component, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  retryCount: number;
}

export class WorkoutProgressErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Workout Progress Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || 'No component stack available'
    });

    // Log the error with context for debugging
    const errorContext = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'workout-progress',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🔍 Full Error Context:', errorContext);
  }

  handleRetry = () => {
    const { onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      console.log(`🔄 Retrying workout progress (attempt ${retryCount + 1}/${this.maxRetries})`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      if (onRetry) {
        onRetry();
      }
    }
  };

  handleRefreshPage = () => {
    console.log('🔄 Refreshing page due to workout progress error');
    window.location.reload();
  };

  handleGoHome = () => {
    console.log('🏠 Navigating to home due to workout progress error');
    window.location.href = '/';
  };

  handleGoToWorkouts = () => {
    console.log('🏋️ Navigating back to workouts due to workout progress error');
    window.location.href = '/workouts';
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo, retryCount } = this.state;

    if (hasError) {
      // If custom fallback provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI with recovery options
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Workout Progress Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Something went wrong with your workout progress. Don't worry - your data is safe!
                </p>
                
                {error && (
                  <div className="bg-muted/50 rounded-lg p-3 text-left">
                    <p className="font-mono text-sm text-destructive mb-2">
                      {error.message || 'An unexpected error occurred'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Error occurred during workout progress tracking
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry} 
                    className="w-full flex items-center gap-2"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({this.maxRetries - retryCount} attempts left)
                  </Button>
                )}
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={this.handleGoToWorkouts} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Workouts
                  </Button>
                  
                  <Button 
                    onClick={this.handleRefreshPage} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </div>

              {/* Development mode: Show technical details */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="bg-muted/30 rounded-lg p-3">
                  <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium">
                    <Bug className="h-4 w-4" />
                    Technical Details (Dev Mode)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Error Message:</p>
                      <p className="font-mono text-xs bg-destructive/10 p-2 rounded">
                        {error.message}
                      </p>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Stack Trace:</p>
                        <pre className="font-mono text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Component Stack:</p>
                        <pre className="font-mono text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                          {errorInfo}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Context:</p>
                      <p className="text-xs bg-muted/50 p-2 rounded">
                        {this.props.context || 'workout-progress'}
                      </p>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Error ID: {Date.now().toString(36)} • {new Date().toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Hook version for functional components
export function useWorkoutProgressErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error('🚨 Workout progress error:', error);
    console.error('📍 Context:', context);
    setError(error);
  }, []);

  return {
    error,
    resetError,
    handleError,
    hasError: !!error
  };
}