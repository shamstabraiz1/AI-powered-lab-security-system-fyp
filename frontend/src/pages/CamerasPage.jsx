import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CameraModal } from '../components/modals/CameraModal';
import { CameraPreviewModal } from '../components/modals/CameraPreviewModal';
import { cameraService } from '../services/cameraService';
import { labService } from '../services/labService';
import { Camera, Plus, Search, Edit3, Eye, Wifi, Video, ShieldCheck, Activity } from 'lucide-react';

export const CamerasPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [previewCamera, setPreviewCamera] = useState(null);

  const { data: camerasData } = useQuery({
    queryKey: ['cameras-list'],
    queryFn: cameraService.getCameras,
  });

  const { data: labsData } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const cameras = camerasData?.results || [
    {
      id: 1,
      name: 'Cam 1: Overhead Main',
      camera_type: 'IP Overhead Camera',
      ip_address: 'rtsp://192.168.1.100:554/stream1',
      lab_details: { name: 'Software Engineering AI Lab 1' },
      location: 'Overhead Ceiling View',
      resolution: '1920x1080',
      fps: 20,
      status: 'Online',
      is_active: true,
    },
    {
      id: 2,
      name: 'Cam 2: Desk Array',
      camera_type: 'Desk Array Dome Cam',
      ip_address: 'rtsp://192.168.1.101:554/stream1',
      lab_details: { name: 'Software Engineering AI Lab 1' },
      location: 'Workstation Desk Array',
      resolution: '1920x1080',
      fps: 20,
      status: 'Online',
      is_active: true,
    },
  ];

  const filteredCameras = cameras.filter((c) => {
    const term = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(term) ||
      c.ip_address.toLowerCase().includes(term) ||
      c.lab_details?.name?.toLowerCase().includes(term);
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingCamera(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cam) => {
    setEditingCamera(cam);
    setIsModalOpen(true);
  };

  const handleSubmitCamera = (values) => {
    console.log('Submitted Camera values:', values);
    setIsModalOpen(false);
    queryClient.invalidateQueries(['cameras-list']);
  };

  return (
    <PageContainer>
      <PageHeader
        title="IP CCTV Camera Infrastructure Management"
        subtitle="Manage IP cameras, RTSP streams, YOLOv8 vision inputs, and live stream connectivity"
        icon={Camera}
        actions={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Add IP Camera
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search camera name or RTSP URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
          >
            <option value="">All Statuses</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Connecting">Connecting</option>
            <option value="Error">Error</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredCameras.length} Camera(s) Configured</span>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCameras.map((cam) => (
          <Card
            key={cam.id}
            title={cam.name}
            subtitle={cam.lab_details?.name || 'Software Engineering Lab'}
            action={
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewCamera(cam)}>
                  Preview Stream
                </Button>
                <Button size="sm" variant="ghost" icon={Edit3} onClick={() => handleOpenEdit(cam)}>
                  Edit
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400 truncate max-w-[200px]">{cam.ip_address}</span>
                <Badge variant={cam.status === 'Online' ? 'success' : 'danger'} dot>
                  {cam.status || 'Online'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Type: <strong className="text-slate-200">{cam.camera_type}</strong></div>
                <div>Position: <strong className="text-slate-200">{cam.location}</strong></div>
                <div>Resolution: <strong className="text-cyan-400 font-mono">{cam.resolution}</strong></div>
                <div>FPS: <strong className="text-emerald-400 font-mono">{cam.fps} FPS</strong></div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">
                  RTSP Connectivity Status: <strong className="text-emerald-400 font-bold">14ms Latency</strong>
                </span>
                <Button size="sm" variant="secondary" icon={Wifi} onClick={() => setPreviewCamera(cam)}>
                  Test Connection
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCamera}
        initialData={editingCamera}
        labs={labsData?.results || []}
      />

      <CameraPreviewModal
        isOpen={!!previewCamera}
        onClose={() => setPreviewCamera(null)}
        camera={previewCamera}
      />
    </PageContainer>
  );
};
