'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Flame,
  Award,
  Layers,
  FileCheck,
  Send,
  Building2,
  TrendingUp,
  UserCheck,
  Sliders,
  Check,
  Filter,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { StudentProfileModal } from '@/components/student/StudentProfileModal';
import { FacultyExpertiseModal } from '@/components/faculty/FacultyExpertiseModal';
import { ProjectHealthOverview, type ProjectHealthItem } from '@/components/faculty/ProjectHealthOverview';
import { PostDetailModal } from '@/components/feed/PostDetailModal';
import { BookOpen } from 'lucide-react';

type DiscoveryProblem = {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  problem_type?: string | null;
  category?: string | null;
  subcategory?: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  active_claims_count: number;
  claimed_by_my_university: boolean;
  matchScore?: number;
  matchTier?: 'HIGH' | 'MEDIUM' | 'GENERAL';
  reasons?: string[];
};

type MyProject = {
  project_id: string;
  problem_id: string;
  problem_title: string;
  domain: string | null;
  project_type?: 'RESEARCH' | 'PROBLEM_SOLVING';
  health_status?: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK';
  project_status: string;
  budget: string;
  lead_university_name: string;
  created_at: string;
  last_activity_at?: string;
  days_since_last_activity?: number;
  total_milestones: number;
  verified_milestones: number;
  unverified_milestones?: number;
};

