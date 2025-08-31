import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      {...props}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl shadow-md">
      {/* Header skeleton */}
      <div className="flex items-center mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Image skeleton */}
      <Skeleton className="h-48 w-full rounded-lg mb-4" />

      {/* Actions skeleton */}
      <div className="flex items-center space-x-4 border-t border-slate-200 dark:border-slate-800 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-950 shadow-md rounded-lg mb-4 overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
      {/* Header skeleton */}
      <div className="flex items-center p-4 border-b border-slate-200/70 dark:border-slate-700/60">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="grid grid-cols-5 gap-1 p-2 border-t border-slate-200/70 dark:border-slate-700/60">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="even:bg-slate-50 dark:even:bg-slate-800/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-4">
            <Skeleton className="h-4 w-32 mb-1" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </td>
    </tr>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex space-x-3 mb-4">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-slate-300 border-t-accent ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
}
