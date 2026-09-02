'use client';

import React from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Lock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Users,
  Layers,
  Rocket,
  Activity,
  HeartHandshake,
  CheckCircle2,
  Bookmark,
  ChevronRight,
} from 'lucide-react';

interface CompanyDashboardOverviewProps {
  data: any;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNeedModal: () => void;
  onOpenPilotWizard: (projectId?: string) => void;
}

export function CompanyDashboardOverview({
  data,
  loading,
  onNavigateTab,
  onOpenProjectDetail,
  onOpenNeedModal,
  onOpenPilotWizard,
}: CompanyDashboardOverviewProps) {
  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        <div className="h-40 rounded-3xl bg-slate-200/80" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-3xl bg-slate-200/80" />
          <div className="h-64 rounded-3xl bg-slate-200/80" />
        </div>
      </div>
    );
  }

  const profile = data.profile || {};
  const kpis = data.kpis || {};
  const topRecommendations = data.topRecommendations || [];
  const recentPilots = data.recentPilots || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-nexus-primary via-emerald-900 to-nexus-primary p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-nexus-primary-fixed text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" /> Corporate Innovation & Public Pilot Suite
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {profile.companyName || 'Industry Partner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {profile.description ||
                'Partnering with premier university laboratories to accelerate civic solutions into live municipal environments.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <button
              onClick={onOpenNeedModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-nexus-primary font-bold text-xs hover:bg-slate-100 transition shadow-lg"
            >
              <Plus className="w-4 h-4" /> Publish Innovation Challenge
            </button>
            <button
              onClick={() => onNavigateTab('PROJECTS')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-nexus-primary-fixed" /> Discover University R&D
            </button>
          </div>
        </div>
      </div>

      {/* Real-time KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Collaborations</span>
            <HeartHandshake className="w-4 h-4 text-nexus-primary" />
          </div>
          <p className="font-serif text-2xl font-bold text-slate-900">{kpis.activeCollaborations || 0}</p>
          <span className="text-[10px] text-slate-400">{kpis.pendingProposals || 0} proposals pending</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Projects Supported</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-purple-700">{kpis.projectsSupported || 0}</p>
          <span className="text-[10px] text-slate-400">Across accredited universities</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Pilots</span>
            <Rocket className="w-4 h-4 text-blue-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-blue-700">{kpis.activePilots || 0}</p>
          <span className="text-[10px] text-slate-400">{kpis.completedPilots || 0} completed & deployed</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Escrow Funding</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-amber-700">
            ${Number(kpis.fundingCommitted || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            ${Number(kpis.fundingReleased || 0).toLocaleString()} released
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Students Connected</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-700">{kpis.studentsConnected || 0}</p>
          <span className="text-[10px] text-slate-400">Talent pipeline engaged</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Solutions Deployed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-teal-700">{kpis.solutionsDeployed || 0}</p>
          <span className="text-[10px] text-slate-400">Municipal impact created</span>
        </div>
      </div>

      {/* Main Split Section: Top AI Recommendations & Active Pilots Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Smart Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" /> Recommended For Your Company
              </h3>
              <p className="text-xs text-slate-500">
                Matches based on your industry focus, open challenges, and technology stack
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('RECOMMENDATIONS')}
              className="text-xs font-bold text-nexus-primary hover:underline flex items-center gap-1"
            >
              View All Recommendations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topRecommendations.map((proj: any) => (
              <div
                key={proj.project_id}
                onClick={() => onOpenProjectDetail(proj.project_id)}
                className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-nexus-primary/40 transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> {proj.matchScore || 88}% Match
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      TRL {proj.max_trl_level || 1}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-slate-900 group-hover:text-nexus-primary transition leading-snug">
                    {proj.problem_title}
                  </h4>

                  <p className="text-xs text-slate-500">{proj.lead_university_name}</p>

                  <p className="text-xs text-slate-600 line-clamp-2">{proj.problem_description}</p>
                </div>

                {proj.matchReasons && proj.matchReasons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[10px]">
                    {proj.matchReasons.slice(0, 2).map((r: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Active Pilot Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-600" /> Active Pilots Snapshot
              </h3>
              <p className="text-xs text-slate-500">Live operational testbeds</p>
            </div>
            <button
              onClick={() => onNavigateTab('PILOTS')}
              className="text-xs font-bold text-nexus-primary hover:underline"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-3">
            {recentPilots.length === 0 ? (
              <div className="p-8 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
                <Rocket className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Live Pilots Yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Propose a pilot testbed on any university project to validate prototypes in real-world conditions.
                </p>
                <button
                  onClick={() => onOpenPilotWizard()}
                  className="px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition"
                >
                  Propose Pilot Testbed
                </button>
              </div>
            ) : (
              recentPilots.map((pilot: any) => (
                <div
                  key={pilot.id}
                  onClick={() => onNavigateTab('PILOTS')}
                  className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pilot.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pilot.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pilot.status}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">{pilot.location}</span>
                  </div>

                  <h5 className="font-serif text-sm font-bold text-slate-900">{pilot.title}</h5>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Pilot Progression</span>
                      <span className="font-bold text-slate-700">{pilot.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-nexus-primary rounded-full transition-all duration-500"
                        style={{ width: `${pilot.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
