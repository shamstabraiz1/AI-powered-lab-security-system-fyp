import React from 'react';
import { X, Download, Image as ImageIcon, Video, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';

export const EvidenceModal = ({ isOpen, onClose, incident }) => {
  if (!isOpen || !incident) return null;

  const imageUrl = evidenceService.getEvidenceImageUrl(incident.id || 15);
  const videoUrl = evidenceService.getEvidenceVideoUrl(incident.id || 15);
  const downloadUrl = evidenceService.getEvidenceDownloadUrl(incident.id || 15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" /> Security Incident Evidence Inspector
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split View: Left Image + Right Video */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
          {/* Left Screenshot */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Captured Detection Frame
            </span>
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800">
              <img
                src={imageUrl}
                alt="Evidence Frame"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <span className="absolute bottom-2 left-2 bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                MOUSE MISSING ALERT (92%)
              </span>
            </div>
          </div>

          {/* Right Video Player */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
              <Video className="w-3.5 h-3.5" /> Video Evidence Recording
            </span>
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative flex flex-col items-center justify-center border border-slate-800 text-slate-400">
              <Video className="w-12 h-12 text-blue-400 mb-2 opacity-80" />
              <span className="text-xs font-medium">MP4 Evidence Recording (20 Seconds)</span>
              <span className="text-[10px] text-slate-500 mt-1 bg-slate-800 px-2 py-0.5 rounded">
                10s Pre-Event Buffer + 10s Post-Event
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Details Card */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs space-y-2 mb-6">
          <h4 className="text-sm font-bold text-white mb-2">
            Incident #{incident.id} - {incident.assetName || 'Mouse'} Missing Alert
          </h4>
          <p className="text-slate-400">
            Discrepancy confirmed at Workstation PC04 in Software Engineering AI Lab 1. 3-cycle consecutive verification window satisfied.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-slate-300">
            <div><strong>Camera:</strong> {incident.cameraName || 'Cam 1: Overhead Main'}</div>
            <div><strong>Laboratory:</strong> SE AI Lab 1 (Room 101)</div>
            <div><strong>Detection Confidence:</strong> <span className="text-emerald-400 font-bold">92.0%</span></div>
            <div><strong>Verification Result:</strong> <span className="text-emerald-400 font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 3/3 Cycles Verified</span></div>
            <div><strong>Recorded At:</strong> {incident.time || '17:35:12'}</div>
            <div><strong>Status:</strong> <span className="text-amber-400 font-bold">Open</span></div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
          >
            <ImageIcon className="w-4 h-4" /> Download Screenshot
          </a>
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
          >
            <Video className="w-4 h-4" /> Download Video MP4
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
          >
            <Download className="w-4 h-4" /> Complete Evidence Package
          </a>
        </div>
      </div>
    </div>
  );
};
