'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Plus,
  MapPin,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Award,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  X,
  Edit,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CompanyPilotManagerProps {
  pilots: any[];
  allProjects?: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProjectDetail: (projectId: string) => void;
  isWizardOpen: boolean;
  onCloseWizard: () => void;
  preselectedProjectId?: string | null;
  preselectedProjectTitle?: string | null;
}

export function CompanyPilotManager({
  pilots,
  allProjects = [],
  loading,
  onRefresh,
  onOpenProjectDetail,
  isWizardOpen,
  onCloseWizard,
  preselectedProjectId,
  preselectedProjectTitle,
}: CompanyPilotManagerProps) {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  // Launch Wizard Form State
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || '');
  const [pilotTitle, setPilotTitle] = useState('');
  const [location, setLocation] = useState('Outer Ring Road Transit Corridor, New Delhi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [objective, setObjective] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('12,000 Daily Commuters & Residents');
  const [infrastructureDetails, setInfrastructureDetails] = useState('10x Acoustic Sensor Nodes with LoRa Gateway');
  const [expectedMetrics, setExpectedMetrics] = useState('Water Loss Reduction (>90%), Detection Accuracy (>95%)');
  const [responsibleContact, setResponsibleContact] = useState('');
  const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);
  const [wizardFeedback, setWizardFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update Progress Modal State
  const [editingPilot, setEditingPilot] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editProgress, setEditProgress] = useState(50);
  const [editImpactSummary, setEditImpactSummary] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const filteredPilots = pilots.filter((p) => {
    if (activeStatusFilter === 'ALL') return true;
    return p.status === activeStatusFilter;
  });

  const handleLaunchPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedProjectId || preselectedProjectId;
    if (!targetId || !pilotTitle || !location || !objective) return;

    setIsSubmittingWizard(true);
    setWizardFeedback(null);

    try {
      const res = await fetch('/api/industry/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetId,
          title: pilotTitle.trim(),
          location: location.trim(),
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || undefined,
          objective: objective.trim(),
          targetPopulation: targetPopulation.trim() || undefined,
          infrastructureDetails: infrastructureDetails.trim() || undefined,
          expectedMetrics: expectedMetrics.trim() || undefined,
          responsibleContact: responsibleContact.trim() || undefined,
          metrics: {
            usersAffected: '12,000+',
            operationalUptime: '99.4%',
            accuracy: '96.2%',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to propose pilot testbed.');

      setWizardFeedback({ type: 'success', text: 'Live pilot testbed successfully proposed and scheduled!' });
      setTimeout(() => {
        onCloseWizard();
        setPilotTitle('');
        setObjective('');
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setWizardFeedback({ type: 'error', text: err.message || 'Error proposing pilot.' });
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  const handleSavePilotUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilot) return;

    setIsSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/industry/pilots/${editingPilot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          progressPercent: Number(editProgress),
          impactSummary: editImpactSummary.trim() || undefined,
        }),
      });

      if (res.ok) {
        setEditingPilot(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update pilot:', err);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const parseMetrics = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Object.entries(parsed).map(([key, val]) => ({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value: String(val),
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Municipal Pilot Testbed Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Deploy university R&D prototypes into live urban transit, water pipeline, and solar grid testbeds. Track real-time impact metrics, community adoption, and milestone progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {['ALL', 'ACTIVE', 'APPROVED', 'PLANNED', 'COMPLETED', 'PROPOSED'].map((st) => (
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

      {/* Pilots List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Loading municipal pilot data...</span>
        </div>
      ) : filteredPilots.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Rocket className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">No Pilots in this Stage</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Propose a live municipal testbed on any accredited university project to begin field validation.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPilots.map((pilot) => {
            const project = pilot.project || {};
            const problem = project.problem || {};
            const university = project.leadUniversity || {};
            const metrics = parseMetrics(pilot.metricsJson);

            return (
              <div
                key={pilot.id}
                className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Status & Location Top */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pilot.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : pilot.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      ● {pilot.status}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pilot.location}
                    </span>
                  </div>

                  {/* Title & Target */}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">{pilot.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Project: <strong className="text-slate-800">{problem.title || 'University Project'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">🏛️ {university.name}</p>
                  </div>

                  {/* Objective */}
                  <p className="text-xs text-slate-600 leading-relaxed">{pilot.objective}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-bold uppercase">Deployment Progression</span>
                      <strong className="text-slate-900">{pilot.progressPercent}%</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-nexus-primary rounded-full transition-all duration-500"
                        style={{ width: `${pilot.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Real-time Configurable Metrics */}
                  {metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {metrics.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <span className="text-[10px] text-emerald-800 block truncate font-medium">{m.label}</span>
                          <strong className="text-emerald-900 font-serif text-sm">{m.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {pilot.impactSummary && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200/80 text-xs">
                      <span className="font-bold text-purple-900 block text-[10px] uppercase">Field Impact Summary</span>
                      <p className="text-purple-800 text-[11px] mt-0.5">{pilot.impactSummary}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setEditingPilot(pilot);
                      setEditStatus(pilot.status);
                      setEditProgress(pilot.progressPercent);
                      setEditImpactSummary(pilot.impactSummary || '');
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-nexus-primary font-bold text-xs"
                  >
                    <Edit className="w-3.5 h-3.5" /> Update Progress & Metrics
                  </button>

                  <button
                    onClick={() => onOpenProjectDetail(pilot.projectId)}
                    className="px-4 py-2 rounded-xl bg-nexus-primary text-white font-bold hover:bg-nexus-primary-container transition flex items-center gap-1 shadow-sm"
                  >
                    View Project Dossier <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Pilot Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-nexus-primary">
                    Propose Municipal Pilot Testbed
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define an operational validation deployment for an accredited university solution
                  </p>
                </div>
              </div>
              <button onClick={onCloseWizard} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {preselectedProjectTitle && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Target Project</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{preselectedProjectTitle}</p>
              </div>
            )}

            {wizardFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  wizardFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {wizardFeedback.text}
              </div>
            )}

            <form onSubmit={handleLaunchPilot} className="space-y-4 text-xs">
              {!preselectedProjectId && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select University Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:border-nexus-primary focus:bg-white transition"
                  >
                    <option value="">Select an active university project...</option>
                    {allProjects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.problem_title} ({p.lead_university_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilot Testbed Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ring Road Smart Acoustic Pipeline Leakage Monitoring Pilot"
                  value={pilotTitle}
                  onChange={(e) => setPilotTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deployment Location / Facility <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Outer Ring Road, South Delhi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Beneficiaries / Population
                  </label>
                  <input
                    type="text"
                    placeholder="12,000 Daily Commuters"
                    value={targetPopulation}
                    onChange={(e) => setTargetPopulation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilot Objective & Acceptance Criteria <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Validate real-time acoustic leak triangulation under daily vehicle noise conditions with >95% accuracy..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Infrastructure & Hardware Details
                  </label>
                  <input
                    type="text"
                    value={infrastructureDetails}
                    onChange={(e) => setInfrastructureDetails(e.target.value)}
                    placeholder="10x Industrial Acoustic Sensors"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Target Metrics
                  </label>
                  <input
                    type="text"
                    value={expectedMetrics}
                    onChange={(e) => setExpectedMetrics(e.target.value)}
                    placeholder="Water Loss Reduction > 90%"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseWizard}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWizard || !pilotTitle.trim() || !objective.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
                >
                  {isSubmittingWizard ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scheduling...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" /> Launch Pilot Testbed
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pilot Progress Modal */}
      {editingPilot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-nexus-primary">Update Pilot Progress</h3>
              <button onClick={() => setEditingPilot(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-900">{editingPilot.title}</p>

            <form onSubmit={handleSavePilotUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Lifecycle Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="PROPOSED">PROPOSED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PLANNED">PLANNED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Progress Percentage: {editProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-nexus-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field Impact Summary & Observations
                </label>
                <textarea
                  rows={3}
                  value={editImpactSummary}
                  onChange={(e) => setEditImpactSummary(e.target.value)}
                  placeholder="e.g. Sensors detected 3 micro-fissures in week 2, preventing 42,000L clean drinking water loss."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-nexus-primary focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPilot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container"
                >
                  {isSubmittingUpdate ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