export default function UniversityDashboardPage() {
  const [activeTab, setActiveTab] = useState<'DISCOVERY' | 'MY_PROJECTS' | 'FACULTY_HEALTH'>('DISCOVERY');
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [university, setUniversity] = useState<{ id: string; name: string } | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [discoveryProblems, setDiscoveryProblems] = useState<DiscoveryProblem[]>([]);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedProjectType, setSelectedProjectType] = useState<'ALL' | 'RESEARCH' | 'PROBLEM_SOLVING'>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  // Modals
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [isFacultyProfileOpen, setIsFacultyProfileOpen] = useState(false);
  const [readingProblem, setReadingProblem] = useState<DiscoveryProblem | null>(null);

  // Claim Modal State
  const [claimingProblem, setClaimingProblem] = useState<DiscoveryProblem | null>(null);
  const [claimBudget, setClaimBudget] = useState('5000');
  const [claimTrack, setClaimTrack] = useState<'PROBLEM_SOLVING' | 'RESEARCH'>('PROBLEM_SOLVING');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Milestone Modal State
  const [milestoneProject, setMilestoneProject] = useState<MyProject | null>(null);
  const [milestoneTrl, setMilestoneTrl] = useState(3);
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneEvidence, setMilestoneEvidence] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);
  const [milestoneStatus, setMilestoneStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/universities/discovery');
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to access your University Dashboard.');
        }
        if (res.status === 403) {
          throw new Error('Only student or faculty accounts can access this portal.');
        }
        throw new Error('Failed to load university portal data.');
      }
      const data = await res.json();
      setUserRole(data.role || 'STUDENT');
      setUserProfile(data.userProfile || null);
      setUniversity(data.university);
      setIsVerified(data.isVerified ?? true);
      setDiscoveryProblems(data.discoveryProblems || []);
      setMyProjects(data.myProjects || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingProblem) return;

    setIsSubmittingClaim(true);
    setClaimMessage(null);

    try {
      const res = await fetch('/api/projects/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: claimingProblem.id,
          budget: Number(claimBudget) || 0,
          projectType: claimTrack,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to claim challenge.');
      }

      setClaimMessage({ type: 'success', text: 'Challenge successfully claimed for research!' });
      setTimeout(() => {
        setClaimingProblem(null);
        void fetchData();
      }, 1000);
    } catch (err: any) {
      setClaimMessage({ type: 'error', text: err.message || 'Error claiming challenge.' });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneProject) return;

    setIsSubmittingMilestone(true);
    setMilestoneStatus(null);

    try {
      const res = await fetch('/api/projects/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: milestoneProject.project_id,
          trlLevel: milestoneTrl,
          description: milestoneDesc,
          evidenceUrl: milestoneEvidence || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit milestone.');
      }

      setMilestoneStatus('TRL Milestone submitted successfully for verification!');
      setTimeout(() => {
        setMilestoneProject(null);
        setMilestoneDesc('');
        setMilestoneEvidence('');
        setMilestoneStatus(null);
        void fetchData();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Error submitting milestone.');
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  // Filtered Discovery Problems
  const filteredDiscovery = discoveryProblems.filter((prob) => {
    if (selectedDomain !== 'ALL' && prob.domain !== selectedDomain) return false;
    return true;
  });

  // Filtered Projects
  const filteredProjects = myProjects.filter((proj) => {
    if (selectedProjectType !== 'ALL' && proj.project_type !== selectedProjectType) return false;
    if (selectedDomain !== 'ALL' && proj.domain !== selectedDomain) return false;
    return true;
  });

  // Map to ProjectHealthItem for Faculty Suite
  const facultyHealthItems: ProjectHealthItem[] = myProjects.map((p) => ({
    project_id: p.project_id,
    problem_title: p.problem_title,
    lead_university_name: p.lead_university_name,
    project_type: p.project_type || 'PROBLEM_SOLVING',
    status: p.project_status,
    health_status: (p.health_status as any) || 'HEALTHY',
    budget: p.budget,
    total_milestones: p.total_milestones,
    verified_milestones: p.verified_milestones,
    unverified_milestones: p.unverified_milestones || 0,
    days_since_last_activity: p.days_since_last_activity || 0,
    last_activity_at: p.last_activity_at || p.created_at,
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* University Portal Header Banner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-nexus-primary/10 border border-nexus-primary/20 flex items-center justify-center text-nexus-primary shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-nexus-primary">
                  {userRole === 'FACULTY' ? 'Faculty Innovation & Research Suite' : 'Student Innovation & R&D Hub'}
                </h1>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  {university ? university.name : 'Regional Innovation Hub'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Personalized problem-solving challenges and research capstones matched with your academic department, engineering skills, and laboratory specializations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {userRole === 'FACULTY' ? (
              <button
                type="button"
                onClick={() => setIsFacultyProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                <Sliders className="w-3.5 h-3.5" /> Research Expertise
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsStudentProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                <Sliders className="w-3.5 h-3.5" /> My Skills & Profile
              </button>
            )}

            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Verification Alert Banner If Pending */}
        {!isVerified && (
          <div className="rounded-3xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Academic Affiliation Verification Pending
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your university credentials have been registered and are currently awaiting administrative confirmation. You can explore challenges and view match scores.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('DISCOVERY')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'DISCOVERY'
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Discovery Feed ({discoveryProblems.length})
            </button>

            <button
              onClick={() => setActiveTab('MY_PROJECTS')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'MY_PROJECTS'
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Claimed Projects ({myProjects.length})
            </button>

            {userRole === 'FACULTY' && (
              <button
                onClick={() => setActiveTab('FACULTY_HEALTH')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'FACULTY_HEALTH'
                    ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Project Health & At-Risk Suite
              </button>
            )}
          </div>

          {/* Project Track Filters (Research vs Problem-Solving) */}
          {activeTab === 'MY_PROJECTS' && (
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setSelectedProjectType('ALL')}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedProjectType === 'ALL' ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setSelectedProjectType('PROBLEM_SOLVING')}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedProjectType === 'PROBLEM_SOLVING'
                    ? 'bg-white text-nexus-primary font-bold shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Problem-Solving
              </button>
              <button
                onClick={() => setSelectedProjectType('RESEARCH')}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedProjectType === 'RESEARCH'
                    ? 'bg-white text-nexus-primary font-bold shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Academic Research
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs text-rose-800">
            <p className="font-bold mb-1">Access Notice</p>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-nexus-primary" />
            <p className="text-xs font-semibold">Loading personalized innovation workspace...</p>
          </div>
        ) : activeTab === 'FACULTY_HEALTH' ? (
          /* Faculty Innovation Health Suite */
          <ProjectHealthOverview
            projects={facultyHealthItems}
            onOpenMilestoneVerify={(projId) => {
              const target = myProjects.find((p) => p.project_id === projId);
              if (target) setMilestoneProject(target);
            }}
          />
        ) : activeTab === 'DISCOVERY' ? (
          /* Discovery Grid with AI Match Badges */
          filteredDiscovery.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Open Challenges in Your Area</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Check back soon as citizens in your university's service area report new challenges.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredDiscovery.map((prob) => {
                const matchScore = prob.matchScore || 50;
                const isHighMatch = matchScore >= 75;

                return (
                  <div
                    key={prob.id}
                    onClick={() => setReadingProblem(prob)}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-nexus-primary/40 transition flex flex-col justify-between space-y-4 cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {prob.domain?.replace(/_/g, ' ') || 'General'}
                          </span>
                          {isHighMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <Sparkles className="w-3 h-3" /> {matchScore}% AI Affinity
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                          <Flame className="w-3 h-3" /> {prob.active_claims_count} active{' '}
                          {prob.active_claims_count === 1 ? 'team' : 'teams'}
                        </span>
                      </div>

                      <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug group-hover:text-nexus-primary transition-colors">
                        {prob.title}
                      </h2>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {prob.description}
                      </p>

                      <div className="text-xs font-bold text-nexus-primary group-hover:underline flex items-center gap-1 pt-0.5">
                        <BookOpen className="w-3.5 h-3.5" /> Read full post & evidence →
                      </div>

                      {/* "Why this project?" Explainability Badges */}
                      {prob.reasons && prob.reasons.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {prob.reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-blue-600" /> {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-slate-400">
                        Reported {new Date(prob.created_at).toLocaleDateString()}
                      </span>

                      {prob.claimed_by_my_university ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Claimed by Us
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setClaimingProblem(prob);
                            setClaimMessage(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Claim for R&D
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* My Active Projects */
          filteredProjects.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
              <Award className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Projects Matching Filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Claim challenges from the Discovery Feed to populate your student engineering portfolio.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.project_id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {proj.project_status}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {proj.project_type === 'RESEARCH' ? 'Academic Research' : 'Problem-Solving Capstone'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Budget: ${Number(proj.budget).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug">
                        {proj.problem_title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Lead: {proj.lead_university_name}</p>
                    </div>

                    {/* TRL Milestones Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Verified TRL Deliverables:</span>
                      <span className="font-bold text-nexus-primary">
                        {proj.verified_milestones} of {proj.total_milestones} Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setMilestoneProject(proj)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Submit TRL Milestone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Claim Modal */}
        {claimingProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-nexus-primary">Claim Challenge for R&D</h3>
                <button
                  onClick={() => setClaimingProblem(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500">Selected Challenge:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{claimingProblem.title}</p>
              </div>

              {claimMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    claimMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {claimMessage.text}
                </div>
              )}

              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Project Track
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClaimTrack('PROBLEM_SOLVING')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                        claimTrack === 'PROBLEM_SOLVING'
                          ? 'bg-nexus-primary text-white border-nexus-primary shadow-sm'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Problem-Solving Capstone
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimTrack('RESEARCH')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                        claimTrack === 'RESEARCH'
                          ? 'bg-nexus-primary text-white border-nexus-primary shadow-sm'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Academic Research
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Proposed Initial Project Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={claimBudget}
                    onChange={(e) => setClaimBudget(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimingProblem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClaim}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container transition disabled:opacity-50 shadow-md shadow-nexus-primary/20"
                  >
                    {isSubmittingClaim ? 'Claiming...' : 'Confirm Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Submission Modal */}
        {milestoneProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-nexus-primary">Submit TRL Milestone Deliverable</h3>
                <button
                  onClick={() => setMilestoneProject(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500">Project:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{milestoneProject.problem_title}</p>
              </div>

              {milestoneStatus && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {milestoneStatus}
                </div>
              )}

              <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technology Readiness Level (TRL 1–9)
                  </label>
                  <select
                    value={milestoneTrl}
                    onChange={(e) => setMilestoneTrl(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  >
                    <option value={1}>TRL 1 — Basic principles observed and reported</option>
                    <option value={2}>TRL 2 — Technology concept formulated</option>
                    <option value={3}>TRL 3 — Analytical and experimental critical function</option>
                    <option value={4}>TRL 4 — Component validation in laboratory</option>
                    <option value={5}>TRL 5 — Component validation in relevant environment</option>
                    <option value={6}>TRL 6 — Prototype demonstration in relevant environment</option>
                    <option value={7}>TRL 7 — Prototype demonstration in operational environment</option>
                    <option value={8}>TRL 8 — Actual system completed and qualified</option>
                    <option value={9}>TRL 9 — Actual system proven in operational environment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Milestone Description & Findings
                  </label>
                  <textarea
                    rows={3}
                    value={milestoneDesc}
                    onChange={(e) => setMilestoneDesc(e.target.value)}
                    placeholder="Describe laboratory results, prototype benchmarks, or field testing data..."
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evidence URL / Report Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={milestoneEvidence}
                    onChange={(e) => setMilestoneEvidence(e.target.value)}
                    placeholder="https://github.com/... or https://drive.google.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMilestoneProject(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMilestone || !milestoneDesc.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container transition disabled:opacity-50 shadow-md shadow-nexus-primary/20"
                  >
                    {isSubmittingMilestone ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student Profile Modal */}
        {isStudentProfileOpen && (
          <StudentProfileModal
            onClose={() => setIsStudentProfileOpen(false)}
            onProfileUpdated={() => void fetchData()}
          />
        )}

        {/* Faculty Expertise Modal */}
        {isFacultyProfileOpen && (
          <FacultyExpertiseModal
            onClose={() => setIsFacultyProfileOpen(false)}
            onProfileUpdated={() => void fetchData()}
          />
        )}

        {/* Post Detail Reader Modal */}
        {readingProblem && (
          <PostDetailModal
            post={{
              id: readingProblem.id,
              title: readingProblem.title,
              description: readingProblem.description,
              domain: readingProblem.domain,
              category: readingProblem.category,
              subcategory: readingProblem.subcategory,
              imageUrl: readingProblem.image_url,
              upvoteCount: 0,
              activeProjectCount: readingProblem.active_claims_count,
              createdAt: readingProblem.created_at,
            }}
            onClose={() => setReadingProblem(null)}
          />
        )}
      </main>
    </div>
  );
}
