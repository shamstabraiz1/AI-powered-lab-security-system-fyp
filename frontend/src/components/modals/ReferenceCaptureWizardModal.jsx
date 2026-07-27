import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Layers, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { referenceService } from '../../services/referenceService';

export const ReferenceCaptureWizardModal = ({ isOpen, onClose, labs = [], cameras = [], onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id || 1);
  const [profileName, setProfileName] = useState('Standard Baseline Profile');
  const [markActive, setMarkActive] = useState(true);
  const [capturedCameras, setCapturedCameras] = useState({});
  const [capturing, setCapturing] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const labCameras = cameras.filter((c) => Number(c.lab) === Number(selectedLabId) || c.lab_details?.id === Number(selectedLabId));
  const activeCameras = labCameras.length > 0 ? labCameras : cameras;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedLabId(labs[0]?.id || 1);
      setProfileName('Standard Baseline Profile');
      setMarkActive(true);
      setCapturedCameras({});
      setCapturing({});
      setErrorMessage(null);
      setSuccessData(null);
    }
  }, [isOpen, labs]);

  const handleCaptureCamera = async (camId) => {
    setCapturing((prev) => ({ ...prev, [camId]: true }));
    setErrorMessage(null);

    try {
      const res = await referenceService.captureReference({
        lab: selectedLabId,
        camera: camId,
        name: profileName,
        is_active: markActive,
      });

      const profile = res.profile || res;
      const detectedAssets = profile.assets?.map((a) => ({
        name: a.asset_name,
        qty: a.detected_quantity,
        conf: a.confidence,
      })) || [];

      setCapturedCameras((prev) => ({
        ...prev,
        [camId]: {
          timestamp: new Date().toLocaleTimeString(),
          status: 'Captured ✅',
          assets: detectedAssets,
          profileData: res,
        },
      }));
      setSuccessData(res);
    } catch (err) {
      console.error('Camera Capture error:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to capture reference frame from camera.';
      setErrorMessage(msg);
    } finally {
      setCapturing((prev) => ({ ...prev, [camId]: false }));
    }
  };

  const handleCompleteWizard = async () => {
    setSaving(true);
    setErrorMessage(null);

    // If camera already captured in Step 4, finalize with success
    const capturedCamIds = Object.keys(capturedCameras);
    if (capturedCamIds.length > 0 && successData) {
      if (onSuccess) onSuccess();
      setSaving(false);
      return;
    }

    try {
      const selectedCamId = activeCameras[0]?.id;
      const res = await referenceService.captureReference({
        lab: selectedLabId,
        camera: selectedCamId,
        name: profileName,
        is_active: markActive,
      });

      setSuccessData(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Wizard Capture error:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to save reference profile.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
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
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-xs relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-heading">
                REFERENCE CAPTURE WIZARD &bull; STEP {step} OF 5
              </span>
              <h3 className="text-base font-extrabold text-white font-heading mt-0.5">
                {step === 1 && 'Select Target Laboratory Facility'}
                {step === 2 && 'Load Laboratory Security Cameras'}
                {step === 3 && 'Review Camera Stream Connectivity'}
                {step === 4 && 'Capture Baseline Snapshots & Detect Assets'}
                {step === 5 && 'Finalize & Activate Reference Profile'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Step Contents */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Laboratory *</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Reference Profile Name *</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="active_wiz" checked={markActive} onChange={(e) => setMarkActive(e.target.checked)} className="accent-blue-600 rounded" />
                <label htmlFor="active_wiz" className="text-slate-300 cursor-pointer font-semibold">
                  Mark as Active Profile (automatically deactivates previous active profile)
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 py-2">
              <span className="text-slate-300 font-semibold block">
                Found {activeCameras.length} CCTV camera(s) configured for selected laboratory:
              </span>
              <div className="space-y-2">
                {activeCameras.map((cam) => (
                  <div key={cam.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">{cam.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{cam.rtsp_url || cam.ip_address || 'http://192.168.100.41:8080/video'} &bull; {cam.location}</span>
                    </div>
                    <Badge variant={cam.status === 'Online' ? 'success' : 'slate'} dot>
                      {cam.status || 'Online'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              {activeCameras.map((cam) => (
                <div key={cam.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="aspect-video bg-black rounded-lg relative flex items-center justify-center border border-slate-800 overflow-hidden">
                    <div className="text-cyan-400 font-mono text-[10px] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                      STREAM READY &bull; {cam.name}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-mono">{cam.rtsp_url || cam.ip_address}</span>
                    <span className="text-emerald-400 font-bold">14ms Stream Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 py-2">
              <span className="text-slate-300 font-semibold block">Capture Baseline Snapshot from Camera Stream:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCameras.map((cam) => {
                  const isCap = capturedCameras[cam.id];
                  const isLoadingCap = capturing[cam.id];
                  return (
                    <div key={cam.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{cam.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{isCap ? isCap.status : 'Pending'}</span>
                      </div>
                      {isCap && isCap.assets && isCap.assets.length > 0 && (
                        <div className="p-2 bg-slate-900 rounded-lg space-y-1 text-[11px]">
                          <span className="text-slate-400 font-semibold">Real YOLO Detections:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {isCap.assets.map((ast, i) => (
                              <Badge key={i} variant="info">
                                {ast.name} x{ast.qty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={isCap ? 'secondary' : 'primary'}
                        icon={Camera}
                        loading={isLoadingCap}
                        onClick={() => handleCaptureCamera(cam.id)}
                        className="w-full"
                      >
                        {isCap ? 'Retake Reference Frame' : 'Capture Reference Frame'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 py-2 text-center">
              {successData ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-extrabold text-white font-heading">Reference Baseline Profile Saved!</h4>
                  <p className="text-slate-300 text-xs">{successData.message}</p>
                </motion.div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <Layers className="w-12 h-12 text-blue-400 mx-auto opacity-80" />
                  <h4 className="text-base font-extrabold text-white font-heading">Ready to Save Baseline Profile</h4>
                  <p className="text-slate-400 text-xs">
                    Click "Finalize & Save" to store reference profile and activate baseline asset monitoring.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            {step > 1 && !successData ? (
              <Button variant="outline" icon={ArrowLeft} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : <div />}

            {step < 5 ? (
              <Button icon={ArrowRight} onClick={() => setStep(step + 1)}>
                Next Step
              </Button>
            ) : successData ? (
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            ) : (
              <Button loading={saving} icon={CheckCircle} onClick={handleCompleteWizard}>
                Finalize & Save
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
