import React from 'react';
import { Camera, CheckCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { referenceService } from '../services/referenceService';

export const ReferenceProfilesPage = () => {
  const { data: profilesData } = useQuery({
    queryKey: ['reference-profiles'],
    queryFn: () => referenceService.getReferenceProfiles(),
  });

  const profiles = profilesData?.results || [
    {
      id: 1,
      camera_details: { name: 'Cam 1: Overhead Main', location: 'Room 101' },
      is_active: true,
      created_at: new Date().toISOString(),
      assets: [
        { asset_details: { name: 'Monitor', category: 'computer' }, detected_quantity: 20, confidence: 0.96 },
        { asset_details: { name: 'Keyboard', category: 'computer' }, detected_quantity: 20, confidence: 0.94 },
        { asset_details: { name: 'Mouse', category: 'computer' }, detected_quantity: 20, confidence: 0.92 },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> Reference Profiles & Asset Baselines
          </h2>
          <p className="text-xs text-slate-400">Manage baseline asset quantity profiles captured before lab sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((prof) => (
          <div key={prof.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">{prof.camera_details?.name || 'Camera Profile'}</h3>
                <span className="text-xs text-slate-400">{prof.camera_details?.location || 'Room 101'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE BASELINE
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-300">Detected Reference Assets</h4>
              <div className="space-y-1.5">
                {prof.assets?.map((ast, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-400">
                    <span>{ast.asset_details?.name || 'Asset'}</span>
                    <span className="font-bold text-cyan-400">{ast.detected_quantity} Units ({(ast.confidence * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
