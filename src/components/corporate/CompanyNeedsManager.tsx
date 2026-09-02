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
  MapPin,
  Clock,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react';

interface IndustryNeedItem {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  targetTrl: number;
  resourceOfferings: string[] | null;
  technology: string[] | null;
  problemCategory: string | null;
  requiredSkills: string[] | null;
  preferredProjectType: string | null;
  expectedOutcome: string | null;
  fundingAvailable: string | null;
  pilotOpportunity: string | null;
  timeline: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  companyUser?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface CompanyNeedsManagerProps {
  userRole?: string;
}

export function CompanyNeedsManager({ userRole }: CompanyNeedsManagerProps) {
  const [needs, setNeeds] = useState<IndustryNeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('water_management');
  const [targetTrl, setTargetTrl] = useState(5);
  const [technologyInput, setTechnologyInput] = useState('IoT, Embedded C, Sensors');
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('Microcontrollers, Edge Computing, Signal Processing');
  const [preferredProjectType, setPreferredProjectType] = useState<'BOTH' | 'PROBLEM_SOLVING' | 'RESEARCH'>('BOTH');
  const [expectedOutcome, setExpectedOutcome] = useState('Functional hardware evaluation prototype tested on pipeline rig');
  const [fundingAvailable, setFundingAvailable] = useState('₹5,00,000 Milestone Escrow');
  const [pilotOpportunity, setPilotOpportunity] = useState('2.5km Transit Corridor Testbed in Delhi NCR');
  const [timeline, setTimeline] = useState('3–6 Months');
  const [location, setLocation] = useState('Delhi NCR');
  const [selectedOfferings, setSelectedOfferings] = useState<string[]>([
    'Milestone Escrow Grant',
    'Hardware Evaluation Kits',
    'Senior Mentorship',
    'Live Pilot Testbed',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/industry/needs?mine=true');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const technology = technologyInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const requiredSkills = requiredSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

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
          technology,
          requiredSkills,
          preferredProjectType,
          expectedOutcome: expectedOutcome.trim() || undefined,
          fundingAvailable: fundingAvailable.trim() || undefined,
          pilotOpportunity: pilotOpportunity.trim() || undefined,
          timeline: timeline.trim() || undefined,
          location: location.trim() || undefined,
          status: 'OPEN',
        }),
      });

      if (!res.ok) throw new Error('Failed to post innovation challenge.');

      setStatusMessage({ type: 'success', text: 'Innovation challenge published successfully to universities!' });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setTitle('');
        setDescription('');
        void fetchNeeds();
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Creation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/industry/needs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n)));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteNeed = async (id: string) => {
    if (!confirm('Are you sure you want to delete this innovation challenge?')) return;
    try {
      const res = await fetch(`/api/industry/needs/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNeeds((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete need:', err);
    }
  };

  const filteredNeeds = needs.filter((n) => {
    if (activeStatusFilter === 'ALL') return true;
    return n.status === activeStatusFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Industry Innovation Challenges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Publish targeted corporate technical needs with funding, hardware grants, and testbed access. University R&D labs and student teams can claim and develop custom solutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setStatusMessage(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
          >
            <Plus className="w-4 h-4" /> Publish New Challenge
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((st) => (
          <button
            key={st}
            onClick={() => setActiveStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeStatusFilter === st
                ? 'bg-nexus-primary text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Needs Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Loading industry challenges...</span>
        </div>
      ) : filteredNeeds.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">No Innovation Challenges Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t published any challenges with this status. Click &quot;Publish New Challenge&quot; to begin.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredNeeds.map((need) => (
            <div
              key={need.id}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {need.domain?.replace(/_/g, ' ') || 'Civic Domain'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        need.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : need.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {need.status}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                      Target TRL {need.targetTrl}
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">{need.title}</h3>

                <p className="text-xs text-slate-600 leading-relaxed">{need.description}</p>

                {/* Details Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  {need.fundingAvailable && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Grant / Escrow:</span>
                      <strong className="text-emerald-700">{need.fundingAvailable}</strong>
                    </div>
                  )}

                  {need.pilotOpportunity && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Pilot Testbed:</span>
                      <strong className="text-slate-800">{need.pilotOpportunity}</strong>
                    </div>
                  )}

                  {need.timeline && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Expected Timeline:</span>
                      <span className="text-slate-700 font-medium">{need.timeline}</span>
                    </div>
                  )}
                </div>

                {/* Resource Offerings */}
                {need.resourceOfferings && need.resourceOfferings.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Available Resources</span>
                    <div className="flex flex-wrap gap-1">
                      {need.resourceOfferings.map((r, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <select
                  value={need.status}
                  onChange={(e) => handleUpdateStatus(need.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none text-[11px]"
                >
                  <option value="OPEN">Status: OPEN</option>
                  <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                  <option value="MATCHED">Status: MATCHED</option>
                  <option value="COMPLETED">Status: COMPLETED</option>
                  <option value="CLOSED">Status: CLOSED</option>
                </select>

                <button
                  onClick={() => handleDeleteNeed(need.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete challenge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Challenge Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-nexus-primary">
                    Publish Industry Innovation Need
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define an open challenge with resource grants for university capstone labs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Challenge Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subsurface Acoustic Leak Correlator for Cast Iron Water Mains"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Problem Description & Operating Environment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the operational bottleneck, testing conditions, and required technical accuracy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Civic Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-nexus-primary focus:bg-white transition"
                  >
                    <option value="water_management">Water Management</option>
                    <option value="waste_management">Waste Management</option>
                    <option value="clean_energy">Clean Energy</option>
                    <option value="urban_infrastructure">Urban Infrastructure</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="disaster_management">Disaster Management</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target TRL Maturity: TRL {targetTrl}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={targetTrl}
                    onChange={(e) => setTargetTrl(Number(e.target.value))}
                    className="w-full mt-2 accent-nexus-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>TRL 2 (Concept)</span>
                    <span>TRL 5 (Lab Prototype)</span>
                    <span>TRL 8 (Field Validated)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Funding Available / Escrow Grant
                  </label>
                  <input
                    type="text"
                    value={fundingAvailable}
                    onChange={(e) => setFundingAvailable(e.target.value)}
                    placeholder="e.g. ₹5,00,000 Milestone Escrow"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pilot Testbed Site
                  </label>
                  <input
                    type="text"
                    value={pilotOpportunity}
                    onChange={(e) => setPilotOpportunity(e.target.value)}
                    placeholder="e.g. 2.5km Transit Corridor in Delhi NCR"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={requiredSkillsInput}
                    onChange={(e) => setRequiredSkillsInput(e.target.value)}
                    placeholder="IoT, Embedded C, Python, Computer Vision"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 3–6 Months"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Publish to University Network
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
