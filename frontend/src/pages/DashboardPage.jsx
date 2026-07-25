import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  VideoOff,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Cpu,
  TrendingUp,
  Activity,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { dashboardService } from '../services/dashboardService';
import { KPICard } from '../components/common/KPICard';
import { WorkstationMap } from '../components/common/WorkstationMap';
import { EvidenceModal } from '../components/modals/EvidenceModal';

export const DashboardPage = () => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardMetrics,
    refetchInterval: 5000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: dashboardService.getAnalyticsData,
  });

  // Recharts Mock/Fallback Chart Data
  const trendData = analyticsData?.seven_day_trend || [
    { date: 'Mon', incidents: 0 },
    { date: 'Tue', incidents: 1 },
    { date: 'Wed', incidents: 0 },
    { date: 'Thu', incidents: 0 },
    { date: 'Fri', incidents: 1 },
    { date: 'Sat', incidents: 0 },
    { date: 'Sun', incidents: 1 },
  ];

  const categoryData = [
    { name: 'Monitors', count: 20 },
    { name: 'Keyboards', count: 20 },
    { name: 'Mice', count: 20 },
    { name: 'Laptops', count: 10 },
    { name: 'Chairs', count: 20 },
  ];

  const severityData = [
    { name: 'Critical', value: 1, color: '#ef4444' },
    { name: 'Warning', value: 2, color: '#f59e0b' },
    { name: 'Info', value: 5, color: '#38bdf8' },
  ];

  const handleInspect = (inc) => {
    setSelectedIncident(inc);
    setIsEvidenceOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Online Cameras"
          value={dashboardData?.online_cameras ?? 2}
          icon={Video}
          color="bg-blue-600/20 text-blue-400"
          trend="100% Up"
          subtitle="RTSP Stream Healthy"
        />
        <KPICard
          title="Offline Cameras"
          value={dashboardData?.offline_cameras ?? 0}
          icon={VideoOff}
          color="bg-slate-700/50 text-slate-400"
          trend="0 Offline"
          subtitle="No interruptions"
        />
        <KPICard
          title="Protected Assets"
          value={dashboardData?.total_assets ?? 70}
          icon={ShieldCheck}
          color="bg-emerald-600/20 text-emerald-400"
          trend="Active Protection"
          subtitle="Monitors, Keyboards, Laptops"
        />
        <KPICard
          title="Today's Incidents"
          value={dashboardData?.todays_incidents ?? 1}
          icon={ShieldAlert}
          color="bg-red-600/20 text-red-400"
          trend="1 Alert Logged"
          subtitle="Discrepancy at PC04"
        />
        <KPICard
          title="Detection Accuracy"
          value={`${dashboardData?.detection_accuracy ?? 96.85}%`}
          icon={TrendingUp}
          color="bg-cyan-600/20 text-cyan-400"
          trend="+1.2% High Conf"
          subtitle="YOLOv8 Medium Weights"
        />
        <KPICard
          title="System Health"
          value={dashboardData?.system_health ?? 'Healthy'}
          icon={Activity}
          color="bg-emerald-600/20 text-emerald-400"
          trend="Optimal"
          subtitle="PostgreSQL + Django"
        />
        <KPICard
          title="Reference Profiles"
          value="1 Active"
          icon={Camera}
          color="bg-purple-600/20 text-purple-400"
          trend="Baseline Loaded"
          subtitle="SE AI Lab 1 Baseline"
        />
        <KPICard
          title="YOLO Engine Status"
          value="20.0 FPS"
          icon={Cpu}
          color="bg-indigo-600/20 text-indigo-400"
          trend="14.2ms / frame"
          subtitle="Single Lazy Instance"
        />
      </div>

      {/* Main Grid: Recharts + Workstation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Trend Line Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 font-heading flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> 7-Day Security Incident Trend Graph
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="incidents" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 font-heading flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Incident Severity Breakdown
          </h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={5}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workstation Map & Latest Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WorkstationMap incidents={[{ id: 15, location: 'Workstation PC04', assetName: 'Mouse' }]} />
        </div>

        {/* Latest Incidents List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 font-heading flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" /> Active Discrepancy Alerts
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-1">
                <strong className="text-red-400 font-bold">Mouse Missing at PC04</strong>
                <span className="text-[10px] text-slate-400">17:35:12</span>
              </div>
              <p className="text-slate-300 text-[11px]">1 Mouse unit missing in SE AI Lab 1 (Cam 1).</p>
              <button
                onClick={() => handleInspect({ id: 15, assetName: 'Mouse', location: 'Workstation PC04', time: '17:35:12', confidence: 0.92 })}
                className="mt-2 text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> Inspect Evidence
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Inspection Modal */}
      <EvidenceModal isOpen={isEvidenceOpen} onClose={() => setIsEvidenceOpen(false)} incident={selectedIncident} />
    </div>
  );
};
