import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

// Simplified Zod Schema requiring ONLY Lab Name
const labSchema = z.object({
  name: z.string().min(1, 'Lab Name is required'),
});

export const LabModal = ({ isOpen, onClose, onSubmit, initialData, isLoading, serverError }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
      });
    } else {
      reset({
        name: '',
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs relative"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              {initialData ? 'Edit Laboratory' : 'Create Laboratory'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {serverError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Lab Name *</label>
              <input
                type="text"
                placeholder="e.g. Software Engineering AI Lab 1"
                {...register('name')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                autoFocus
              />
              {errors.name && <span className="text-red-400 text-[11px] mt-1 block">{errors.name.message}</span>}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {initialData ? 'Save Changes' : 'Create Laboratory'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
