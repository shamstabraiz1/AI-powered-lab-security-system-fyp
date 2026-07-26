import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical, AlertCircle, Clock, BookOpen, User } from 'lucide-react';
import { Button } from '../ui/Button';

const sessionSchema = z.object({
  instructor_name: z.string().min(1, 'Instructor Name is required'),
  course_name: z.string().min(1, 'Course Name is required'),
  course_code: z.string().optional(),
  lab: z.coerce.number().min(1, 'Laboratory selection is required'),
  session_topic: z.string().min(1, 'Session Topic is required'),
  planned_duration: z.coerce.number().min(15, 'Planned duration must be at least 15 minutes'),
});

export const SessionModal = ({ isOpen, onClose, onSubmit, labs = [], isLoading, serverError }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      instructor_name: 'Dr. Tabraiz Shams',
      course_name: 'Computer Vision & AI Systems',
      course_code: 'SE-402',
      lab: labs[0]?.id || 1,
      session_topic: 'Real-time Object Detection & Baseline Verification',
      planned_duration: 120,
    },
  });

  useEffect(() => {
    reset({
      instructor_name: 'Dr. Tabraiz Shams',
      course_name: 'Computer Vision & AI Systems',
      course_code: 'SE-402',
      lab: labs[0]?.id || 1,
      session_topic: 'Real-time Object Detection & Baseline Verification',
      planned_duration: 120,
    });
  }, [isOpen, labs, reset]);

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
              Start New Academic Laboratory Session
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {serverError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Instructor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Tabraiz Shams"
                  {...register('instructor_name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.instructor_name && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.instructor_name.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Target Laboratory *</label>
                <select
                  {...register('lab')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {errors.lab && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.lab.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Course Name *</label>
                <input
                  type="text"
                  placeholder="Computer Vision & AI Systems"
                  {...register('course_name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.course_name && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.course_name.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. SE-402"
                  {...register('course_code')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Session Topic *</label>
              <input
                type="text"
                placeholder="Session Topic & Real-time AI Baseline"
                {...register('session_topic')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
              {errors.session_topic && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.session_topic.message}</span>}
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Planned Duration (Minutes) *</label>
              <input
                type="number"
                {...register('planned_duration')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
              {errors.planned_duration && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.planned_duration.message}</span>}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Active Reference Profile:</span>
                <strong className="text-cyan-400">Room 101 Standard Baseline (Active)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Cameras:</span>
                <strong className="text-emerald-400 font-mono">2 CCTV Cameras Online</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Start Lab Session
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
