'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  ThumbsUp,
  AlertTriangle,
  GraduationCap,
  Building2,
  ChevronRight,
  X,
  ExternalLink,
  Rocket,
  RefreshCw,
} from 'lucide-react';

interface CompanyProblemExplorerProps {
  problems: any[];
  loading: boolean;
  onRefresh: () => void;
  onSelectProject?: (projectId: string) => void;
  onOpenPilotWizard?: (projectId: string, projectTitle: string) => void;
}

export function CompanyProblemExplorer({
  problems,
  loading,
  onRefresh,
  onSelectProject,
  onOpenPilotWizard,
}: CompanyProblemExplorerProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);

  const filteredProblems = problems.filter((p) => {
    if (selectedDomain !== 'ALL' && p.domain !== selectedDomain) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCity = p.reporter_city?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCity && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Search & Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
              Explore Regional Civic Challenges
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Discover grassroots civic problems reported by citizens, view academic response teams, and identify pilot targets.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keyword, location, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>

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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-nexus-primary focus:bg-white transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress (University Claimed)</option>
            <option value="OPEN">Open for Innovation</option>
            <option value="NEEDS_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Loading citizen challenges...</span>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">No Civic Challenges Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try broadening your search query or selecting &quot;All Civic Domains&quot;.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProblems.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProblem(p)}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-nexus-primary/40 transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {p.domain?.replace(/_/g, ' ') || 'Civic Problem'}
                  </span>

                  <div className="flex items-center gap-2">
                    {p.has_active_pilot && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        🚀 Pilot Active
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" /> {p.upvote_count || 0} Upvotes
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-nexus-primary transition leading-snug">
                  {p.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.reporter_city || 'Regional'}, {p.reporter_state || 'India'}
                  </span>
                  <span>•</span>
                  <span>{p.category || 'General Issue'}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-nexus-primary" /> {p.active_projects_count || 0} University Solutions
                </span>

                <span className="font-bold text-nexus-primary group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-xs">
                  View Problem Dossier <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problem Detail Modal Drawer */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                  {selectedProblem.domain?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500">{selectedProblem.category}</span>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-slate-900 leading-snug">{selectedProblem.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Reported in {selectedProblem.reporter_city},{' '}
                {selectedProblem.reporter_state} • {selectedProblem.upvote_count || 0} community upvotes
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs leading-relaxed text-slate-700">
              {selectedProblem.description}
            </div>

            {selectedProblem.matchReasons && selectedProblem.matchReasons.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs space-y-1">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Why this problem aligns with your industry expertise:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-purple-800">
                  {selectedProblem.matchReasons.map((r: string, idx: number) => (
                    <span key={idx} className="bg-white/90 px-2 py-0.5 rounded border border-purple-200">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Active University Teams: <strong>{selectedProblem.active_projects_count || 0}</strong>
              </span>

              <button
                onClick={() => setSelectedProblem(null)}
                className="px-5 py-2.5 rounded-xl bg-nexus-primary text-white font-bold hover:bg-nexus-primary-container transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
