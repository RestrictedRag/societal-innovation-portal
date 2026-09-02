'use client';

import React, { useState } from 'react';
import {
  Bookmark,
  Scale,
  Trash2,
  ExternalLink,
  GraduationCap,
  Building2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';

interface CompanySavedProjectsProps {
  savedProjects: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProjectDetail: (projectId: string) => void;
  onRemoveSaved: (savedId: string) => void;
  onOpenPilotWizard: (projectId: string, projectTitle: string) => void;
}

export function CompanySavedProjects({
  savedProjects,
  loading,
  onRefresh,
  onOpenProjectDetail,
  onRemoveSaved,
  onOpenPilotWizard,
}: CompanySavedProjectsProps) {
  const [comparisonList, setComparisonList] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const toggleCompare = (p: any) => {
    if (comparisonList.some((item) => item.project_id === p.id)) {
      setComparisonList((prev) => prev.filter((item) => item.project_id !== p.id));
    } else {
      if (comparisonList.length >= 3) {
        alert('You can compare a maximum of 3 projects simultaneously.');
        return;
      }
      setComparisonList((prev) => [...prev, p]);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Saved Projects & Watchlist
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate bookmarked university innovations, compare technical capabilities, and initiate pilot deployments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {comparisonList.length >= 2 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
            >
              <Scale className="w-3.5 h-3.5" /> Compare ({comparisonList.length}) Side-by-Side
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Loading saved watchlist...</span>
        </div>
      ) : savedProjects.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">Your Watchlist is Empty</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any project in the Innovation Explorer to save it here for team evaluation.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {savedProjects.map((item) => {
            const project = item.project || {};
            const problem = project.problem || {};
            const university = project.leadUniversity || {};
            const isCompared = comparisonList.some((c) => c.id === project.id);

            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {problem.domain?.replace(/_/g, ' ') || 'Civic Domain'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                        TRL {project.maxTrl || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleCompare(project)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
                          isCompared
                            ? 'bg-nexus-primary text-white border-nexus-primary'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Scale className="w-3 h-3" /> {isCompared ? 'Compared' : 'Compare'}
                      </button>

                      <button
                        onClick={() => onRemoveSaved(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">{problem.title}</h3>
                  <p className="text-xs text-slate-500">
                    Lead Academic Partner: <strong className="text-slate-800">{university.name}</strong>
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{problem.description}</p>

                  {item.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900">
                      <strong>Watchlist Note:</strong> {item.notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenPilotWizard(project.id, problem.title)}
                    className="text-xs font-bold text-nexus-primary hover:underline"
                  >
                    Propose Pilot →
                  </button>

                  <button
                    onClick={() => onOpenProjectDetail(project.id)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200 transition flex items-center gap-1"
                  >
                    View Dossier <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-5xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-nexus-primary" />
                <h3 className="font-serif text-xl font-bold text-slate-900">Side-by-Side Spec Comparison</h3>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {comparisonList.map((p) => {
                const prob = p.problem || {};
                const uni = p.leadUniversity || {};
                const stu = p.claimedByUser || {};

                return (
                  <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-nexus-primary text-white">
                        TRL {p.maxTrl || 1}
                      </span>
                      <h4 className="font-serif text-base font-bold text-slate-900 mt-1">{prob.title}</h4>
                      <p className="text-slate-500 text-[11px]">{uni.name}</p>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <strong className="text-slate-700 block">Civic Domain:</strong>
                        <span className="text-slate-600 capitalize">{prob.domain?.replace(/_/g, ' ')}</span>
                      </div>

                      <div>
                        <strong className="text-slate-700 block">Student Lead:</strong>
                        <span className="text-slate-600">{stu.fullName || 'University Team'}</span>
                      </div>

                      <div>
                        <strong className="text-slate-700 block">Student Skills:</strong>
                        <span className="text-slate-600">{(stu.skills || []).join(', ') || 'N/A'}</span>
                      </div>

                      <div>
                        <strong className="text-slate-700 block">Verified Milestones:</strong>
                        <span className="text-slate-600">
                          {p.verifiedMilestones || 0} / {p.totalMilestones || 0} verified
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          setIsCompareModalOpen(false);
                          onOpenProjectDetail(p.id);
                        }}
                        className="w-full py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 hover:bg-slate-100"
                      >
                        View Full Dossier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
