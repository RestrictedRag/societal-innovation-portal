'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  MapPin,
  RefreshCw,
  Eye,
  Building,
  ShieldCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { GuidedProblemWizard } from '@/components/complaints/GuidedProblemWizard';
import { CitizenGuidanceSection } from '@/components/complaints/CitizenGuidanceSection';
import { GovernmentLinksSection } from '@/components/complaints/GovernmentLinksSection';
import { useAuth } from '@/lib/auth/use-auth';

interface UniversityClaim {
  id: string;
  lead_university_name: string;
  status: string;
  budget: string;
}

interface MyProblem {
  id: string;
  client_id: string;
  title: string;
  description: string;
  domain: string;
  status:
    | 'PENDING'
    | 'PENDING_MODERATION'
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'CLAIMED'
    | 'MERGED'
    | 'NEEDS_REVIEW'
    | 'REJECTED'
    | 'PROCESSING_FAILED';
  image_url: string | null;
  spam_score: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  active_claims_count: number;
  university_claims?: UniversityClaim[];
}

interface ProblemTotals {
  total: number;
  pendingModeration: number;
  open: number;
  inProgress: number;
  claimed: number;
  merged: number;
  needsReview: number;
  rejected: number;
}

export default function MyProblemsView() {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const [problems, setProblems] = useState<MyProblem[]>([]);
  const [totals, setTotals] = useState<ProblemTotals>({
    total: 0,
    pendingModeration: 0,
    open: 0,
    inProgress: 0,
    claimed: 0,
    merged: 0,
    needsReview: 0,
    rejected: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchMyProblems = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = status === 'ALL' ? '/api/problems/mine' : `/api/problems/mine?status=${status}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to view your submitted problems.');
        }
        throw new Error(data?.error || 'Failed to load your problems.');
      }

      setProblems(data.problems || []);
      if (data.totals) {
        setTotals(data.totals);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void fetchMyProblems(selectedStatus);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [selectedStatus, authLoading, isAuthenticated]);

  const formatDomainName = (domain: string | null | undefined) => {
    if (!domain) return 'General';
    return domain.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadge = (status: MyProblem['status']) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Open for Research',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: Sparkles,
        };
      case 'IN_PROGRESS':
      case 'CLAIMED':
        return {
          label: 'Active Capstone',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: GraduationCap,
        };
      case 'MERGED':
        return {
          label: 'Merged Solution',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: CheckCircle2,
        };
      case 'NEEDS_REVIEW':
        return {
          label: 'Needs Review',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Clock,
        };
      case 'PENDING':
      case 'PENDING_MODERATION':
        return {
          label: 'Under Moderation',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
        };
      case 'REJECTED':
        return {
          label: 'Rejected by Moderation',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertTriangle,
        };
      case 'PROCESSING_FAILED':
        return {
          label: 'Processing Failed',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: Tag,
        };
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">Sign in to View Your Problems</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Please log in to your account to view, monitor, and track the status of all civic challenges you have reported.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-nexus-primary text-white text-sm font-bold shadow-md shadow-nexus-primary/20 hover:bg-nexus-primary-container transition"
        >
          Sign In to Your Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primary Hero CTA: Submit a Problem (Report -> Track -> Impact) */}
      <div className="relative overflow-hidden rounded-3xl border border-nexus-primary/20 bg-gradient-to-br from-nexus-primary/10 via-white to-emerald-500/10 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-primary text-white text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> REPORT → TRACK → IMPACT
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-nexus-primary">
              Have a problem in your neighborhood?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Submit your report using our guided 7-step wizard. CivicNexus pairs your community challenge with accredited student engineering teams and corporate sponsors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-nexus-primary text-white text-sm font-bold hover:bg-nexus-primary-container transition shadow-xl shadow-nexus-primary/25 group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Submit a Problem
            </button>

            <button
              onClick={() => void fetchMyProblems(selectedStatus)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Guidance Section */}
      <CitizenGuidanceSection />

      {/* Official Government Portals Section */}
      <GovernmentLinksSection />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Filed</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-serif text-3xl font-bold text-slate-900 mt-1">{totals.total}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Under Review</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="font-serif text-3xl font-bold text-amber-900 mt-1">{totals.pendingModeration}</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Open for Claims</span>
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-serif text-3xl font-bold text-emerald-900 mt-1">{totals.open}</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Research Active</span>
            <GraduationCap className="w-4 h-4 text-blue-700" />
          </div>
          <p className="font-serif text-3xl font-bold text-blue-900 mt-1">{totals.inProgress + totals.claimed}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
        {[
          { key: 'ALL', label: 'All Problems', count: totals.total },
          { key: 'PENDING_MODERATION', label: 'Pending Review', count: totals.pendingModeration },
          { key: 'OPEN', label: 'Open for Research', count: totals.open },
          { key: 'IN_PROGRESS', label: 'Research Active', count: totals.inProgress + totals.claimed },
          { key: 'MERGED', label: 'Merged Solutions', count: totals.merged },
          { key: 'NEEDS_REVIEW', label: 'Needs Review', count: totals.needsReview },
          { key: 'REJECTED', label: 'Rejected', count: totals.rejected },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === tab.key
                ? 'bg-nexus-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-3xl bg-white border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            onClick={() => void fetchMyProblems(selectedStatus)}
            className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-slate-900">No problems found in this view</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {selectedStatus === 'ALL'
                ? "You haven't reported any civic challenges yet. Report a problem in your neighborhood to start the research and solution cycle."
                : `You do not have any problems currently in ${selectedStatus.replace(/_/g, ' ')} status.`}
            </p>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/15"
          >
            <Plus className="w-4 h-4" /> Report a Civic Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => {
            const badge = getStatusBadge(problem.status);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={problem.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-nexus-primary/30 hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-nexus-primary/10 text-nexus-primary">
                        {formatDomainName(problem.domain)}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                      >
                        <BadgeIcon className="w-3 h-3" /> {badge.label}
                      </span>

                      {problem.active_claims_count > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> {problem.active_claims_count}{' '}
                          {problem.active_claims_count === 1 ? 'University Team' : 'University Teams'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{problem.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                      {problem.description}
                    </p>
                  </div>

                  {problem.image_url && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={problem.image_url}
                        alt={problem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* University Research Capstone Banner */}
                {problem.university_claims && problem.university_claims.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" /> Active University Research Projects
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {problem.university_claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{claim.lead_university_name}</p>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Status: {claim.status}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            ${Number(claim.budget || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Moderation Notice */}
                {problem.status === 'PENDING_MODERATION' && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Awaiting Administrative Approval: </span>
                      This submission is currently being reviewed by civic moderators. Once approved, it will be published to the public explore feed and made discoverable to accredited universities.
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    {problem.latitude && problem.longitude && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {Number(problem.latitude).toFixed(4)}, {Number(problem.longitude).toFixed(4)}
                      </span>
                    )}
                    <span>Reported on {new Date(problem.created_at).toLocaleDateString()}</span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-400">ID: {problem.id.substring(0, 8)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Challenge Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <GuidedProblemWizard
              onClose={() => {
                setIsReportModalOpen(false);
                void fetchMyProblems(selectedStatus);
              }}
              onSuccess={() => {
                void fetchMyProblems(selectedStatus);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
