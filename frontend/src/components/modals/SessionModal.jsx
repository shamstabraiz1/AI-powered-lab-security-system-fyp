import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const PREDEFINED_INSTRUCTORS = [
  'Engr. Dr. Fakhar Zaman',
  'Engr. Dr. Asma Javad',
  'Engr. Awais Rathore',
  'Engr. Zeeshan Rashid',
  'Engr. Tahir Abbasi',
  'Engr. Ghulam Rabani Butt',
  'Engr. Ahmad Khwaja',
  'Engr. Daniyal Nazir',
  'Engr. Khurram Iqbal',
  'Engr. Sidra Rafique',
];

const OTHER_INSTRUCTOR_OPTION = 'Other (Custom Instructor)';

const sessionSchema = z
  .object({
    instructor_select: z.string().min(1, 'Instructor selection is required'),
    custom_instructor_name: z.string().optional(),
    course_name: z.string().min(1, 'Course Name is required'),
    course_code: z.string().optional(),
    lab: z.coerce.number().min(1, 'Laboratory selection is required'),
    session_topic: z.string().min(1, 'Session Topic is required'),
    planned_duration: z.coerce.number().min(15, 'Planned duration must be at least 15 minutes'),
  })
  .superRefine((data, ctx) => {
    if (data.instructor_select === OTHER_INSTRUCTOR_OPTION) {
      if (!data.custom_instructor_name || data.custom_instructor_name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['custom_instructor_name'],
          message: 'Custom Instructor Name is required',
        });
      }
    }
  });

export const SessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  labs = [],
  isLoading,
  serverError,
  initialData = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      instructor_select: PREDEFINED_INSTRUCTORS[0],
      custom_instructor_name: '',
      course_name: 'Computer Vision & AI Systems',
      course_code: 'SE-402',
      lab: labs[0]?.id || 1,
      session_topic: 'Real-time Object Detection & Baseline Verification',
      planned_duration: 120,
    },
  });

  const selectedInstructor = watch('instructor_select');

  useEffect(() => {
    const rawInstructor = initialData?.instructor_name || PREDEFINED_INSTRUCTORS[0];
    const isPredefined = PREDEFINED_INSTRUCTORS.includes(rawInstructor);

    reset({
      instructor_select: isPredefined ? rawInstructor : OTHER_INSTRUCTOR_OPTION,
      custom_instructor_name: isPredefined ? '' : rawInstructor,
      course_name: initialData?.course_name || 'Computer Vision & AI Systems',
      course_code: initialData?.course_code || 'SE-402',
      lab: initialData?.lab || labs[0]?.id || 1,
      session_topic: initialData?.session_topic || 'Real-time Object Detection & Baseline Verification',
      planned_duration: initialData?.planned_duration || 120,
    });
  }, [isOpen, labs, reset, initialData]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const finalInstructorName =
      data.instructor_select === OTHER_INSTRUCTOR_OPTION
        ? data.custom_instructor_name?.trim() || ''
        : data.instructor_select?.trim() || '';

    if (!finalInstructorName) {
      return;
    }

    const payload = {
      instructor_name: finalInstructorName,
      course_name: data.course_name,
      course_code: data.course_code,
      lab: data.lab,
      session_topic: data.session_topic,
      planned_duration: data.planned_duration,
    };

    onSubmit(payload);
  };

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

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Instructor *</label>
                <select
                  {...register('instructor_select')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {PREDEFINED_INSTRUCTORS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value={OTHER_INSTRUCTOR_OPTION}>{OTHER_INSTRUCTOR_OPTION}</option>
                </select>
                {errors.instructor_select && (
                  <span className="text-red-400 text-[10px] mt-0.5 block">{errors.instructor_select.message}</span>
                )}

                {selectedInstructor === OTHER_INSTRUCTOR_OPTION && (
                  <div className="mt-2">
                    <label className="block text-slate-300 mb-1 font-semibold">Custom Instructor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Engr. Visiting Faculty"
                      {...register('custom_instructor_name')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                    {errors.custom_instructor_name && (
                      <span className="text-red-400 text-[10px] mt-0.5 block">
                        {errors.custom_instructor_name.message}
                      </span>
                    )}
                  </div>
                )}
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
