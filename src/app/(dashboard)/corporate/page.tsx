'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Users,
  Layers,
  Cpu,
  Database,
  Cloud,
  FileCheck,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth/use-auth';
import { IndustryNeedsBoard } from '@/components/corporate/IndustryNeedsBoard';
import { ResourceOfferingModal } from '@/components/corporate/ResourceOfferingModal';

type ShowcaseProject = {
  project_id: string;
  problem_id: string;
  problem_title: string;
  problem_description: string;
  domain: string | null;
  image_url: string | null;
  project_status: string;
  budget: string;
  lead_university_name: string;
  total_milestones: number;
  verified_milestones: number;
  max_trl_level: number | null;
  held_escrow: string;
  released_escrow: string;
};

export default function CorporateDashboardPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'SHOWCASE' | 'NEEDS_BOARD' | 'PILOTS'>('SHOWCASE');
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [selectedTrlFilter, setSelectedTrlFilter] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sponsor Escrow Modal State
  const [sponsoringProject, setSponsoringProject] = useState<ShowcaseProject | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState('10000');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);
  const [pledgeMessage, setPledgeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resource Offering Modal State
  const [offeringProject, setOfferingProject] = useState<ShowcaseProject | null>(null);

  const fetchShowcase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/showcase');
      if (!res.ok) throw new Error('Failed to load corporate showcase.');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchShowcase();
  }, []);

  const handlePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsoringProject) return;

    setIsSubmittingPledge(true);
    setPledgeMessage(null);

    try {
      const res = await fetch(`/api/projects/${sponsoringProject.project_id}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(pledgeAmount) }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to pledge escrow sponsorship.');

      setPledgeMessage({
        type: 'success',
        text: `Successfully pledged $${Number(pledgeAmount).toLocaleString()} into escrow! Funds are held safely until milestone verification.`,
      });

      setTimeout(() => {
        setSponsoringProject(null);
        void fetchShowcase();
      }, 1500);
    } catch (err: any) {
      setPledgeMessage({ type: 'error', text: err.message || 'Failed to pledge funds.' });
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  // Filtered Showcase by TRL
  const filteredProjects = projects.filter((p) => {
    if (selectedTrlFilter === 'ALL') return true;
    return (p.max_trl_level || 1) >= selectedTrlFilter;
  });

  // Aggregated KPIs
  const totalHeld = projects.reduce((acc, p) => acc + Number(p.held_escrow || 0), 0);
  const totalReleased = projects.reduce((acc, p) => acc + Number(p.released_escrow || 0), 0);
  const totalMilestonesVerified = projects.reduce((acc, p) => acc + (p.verified_milestones || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex-grow space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nexus-primary/10 border border-nexus-primary/20 text-nexus-primary text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" /> Industry Partner & Escrow Portal
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-nexus-primary tracking-tight">
              Innovation Impact & Industry Collaboration
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Discover accredited academic R&D initiatives, pledge capital into milestone-gated escrow ledgers, and support student teams with hardware, cloud credits, and pilot testbeds.
            </p>
          </div>

          <button
            onClick={() => void fetchShowcase()}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Showcase
          </button>
        </header>

        {/* Global Impact KPI Bento Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Research Projects
              </span>
              <div className="w-8 h-8 rounded-full bg-nexus-primary/10 flex items-center justify-center text-nexus-primary">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-nexus-primary">{projects.length}</p>
            <p className="text-[11px] text-slate-500">Multidisciplinary university teams deployed</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Escrow Funding Held
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-amber-700">
              ${totalHeld.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">Protected in escrow pending milestone verification</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Escrow Released for R&D
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-3xl font-bold text-emerald-700">
              ${totalReleased.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">{totalMilestonesVerified} verified TRL milestones unlocked</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SHOWCASE')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'SHOWCASE'
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Discover University Solutions ({projects.length})
            </button>

            <button
              onClick={() => setActiveTab('NEEDS_BOARD')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'NEEDS_BOARD'
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Industry Needs Board
            </button>

            <button
              onClick={() => setActiveTab('PILOTS')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PILOTS'
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" /> Collaboration & Pilot Tracking
            </button>
          </div>

          {/* TRL Filters for Showcase */}
          {activeTab === 'SHOWCASE' && (
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setSelectedTrlFilter('ALL')}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedTrlFilter === 'ALL' ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                All TRLs
              </button>
              <button
                onClick={() => setSelectedTrlFilter(3)}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedTrlFilter === 3 ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                TRL 3+ (Proof of Concept)
              </button>
              <button
                onClick={() => setSelectedTrlFilter(5)}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedTrlFilter === 5 ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                TRL 5+ (Field Ready)
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Solutions Showcase Grid */}
        {activeTab === 'SHOWCASE' && (
          error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs text-rose-800">
              {error}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-nexus-primary" />
              <p className="text-xs font-semibold">Loading industry showcase...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Projects Matching TRL Filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Check back soon as universities claim civic challenges and submit initial research roadmaps.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.project_id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {proj.domain?.replace('_', ' ') || 'Civic Domain'}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        TRL {proj.max_trl_level ?? 1} Demonstrated
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-xl font-bold text-slate-900 leading-snug group-hover:text-nexus-primary transition-colors">
                        {proj.problem_title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Lead Institution: <strong className="text-slate-700">{proj.lead_university_name}</strong></p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {proj.problem_description}
                    </p>

                    {/* Escrow Status Breakdown */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Funds Held in Escrow</span>
                        <span className="font-bold text-amber-700 font-serif text-sm">
                          ${Number(proj.held_escrow || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Released to Lab</span>
                        <span className="font-bold text-emerald-700 font-serif text-sm">
                          ${Number(proj.released_escrow || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-slate-500">
                      {proj.verified_milestones} / {proj.total_milestones} Milestones Verified
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOfferingProject(proj)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-nexus-primary" /> Offer Resources
                      </button>

                      <button
                        onClick={() => {
                          setSponsoringProject(proj);
                          setPledgeMessage(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Sponsor in Escrow
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 2: Industry Needs Board */}
        {activeTab === 'NEEDS_BOARD' && (
          <IndustryNeedsBoard userRole={profile?.role} />
        )}

        {/* Tab 3: Corporate Collaboration & Pilot Tracking */}
        {activeTab === 'PILOTS' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-nexus-primary">Enterprise Pilot Testbeds & Escrow Disbursals</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track ongoing laboratory testing, hardware deployments, and pilot validation in municipal environments.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {projects.filter((p) => Number(p.released_escrow || 0) > 0 || Number(p.held_escrow || 0) > 0).map((proj) => (
                <div key={proj.project_id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Pilot Active (TRL {proj.max_trl_level ?? 1})
                    </span>
                    <span className="text-xs font-bold text-slate-900">{proj.lead_university_name}</span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-slate-900">{proj.problem_title}</h4>

                  <div className="rounded-2xl bg-slate-50 p-3.5 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Committed Capital</span>
                      <span className="font-bold text-slate-900">${(Number(proj.held_escrow || 0) + Number(proj.released_escrow || 0)).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Verified Milestones</span>
                      <span className="font-bold text-nexus-primary">{proj.verified_milestones} Completed</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => setOfferingProject(proj)}
                      className="text-xs font-bold text-nexus-primary hover:underline"
                    >
                      Offer Additional Hardware / Compute Support →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsor Escrow Modal */}
        {sponsoringProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-nexus-primary">Pledge Corporate Escrow</h3>
                <button
                  onClick={() => setSponsoringProject(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500">Project Target:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{sponsoringProject.problem_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">Lead: {sponsoringProject.lead_university_name}</p>
              </div>

              {pledgeMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    pledgeMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {pledgeMessage.text}
                </div>
              )}

              <form onSubmit={handlePledge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sponsorship Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Funds are deposited into an escrow ledger and only released when TRL milestones are independently verified.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSponsoringProject(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPledge}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container transition disabled:opacity-50 shadow-md shadow-nexus-primary/20"
                  >
                    {isSubmittingPledge ? 'Depositing...' : 'Confirm Escrow Deposit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Resource Offering Modal */}
        {offeringProject && (
          <ResourceOfferingModal
            projectId={offeringProject.project_id}
            projectTitle={offeringProject.problem_title}
            universityName={offeringProject.lead_university_name}
            onClose={() => setOfferingProject(null)}
            onSuccess={() => void fetchShowcase()}
          />
        )}
      </main>
    </div>
  );
}
