'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldAlert,
  Flame,
  FileCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface ProjectHealthItem {
  project_id: string;
  problem_title: string;
  lead_university_name: string;
  project_type: string;
  status: string;
  health_status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK';
  budget: string;
  total_milestones: number;
  verified_milestones: number;
  unverified_milestones: number;
  days_since_last_activity: number;
  last_activity_at: string;
  risk_reason?: string | null;
}

interface ProjectHealthOverviewProps {
  projects: ProjectHealthItem[];
  onOpenMilestoneVerify?: (projectId: string) => void;
}

export function ProjectHealthOverview({ projects, onOpenMilestoneVerify }: ProjectHealthOverviewProps) {
  // Aggregate Health Counters
  const healthyCount = projects.filter((p) => p.health_status === 'HEALTHY').length;
  const needsAttentionCount = projects.filter((p) => p.health_status === 'NEEDS_ATTENTION').length;
  const atRiskCount = projects.filter((p) => p.health_status === 'AT_RISK').length;

  const atRiskProjects = projects.filter(
    (p) => p.health_status === 'AT_RISK' || p.health_status === 'NEEDS_ATTENTION' || p.days_since_last_activity > 21,
  );

  const pendingVerificationProjects = projects.filter((p) => p.unverified_milestones > 0);

  return (
    <div className="space-y-6">
      {/* 3-Pillar Health KPI Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Healthy & On Schedule
            </span>
            <p className="font-serif text-3xl font-bold text-emerald-950 mt-1">{healthyCount}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Active TRL progress in last 14 days</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Needs Faculty Attention
            </span>
            <p className="font-serif text-3xl font-bold text-amber-950 mt-1">{needsAttentionCount}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Pending milestone reviews or slow cadence</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              At-Risk / Stale Projects
            </span>
            <p className="font-serif text-3xl font-bold text-rose-950 mt-1">{atRiskCount}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">No deliverables recorded for &gt;21 days</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-200/80 text-rose-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* At-Risk Alert Banner If Any Exist */}
      {atRiskProjects.length > 0 && (
        <div className="rounded-3xl border border-rose-300 bg-rose-50/70 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <h3 className="font-serif text-base font-bold">
              Automated At-Risk Diagnostics ({atRiskProjects.length} projects flagged for faculty intervention)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {atRiskProjects.map((proj) => (
              <div
                key={proj.project_id}
                className="rounded-2xl border border-rose-200 bg-white p-4 flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                      {proj.days_since_last_activity > 21
                        ? `Stale (${proj.days_since_last_activity} days inactive)`
                        : 'Blocked Cadence'}
                    </span>
                    <span className="text-slate-500">
                      {proj.project_type === 'RESEARCH' ? 'Academic Research' : 'Problem Solving'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1.5 leading-snug">
                    {proj.problem_title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verified TRL Milestones: {proj.verified_milestones} / {proj.total_milestones}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-rose-700 font-semibold">
                    Recommendation: Conduct team standup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentorship & TRL Verification Queue */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-nexus-primary" />
            <h3 className="font-serif text-base font-bold text-nexus-primary">
              Mentorship & TRL Milestone Review Queue
            </h3>
          </div>
          <span className="text-xs font-bold bg-nexus-primary/10 text-nexus-primary px-3 py-1 rounded-full">
            {pendingVerificationProjects.length} pending review
          </span>
        </div>

        {pendingVerificationProjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            All student milestone updates have been reviewed and verified!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingVerificationProjects.map((proj) => (
              <div
                key={proj.project_id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {proj.unverified_milestones} Pending Verification
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{proj.lead_university_name}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{proj.problem_title}</h4>
                </div>

                {onOpenMilestoneVerify && (
                  <button
                    type="button"
                    onClick={() => onOpenMilestoneVerify(proj.project_id)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shrink-0 shadow-sm"
                  >
                    Review Deliverables <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
