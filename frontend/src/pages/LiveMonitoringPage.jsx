import React, { useRef, useEffect } from 'react';
import { Video, Cpu, Activity, ShieldCheck, CheckCircle } from 'lucide-react';
import { WorkstationMap } from '../components/common/WorkstationMap';

export const LiveMonitoringPage = () => {
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);

  useEffect(() => {
    let animationFrame;
    let phase = 0;

    const drawStream = (canvas, boxes) => {
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

      boxes.forEach((box) => {
        const jitterX = Math.sin(phase) * 1.5;
        const jitterY = Math.cos(phase) * 1.5;
        const bx = box.x + jitterX;
        const by = box.y + jitterY;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, box.w, box.h);

        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 20, box.w, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`${box.label} ${(box.conf * 100).toFixed(0)}%`, bx + 4, by - 5);
      });
    };

    const animate = () => {
      phase += 0.05;
      drawStream(canvas1Ref.current, [
        { label: 'Monitor', conf: 0.96, x: 50, y: 40, w: 120, h: 80, color: '#10b981' },
        { label: 'Monitor', conf: 0.94, x: 200, y: 40, w: 120, h: 80, color: '#10b981' },
        { label: 'Keyboard', conf: 0.88, x: 50, y: 150, w: 100, h: 40, color: '#38bdf8' },
        { label: 'Mouse (Missing)', conf: 0.92, x: 350, y: 150, w: 40, h: 40, color: '#ef4444' },
      ]);
      drawStream(canvas2Ref.current, [
        { label: 'Laptop', conf: 0.95, x: 80, y: 60, w: 130, h: 90, color: '#a855f7' },
        { label: 'Chair', conf: 0.89, x: 80, y: 180, w: 80, h: 100, color: '#f59e0b' },
      ]);
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" /> Live AI CCTV Monitoring Operations
          </h2>
          <p className="text-xs text-slate-400">Real-time YOLOv8 bounding box stream analytics and workstation spatial state.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 2 CAMERAS STREAMING (20.0 FPS)
        </span>
      </div>

      {/* Camera Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cam 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="relative aspect-video bg-black">
            <canvas ref={canvas1Ref} width={640} height={360} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-xs">
              <span className="bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded font-semibold text-white">
                Cam 1: Overhead Main (Room 101)
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                ONLINE &bull; 20 FPS
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] text-slate-300">
              <span className="bg-slate-950/80 px-2 py-0.5 rounded">1920x1080 &bull; YOLOv8m</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">AI Active</span>
            </div>
          </div>
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">🖥 Monitor 20</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">⌨ Keyboard 20</span>
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-1 rounded font-bold">🖱 Mouse 19 (1 Missing)</span>
          </div>
        </div>

        {/* Cam 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="relative aspect-video bg-black">
            <canvas ref={canvas2Ref} width={640} height={360} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-xs">
              <span className="bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded font-semibold text-white">
                Cam 2: Desk Array (Room 101)
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                ONLINE &bull; 20 FPS
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] text-slate-300">
              <span className="bg-slate-950/80 px-2 py-0.5 rounded">1920x1080 &bull; YOLOv8m</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">AI Active</span>
            </div>
          </div>
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">💻 Laptop 10</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">💺 Chair 20</span>
          </div>
        </div>
      </div>

      {/* 2D Workstation Map */}
      <WorkstationMap incidents={[{ id: 15, location: 'Workstation PC04', assetName: 'Mouse' }]} />
    </div>
  );
};
