'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Layers,
  Award,
  DollarSign,
  Rocket,
  Bookmark,
  Building2,
  Users,
  GraduationCap,
  ChevronRight,
  Sliders,
  Check,
  X,
  Scale,
  RefreshCw,
} from 'lucide-react';

interface CompanyProjectExplorerProps {
  projects: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProjectDetail: (projectId: string) => void;
  onOpenResourceOffer: (project: any) => void;
  onOpenEscrowSponsor: (project: any) => void;
  onOpenPilotWizard: (projectId: string, projectTitle: string) => void;
  onToggleSaveProject: (projectId: string) => void;
}

export function CompanyProjectExplorer({
  projects,
  loading,
  onRefresh,
  onOpenProjectDetail,
  onOpenResourceOffer,
  onOpenEscrowSponsor,
  onOpenPilotWizard,
  onToggleSaveProject,
}: CompanyProjectExplorerProps) {
  const [projectTypeFilter, setProjectTypeFilter] = useState<'ALL' | 'RESEARCH' | 'PROBLEM_SOLVING'>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedTrl, setSelectedTrl] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonList, setComparisonList] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    if (projectTypeFilter !== 'ALL' && p.project_type !== projectTypeFilter) return false;
    if (selectedDomain !== 'ALL' && p.domain !== selectedDomain) return false;
    if (selectedTrl !== 'ALL' && (p.max_trl_level || 1) < selectedTrl) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.problem_title?.toLowerCase().includes(q);
      const matchDesc = p.problem_description?.toLowerCase().includes(q);
      const matchUni = p.lead_university_name?.toLowerCase().includes(q);
      const matchSkills = (p.student_skills || []).some((s: string) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchUni && !matchSkills) return false;
    }
    return true;
  });

  const toggleCompare = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparisonList.some((item) => item.project_id === p.project_id)) {
      setComparisonList((prev) => prev.filter((item) => item.project_id !== p.project_id));
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
      {/* Header & Filter Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
              University Innovation Explorer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse accredited university R&D projects, evaluate prototypes, and sponsor live municipal pilot testbeds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by tech, skill, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>

          {/* Project Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl font-semibold">
            <button
              onClick={() => setProjectTypeFilter('ALL')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                projectTypeFilter === 'ALL' ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setProjectTypeFilter('PROBLEM_SOLVING')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                projectTypeFilter === 'PROBLEM_SOLVING'
                  ? 'bg-white text-nexus-primary font-bold shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              ⚡ Solutions
            </button>
            <button
              onClick={() => setProjectTypeFilter('RESEARCH')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                projectTypeFilter === 'RESEARCH' ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
              }`}
            >
              🔬 Research
            </button>
          </div>

          {/* Domain Filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-nexus-primary focus:bg-white transition"
          >
            <option value="ALL">All Civic Domains</option>
            <option value="water_management">Water Management</option>
            <option value="waste_management">Waste Management</option>
            <option value="clean_energy">Clean Energy</option>
            <option value="urban_infrastructure">Urban Infrastructure</option>
            <option value="healthcare">Healthcare</option>
            <option value="agriculture">Agriculture & Agritech</option>
            <option value="disaster_management">Disaster Management</option>
            <option value="governance">Governance</option>
          </select>

          {/* TRL Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl font-semibold">
            <button
              onClick={() => setSelectedTrl('ALL')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                selectedTrl === 'ALL' ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
              }`}
            >
              All TRL
            </button>
            <button
              onClick={() => setSelectedTrl(3)}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                selectedTrl === 3 ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
              }`}
            >
              TRL 3+ (PoC)
            </button>
            <button
              onClick={() => setSelectedTrl(5)}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                selectedTrl === 5 ? 'bg-white text-nexus-primary font-bold shadow-sm' : 'text-slate-600'
              }`}
            >
              TRL 5+ (Pilot)
            </button>
          </div>
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {comparisonList.length > 0 && (
        <div className="sticky top-24 z-30 rounded-2xl bg-slate-900 text-white p-4 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-nexus-primary-fixed" />
            <span className="text-xs font-bold">{comparisonList.length} of 3 Projects Selected for Comparison</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setComparisonList([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
            >
              Compare Side-by-Side →
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Discovering verified university initiatives...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">No Projects Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, TRL thresholds, or project domain filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((p) => {
            const isCompared = comparisonList.some((item) => item.project_id === p.project_id);

            return (
              <div
                key={p.project_id}
                onClick={() => onOpenProjectDetail(p.project_id)}
                className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-nexus-primary/40 transition cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.project_type === 'RESEARCH'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.project_type === 'RESEARCH' ? '🔬 Research' : '⚡ Solution'}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {p.domain?.replace(/_/g, ' ') || 'Civic Domain'}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                        TRL {p.max_trl_level || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleCompare(p, e)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
                          isCompared
                            ? 'bg-nexus-primary text-white border-nexus-primary'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Compare with another project"
                      >
                        <Scale className="w-3 h-3" />
                        {isCompared ? 'Compared' : 'Compare'}
                      </button>

                      <button
                        onClick={() => onToggleSaveProject(p.project_id)}
                        className={`p-1.5 rounded-lg border transition ${
                          p.is_saved
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Save to watchlist"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Project Title & University */}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-nexus-primary transition leading-snug">
                      {p.problem_title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lead Academic Partner: <strong className="text-slate-800">{p.lead_university_name}</strong>
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{p.problem_description}</p>

                  {/* Student Skills / Team tags */}
                  {p.student_skills && p.student_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.student_skills.slice(0, 3).map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Match Reasons */}
                  {p.match_reasons && p.match_reasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-[11px] text-purple-900 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span className="font-medium truncate">
                        {p.match_score}% Match: {p.match_reasons[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {p.verified_milestones} / {p.total_milestones} Milestones Verified
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenResourceOffer(p)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                    >
                      Offer Support
                    </button>

                    <button
                      onClick={() => onOpenPilotWizard(p.project_id, p.problem_title)}
                      className="px-3.5 py-1.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-sm"
                    >
                      Propose Pilot
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-5xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-nexus-primary" />
                <h3 className="font-serif text-xl font-bold text-slate-900">Project Spec Comparison Matrix</h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {comparisonList.map((p) => (
                <div key={p.project_id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-nexus-primary text-white">
                      TRL {p.max_trl_level || 1}
                    </span>
                    <h4 className="font-serif text-base font-bold text-slate-900 mt-1">{p.problem_title}</h4>
                    <p className="text-slate-500 text-[11px]">{p.lead_university_name}</p>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <strong className="text-slate-700 block">Civic Domain:</strong>
                      <span className="text-slate-600 capitalize">{p.domain?.replace(/_/g, ' ')}</span>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Project Type:</strong>
                      <span className="text-slate-600">{p.project_type}</span>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Student Skills:</strong>
                      <span className="text-slate-600">{(p.student_skills || []).join(', ') || 'N/A'}</span>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Milestones Progress:</strong>
                      <span className="text-slate-600">
                        {p.verified_milestones} / {p.total_milestones} verified
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">AI Match Score:</strong>
                      <span className="font-bold text-purple-700">{p.match_score || 80}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        onOpenProjectDetail(p.project_id);
                      }}
                      className="w-full py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 hover:bg-slate-100"
                    >
                      View Full Dossier
                    </button>
                    <button
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        onOpenPilotWizard(p.project_id, p.problem_title);
                      }}
                      className="w-full py-2 rounded-xl bg-nexus-primary text-white font-bold hover:bg-nexus-primary-container"
                    >
                      Propose Pilot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
