import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EvidenceModal } from '../components/modals/EvidenceModal';
import { cameraService } from '../services/cameraService';
import { sessionService } from '../services/sessionService';
import { incidentService } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import {
  Eye,
  Play,
  Square,
  RefreshCw,
  Activity,
  Shield,
  Cpu,
  AlertTriangle,
  FileVideo,
  Grid2x2,
  Grid3x3,
  CheckCircle,
  User,
  BookOpen,
  Camera as CameraIcon,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';

// Stream component displaying backend MJPEG continuous video stream with YOLO detections
const RealCameraStreamCard = ({ camera, isMonitoring }) => {
  const cardRef = useRef(null);
  const [streamError, setStreamError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  const [isCardFullscreen, setIsCardFullscreen] = useState(false);
  const backendStreamUrl = `/api/cameras/${camera.id}/stream/`;
  const streamUrl = camera.rtsp_url || camera.ip_address;

  useEffect(() => {
    console.log(`[LIVE MONITORING STREAM] Connecting to annotated stream URL: ${backendStreamUrl} for Camera "${camera.name}" (ID: ${camera.id})`);
  }, [backendStreamUrl, camera.id, camera.name]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCardFullscreen(document.fullscreenElement === cardRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleCardFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (!document.fullscreenElement) {
      if (cardRef.current?.requestFullscreen) {
        cardRef.current.requestFullscreen().catch((err) => {
          console.error('Error attempting to enable fullscreen on camera feed:', err);
        });
      } else if (cardRef.current?.webkitRequestFullscreen) {
        cardRef.current.webkitRequestFullscreen();
      } else if (cardRef.current?.msRequestFullscreen) {
        cardRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleStreamLoad = () => {
    setStreamLoading(false);
    console.log(`[LIVE MONITORING STREAM] Stream connected and receiving frames successfully for Camera ID: ${camera.id}`);
  };

  const handleStreamError = (err) => {
    setStreamLoading(false);
    setStreamError(true);
    console.error(`[LIVE MONITORING STREAM] Connection error for Camera ID: ${camera.id} (${camera.name}) at URL: ${backendStreamUrl}`, err);
  };

  return (
    <div
      ref={cardRef}
      className={`bg-black rounded-xl overflow-hidden relative border border-slate-800 shadow-xl group ${
        isCardFullscreen
          ? 'w-screen h-screen flex items-center justify-center z-50 rounded-none border-none'
          : 'aspect-video'
      }`}
    >
      {streamLoading && !streamError && (
        <div className="absolute inset-0 z-10 bg-slate-950/90 flex flex-col items-center justify-center space-y-2 text-center p-4">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-xs text-slate-300 font-semibold font-heading">Connecting to Annotated Stream...</span>
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{backendStreamUrl}</span>
        </div>
      )}

      {!streamError ? (
        <img
          src={backendStreamUrl}
          alt={camera.name}
          onLoad={handleStreamLoad}
          onError={handleStreamError}
          className={`w-full h-full ${isCardFullscreen ? 'object-contain max-h-screen' : 'object-cover'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center space-y-2">
          <CameraIcon className="w-8 h-8 text-red-400 opacity-70" />
          <span className="text-xs text-slate-300 font-bold">{camera.name}</span>
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{streamUrl}</span>
          <span className="text-[10px] text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-lg">
            Unable to receive annotated stream from backend
          </span>
        </div>
      )}

      {/* Camera Header Overlay */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none z-20">
        <div className="bg-slate-950/85 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-white font-bold font-heading flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{camera.name}</span>
          <span className="text-slate-400 font-normal">&bull; {camera.location || 'Location Not Specified'}</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <Badge variant={camera.status === 'Online' ? 'success' : 'slate'} dot>
            {camera.status || 'Offline'}
          </Badge>
          <button
            onClick={toggleCardFullscreen}
            className="p-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer flex items-center justify-center"
            title={isCardFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
            aria-label="Toggle Full Screen"
          >
            {isCardFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Floating Exit Button (Bottom Right) */}
      {isCardFullscreen && (
        <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
          <button
            onClick={toggleCardFullscreen}
            className="px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 shadow-2xl transition cursor-pointer backdrop-blur"
          >
            <Minimize2 className="w-4 h-4 text-cyan-400" />
            <span>Exit Full Screen</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const LiveMonitoringPage = () => {
  const queryClient = useQueryClient();
  const [gridMode, setGridMode] = useState('2x2');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const cameraGridContainerRef = useRef(null);

  // Synchronize grid fullscreen state with browser changes (e.g. Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsGridFullscreen(document.fullscreenElement === cameraGridContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleGridFullscreen = () => {
    if (!document.fullscreenElement) {
      if (cameraGridContainerRef.current?.requestFullscreen) {
        cameraGridContainerRef.current.requestFullscreen().catch((err) => {
          console.error('Error attempting to enable fullscreen on camera feed area:', err);
        });
      } else if (cameraGridContainerRef.current?.webkitRequestFullscreen) {
        cameraGridContainerRef.current.webkitRequestFullscreen();
      } else if (cameraGridContainerRef.current?.msRequestFullscreen) {
        cameraGridContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Queries
  const { data: monitoringData } = useQuery({
    queryKey: ['monitoring-status'],
    queryFn: sessionService.getMonitoringStatus,
    refetchInterval: 5000,
  });

  const { data: camerasData, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras-list'],
    queryFn: () => cameraService.getCameras(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-list'],
    queryFn: () => sessionService.getSessions(),
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => incidentService.getIncidents(),
    refetchInterval: 5000,
  });

  const camerasList = camerasData?.results || (Array.isArray(camerasData) ? camerasData : []);
  const sessionsList = sessionsData?.results || (Array.isArray(sessionsData) ? sessionsData : []);
  const incidentsList = incidentsData?.results || (Array.isArray(incidentsData) ? incidentsData : []);

  const activeSession = sessionsList.find((s) => s.status === 'Active' || s.status === 'Paused');
  const isMonitoring = monitoringData?.is_running ?? false;

  // Mutations
  const startMutation = useMutation({
    mutationFn: sessionService.startMonitoring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-status'] }),
  });

  const stopMutation = useMutation({
    mutationFn: sessionService.stopMonitoring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-status'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => incidentService.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-list'] });
    },
  });

  const handleDeleteIncident = (incidentId) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      deleteMutation.mutate(incidentId);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Security Operations Center (SOC) Live Monitoring"
        subtitle="Real-time lab camera stream monitoring and AI discrepancy telemetry"
        icon={Eye}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => setGridMode('2x2')}
                className={`p-1.5 rounded transition ${gridMode === '2x2' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="2x2 Grid"
              >
                <Grid2x2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridMode('3x3')}
                className={`p-1.5 rounded transition ${gridMode === '3x3' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="3x3 Grid"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="outline"
              icon={isGridFullscreen ? Minimize2 : Maximize2}
              onClick={toggleGridFullscreen}
              title={isGridFullscreen ? 'Exit Full Screen' : 'Full Screen Camera Feed'}
            >
              {isGridFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            </Button>
            {isMonitoring ? (
              <Button variant="danger" icon={Square} loading={stopMutation.isPending} onClick={() => stopMutation.mutate()}>
                Stop Monitoring
              </Button>
            ) : (
              <Button variant="primary" icon={Play} loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
                Start Monitoring
              </Button>
            )}
          </div>
        }
      />

      {/* SOC Session Banner */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-heading">Active Facility</span>
            <strong className="text-white font-heading text-sm">{activeSession?.lab_details?.name || 'No Active Facility'}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-heading">Lab Instructor</span>
            <strong className="text-white font-heading text-sm">{activeSession?.instructor_name || 'Not Specified'}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-heading">Course Topic</span>
            <strong className="text-white font-heading text-sm">{activeSession?.session_topic || 'No Active Topic'}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-heading">Engine Status</span>
            <Badge variant={isMonitoring ? 'success' : 'slate'} dot>
              {isMonitoring ? 'SCHEDULER RUNNING' : 'STANDBY'}
            </Badge>
          </div>
        </div>
      </div>

      {/* ONLY The Camera Feed / Video Area Container */}
      <div
        ref={cameraGridContainerRef}
        className={isGridFullscreen ? 'bg-black p-4 h-screen w-screen overflow-y-auto flex flex-col justify-center relative z-50' : ''}
      >
        {isGridFullscreen && (
          <div className="absolute top-4 right-4 z-40">
            <button
              onClick={toggleGridFullscreen}
              className="px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 shadow-2xl transition cursor-pointer backdrop-blur"
            >
              <Minimize2 className="w-4 h-4 text-cyan-400" />
              <span>Exit Full Screen</span>
            </button>
          </div>
        )}

        {camerasLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading camera stream instances from database...</div>
        ) : camerasList.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
            No cameras configured in database. Add IP cameras in the IP Cameras module to view live streams.
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridMode === '2x2' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 ${isGridFullscreen ? 'w-full max-h-full' : ''}`}>
            {camerasList.map((cam) => (
              <RealCameraStreamCard key={cam.id} camera={cam} isMonitoring={isMonitoring} />
            ))}
          </div>
        )}
      </div>

      {/* Incidents Log Table */}
      <Card title="Security Operations Incidents Log" subtitle="Recorded asset discrepancies and evidence captures from backend">
        {incidentsList.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No incidents recorded. The system will log incidents when discrepancies occur.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Camera</th>
                  <th className="p-3">Missing Asset</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidentsList.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">#INC-{inc.id}</td>
                    <td className="p-3 font-bold text-cyan-400">{inc.camera_name || 'Camera'}</td>
                    <td className="p-3 text-red-400 font-bold">
                      {inc.asset_name || 'Asset'} (Missing: {inc.missing_quantity || 1})
                    </td>
                    <td className="p-3">
                      <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : 'warning'} dot>
                        {inc.severity || 'CRITICAL'}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{new Date(inc.created_at || Date.now()).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" icon={FileVideo} onClick={() => setSelectedEvidence(inc)}>
                          View Evidence
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDeleteIncident(inc.id)}
                          loading={deleteMutation.isPending && deleteMutation.variables === inc.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EvidenceModal isOpen={!!selectedEvidence} onClose={() => setSelectedEvidence(null)} incident={selectedEvidence} />
    </PageContainer>
  );
};
