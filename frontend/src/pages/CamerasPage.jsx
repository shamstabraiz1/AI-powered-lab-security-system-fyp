import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CameraModal } from '../components/modals/CameraModal';
import { CameraPreviewModal } from '../components/modals/CameraPreviewModal';
import { cameraService } from '../services/cameraService';
import { labService } from '../services/labService';
import {
  Camera,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CamerasPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [previewCamera, setPreviewCamera] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [serverError, setServerError] = useState('');

  // 1. Fetch Cameras Query
  const { data: camerasData, isLoading, isRefetching } = useQuery({
    queryKey: ['cameras-list'],
    queryFn: () => cameraService.getCameras(),
  });

  // 2. Fetch Labs Query
  const { data: labsData } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const camerasList = camerasData?.results || (Array.isArray(camerasData) ? camerasData : []);
  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: (values) => cameraService.createCamera(values),
    onSuccess: (newCam) => {
      console.log('[CAMERAS PAGE] Created Camera Success:', newCam);
      queryClient.invalidateQueries({ queryKey: ['cameras-list'] });
      showToast(`Camera "${newCam.name}" added successfully!`);
      setIsModalOpen(false);
      setServerError('');
    },
    onError: (err) => {
      console.error('[CAMERAS PAGE] Create Camera Error:', err);
      const apiErr = err.response?.data;
      setServerError(
        typeof apiErr === 'string'
          ? apiErr
          : apiErr?.name?.[0] || apiErr?.ip_address?.[0] || apiErr?.rtsp_url?.[0] || apiErr?.detail || 'Failed to create camera.'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => cameraService.updateCamera(id, data),
    onSuccess: (updatedCam) => {
      console.log('[CAMERAS PAGE] Updated Camera Success:', updatedCam);
      queryClient.invalidateQueries({ queryKey: ['cameras-list'] });
      showToast(`Camera "${updatedCam.name}" updated successfully!`);
      setIsModalOpen(false);
      setServerError('');
    },
    onError: (err) => {
      console.error('[CAMERAS PAGE] Update Camera Error:', err);
      const apiErr = err.response?.data;
      setServerError(
        typeof apiErr === 'string'
          ? apiErr
          : apiErr?.name?.[0] || apiErr?.detail || 'Failed to update camera.'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cameraService.deleteCamera(id),
    onSuccess: () => {
      console.log('[CAMERAS PAGE] Deleted Camera Success');
      queryClient.invalidateQueries({ queryKey: ['cameras-list'] });
      showToast('Camera deleted successfully.');
    },
    onError: (err) => {
      console.error('[CAMERAS PAGE] Delete Camera Error:', err);
      alert('Failed to delete camera.');
    },
  });

  const filteredCameras = camerasList.filter((c) => {
    const term = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(term) ||
      (c.ip_address && c.ip_address.toLowerCase().includes(term)) ||
      (c.location && c.location.toLowerCase().includes(term)) ||
      c.lab_details?.name?.toLowerCase().includes(term);
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingCamera(null);
    setServerError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cam) => {
    setEditingCamera(cam);
    setServerError('');
    setIsModalOpen(true);
  };

  const handleDelete = (cam) => {
    if (confirm(`Are you sure you want to delete camera "${cam.name}"?`)) {
      deleteMutation.mutate(cam.id);
    }
  };

  const handleSubmitCamera = (values) => {
    if (editingCamera) {
      updateMutation.mutate({ id: editingCamera.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="IP CCTV Camera Management Infrastructure"
        subtitle="Configure IP cameras, RTSP/HTTP/MJPEG video streams, position locations, and live diagnostic previews"

        icon={Camera}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => queryClient.invalidateQueries({ queryKey: ['cameras-list'] })}>
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={handleOpenCreate}>
              Add IP Camera
            </Button>
          </div>
        }
      />

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search camera name, IP address, or laboratory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
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

      {/* Loading & Empty States */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading cameras infrastructure...</div>
      ) : filteredCameras.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
          No cameras found. Click "Add IP Camera" to configure a camera stream.
        </div>
      ) : (
        /* Camera Data Table */
        <Card title="Configured Cameras List" subtitle="RTSP video stream sources and spatial positions">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Camera Name</th>
                  <th className="p-3">Laboratory</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">FPS / Res</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white font-heading">{cam.name}</td>
                    <td className="p-3 font-semibold text-cyan-400">{cam.lab_details?.name || 'Software Lab'}</td>
                    <td className="p-3 text-slate-300">{cam.location || 'Overhead Ceiling'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">{cam.ip_address || '192.168.1.100'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{cam.fps || 20} FPS ({cam.resolution || '1080p'})</td>
                    <td className="p-3">
                      <Badge variant={cam.status === 'Online' ? 'success' : 'danger'} dot>
                        {cam.status || 'Online'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewCamera(cam)}>
                          Preview
                        </Button>
                        <Button size="sm" variant="ghost" icon={Edit3} onClick={() => handleOpenEdit(cam)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(cam)} className="text-red-400 hover:text-red-300">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCamera}
        initialData={editingCamera}
        labs={labsList}
        isLoading={createMutation.isPending || updateMutation.isPending}
        serverError={serverError}
      />

      <CameraPreviewModal
        isOpen={!!previewCamera}
        onClose={() => setPreviewCamera(null)}
        camera={previewCamera}
      />
    </PageContainer>
  );
};
