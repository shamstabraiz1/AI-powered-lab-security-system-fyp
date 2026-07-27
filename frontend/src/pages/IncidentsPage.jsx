import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EvidenceModal } from '../components/modals/EvidenceModal';
import { incidentService } from '../services/incidentService';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  FileVideo,
  RefreshCw,
  Edit3,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IncidentsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [newStatus, setNewStatus] = useState('Resolved');
  const [statusComment, setStatusComment] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Fetch Incidents Query
  const { data: incidentsData, isLoading, isRefetching } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => incidentService.getIncidents(),
    refetchInterval: 3000,

  });

  const incidentsList = incidentsData?.results || (Array.isArray(incidentsData) ? incidentsData : []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => incidentService.updateIncidentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-list'] });
      showToast(`Incident status updated to ${newStatus}.`);
      setSelectedIncident(null);
      setStatusComment('');
    },
    onError: () => alert('Failed to update incident status.'),
  });

  const filteredIncidents = incidentsList.filter((inc) => {
    const term = search.toLowerCase();
    const matchSearch =
      (inc.title && inc.title.toLowerCase().includes(term)) ||
      (inc.asset_name && inc.asset_name.toLowerCase().includes(term)) ||
      (inc.camera_name && inc.camera_name.toLowerCase().includes(term)) ||
      (inc.lab_name && inc.lab_name.toLowerCase().includes(term));
    const matchSev = severityFilter ? inc.severity === severityFilter : true;
    const matchStat = statusFilter ? inc.status === statusFilter : true;
    return matchSearch && matchSev && matchStat;
  });

  const totalIncidents = incidentsList.length;
  const criticalIncidents = incidentsList.filter((i) => i.severity === 'CRITICAL').length;
  const resolvedIncidents = incidentsList.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const pendingIncidents = incidentsList.filter((i) => i.status === 'Open' || i.status === 'Under Investigation').length;

  return (
    <PageContainer>
      <PageHeader
        title="Enterprise Incident Management & Audit Log"
        subtitle="Review, audit, investigate, and resolve AI-detected asset discrepancy incidents across all laboratory facilities"
        icon={AlertTriangle}
        actions={
          <Button variant="outline" icon={RefreshCw} onClick={() => queryClient.invalidateQueries({ queryKey: ['incidents-list'] })}>
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-widest font-heading">Total Incidents</span>
          <strong className="text-white font-mono text-xl font-bold mt-1 block">{totalIncidents}</strong>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-widest font-heading">Critical Alerts</span>
          <strong className="text-red-400 font-mono text-xl font-bold mt-1 block">{criticalIncidents}</strong>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-widest font-heading">Pending Investigation</span>
          <strong className="text-amber-400 font-mono text-xl font-bold mt-1 block">{pendingIncidents}</strong>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-widest font-heading">Resolved & Closed</span>
          <strong className="text-emerald-400 font-mono text-xl font-bold mt-1 block">{resolvedIncidents}</strong>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search incident ID, asset, camera, or lab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="False Alarm">False Alarm</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredIncidents.length} Incident(s) Found</span>
      </div>

      {/* Incidents Data Table */}
      <Card title="Recorded Security Incidents" subtitle="AI detection logs with missing asset counts and audit trail">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading incidents from database...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No incidents recorded in database. The system will log incidents automatically when discrepancies are detected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Laboratory & Camera</th>
                  <th className="p-3">Missing Asset</th>
                  <th className="p-3">Exp / Det</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Officer</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">#INC-{inc.id}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{inc.lab_name || 'Lab'}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{inc.camera_name || 'Camera'}</span>
                    </td>
                    <td className="p-3 font-bold text-red-400">
                      {inc.asset_name || 'Asset'} <span className="text-xs font-normal">(-{inc.missing_quantity || 1})</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      {inc.expected_quantity || 0} / <strong className="text-amber-400">{inc.detected_quantity || 0}</strong>
                    </td>
                    <td className="p-3 font-mono text-cyan-400">{((inc.confidence || 0.94) * 100).toFixed(0)}%</td>
                    <td className="p-3">
                      <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : 'warning'} dot>
                        {inc.severity || 'CRITICAL'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={inc.status === 'Resolved' ? 'success' : inc.status === 'Under Investigation' ? 'warning' : 'danger'}>
                        {inc.status || 'Open'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">{inc.assigned_officer || 'Security Staff'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" icon={FileVideo} onClick={() => setSelectedEvidence(inc)}>
                          Evidence
                        </Button>
                        <Button size="sm" variant="ghost" icon={Edit3} onClick={() => setSelectedIncident(inc)}>
                          Workflow
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

      {/* Incident Status Workflow Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-heading">
                  Update Workflow Status: #INC-{selectedIncident.id}
                </h3>
                <button onClick={() => setSelectedIncident(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Select New Workflow Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="False Alarm">False Alarm</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Officer Investigation Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Enter audit investigation notes..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedIncident(null)}>Cancel</Button>
                  <Button onClick={() => updateStatusMutation.mutate({ id: selectedIncident.id, status: newStatus })} loading={updateStatusMutation.isPending}>
                    Save Workflow Status
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EvidenceModal isOpen={!!selectedEvidence} onClose={() => setSelectedEvidence(null)} incident={selectedEvidence} />
    </PageContainer>
  );
};
