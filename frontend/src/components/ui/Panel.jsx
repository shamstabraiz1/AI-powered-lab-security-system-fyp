import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Panel = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md',
          className
        )
      )}
    >
      {children}
    </div>
  );
};
