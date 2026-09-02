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
  Compass,
  AlertTriangle,
  Bookmark,
  Bell,
  Sliders,
  Rocket,
  Scale,
  Settings,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth/use-auth';

// Corporate Modules
import { CompanyDashboardOverview } from '@/components/corporate/CompanyDashboardOverview';
import { CompanyProjectExplorer } from '@/components/corporate/CompanyProjectExplorer';
import { CompanyProjectDetailModal } from '@/components/corporate/CompanyProjectDetailModal';
import { CompanyProblemExplorer } from '@/components/corporate/CompanyProblemExplorer';
import { CompanyNeedsManager } from '@/components/corporate/CompanyNeedsManager';
import { CompanyCollaborationWorkspace } from '@/components/corporate/CompanyCollaborationWorkspace';
import { CompanyPilotManager } from '@/components/corporate/CompanyPilotManager';
import { CompanySavedProjects } from '@/components/corporate/CompanySavedProjects';
import { CompanyImpactDashboard } from '@/components/corporate/CompanyImpactDashboard';
import { CompanyProfileEditor } from '@/components/corporate/CompanyProfileEditor';
import { CompanyNotificationCenter } from '@/components/corporate/CompanyNotificationCenter';
import { ResourceOfferingModal } from '@/components/corporate/ResourceOfferingModal';

export type CorporateTab =
  | 'DASHBOARD'
  | 'PROJECTS'
  | 'PROBLEMS'
  | 'NEEDS'
  | 'RECOMMENDATIONS'
  | 'COLLABORATIONS'
  | 'PILOTS'
  | 'SAVED'
  | 'IMPACT'
  | 'PROFILE';

