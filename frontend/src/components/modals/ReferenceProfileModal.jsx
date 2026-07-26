import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Trash2, Shield, Layers } from 'lucide-react';
import { Button } from '../ui/Button';

const profileSchema = z.object({
  name: z.string().min(1, 'Profile Name is required'),
  camera: z.coerce.number().min(1, 'Camera selection is required'),
  is_active: z.boolean().default(true),
});

export const ReferenceProfileModal = ({ isOpen, onClose, onSubmit, initialData, cameras = [], isLoading }) => {
  const [assets, setAssets] = useState([
    { name: 'Monitor', category: 'computer', quantity: 20, confidence: 0.95 },
    { name: 'Keyboard', category: 'computer', quantity: 20, confidence: 0.90 },
    { name: 'Mouse', category: 'computer', quantity: 20, confidence: 0.90 },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: 'Standard Baseline Profile',
      camera: cameras[0]?.id || 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || 'Standard Baseline Profile',
        camera: initialData.camera || cameras[0]?.id || 1,
        is_active: initialData.is_active ?? true,
      });
      if (initialData.assets?.length > 0) {
        setAssets(
          initialData.assets.map((a) => ({
            name: a.asset_details?.name || 'Asset',
            category: a.asset_details?.category || 'computer',
            quantity: a.detected_quantity || 20,
            confidence: a.confidence || 0.90,
          }))
        );
      }
    }
  }, [initialData, reset, isOpen, cameras]);

  const handleAddAsset = () => {
    setAssets([...assets, { name: 'Laptop', category: 'laptop', quantity: 10, confidence: 0.85 }]);
  };

  const handleRemoveAsset = (idx) => {
    setAssets(assets.filter((_, i) => i !== idx));
  };

  const handleAssetChange = (idx, field, val) => {
    const next = [...assets];
    next[idx][field] = val;
    setAssets(next);
  };

  const handleFormSubmit = (values) => {
    onSubmit({ ...values, assets });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              {initialData ? 'Edit Reference Asset Baseline Profile' : 'Create Reference Profile'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Profile Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101 Standard Baseline"
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
                {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Target Camera *</label>
                <select
                  {...register('camera')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Embedded Assets Management */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white font-heading flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Tracked Reference Baseline Assets
                </span>
                <Button size="sm" variant="outline" icon={Plus} onClick={handleAddAsset}>
                  Add Asset
                </Button>
              </div>

              <div className="space-y-2">
                {assets.map((ast, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                    <div>
                      <input
                        type="text"
                        value={ast.name}
                        onChange={(e) => handleAssetChange(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                        placeholder="Asset Name"
                      />
                    </div>
                    <div>
                      <select
                        value={ast.category}
                        onChange={(e) => handleAssetChange(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="computer">Computer / Monitor</option>
                        <option value="laptop">Laptop</option>
                        <option value="mouse">Mouse</option>
                        <option value="keyboard">Keyboard</option>
                        <option value="chair">Chair</option>
                        <option value="projector">Projector</option>
                        <option value="printer">Printer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={ast.quantity}
                        onChange={(e) => handleAssetChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400 font-mono">{(ast.confidence * 100).toFixed(0)}%</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(idx)}
                        className="p-1 rounded text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Save Reference Profile
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
