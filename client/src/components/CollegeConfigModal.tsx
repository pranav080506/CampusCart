import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CollegeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollegeConfigModal: React.FC<CollegeConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { college, switchCollege, refreshAuth } = useAuth();
  const [name, setName] = useState(college?.name || '');
  const [domain, setDomain] = useState(college?.domain || '');
  const [shortCode, setShortCode] = useState(college?.shortCode || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.updateCollegeConfig({
        name,
        domain,
        shortCode
      });
      if (res.success) {
        setSavedSuccess(true);
        await refreshAuth();
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand" />
            <h3 className="font-heading font-bold text-base text-ink-primary dark:text-white">
              Configure Verified College
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            <span>College configuration saved and header updated!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-ink-primary dark:text-gray-200 mb-1">
              Verified College / Institution Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-white focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink-primary dark:text-gray-200 mb-1">
                Short Code *
              </label>
              <input
                type="text"
                required
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block font-bold text-ink-primary dark:text-gray-200 mb-1">
                Campus Email Domain *
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Quick Demo College Switcher */}
          <div className="pt-2 border-t border-surface-border dark:border-surface-dark-border">
            <label className="block font-bold text-ink-secondary mb-1">
              Quick Switch Campus (Demo Data):
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchCollege('col-glbajaj')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  college?.id === 'col-glbajaj' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-ink-secondary'
                }`}
              >
                GL Bajaj
              </button>
              <button
                type="button"
                onClick={() => switchCollege('col-bits')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  college?.id === 'col-bits' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-ink-secondary'
                }`}
              >
                BITS Pilani
              </button>
            </div>
          </div>

          {/* Supabase Cloud Connection Status */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-primary dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase PostgreSQL & Storage
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-brand dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary dark:text-gray-400 font-mono truncate">
              URL: https://wnftvqqtjjzgpuventan.supabase.co
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
              ✓ Storage Bucket: <code className="font-mono">campus-cart-images</code> (Active)
            </p>
          </div>

          <div className="pt-3 border-t border-surface-border dark:border-surface-dark-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover shadow-sm"
            >
              {isSaving ? 'Updating...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
