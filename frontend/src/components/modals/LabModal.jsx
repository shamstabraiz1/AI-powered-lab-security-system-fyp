import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical, Building, Hash, Users, Layers, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

const labSchema = z.object({
  name: z.string().min(1, 'Lab Name is required'),
  code: z.string().min(1, 'Lab Code is required'),
  floor: z.string().min(1, 'Floor is required'),
  department: z.string().min(1, 'Department is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const LabModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: '',
      code: '',
      floor: '1st Floor',
      department: 'Department of Software Engineering',
      capacity: 30,
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        code: initialData.code || '',
        floor: initialData.floor || '1st Floor',
        department: initialData.department || 'Department of Software Engineering',
        capacity: initialData.capacity || 30,
        description: initialData.description || '',
        is_active: initialData.is_active ?? true,
      });
    } else {
      reset({
        name: '',
        code: '',
        floor: '1st Floor',
        department: 'Department of Software Engineering',
        capacity: 30,
        description: '',
        is_active: true,
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
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs relative"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              {initialData ? 'Edit Laboratory Facility' : 'Create New Laboratory Facility'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Lab Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SE AI Lab 1"
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Lab Code / Room *</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101"
                  {...register('code')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.code && <span className="text-red-400 text-[10px]">{errors.code.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Floor *</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Floor"
                  {...register('floor')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Workstation Capacity *</label>
                <input
                  type="number"
                  {...register('capacity')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Department *</label>
              <input
                type="text"
                {...register('department')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Description</label>
              <textarea
                rows={2}
                placeholder="Software Engineering AI & Computer Vision Workstation Lab..."
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_active" {...register('is_active')} className="accent-blue-600 rounded" />
              <label htmlFor="is_active" className="text-slate-300 cursor-pointer font-semibold">
                Active & Monitored Status
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
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
