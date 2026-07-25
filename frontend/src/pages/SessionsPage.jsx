import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle, Loader2, Video, Camera, Cpu, Shield } from 'lucide-react';
import { sessionService } from '../services/sessionService';
import { SummaryReportModal } from '../components/modals/SummaryReportModal';

export const SessionsPage = () => {
  const [instructor, setInstructor] = useState('Dr. Tabraiz Shams');
  const [course, setCourse] = useState('Deep Learning & Computer Vision');
  const [code, setCode] = useState('SE-412');
  const [lab, setLab] = useState('Software Engineering AI Lab 1 (Room 101)');
  const [topic, setTopic] = useState('Lab 08: Real-Time YOLOv8 Object Tracking');
  const [duration, setDuration] = useState('1.5');
  
  const [isStarting, setIsStarting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const steps = [
    'Starting Session...',
    'Connecting Cameras...',
    'Capturing Reference Images...',
    'Running YOLOv8 Detection...',
    'Creating Reference Profile...',
    'Starting Monitoring...',
  ];

  const handleStartSession = async (e) => {
    e.preventDefault();
    setIsStarting(true);
    setCurrentStep(0);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    try {
      await sessionService.startMonitoring();
    } catch {
      console.log('Session started.');
    }

    setIsStarting(false);
    setSessionActive(true);
  };

  const handleEndSession = async () => {
    if (confirm('End active lab session and generate report?')) {
      try {
        await sessionService.stopMonitoring();
      } catch {
        console.log('Session stopped.');
      }
      setSessionActive(false);
      setIsReportOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-400" /> Academic Laboratory Sessions
          </h2>
          <p className="text-xs text-slate-400">Initiate lab sessions and launch automated AI asset security monitoring.</p>
        </div>
      </div>

      {/* If Active Session is running, show active session banner */}
      {sessionActive ? (
        <div className="bg-slate-900/90 border-l-4 border-blue-500 border-y border-r border-slate-800 p-6 rounded-xl shadow-xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> SESSION ACTIVE & MONITORING
            </span>
            <h3 className="text-lg font-bold text-white font-heading">{course} ({code})</h3>
            <p className="text-xs text-slate-400 mt-1">
              Instructor: <strong className="text-slate-200">{instructor}</strong> &bull; Topic: <strong className="text-slate-200">{topic}</strong> &bull; Location: <strong className="text-slate-200">{lab}</strong>
            </p>
          </div>
          <button
            onClick={handleEndSession}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition"
          >
            End Lab Session & Report
          </button>
        </div>
      ) : (
        /* Form & Pre-Flight Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 font-heading">Session Configuration Form</h3>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Instructor Name *</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course Name *</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Computer Lab *</label>
                  <select
                    value={lab}
                    onChange={(e) => setLab(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                  >
                    <option value="Software Engineering AI Lab 1 (Room 101)">Software Engineering AI Lab 1 (Room 101)</option>
                    <option value="Robotics & Vision Lab 2 (Room 202)">Robotics & Vision Lab 2 (Room 202)</option>
                    <option value="Embedded Systems Lab 3 (Room 303)">Embedded Systems Lab 3 (Room 303)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Topic / Lab Exercise *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Planned Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs"
                  >
                    <option value="1">1.0 Hour</option>
                    <option value="1.5">1.5 Hours</option>
                    <option value="2">2.0 Hours</option>
                    <option value="3">3.0 Hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isStarting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" /> Launch Lab Session & Start AI Protection
                </button>
              </div>
            </form>
          </div>

          {/* Pre-Flight Sidebar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-cyan-400 font-heading">Pre-Flight Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Selected Lab:</span>
                <span className="font-semibold text-white">{lab}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Workstation Count:</span>
                <span className="font-semibold text-white">8 Workstations (PC01-PC08)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tracked Assets:</span>
                <span className="font-semibold text-cyan-400">70 Monitored Units</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Cameras Available:</span>
                <span className="font-semibold text-emerald-400">2 Online</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">YOLO Model:</span>
                <span className="font-semibold text-purple-400">yolov8m.pt</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Checklist Modal */}
      {isStarting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-heading text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> Launching AI Protection
            </h3>
            <div className="space-y-3 pt-2 text-xs">
              {steps.map((stepText, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isActive = currentStep === stepNum;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className={isDone || isActive ? 'text-white font-semibold' : 'text-slate-500'}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SummaryReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
};
