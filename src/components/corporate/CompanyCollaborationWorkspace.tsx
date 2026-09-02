'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  Users,
  GraduationCap,
  Building2,
  DollarSign,
  Cpu,
  Layers,
  Calendar,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface CompanyCollaborationWorkspaceProps {
  collaborations: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNewProposal: () => void;
}

export function CompanyCollaborationWorkspace({
  collaborations,
  loading,
  onRefresh,
  onOpenProjectDetail,
  onOpenNewProposal,
}: CompanyCollaborationWorkspaceProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCollaborations = collaborations.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const getProposalIcon = (type: string) => {
    switch (type) {
      case 'MENTORSHIP':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'FUNDING':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'HARDWARE':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'PILOT_LOCATION':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      default:
        return <Layers className="w-4 h-4 text-nexus-primary" />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
            Industry Collaboration Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track active mentorship agreements, hardware resource grants, cloud credits, and pilot partnership proposals.
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
        {['ALL', 'ACCEPTED', 'PROPOSED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              statusFilter === st
                ? 'bg-nexus-primary text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Collaborations Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
          <span>Loading collaboration workspaces...</span>
        </div>
      ) : filteredCollaborations.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-slate-900">No Collaborations in this Category</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse university innovation projects to offer mentorship, sponsor escrow funding, or supply hardware.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCollaborations.map((collab) => {
            const project = collab.project || {};
            const problem = project.problem || {};
            const university = project.leadUniversity || {};
            const student = project.claimedByUser || {};

            return (
              <div
                key={collab.id}
                className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1.5 rounded-lg bg-slate-100">{getProposalIcon(collab.proposalType)}</span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        {collab.proposalType?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        collab.status === 'ACCEPTED' || collab.status === 'IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : collab.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {collab.status}
                    </span>
                  </div>

                  {/* Title & Project Target */}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">{collab.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Project: <strong className="text-slate-800">{problem.title || 'University Project'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">🏛️ {university.name}</p>
                  </div>

                  {/* Commitment Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <p className="text-slate-700 leading-relaxed">{collab.description}</p>

                    {collab.commitment && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold">Committed Resource:</span>
                        <strong className="text-slate-900">{collab.commitment}</strong>
                      </div>
                    )}

                    {Number(collab.estimatedValue || 0) > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Estimated Value:</span>
                        <strong className="text-emerald-700">${Number(collab.estimatedValue).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>

                  {/* Faculty Feedback if any */}
                  {collab.facultyFeedback && (
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 text-xs space-y-1">
                      <span className="font-bold text-purple-900 text-[11px]">👨‍🏫 Faculty Feedback:</span>
                      <p className="text-purple-800 text-[11px]">{collab.facultyFeedback}</p>
                    </div>
                  )}

                  {/* Student Team Contact */}
                  {student.fullName && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Student Lead: <strong className="text-slate-800">{student.fullName}</strong>
                      </span>
                      <span>{student.department}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Initiated {new Date(collab.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => onOpenProjectDetail(collab.projectId)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition flex items-center gap-1"
                  >
                    View Project Dossier <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
