import React, { useState } from 'react';
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
} from 'lucide-react';

// Stream component displaying backend MJPEG continuous video stream with YOLO detections
const RealCameraStreamCard = ({ camera, isMonitoring }) => {
  const [streamError, setStreamError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  const backendStreamUrl = `/api/cameras/${camera.id}/stream/`;
  const streamUrl = camera.rtsp_url || camera.ip_address;

  React.useEffect(() => {
    console.log(`[LIVE MONITORING STREAM] Connecting to annotated stream URL: ${backendStreamUrl} for Camera "${camera.name}" (ID: ${camera.id})`);
  }, [backendStreamUrl, camera.id, camera.name]);

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
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800 shadow-xl group">
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
          className="w-full h-full object-cover"
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
        <div className="bg-slate-950/85 backdrop-blur px-2 py-1 rounded-lg border border-slate-800 text-[10px] text-white font-bold font-heading">
          {camera.name} &bull; <span className="text-slate-400 font-normal">{camera.location || 'Location Not Specified'}</span>
        </div>
        <Badge variant={camera.status === 'Online' ? 'success' : 'slate'} dot>
          {camera.status || 'Offline'}
        </Badge>
      </div>
    </div>
  );
};



export const LiveMonitoringPage = () => {
  const queryClient = useQueryClient();
  const [gridMode, setGridMode] = useState('2x2');
  const [selectedEvidence, setSelectedEvidence] = useState(null);

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
              >
                <Grid2x2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridMode('3x3')}
                className={`p-1.5 rounded transition ${gridMode === '3x3' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
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

      {/* Multi-Camera Stream Grid */}
      {camerasLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading camera stream instances from database...</div>
      ) : camerasList.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
          No cameras configured in database. Add IP cameras in the IP Cameras module to view live streams.
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${gridMode === '2x2' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
          {camerasList.map((cam) => (
            <RealCameraStreamCard key={cam.id} camera={cam} isMonitoring={isMonitoring} />
          ))}
        </div>
      )}

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
                  <th className="p-3">Action</th>
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
                      <Button size="sm" variant="outline" icon={FileVideo} onClick={() => setSelectedEvidence(inc)}>
                        View Evidence
                      </Button>
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
