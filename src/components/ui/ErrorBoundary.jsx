import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <Button onClick={this.handleRetry} fullWidth>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Retry component for failed operations
export function RetryCard({ message, onRetry, loading = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-14 h-14 mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-400" />
      </div>
      <p className="text-sm text-[var(--color-text-muted)] text-center mb-4">
        {message || 'Something went wrong'}
      </p>
      <Button variant="secondary" onClick={onRetry} loading={loading}>
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

// Empty state component
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 mb-4 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
          <Icon className="w-7 h-7 text-[var(--color-text-dim)]" />
        </div>
      )}
      <h3 className="font-semibold text-[var(--color-text)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}

// Offline banner
export function OfflineBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-amber-950 text-center py-2 text-sm font-medium safe-top">
      You're offline. Some features may be unavailable.
    </div>
  );
}
