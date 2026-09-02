'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  X,
  Award,
  Building2,
  Users,
  Layers,
  GraduationCap,
  DollarSign,
  Rocket,
  Lock,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Bookmark,
  Send,
  Loader2,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Cpu,
} from 'lucide-react';
import { ResourceOfferingModal } from './ResourceOfferingModal';
import { CompanyInterestModal } from './CompanyInterestModal';

interface CompanyProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
  onOpenPilotWizard?: (projectId: string, projectTitle: string) => void;
  onRefresh?: () => void;
}

export function CompanyProjectDetailModal({
  projectId,
  onClose,
  onOpenPilotWizard,
  onRefresh,
}: CompanyProjectDetailModalProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-modal triggers
  const [isOfferingResources, setIsOfferingResources] = useState(false);
  const [isRequestingMeeting, setIsRequestingMeeting] = useState(false);
  const [isSponsoringEscrow, setIsSponsoringEscrow] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState('20000');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);
  const [pledgeFeedback, setPledgeFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/industry/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to load project details.');
      const data = await res.json();
      setProject(data.project);
    } catch (err: any) {
      setError(err.message || 'Error fetching project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjectDetails();
  }, [projectId]);

  const handleToggleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/industry/saved-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject((prev: any) => ({ ...prev, isSaved: data.isSaved }));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePledgeEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSubmittingPledge(true);
    setPledgeFeedback(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(pledgeAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deposit escrow funds.');

      setPledgeFeedback('Successfully pledged funds into verified milestone escrow!');
      setTimeout(() => {
        setIsSponsoringEscrow(false);
        void fetchProjectDetails();
        if (onRefresh) onRefresh();
      }, 1200);
    } catch (err: any) {
      setPledgeFeedback(err.message || 'Pledge failed.');
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl rounded-3xl bg-white p-12 text-center shadow-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-primary" />
          <p className="text-xs font-bold text-slate-600">Loading university innovation dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900">{error || 'Project not found'}</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  const problem = project.problem || {};
  const university = project.leadUniversity || {};
  const student = project.claimedByUser || {};
  const milestones = project.updates || [];
  const ledgers = project.ledgers || [];
  const pilots = project.pilots || [];
  const collaborations = project.collaborations || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
        <div className="w-full max-w-4xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    project.projectType === 'RESEARCH'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {project.projectType === 'RESEARCH' ? '🔬 Academic Research' : '⚡ Problem-Solving Prototype'}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  {problem.domain?.replace(/_/g, ' ') || 'Civic Domain'}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                  TRL {project.maxTrl || 1} Demonstrated
                </span>

                {project.matchScore && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {project.matchScore}% Synergy Match
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl font-bold text-slate-900 leading-snug">{problem.title}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>
                  Lead Institution: <strong className="text-slate-800">{university.name}</strong>
                </span>
                <span>•</span>
                <span>
                  Status: <strong className="text-emerald-700 font-bold">{project.status}</strong>
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSave}
                disabled={isSaving}
                className={`p-2 rounded-xl border transition ${
                  project.isSaved
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
                title={project.isSaved ? 'Saved in watchlist' : 'Bookmark to watchlist'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Match Explanation Callout */}
          {project.matchReasons && project.matchReasons.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-900 block mb-0.5">
                  Why this project matches your corporate innovation focus:
                </span>
                <div className="flex flex-wrap gap-2 text-[11px] text-purple-800">
                  {project.matchReasons.map((reason: string, idx: number) => (
                    <span key={idx} className="bg-white/80 px-2 py-0.5 rounded-md border border-purple-200">
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Civic Problem & Proposed Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target Civic Challenge</span>
              <p className="text-slate-700 leading-relaxed">{problem.description}</p>
              {problem.category && (
                <p className="text-slate-500 text-[11px]">
                  Category: <span className="font-semibold text-slate-700">{problem.category}</span>
                  {problem.subcategory && ` / ${problem.subcategory}`}
                </p>
              )}
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Academic Solution & TRL Roadmap</span>
              <p className="text-slate-700 leading-relaxed">
                {milestones.length > 0
                  ? milestones[0]?.description
                  : 'Multi-phase technical capstone project developing verified functional hardware and edge intelligence.'}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px]">
                <span className="text-emerald-800 font-bold">
                  {milestones.filter((m: any) => m.verified).length} of {milestones.length} Milestones Verified
                </span>
              </div>
            </div>
          </div>

          {/* Research Team & Faculty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-nexus-primary" /> Lead Student Researcher
                </span>
                {student.yearOfStudy && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                    Year {student.yearOfStudy}
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 text-sm">{student.fullName || 'Student Lead'}</p>
              <p className="text-slate-500">{student.department || 'Engineering Department'}</p>
              {student.skills && student.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {student.skills.slice(0, 4).map((skill: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Academic Faculty Verifier
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {milestones[0]?.verifier?.fullName || 'Accredited Faculty Lab Director'}
              </p>
              <p className="text-slate-500">{milestones[0]?.verifier?.department || university.name}</p>
              <p className="text-[11px] text-slate-400">
                Independent laboratory oversight and milestone verification protocol.
              </p>
            </div>
          </div>

          {/* Verified Milestones Timeline */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Technology Readiness Milestones (TRL 1–9)
            </h4>
            <div className="space-y-2">
              {milestones.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center">
                  No milestones logged yet for this project.
                </div>
              ) : (
                milestones.map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                      m.verified ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          TRL {m.trlLevel}
                        </span>
                        <span className="font-semibold text-slate-900">{m.description}</span>
                      </div>
                      {m.evidenceUrl && (
                        <a
                          href={m.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-nexus-primary hover:underline font-bold"
                        >
                          View Research Evidence Artifact <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {m.verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Faculty
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold">Under Lab Review</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Financial & Escrow Status */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Allocated Budget</span>
              <span className="font-bold text-slate-900 font-serif text-sm">${Number(project.budget || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Escrow Held</span>
              <span className="font-bold text-amber-700 font-serif text-sm">
                ${Number(project.totalEscrowHeld || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Escrow Released</span>
              <span className="font-bold text-emerald-700 font-serif text-sm">
                ${Number(project.totalEscrowReleased || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Active Pilots</span>
              <span className="font-bold text-nexus-primary font-serif text-sm">{pilots.length} Municipal Testbeds</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRequestingMeeting(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Calendar className="w-3.5 h-3.5 text-nexus-primary" /> Request Meeting
              </button>

              <button
                onClick={() => setIsOfferingResources(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Cpu className="w-3.5 h-3.5 text-nexus-primary" /> Offer Hardware / Resources
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenPilotWizard) {
                    onOpenPilotWizard(project.id, problem.title);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                <Rocket className="w-3.5 h-3.5" /> Propose Live Pilot
              </button>

              <button
                onClick={() => {
                  setIsSponsoringEscrow(true);
                  setPledgeFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shadow-md shadow-amber-600/20"
              >
                <DollarSign className="w-3.5 h-3.5" /> Sponsor Escrow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Modal: Sponsor Escrow */}
      {isSponsoringEscrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-nexus-primary">Pledge Milestone Escrow</h3>
              <button onClick={() => setIsSponsoringEscrow(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Funding for <strong className="text-slate-800">{problem.title}</strong> is locked in smart escrow and
              released to university lab accounts only upon faculty milestone verification.
            </p>

            {pledgeFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                {pledgeFeedback}
              </div>
            )}

            <form onSubmit={handlePledgeEscrow} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pledge Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSponsoringEscrow(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPledge}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-nexus-primary hover:bg-nexus-primary-container transition shadow-md"
                >
                  {isSubmittingPledge ? 'Depositing...' : 'Confirm Escrow Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Resource Offering */}
      {isOfferingResources && (
        <ResourceOfferingModal
          projectId={project.id}
          projectTitle={problem.title}
          universityName={university.name}
          onClose={() => setIsOfferingResources(false)}
          onSuccess={() => void fetchProjectDetails()}
        />
      )}

      {/* Sub-Modal: Meeting Request */}
      {isRequestingMeeting && (
        <CompanyInterestModal
          projectId={project.id}
          projectTitle={problem.title}
          universityName={university.name}
          studentName={student.fullName}
          studentId={student.id}
          facultyName={milestones[0]?.verifier?.fullName}
          facultyId={milestones[0]?.verifier?.id}
          onClose={() => setIsRequestingMeeting(false)}
          onSuccess={() => void fetchProjectDetails()}
        />
      )}
    </>
  );
}