export default function CorporateDashboardPage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<CorporateTab>('DASHBOARD');

  // Global State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Modals
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [offeringProject, setOfferingProject] = useState<any | null>(null);
  const [isPilotWizardOpen, setIsPilotWizardOpen] = useState(false);
  const [pilotTargetProjectId, setPilotTargetProjectId] = useState<string | null>(null);
  const [pilotTargetProjectTitle, setPilotTargetProjectTitle] = useState<string | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, projRes, probRes, collabRes, pilotRes, savedRes, recRes, notifRes] = await Promise.all([
        fetch('/api/industry/dashboard'),
        fetch('/api/industry/projects'),
        fetch('/api/industry/problems'),
        fetch('/api/industry/collaborations'),
        fetch('/api/industry/pilots'),
        fetch('/api/industry/saved-projects'),
        fetch('/api/industry/recommendations'),
        fetch('/api/industry/notifications'),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
      }
      if (probRes.ok) {
        const prData = await probRes.json();
        setProblems(prData.problems || []);
      }
      if (collabRes.ok) {
        const cData = await collabRes.json();
        setCollaborations(cData.collaborations || []);
      }
      if (pilotRes.ok) {
        const piData = await pilotRes.json();
        setPilots(piData.pilots || []);
      }
      if (savedRes.ok) {
        const sData = await savedRes.json();
        setSavedProjects(sData.savedProjects || []);
      }
      if (recRes.ok) {
        setRecommendationsData(await recRes.json());
      }
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setUnreadNotificationsCount(nData.unreadCount || 0);
      }
    } catch (err: any) {
      console.error('Failed to load corporate data:', err);
      setError(err.message || 'An error occurred loading corporate portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
  }, []);

  const handleToggleSaveProject = async (projectId: string) => {
    try {
      const res = await fetch('/api/industry/saved-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.project_id === projectId ? { ...p, is_saved: data.isSaved } : p)),
        );
        // Refresh saved projects list
        const savedRes = await fetch('/api/industry/saved-projects');
        if (savedRes.ok) {
          const sData = await savedRes.json();
          setSavedProjects(sData.savedProjects || []);
        }
      }
    } catch (err) {
      console.error('Failed to toggle save project:', err);
    }
  };

  const handleRemoveSaved = async (savedId: string) => {
    try {
      const res = await fetch(`/api/industry/saved-projects/${savedId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSavedProjects((prev) => prev.filter((s) => s.id !== savedId));
        void fetchAllData();
      }
    } catch (err) {
      console.error('Failed to remove saved project:', err);
    }
  };

  const openPilotWizardForProject = (projId?: string, projTitle?: string) => {
    setPilotTargetProjectId(projId || null);
    setPilotTargetProjectTitle(projTitle || null);
    setIsPilotWizardOpen(true);
  };

  const navTabs: Array<{ id: CorporateTab; label: string; icon: any; count?: number }> = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: Building2 },
    { id: 'PROJECTS', label: 'Explore Projects', icon: Sparkles, count: projects.length },
    { id: 'PROBLEMS', label: 'Civic Challenges', icon: Compass, count: problems.length },
    { id: 'NEEDS', label: 'My Challenges', icon: Layers, count: dashboardData?.kpis?.openNeedsCount },
    { id: 'RECOMMENDATIONS', label: 'Smart AI Matches', icon: Sparkles },
    { id: 'COLLABORATIONS', label: 'Collaborations', icon: HeartHandshake, count: collaborations.length },
    { id: 'PILOTS', label: 'Live Pilots', icon: Rocket, count: pilots.length },
    { id: 'SAVED', label: 'Watchlist', icon: Bookmark, count: savedProjects.length },
    { id: 'IMPACT', label: 'CSR Impact', icon: TrendingUp },
    { id: 'PROFILE', label: 'Company Profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-grow space-y-6">
        {/* Top Header & Fast Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-nexus-primary text-white flex items-center justify-center shadow-md shadow-nexus-primary/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-nexus-primary tracking-tight">
                  Industry Innovation Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary/10 text-nexus-primary">
                  Production R&D
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Connecting Enterprise R&D with Accredited University Innovation Laboratories
              </p>
            </div>
          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
              title="Activity Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nexus-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => openPilotWizardForProject()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
            >
              <Rocket className="w-3.5 h-3.5" /> Propose Pilot
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                    : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'DASHBOARD' && (
          <CompanyDashboardOverview
            data={dashboardData}
            loading={loading}
            onNavigateTab={(tab) => setActiveTab(tab as CorporateTab)}
            onOpenProjectDetail={(id) => setDetailProjectId(id)}
            onOpenNeedModal={() => setActiveTab('NEEDS')}
            onOpenPilotWizard={(id) => openPilotWizardForProject(id)}
          />
        )}

        {/* Tab 2: Discover Projects (Innovation Explorer) */}
        {activeTab === 'PROJECTS' && (
          <CompanyProjectExplorer
            projects={projects}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenProjectDetail={(id) => setDetailProjectId(id)}
            onOpenResourceOffer={(p) => setOfferingProject(p)}
            onOpenEscrowSponsor={(p) => setDetailProjectId(p.project_id)}
            onOpenPilotWizard={(id, title) => openPilotWizardForProject(id, title)}
            onToggleSaveProject={handleToggleSaveProject}
          />
        )}

        {/* Tab 3: Explore Civic Challenges */}
        {activeTab === 'PROBLEMS' && (
          <CompanyProblemExplorer
            problems={problems}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenPilotWizard={(id, title) => openPilotWizardForProject(id, title)}
          />
        )}

        {/* Tab 4: My Industry Needs Board */}
        {activeTab === 'NEEDS' && <CompanyNeedsManager userRole={profile?.role} />}

        {/* Tab 5: Smart AI Recommendations */}
        {activeTab === 'RECOMMENDATIONS' && (
          <div className="space-y-6 font-sans">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> AI Synergy Matching Engine
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Tailored Innovation Opportunities
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Personalized algorithms analyzing technical skill intersections, published industry challenges, and regional pilot facility locations.
              </p>

              {/* Dynamic Insights */}
              {recommendationsData?.insights && (
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {recommendationsData.insights.map((insight: string, idx: number) => (
                    <span key={idx} className="bg-white/10 px-3 py-1 rounded-xl border border-white/15 text-purple-100 font-medium">
                      💡 {insight}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Projects Grid */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" /> High-Affinity University Projects
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {(recommendationsData?.recommendedProjects || []).map((p: any) => (
                  <div
                    key={p.project_id}
                    onClick={() => setDetailProjectId(p.project_id)}
                    className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" /> {p.matchScore}% Match
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nexus-primary text-white">
                          TRL {p.max_trl_level || 1}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-nexus-primary transition leading-snug">
                        {p.problem_title}
                      </h4>

                      <p className="text-xs text-slate-500 font-semibold">{p.lead_university_name}</p>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{p.problem_description}</p>

                      {p.matchReasons && (
                        <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/60 text-xs space-y-1">
                          <span className="font-bold text-purple-900 text-[11px] block">Why this matches:</span>
                          <div className="flex flex-wrap gap-1 text-[11px] text-purple-800">
                            {p.matchReasons.map((r: string, idx: number) => (
                              <span key={idx} className="bg-white px-2 py-0.5 rounded border border-purple-200">
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPilotWizardForProject(p.project_id, p.problem_title);
                        }}
                        className="font-bold text-nexus-primary hover:underline"
                      >
                        Propose Pilot →
                      </button>

                      <button
                        onClick={() => setDetailProjectId(p.project_id)}
                        className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200 transition"
                      >
                        View Project Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Collaborations Workspace */}
        {activeTab === 'COLLABORATIONS' && (
          <CompanyCollaborationWorkspace
            collaborations={collaborations}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenProjectDetail={(id) => setDetailProjectId(id)}
            onOpenNewProposal={() => setActiveTab('PROJECTS')}
          />
        )}

        {/* Tab 7: Pilots Management */}
        {activeTab === 'PILOTS' && (
          <CompanyPilotManager
            pilots={pilots}
            allProjects={projects}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenProjectDetail={(id) => setDetailProjectId(id)}
            isWizardOpen={isPilotWizardOpen}
            onCloseWizard={() => {
              setIsPilotWizardOpen(false);
              setPilotTargetProjectId(null);
              setPilotTargetProjectTitle(null);
            }}
            preselectedProjectId={pilotTargetProjectId}
            preselectedProjectTitle={pilotTargetProjectTitle}
          />
        )}

        {/* Tab 8: Saved Watchlist */}
        {activeTab === 'SAVED' && (
          <CompanySavedProjects
            savedProjects={savedProjects}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenProjectDetail={(id) => setDetailProjectId(id)}
            onRemoveSaved={handleRemoveSaved}
            onOpenPilotWizard={(id, title) => openPilotWizardForProject(id, title)}
          />
        )}

        {/* Tab 9: CSR Social Impact */}
        {activeTab === 'IMPACT' && <CompanyImpactDashboard />}

        {/* Tab 10: Company Profile Settings */}
        {activeTab === 'PROFILE' && <CompanyProfileEditor />}
      </main>

      {/* Project Detail Modal */}
      {detailProjectId && (
        <CompanyProjectDetailModal
          projectId={detailProjectId}
          onClose={() => setDetailProjectId(null)}
          onOpenPilotWizard={(id, title) => openPilotWizardForProject(id, title)}
          onRefresh={fetchAllData}
        />
      )}

      {/* Resource Offering Modal */}
      {offeringProject && (
        <ResourceOfferingModal
          projectId={offeringProject.project_id}
          projectTitle={offeringProject.problem_title}
          universityName={offeringProject.lead_university_name}
          onClose={() => setOfferingProject(null)}
          onSuccess={fetchAllData}
        />
      )}

      {/* Notification Center Drawer */}
      <CompanyNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => {
          setIsNotificationCenterOpen(false);
          void fetchAllData();
        }}
        onNavigate={(tab) => {
          if (tab.includes('university') || tab.includes('corporate')) {
            setActiveTab('COLLABORATIONS');
          }
        }}
      />
    </div>
  );
}
