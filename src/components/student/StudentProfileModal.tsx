'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  X,
  Check,
  Plus,
  BookOpen,
  Code2,
  Heart,
  Save,
  Loader2,
} from 'lucide-react';

interface StudentProfileModalProps {
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const COMMON_SKILLS = [
  'Python',
  'React / Next.js',
  'IoT & Microcontrollers',
  'Embedded C',
  'Computer Vision',
  'Machine Learning / AI',
  'GIS & Spatial Analysis',
  'CAD & Structural Design',
  'Data Analytics',
  'Renewable Energy & Solar',
  'Hydrology & Water Systems',
  'Mobile App Development',
];

const COMMON_INTERESTS = [
  'Clean Energy',
  'Smart City Infrastructure',
  'Water Conservation',
  'Agricultural Automation',
  'Waste Segregation & Recycling',
  'Public Healthcare Technology',
  'Disaster Alert Systems',
  'Assistive Tech & Accessibility',
];

export function StudentProfileModal({ onClose, onProfileUpdated }: StudentProfileModalProps) {
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<number>(3);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [preferredProjectType, setPreferredProjectType] = useState<'RESEARCH' | 'PROBLEM_SOLVING' | 'BOTH'>('BOTH');
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
            setYearOfStudy(p.yearOfStudy || 3);
            setSkills(Array.isArray(p.skills) ? p.skills : []);
            setInterests(Array.isArray(p.interests) ? p.interests : []);
            setPreferredProjectType((p.preferredProjectType as any) || 'BOTH');
            setBio(p.bio || '');
          }
        }
      } catch (err) {
        console.error('Failed to load student profile:', err);
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  const handleToggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    if (!skills.includes(customSkillInput.trim())) {
      setSkills((prev) => [...prev, customSkillInput.trim()]);
    }
    setCustomSkillInput('');
  };

  const handleToggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterestInput.trim()) return;
    if (!interests.includes(customInterestInput.trim())) {
      setInterests((prev) => [...prev, customInterestInput.trim()]);
    }
    setCustomInterestInput('');
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
          yearOfStudy: Number(yearOfStudy),
          skills,
          interests,
          preferredProjectType,
          bio,
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile.');

      setStatusMessage('Student Innovation Profile saved successfully!');
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
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-nexus-primary">Student Innovation Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your technical background to power personalized project discovery.
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
          <div className="py-12 text-center text-xs text-slate-400">Loading student profile...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Academic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Department / Branch
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                >
                  <option value={1}>1st Year (Undergraduate)</option>
                  <option value={2}>2nd Year (Undergraduate)</option>
                  <option value={3}>3rd Year (Undergraduate / Pre-final)</option>
                  <option value={4}>4th Year (Undergraduate / Final Year Capstone)</option>
                  <option value={5}>Postgraduate / Master's / Ph.D.</option>
                </select>
              </div>
            </div>

            {/* Preferred Project Type */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Project Track
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'PROBLEM_SOLVING', label: 'Problem-Solving Projects', desc: 'Practical community prototypes' },
                  { key: 'RESEARCH', label: 'Research Projects', desc: 'Academic experimentation & novelty' },
                  { key: 'BOTH', label: 'All Project Types', desc: 'Open to both R&D tracks' },
                ].map((track) => {
                  const isSelected = preferredProjectType === track.key;
                  return (
                    <button
                      key={track.key}
                      type="button"
                      onClick={() => setPreferredProjectType(track.key as any)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-nexus-primary bg-nexus-primary text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-xs block">{track.label}</span>
                      <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {track.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical Skills Selection */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Technical Skills & Tools
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-nexus-primary text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Skill Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Add another skill (e.g. ROS, MATLAB, LoRaWAN)..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none flex-grow"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Research & Innovation Interests */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Civic & Research Interests
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
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
