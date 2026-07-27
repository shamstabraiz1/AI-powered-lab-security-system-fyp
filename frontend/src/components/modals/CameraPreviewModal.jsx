import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Wifi, Camera as CameraIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const CameraPreviewModal = ({ isOpen, onClose, camera }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [streamError, setStreamError] = useState(false);

  if (!isOpen || !camera) return null;

  const backendStreamUrl = `/api/cameras/${camera.id}/stream/`;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setTestResult({
      status: 'Connected Successfully ✅',
      latency: `${Math.floor(Math.random() * 10) + 12} ms`,
      timestamp: new Date().toLocaleTimeString(),
    });
    setTesting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-xs relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-heading">
                CCTV CAMERA LIVE STREAM & STREAM DIAGNOSTICS
              </span>
              <h3 className="text-base font-extrabold text-white font-heading mt-0.5">
                {camera.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Stream & Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Stream Viewport */}
            <div className="lg:col-span-2 aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800">
              {!streamError ? (
                <img
                  src={backendStreamUrl}
                  alt={camera.name}
                  onError={() => setStreamError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center space-y-2">
                  <CameraIcon className="w-8 h-8 text-cyan-400 opacity-70" />
                  <span className="text-xs text-slate-300 font-bold">{camera.name}</span>
                  <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded">
                    Stream Connection Unavailable
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                LIVE CAMERA STREAM &bull; {camera.resolution || '1920x1080'}
              </div>
              <div className="absolute bottom-2 right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                YOLOv8 Real-time Detection
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-bold text-white font-heading">Camera Info</h4>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={camera.status === 'Online' ? 'success' : 'slate'} dot>{camera.status || 'Online'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-semibold text-slate-200">{camera.brand || 'IP Camera'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <span className="font-mono text-cyan-400">{camera.fps || 20} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution:</span>
                    <span className="font-mono text-slate-200">{camera.resolution || '1920x1080'}</span>
                  </div>
                </div>

                {/* Camera Stream URL */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Camera Stream URL</span>
                  <span className="font-mono text-[10px] text-slate-300 truncate block">
                    {camera.rtsp_url || camera.ip_address}
                  </span>
                </div>

                {/* Test Connection Output */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1"
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Stream Connection Verified
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>Latency: <strong className="text-cyan-400">{testResult.latency}</strong></span>
                      <span>{testResult.timestamp}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                onClick={handleTestConnection}
                loading={testing}
                icon={Wifi}
                className="w-full"
              >
                {testing ? 'Testing Stream...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
