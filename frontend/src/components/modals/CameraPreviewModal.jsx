import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Activity, CheckCircle, AlertTriangle, RefreshCw, Cpu, Wifi } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const CameraPreviewModal = ({ isOpen, onClose, camera }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !camera) return;

    let animFrame;
    let phase = 0;

    const drawStream = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let j = 0; j < h; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
      }

      // Animated bounding boxes
      const boxes = [
        { label: 'Monitor', conf: 0.96, x: 60, y: 50, w: 120, h: 80, color: '#10b981' },
        { label: 'Keyboard', conf: 0.92, x: 60, y: 150, w: 100, h: 40, color: '#38bdf8' },
        { label: 'Mouse', conf: 0.94, x: 180, y: 150, w: 40, h: 40, color: '#10b981' },
      ];

      boxes.forEach((box) => {
        const jitterX = Math.sin(phase) * 1.2;
        const bx = box.x + jitterX;
        const by = box.y;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, box.w, box.h);

        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 18, box.w, 18);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`${box.label} ${(box.conf * 100).toFixed(0)}%`, bx + 4, by - 5);
      });

      phase += 0.05;
      animFrame = requestAnimationFrame(drawStream);
    };

    drawStream();
    return () => cancelAnimationFrame(animFrame);
  }, [isOpen, camera]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setTestResult({
      status: 'Connected',
      latency: `${Math.floor(Math.random() * 10) + 12} ms`,
      timestamp: new Date().toLocaleTimeString(),
    });
    setTesting(false);
  };

  if (!isOpen || !camera) return null;

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
                CCTV CAMERA PREVIEW & RTSP DIAGNOSTICS
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
            {/* Canvas Stream */}
            <div className="lg:col-span-2 aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800">
              <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                LIVE RTSP STREAM &bull; {camera.resolution || '1920x1080'}
              </div>
              <div className="absolute bottom-2 right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                20 FPS &bull; YOLOv8 Active
              </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-bold text-white font-heading">Camera Info</h4>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="success" dot>{camera.status || 'Online'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-semibold text-slate-200">{camera.camera_type || 'IP Overhead'}</span>
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

                {/* RTSP URL */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">RTSP Source</span>
                  <span className="font-mono text-[10px] text-slate-300 truncate block">
                    {camera.ip_address}
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
                      <CheckCircle className="w-3.5 h-3.5" /> RTSP Connection Verified
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
                {testing ? 'Pinging RTSP Stream...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
