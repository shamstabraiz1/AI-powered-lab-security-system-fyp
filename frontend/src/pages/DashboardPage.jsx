import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { MonitoringStatusPanel } from '../components/dashboard/MonitoringStatusPanel';
import { SystemHealthPanel } from '../components/dashboard/SystemHealthPanel';
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts';
import { RecentIncidentsTable } from '../components/dashboard/RecentIncidentsTable';
import { LiveNotificationsPanel } from '../components/dashboard/LiveNotificationsPanel';
import { RecentEvidencePanel } from '../components/dashboard/RecentEvidencePanel';
import { LabStatusPanel } from '../components/dashboard/LabStatusPanel';

import { dashboardService } from '../services/dashboardService';
import { sessionService } from '../services/sessionService';
import { incidentService } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import { evidenceService } from '../services/evidenceService';
import { labService } from '../services/labService';

import {
  LayoutDashboard,
  FlaskConical,
  Camera,
  Eye,
  Activity,
  AlertTriangle,
  FileVideo,
  Bell,
  CheckCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DashboardPage = () => {
  // Query 1: Dashboard Stats (auto-refresh 30s)
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getDashboardStats,
    refetchInterval: 30000,
  });

  // Query 2: Monitoring & Scheduler Status (auto-refresh 15s)
  const { data: monitoringData } = useQuery({
    queryKey: ['monitoring-status'],
    queryFn: sessionService.getMonitoringStatus,
    refetchInterval: 15000,
  });

  // Query 3: Incidents (auto-refresh 30s)
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => incidentService.getIncidents(),
    refetchInterval: 30000,
  });

  // Query 4: Notifications (auto-refresh 15s)
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 15000,
  });

  // Query 5: Evidence List (auto-refresh 30s)
  const { data: evidenceData } = useQuery({
    queryKey: ['evidence-list'],
    queryFn: evidenceService.getEvidenceList,
    refetchInterval: 30000,
  });

  // Query 6: Labs List (auto-refresh 30s)
  const { data: labsData } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
    refetchInterval: 30000,
  });

  // Query 7: Sessions List
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-list'],
    queryFn: () => sessionService.getSessions(),
    refetchInterval: 30000,
  });

  const incidentsList = incidentsData?.results || (Array.isArray(incidentsData) ? incidentsData : []);
  const notificationsList = notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);
  const evidenceList = evidenceData?.results || (Array.isArray(evidenceData) ? evidenceData : []);
  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);
  const sessionsList = sessionsData?.results || (Array.isArray(sessionsData) ? sessionsData : []);

  // Real Stats Extraction from Django Backend
  const totalLabs = dashData?.total_labs ?? labsList.length;
  const totalCameras = (dashData?.online_cameras ?? 0) + (dashData?.offline_cameras ?? 0);
  const activeCameras = dashData?.online_cameras ?? 0;
  const activeSessions = sessionsList.filter((s) => s.status === 'Active').length;
  const activeSessionName = sessionsList.find((s) => s.status === 'Active')?.lab_details?.name || (activeSessions > 0 ? 'Active Session' : 'None');
  const totalIncidents = incidentsList.length;
  const criticalIncidents = incidentsList.filter((i) => i.severity === 'CRITICAL').length;
  const pendingIncidents = dashData?.active_incidents ?? incidentsList.filter((i) => i.status === 'Open' || i.status === 'Under Investigation').length;
  const resolvedIncidents = incidentsList.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const evidenceCount = evidenceList.length;
  const notifCount = notificationsList.length;
  const systemHealth = dashData?.system_health ?? (dashLoading ? 'Loading...' : 'Operational');

  return (
    <PageContainer>
      <PageHeader
        title="Security Operations Center (SOC) Main Dashboard"
        subtitle="Real-time computer lab surveillance, YOLOv8 vision engine diagnostics, and incident telemetry"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${monitoringData?.is_running ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <span className={`w-2 h-2 rounded-full ${monitoringData?.is_running ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'} shrink-0`} />
              {monitoringData?.is_running ? 'LIVE MONITORING ACTIVE' : 'MONITORING STANDBY'}
            </span>
          </div>
        }
      />

      {/* 12 KPI Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Labs"
          value={totalLabs}
          subtitle="Monitored Facilities"
          icon={FlaskConical}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          isLoading={dashLoading}
          isError={dashError}
        />
        <StatCard
          title="Total Cameras"
          value={totalCameras}
          subtitle="Configured Streams"
          icon={Camera}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
          isLoading={dashLoading}
          isError={dashError}
        />
        <StatCard
          title="Active Cameras"
          value={activeCameras}
          subtitle="Online & Streaming"
          icon={Eye}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          isLoading={dashLoading}
          isError={dashError}
        />
        <StatCard
          title="Monitoring Sessions"
          value={activeSessions}
          subtitle="Active Sessions"
          icon={Activity}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Active Session"
          value={activeSessionName}
          subtitle={activeSessions > 0 ? "Academic Session Active" : "No Active Session"}
          icon={Zap}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Total Incidents"
          value={totalIncidents}
          subtitle="Recorded Discrepancies"
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Critical Incidents"
          value={criticalIncidents}
          subtitle="Immediate Action Req."
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-500/20"
          isLoading={dashLoading}
        />
        <StatCard
          title="Pending Incidents"
          value={pendingIncidents}
          subtitle="Under Investigation"
          icon={ClockIcon}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Resolved Incidents"
          value={resolvedIncidents}
          subtitle="Verified & Closed"
          icon={CheckCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Evidence Captured"
          value={evidenceCount}
          subtitle="Recorded Clips"
          icon={FileVideo}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          isLoading={dashLoading}
        />
        <StatCard
          title="Notifications"
          value={notifCount}
          subtitle="Total System Alerts"
          icon={Bell}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
          isLoading={notificationsLoading}
        />
        <StatCard
          title="System Health"
          value={systemHealth}
          subtitle={systemHealth === 'Healthy' ? '100% Operational' : systemHealth}
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          isLoading={dashLoading}
        />
      </div>

      {/* Monitoring Status & System Health Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonitoringStatusPanel monitoringData={monitoringData} />
        <SystemHealthPanel />
      </div>

      {/* Visual Analytics Charts Section */}
      <AnalyticsCharts />

      {/* Laboratory Facilities Status Overview */}
      <LabStatusPanel labs={labsList} />

      {/* Recent Security Incidents Table */}
      <RecentIncidentsTable incidents={incidentsList} isLoading={incidentsLoading} />

      {/* Live Notifications Feed & Recent Evidence Clips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveNotificationsPanel notifications={notificationsList} isLoading={notificationsLoading} />
        <RecentEvidencePanel evidenceList={evidenceList} />
      </div>
    </PageContainer>
  );
};

const ClockIcon = (props) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
