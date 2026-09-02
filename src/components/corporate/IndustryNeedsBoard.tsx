'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Sparkles,
  Layers,
  Award,
  RefreshCw,
  Send,
  X,
  CheckCircle2,
  Cpu,
  Database,
  Cloud,
  DollarSign,
  Users,
} from 'lucide-react';

interface IndustryNeedItem {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  targetTrl: number;
  resourceOfferings: string[] | null;
  status: string;
  createdAt: string;
  companyUser?: {
    id: string;
    email: string;
    role: string;
  };
}

interface IndustryNeedsBoardProps {
  userRole?: string;
}

export function IndustryNeedsBoard({ userRole }: IndustryNeedsBoardProps) {
  const [needs, setNeeds] = useState<IndustryNeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('urban_infrastructure');
  const [targetTrl, setTargetTrl] = useState(5);
  const [selectedOfferings, setSelectedOfferings] = useState<string[]>(['Funding', 'Mentorship']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/industry/needs');
      if (res.ok) {
        const data = await res.json();
        setNeeds(data.needs || []);
      }
    } catch (err) {
      console.error('Failed to fetch industry needs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNeeds();
  }, []);

  const handleToggleOffering = (offering: string) => {
    setSelectedOfferings((prev) =>
      prev.includes(offering) ? prev.filter((o) => o !== offering) : [...prev, offering],
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/industry/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          domain,
          targetTrl: Number(targetTrl),
          resourceOfferings: selectedOfferings,
        }),
      });

      if (!res.ok) throw new Error('Failed to post industry need.');

      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      void fetchNeeds();
    } catch (err: any) {
      alert(err.message || 'Error creating need.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = userRole === 'COMPANY_REP' || userRole === 'ADMIN';

  return (
    <div className="space-y-6 font-sans">
      {/* Board Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-nexus-primary">Enterprise Problem Statements & Needs Board</h2>
            <span className="text-[10px] font-extrabold uppercase bg-nexus-primary/10 text-nexus-primary px-2.5 py-0.5 rounded-full">
              Industry R&D Demands
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Corporate partners post verified engineering challenges with dedicated funding, cloud credits, and pilot testbeds for university labs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchNeeds()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canPost && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
            >
              <Plus className="w-4 h-4" /> Post Industry Challenge
            </button>
          )}
        </div>
      </div>

      {/* Needs Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading industry challenges...</div>
      ) : needs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Industry Challenges Active</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Corporate partners regularly post new R&D challenges with dedicated escrow milestones.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {needs.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {item.domain?.replace('_', ' ') || 'General'}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Target: TRL {item.targetTrl}
                  </span>
                </div>

                <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.description}</p>

                {/* Resource Offerings Badges */}
                {item.resourceOfferings && item.resourceOfferings.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Corporate Resources Committed:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.resourceOfferings.map((res, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Posted {new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="font-bold text-nexus-primary">Open for University R&D</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Challenge Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-nexus-primary">Post Enterprise R&D Challenge</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Challenge Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Edge AI Sensor for Real-time Water Turbidity Monitoring"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  >
                    <option value="urban_infrastructure">Urban Infrastructure</option>
                    <option value="water_management">Water Management</option>
                    <option value="clean_energy">Clean Energy & Grids</option>
                    <option value="waste_management">Waste Management</option>
                    <option value="agriculture">Agriculture & Agritech</option>
                    <option value="healthcare">Healthcare & Biotech</option>
                    <option value="disaster_management">Disaster Management</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Readiness Level (TRL)
                  </label>
                  <select
                    value={targetTrl}
                    onChange={(e) => setTargetTrl(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  >
                    <option value={3}>TRL 3 — Proof of Concept</option>
                    <option value={4}>TRL 4 — Lab Validated Component</option>
                    <option value={5}>TRL 5 — Field Prototype</option>
                    <option value={6}>TRL 6 — Operational Prototype</option>
                    <option value={7}>TRL 7 — Pilot Demonstration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Problem Description & Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline operating constraints, expected accuracy, hardware power limits, and deliverables..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition resize-y"
                />
              </div>

              {/* Resource Offerings Checklist */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Resources Committed by Enterprise
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Milestone Escrow Grant',
                    'Senior Mentorship',
                    'Evaluation Hardware Kits',
                    'Cloud Compute / GPU Credits',
                    'Industrial Datasets',
                    'Commercial Pilot Site',
                    'Student Internships',
                  ].map((res) => {
                    const isSelected = selectedOfferings.includes(res);
                    return (
                      <button
                        key={res}
                        type="button"
                        onClick={() => handleToggleOffering(res)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-nexus-primary text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {res}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container transition disabled:opacity-50 shadow-md shadow-nexus-primary/20"
                >
                  {isSubmitting ? 'Posting...' : 'Post Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
