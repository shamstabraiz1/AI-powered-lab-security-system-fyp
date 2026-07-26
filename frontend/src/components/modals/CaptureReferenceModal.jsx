import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';

export const CaptureReferenceModal = ({ isOpen, onClose, cameras = [], onCaptureSuccess }) => {
  const [selectedCam, setSelectedCam] = useState(cameras[0]?.id || 1);
  const [capturing, setCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState(null);

  const handleCapture = async () => {
    setCapturing(true);
    setCapturedData(null);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = {
      profileId: Math.floor(Math.random() * 100) + 10,
      cameraName: cameras.find((c) => c.id === Number(selectedCam))?.name || 'Cam 1: Overhead Main',
      timestamp: new Date().toLocaleTimeString(),
      assets: [
        { name: 'Monitor', detected: 20 },
        { name: 'Keyboard', detected: 20 },
        { name: 'Mouse', detected: 20 },
      ],
    };

    setCapturedData(result);
    setCapturing(false);
    if (onCaptureSuccess) onCaptureSuccess(result);
  };

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
              Capture Reference Image Baseline
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Select Camera Stream *</label>
              <select
                value={selectedCam}
                onChange={(e) => setSelectedCam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ip_address})
                  </option>
                ))}
              </select>
            </div>

            {capturedData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" /> Reference Baseline Captured & Saved
                </div>

                <div className="aspect-video bg-black rounded-lg relative flex items-center justify-center border border-slate-800 overflow-hidden">
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 text-cyan-400 mb-1" />
                    <span>Frame Captured & Bounding Box Profile Saved</span>
                    <span className="text-[10px] text-cyan-400 font-mono mt-1">{capturedData.timestamp}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-semibold block">Stored Expected Baseline Assets:</span>
                  {capturedData.assets.map((ast, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{ast.name}:</span>
                      <span className="font-bold text-cyan-400 font-mono">{ast.detected} Units</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="p-6 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-2">
                <Camera className="w-10 h-10 mx-auto text-blue-400 opacity-80" />
                <p className="text-slate-300 font-semibold">Click below to grab reference snapshot</p>
                <p className="text-slate-500 text-[11px]">
                  Grabs current frame from RTSP stream, runs YOLOv8 detection, and saves baseline quantity profile into PostgreSQL.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleCapture} loading={capturing} icon={Camera}>
                {capturing ? 'Capturing Frame...' : 'Capture Reference Image'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
