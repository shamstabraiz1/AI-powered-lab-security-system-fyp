import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded bg-slate-800/80 border border-slate-700/50', className)
      )}
      {...props}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

export const StreamSkeleton = () => {
  return (
    <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center p-4">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
};
