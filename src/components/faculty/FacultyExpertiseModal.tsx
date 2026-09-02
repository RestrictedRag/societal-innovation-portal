'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Plus,
  BookOpen,
  Award,
  Save,
  Loader2,
  Building,
} from 'lucide-react';

interface FacultyExpertiseModalProps {
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const COMMON_EXPERTISE = [
  'Embedded Systems & IoT',
  'Civil & Structural Engineering',
  'Water Resource Management',
  'Renewable Energy & Smart Grids',
  'Waste Processing & Circular Economy',
  'Machine Learning & Computer Vision',
  'Robotics & Agricultural Automation',
  'Biomedical Device Engineering',
  'Disaster Mitigation & GIS Modeling',
  'Environmental Impact Assessment',
];

export function FacultyExpertiseModal({ onClose, onProfileUpdated }: FacultyExpertiseModalProps) {
  const [department, setDepartment] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [customExpertiseInput, setCustomExpertiseInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          if (p) {
            setDepartment(p.department || '');
            setExpertise(Array.isArray(p.expertise) ? p.expertise : []);
            setInterests(Array.isArray(p.interests) ? p.interests : []);
            setBio(p.bio || '');
          }
        }
      } catch (err) {
        console.error('Failed to load faculty profile:', err);
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  const handleToggleExpertise = (item: string) => {
    setExpertise((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExpertiseInput.trim()) return;
    if (!expertise.includes(customExpertiseInput.trim())) {
      setExpertise((prev) => [...prev, customExpertiseInput.trim()]);
    }
    setCustomExpertiseInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          expertise,
          interests,
          bio,
        }),
      });

      if (!res.ok) throw new Error('Failed to save expertise profile.');

      setStatusMessage('Faculty Expertise Profile saved successfully!');
      setTimeout(() => {
        if (onProfileUpdated) onProfileUpdated();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-nexus-primary">Faculty Expertise & Mentorship Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Declare your research focus and domains to curate capstone mentorship queues.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading faculty profile...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department / Research Faculty
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Department of Civil & Environmental Engineering"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            {/* Research Expertise Tags */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Research Expertise & Domains
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EXPERTISE.map((item) => {
                  const isSelected = expertise.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleExpertise(item)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-nexus-primary text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Expertise */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customExpertiseInput}
                  onChange={(e) => setCustomExpertiseInput(e.target.value)}
                  placeholder="Add custom research domain (e.g. Nano-materials, LoRaWAN telemetry)..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none flex-grow"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Faculty Bio & Mentorship Note (Optional)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your lab facilities, preferred capstone scope, or research grant affiliations..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition resize-y"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
