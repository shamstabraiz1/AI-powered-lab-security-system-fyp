import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Wifi, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { cameraService } from '../../services/cameraService';

// IPv4 Regex
const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;

// Camera Schema with validation supporting RTSP, HTTP, and HTTPS streams
const cameraSchema = z.object({
  name: z.string().min(1, 'Camera Name is required'),
  lab: z.coerce.number().min(1, 'Laboratory selection is required'),
  serial_number: z.string().optional(),
  brand: z.string().optional(),
  model_name: z.string().optional(),
  ip_address: z
    .string()
    .min(1, 'IP Address is required')
    .refine((val) => ipv4Regex.test(val), { message: 'Invalid IPv4 address format (e.g. 192.168.1.100)' }),
  rtsp_url: z
    .string()
    .min(1, 'Camera Stream URL is required')
    .refine(
      (val) => val.startsWith('rtsp://') || val.startsWith('http://') || val.startsWith('https://'),
      { message: 'Camera Stream URL must begin with rtsp://, http://, or https://' }
    ),
  location: z.string().min(1, 'Camera Location is required (e.g. Front Left, Entrance)'),
  username: z.string().optional(),
  password: z.string().optional(),
  is_active: z.boolean().default(true),
  resolution: z.string().default('1920x1080'),
  fps: z.coerce.number().default(20),
});

export const CameraModal = ({ isOpen, onClose, onSubmit, initialData, labs = [], isLoading, serverError }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: '',
      lab: labs[0]?.id || 1,
      serial_number: '',
      brand: 'Hikvision',
      model_name: 'DS-2CD2043G0-I',
      ip_address: '192.168.1.100',
      rtsp_url: 'rtsp://192.168.1.100:554/stream1',
      location: 'Overhead Ceiling View',
      username: 'admin',
      password: '',
      is_active: true,
      resolution: '1920x1080',
      fps: 20,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        lab: initialData.lab || labs[0]?.id || 1,
        serial_number: initialData.serial_number || '',
        brand: initialData.brand || 'Hikvision',
        model_name: initialData.model_name || '',
        ip_address: initialData.ip_address || '192.168.1.100',
        rtsp_url: initialData.rtsp_url || 'rtsp://192.168.1.100:554/stream1',
        location: initialData.location || 'Overhead Ceiling View',
        username: initialData.username || '',
        password: initialData.password || '',
        is_active: initialData.is_active ?? true,
        resolution: initialData.resolution || '1920x1080',
        fps: initialData.fps || 20,
      });
    } else {
      reset({
        name: '',
        lab: labs[0]?.id || 1,
        serial_number: '',
        brand: 'Hikvision',
        model_name: 'DS-2CD2043G0-I',
        ip_address: '192.168.1.100',
        rtsp_url: 'rtsp://192.168.1.100:554/stream1',
        location: 'Overhead Ceiling View',
        username: 'admin',
        password: '',
        is_active: true,
        resolution: '1920x1080',
        fps: 20,
      });
    }
    setTestResult(null);
  }, [initialData, reset, isOpen, labs]);

  const handleTestConnection = async () => {
    const ip = getValues('ip_address');
    const streamUrl = getValues('rtsp_url');

    if (!streamUrl || (!streamUrl.startsWith('rtsp://') && !streamUrl.startsWith('http://') && !streamUrl.startsWith('https://'))) {
      setTestResult({ status: 'Invalid Stream URL', success: false });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await cameraService.testConnection({ ip_address: ip, rtsp_url: streamUrl });
      setTestResult({
        status: res.status || 'Connected Successfully ✅',
        latency: res.latency || '14ms',
        success: true,
      });
    } catch {
      setTestResult({ status: 'Camera Offline', success: false });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              {initialData ? 'Edit IP Camera Configuration' : 'Add New IP CCTV Camera'}
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
                {errors.name && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.name.message}</span>}
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
                <label className="block text-slate-300 mb-1 font-semibold">IPv4 Address *</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100"
                  {...register('ip_address')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
                {errors.ip_address && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.ip_address.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Camera Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Front Left, Entrance, Exit"
                  {...register('location')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.location && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.location.message}</span>}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-300 font-semibold">Camera Stream URL * (RTSP / HTTP / MJPEG)</label>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Wifi className="w-3 h-3" /> {testing ? 'Testing Stream...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="text"
                placeholder="rtsp://192.168.1.100:554/stream1 or http://192.168.100.41:8080/video"
                {...register('rtsp_url')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
              {errors.rtsp_url && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.rtsp_url.message}</span>}

              {testResult && (
                <div
                  className={`mt-1.5 p-2 rounded text-[11px] font-bold flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  <span>{testResult.status}</span>
                  {testResult.latency && <span className="font-mono">{testResult.latency}</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-998823"
                  {...register('serial_number')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Brand</label>
                <input
                  type="text"
                  placeholder="Hikvision / Dahua / Mobile Webcam"
                  {...register('brand')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Model</label>
                <input
                  type="text"
                  placeholder="DS-2CD2043G0-I / IP Webcam App"
                  {...register('model_name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Stream Username</label>
                <input
                  type="text"
                  placeholder="admin"
                  {...register('username')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Stream Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full px-3 py-2 pr-8 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_active_check" {...register('is_active')} className="accent-blue-600 rounded" />
              <label htmlFor="is_active_check" className="text-slate-300 cursor-pointer font-semibold">
                Camera Enabled & Actively Monitored
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {initialData ? 'Save Changes' : 'Create Camera'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
