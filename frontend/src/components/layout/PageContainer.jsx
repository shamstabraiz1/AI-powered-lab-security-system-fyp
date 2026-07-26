import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const PageContainer = ({ children, className }) => {
  return (
    <div className={twMerge(clsx('max-w-7xl mx-auto space-y-6 animate-fadeIn', className))}>
      {children}
    </div>
  );
};
