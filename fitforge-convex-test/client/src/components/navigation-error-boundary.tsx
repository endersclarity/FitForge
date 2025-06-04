import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log navigation errors for debugging
    console.error('Navigation Error Boundary caught an error:', error, errorInfo);
    
    // Optional: Send error to monitoring service
    // trackError('navigation_error', { error: error.message, component: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Navigation Error</AlertTitle>
              <AlertDescription>
                Something went wrong with the navigation system. This could be due to a routing issue or a temporary problem.
              </AlertDescription>
            </Alert>

            <div className="bg-card p-6 rounded-lg border space-y-4">
              <h2 className="text-lg font-semibold">What can you do?</h2>
              
              <div className="space-y-3">
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome} 
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                  variant="secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded text-sm">
                  <summary className="cursor-pointer font-medium">Technical Details (Dev Mode)</summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="text-xs overflow-auto max-h-32 mt-1 p-2 bg-background rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="text-xs overflow-auto max-h-32 mt-1 p-2 bg-background rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NavigationErrorBoundary;

// Hook for functional components to handle navigation errors
export const useNavigationErrorHandler = () => {
  const handleNavigationError = (error: Error, fallbackPath = '/dashboard') => {
    console.error('Navigation error:', error);
    
    // Show user-friendly error message
    if (error.message.includes('404') || error.message.includes('not found')) {
      // Handle 404 errors
      window.location.href = fallbackPath;
    } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      // Handle auth errors
      window.location.href = '/auth';
    } else {
      // Generic error handling
      window.location.href = fallbackPath;
    }
  };

  return { handleNavigationError };
};

// Higher-order component for wrapping components with error boundary
export const withNavigationErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <NavigationErrorBoundary fallback={fallback}>
      <Component {...props} />
    </NavigationErrorBoundary>
  );
  
  WrappedComponent.displayName = `withNavigationErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};