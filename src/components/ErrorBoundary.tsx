import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface InnerProps extends Props {
  navigate: ReturnType<typeof useNavigate>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<InnerProps, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.navigate('/', { replace: true });
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error && typeof parsedError.error === 'string') {
            if (parsedError.error.includes('Missing or insufficient permissions')) {
              errorMessage = 'You do not have permission to perform this action.';
            } else {
              errorMessage = parsedError.error;
            }
          }
        }
      } catch (e) {
        // Not a JSON error string, use the original message
        if (this.state.error?.message) {
           errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
              <p className="text-sm text-slate-500">
                {errorMessage}
              </p>
            </div>

            <Button 
              onClick={this.handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const navigate = useNavigate();
  return <ErrorBoundaryInner navigate={navigate}>{children}</ErrorBoundaryInner>;
}
