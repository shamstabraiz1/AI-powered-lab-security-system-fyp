import React from 'react';
import { X, Video, Image as ImageIcon, Download, Camera, FileVideo, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EvidenceModal = ({ isOpen, onClose, incident }) => {
  if (!isOpen || !incident) return null;

  const assetName = incident.assetName || incident.asset_name || incident.asset_details?.name || 'Asset';
  const labName = incident.labName || incident.lab_name || incident.lab_details?.name || 'Laboratory';
  const cameraName = incident.cameraName || incident.camera_name || incident.camera_details?.name || 'Camera Stream';
  const missingQty = incident.missing || incident.missing_quantity || (incident.expected_quantity && incident.detected_quantity ? incident.expected_quantity - incident.detected_quantity : 1);
  const confidence = incident.confidence || 0.95;

  const rawImage = incident.image || incident.evidence_details?.image || incident.evidence?.image || incident.incident_details?.evidence_details?.image;
  const rawVideo = incident.video || incident.evidence_details?.video || incident.evidence?.video || incident.incident_details?.evidence_details?.video;

  const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : rawImage.startsWith('/') ? rawImage : `/${rawImage}`) : null;
  const videoUrl = rawVideo ? (rawVideo.startsWith('http') ? rawVideo : rawVideo.startsWith('/') ? rawVideo : `/${rawVideo}`) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 text-xs relative overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-heading">
                SECURITY INCIDENT EVIDENCE INSPECTOR
              </span>
              <h3 className="text-lg font-extrabold text-white font-heading mt-0.5">
                Incident #{incident.id} - {assetName} Discrepancy
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Location: <strong className="text-slate-200">{labName}</strong> &bull; Camera: <strong className="text-slate-200">{cameraName}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Split View Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Frame Snapshot */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 font-heading">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Captured Bounding Box Frame
              </span>
              <div className="aspect-video bg-black rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-800">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Evidence Snapshot for Incident #${incident.id}`}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <Camera className="w-10 h-10 mb-2 text-blue-400/80" />
                    <span>YOLOv8 Detection Frame Snapshot</span>
                    <span className="text-[10px] text-cyan-400 mt-1 font-mono">Confidence: {(confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Recorded MP4 Video or Explicit Notice */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 font-heading">
                <Video className="w-4 h-4 text-purple-400" /> Recorded Video Evidence
              </span>
              <div className="aspect-video bg-black rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-800">
                {videoUrl ? (
                  <video
                    controls
                    autoPlay={false}
                    className="w-full h-full object-contain bg-slate-950 rounded-xl"
                    src={videoUrl}
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                ) : (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-slate-800/80 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-amber-400/80" />
                    <span className="text-slate-200 font-bold text-xs font-heading">Video Evidence Not Available</span>
                    <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs">
                      A still frame snapshot was recorded for this incident, but no video clip package is attached.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Verified Missing: <strong className="text-red-400 font-bold">-{missingQty} Unit(s)</strong>
            </span>
            <div className="flex gap-3">
              <a
                href={`/api/evidence/${incident.id}/download/`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Evidence Package
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
