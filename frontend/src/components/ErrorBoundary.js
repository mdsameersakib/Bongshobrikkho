import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedo } from '@fortawesome/free-solid-svg-icons';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-red-500 text-4xl mb-4"
          />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="btn btn-primary w-full"
          >
            <FontAwesomeIcon icon={faRedo} className="mr-2" />
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost w-full"
          >
            Refresh Page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function logError(error, errorInfo) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  // In production, you could send this to an error reporting service
  // Example: Sentry, LogRocket, etc.
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Clear any error state if needed
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
