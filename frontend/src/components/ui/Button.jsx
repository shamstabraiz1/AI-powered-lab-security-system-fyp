import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-500/30',
  outline: 'bg-transparent hover:bg-slate-900 text-slate-200 border border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-[11px]',
  md: 'px-3.5 py-2 text-xs',
  lg: 'px-4 py-2.5 text-sm',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 text-current shrink-0" />
      ) : null}
      {children}
    </motion.button>
  );
};
