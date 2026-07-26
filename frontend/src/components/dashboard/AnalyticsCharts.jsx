import React from 'react';
import { Card } from '../ui/Card';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsCharts = () => {
  const trendData = [
    { day: 'Mon', incidents: 2, resolved: 2 },
    { day: 'Tue', incidents: 4, resolved: 3 },
    { day: 'Wed', incidents: 1, resolved: 1 },
    { day: 'Thu', incidents: 5, resolved: 4 },
    { day: 'Fri', incidents: 3, resolved: 3 },
    { day: 'Sat', incidents: 0, resolved: 0 },
    { day: 'Sun', incidents: 1, resolved: 1 },
  ];

  const severityData = [
    { name: 'Critical', value: 2, color: '#ef4444' },
    { name: 'High', value: 4, color: '#f97316' },
    { name: 'Warning', value: 5, color: '#f59e0b' },
    { name: 'Info', value: 3, color: '#3b82f6' },
  ];

  const cameraData = [
    { name: 'Room 101 Cam 1', status: 'Online', uptime: 99.8 },
    { name: 'Room 101 Cam 2', status: 'Online', uptime: 98.5 },
    { name: 'Room 202 Cam 1', status: 'Online', uptime: 100 },
    { name: 'Room 303 Cam 1', status: 'Offline', uptime: 85.0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Incident Trend Chart */}
      <Card title="7-Day Incident Trend" subtitle="Daily detected discrepancies vs resolved incidents">
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="incidents" stroke="#3b82f6" fillOpacity={1} fill="url(#incidentGrad)" strokeWidth={2} name="Incidents" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#resolvedGrad)" strokeWidth={2} name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Incidents by Severity Pie Chart */}
      <Card title="Incidents by Severity" subtitle="Discrepancy classification breakdown">
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 text-xs pr-4 shrink-0">
            {severityData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-300 font-semibold">{s.name}:</span>
                <span className="text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
