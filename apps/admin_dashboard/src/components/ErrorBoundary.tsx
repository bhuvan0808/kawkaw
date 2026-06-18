'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/primitives';

interface State {
  hasError: boolean;
  message?: string;
}

/** App-wide error boundary so a render fault in one section can't blank the console. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced to the console; a real deployment would forward to Sentry/etc.
    console.error('Admin dashboard error boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-ink">This screen hit an error</h2>
          <p className="mt-2 max-w-md text-sm text-ink-muted">{this.state.message ?? 'Unexpected error.'}</p>
          <Button className="mt-6" onClick={() => this.setState({ hasError: false })}>
            Reload section
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
