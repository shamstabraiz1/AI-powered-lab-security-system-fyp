import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Video, Link as LinkIcon, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';

const cameraSchema = z.object({
  name: z.string().min(1, 'Camera Name is required'),
  camera_type: z.string().min(1, 'Camera Type is required'),
  ip_address: z.string().min(1, 'RTSP Stream Source is required'),
  lab: z.coerce.number().min(1, 'Lab selection is required'),
  location: z.string().optional(),
  resolution: z.string().default('1920x1080'),
  fps: z.coerce.number().default(20),
  status: z.enum(['Online', 'Offline', 'Connecting', 'Error']).default('Online'),
  is_active: z.boolean().default(true),
});

export const CameraModal = ({ isOpen, onClose, onSubmit, initialData, labs = [], isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: '',
      camera_type: 'IP Overhead Camera',
      ip_address: 'rtsp://192.168.1.100:554/stream1',
      lab: labs[0]?.id || 1,
      location: 'Overhead Ceiling View',
      resolution: '1920x1080',
      fps: 20,
      status: 'Online',
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        camera_type: initialData.camera_type || 'IP Overhead Camera',
        ip_address: initialData.ip_address || 'rtsp://192.168.1.100:554/stream1',
        lab: initialData.lab || labs[0]?.id || 1,
        location: initialData.location || 'Overhead Ceiling View',
        resolution: initialData.resolution || '1920x1080',
        fps: initialData.fps || 20,
        status: initialData.status || 'Online',
        is_active: initialData.is_active ?? true,
      });
    } else {
      reset({
        name: '',
        camera_type: 'IP Overhead Camera',
        ip_address: 'rtsp://192.168.1.100:554/stream1',
        lab: labs[0]?.id || 1,
        location: 'Overhead Ceiling View',
        resolution: '1920x1080',
        fps: 20,
        status: 'Online',
        is_active: true,
      });
    }
  }, [initialData, reset, isOpen, labs]);

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
              <Camera className="w-4 h-4 text-blue-400" />
              {initialData ? 'Edit CCTV IP Camera' : 'Add New IP Camera'}
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
                <label className="block text-slate-300 mb-1 font-semibold">Camera Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cam 1: Overhead Main"
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Laboratory *</label>
                <select
                  {...register('lab')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">RTSP Stream Source URL *</label>
              <input
                type="text"
                placeholder="rtsp://admin:password@192.168.1.100:554/stream"
                {...register('ip_address')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
              {errors.ip_address && <span className="text-red-400 text-[10px]">{errors.ip_address.message}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Camera Type *</label>
                <select
                  {...register('camera_type')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="IP Overhead Camera">IP Overhead Camera</option>
                  <option value="Desk Array Dome Cam">Desk Array Dome Cam</option>
                  <option value="Wall Entrance Cam">Wall Entrance Cam</option>
                  <option value="USB WebCam Stream">USB WebCam Stream</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Resolution *</label>
                <select
                  {...register('resolution')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1920x1080">1920x1080 (1080p FHD)</option>
                  <option value="1280x720">1280x720 (720p HD)</option>
                  <option value="2560x1440">2560x1440 (2K QHD)</option>
                  <option value="3840x2160">3840x2160 (4K UHD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Framerate (FPS) *</label>
                <input
                  type="number"
                  {...register('fps')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Position / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Overhead Workstation Array"
                  {...register('location')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_active_cam" {...register('is_active')} className="accent-blue-600 rounded" />
              <label htmlFor="is_active_cam" className="text-slate-300 cursor-pointer font-semibold">
                Camera Enabled & Actively Monitored
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {initialData ? 'Save Changes' : 'Add Camera'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
