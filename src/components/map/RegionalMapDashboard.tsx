'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  BarChart3,
  Layers,
  GraduationCap,
  Sparkles,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Activity,
} from 'lucide-react';
import type { RegionData } from './LeafletMap';

// Dynamically load LeafletMap with SSR disabled to prevent window/document undefined issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-3xl bg-slate-100 animate-pulse flex flex-col items-center justify-center border border-slate-200">
      <MapPin className="w-8 h-8 text-slate-400 animate-bounce mb-2" />
      <p className="text-sm font-semibold text-slate-500">Loading interactive regional map...</p>
    </div>
  ),
});

export interface ProblemItem {
  id: string;
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
    | 'PROCESSING_FAILED'
    | 'RESOLVED';
  image_url: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  region_name: string;
  author_name: string | null;
  active_claims_count: number;
}

interface PlatformTotals {
  totalProblems: number;
  openCount: number;
  inProgressCount: number;
  claimedCount: number;
  pendingCount: number;
  totalRegions: number;
}

export default function RegionalMapDashboard() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [platformTotals, setPlatformTotals] = useState<PlatformTotals | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (regionFilter: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = regionFilter
        ? `/api/map/regions?region=${encodeURIComponent(regionFilter)}`
        : '/api/map/regions';

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load regional map data.');
      }
      const data = await res.json();
      setRegions(data.regions || []);
      setProblems(data.problems || []);
      setPlatformTotals(data.platformTotals || null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading map data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    void fetchData(selectedRegion);
  }, [selectedRegion]);

  // Current stats object based on whether a region is selected
  const activeStats = useMemo(() => {
    if (selectedRegion) {
      const currentRegion = regions.find((r) => r.region_name === selectedRegion);
      if (currentRegion) {
        return {
          title: currentRegion.region_name,
          total: Number(currentRegion.total_problems) || 0,
          open: Number(currentRegion.open_count) || 0,
          inProgress: Number(currentRegion.inProgress_count) || 0,
          claimed: Number(currentRegion.claimed_count) || 0,
          pending: Number(currentRegion.pending_count) || 0,
          domains: currentRegion.domains_breakdown || {},
        };
      }
    }

    // Platform-wide aggregation
    const allDomains: Record<string, number> = {};
    regions.forEach((r) => {
      if (r.domains_breakdown) {
        Object.entries(r.domains_breakdown).forEach(([domain, count]) => {
          allDomains[domain] = (allDomains[domain] || 0) + Number(count);
        });
      }
    });

    return {
      title: 'Platform-Wide (All Regions)',
      total: platformTotals?.totalProblems || 0,
      open: platformTotals?.openCount || 0,
      inProgress: platformTotals?.inProgressCount || 0,
      claimed: platformTotals?.claimedCount || 0,
      pending: platformTotals?.pendingCount || 0,
      domains: allDomains,
    };
  }, [selectedRegion, regions, platformTotals]);

  // Selected problem object if active
  const selectedProblem = useMemo(() => {
    if (!selectedProblemId) return null;
    return problems.find((p) => p.id === selectedProblemId) || null;
  }, [selectedProblemId, problems]);

  // Total active claims across current scope
  const activeClaimsInScope = useMemo(() => {
    return problems.reduce((acc, p) => acc + (Number(p.active_claims_count) || 0), 0);
  }, [problems]);

  const formatDomainName = (domain: string | null | undefined) => {
    if (!domain) return 'Other';
    return domain
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-nexus-primary flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-nexus-secondary" /> Regional Problem Density & Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Explore geographic problem distribution across municipal nodes and monitor civic capstone progress. Click any dot on the map to jump directly to its problem statement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedRegion && (
            <button
              onClick={() => {
                setSelectedRegion(null);
                setSelectedProblemId(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Reset to All Regions
            </button>
          )}
          <button
            onClick={() => void fetchData(selectedRegion)}
            disabled={Boolean(loading)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Region Chips Quick Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Regions:
        </span>
        <button
          onClick={() => {
            setSelectedRegion(null);
            setSelectedProblemId(null);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            selectedRegion === null
              ? 'bg-nexus-primary text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Regions ({regions.length})
        </button>
        {regions.map((region) => (
          <button
            key={region.region_name}
            onClick={() => {
              setSelectedRegion(region.region_name);
              setSelectedProblemId(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedRegion === region.region_name
                ? 'bg-nexus-primary text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{region.region_name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedRegion === region.region_name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {region.total_problems}
            </span>
          </button>
        ))}
      </div>

      {/* Top Interactive Map */}
      <LeafletMap
        regions={regions}
        problems={problems}
        selectedRegion={selectedRegion}
        selectedProblemId={selectedProblemId}
        onSelectRegion={(name) => {
          setSelectedRegion(name);
          setSelectedProblemId(null);
        }}
        onSelectProblem={(id) => setSelectedProblemId(id)}
      />

      {/* Bottom Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bottom Left: Problem List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-nexus-primary" />
              <h3 className="font-bold text-base text-slate-900">
                {selectedRegion ? `Problems in ${selectedRegion}` : 'Recent Challenges (All Regions)'}
              </h3>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {problems.length} listed
            </span>
          </div>

          {/* Map Selection Focus Banner */}
          {selectedProblem && (
            <div className="rounded-2xl border border-nexus-primary/30 bg-nexus-primary/5 p-3.5 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-nexus-primary shrink-0" />
                <span className="font-bold text-nexus-primary shrink-0">Selected Problem:</span>
                <span className="text-slate-800 font-semibold truncate">{selectedProblem.title}</span>
              </div>
              <button
                onClick={() => setSelectedProblemId(null)}
                className="text-xs font-bold text-nexus-primary hover:underline shrink-0"
              >
                Clear Focus
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : problems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600">No problems found in this region.</p>
              <p className="text-xs text-slate-400">Be the first to report a local challenge in this municipal area.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {problems.map((problem) => {
                const isSelected = selectedProblemId === problem.id;

                return (
                  <div
                    key={problem.id}
                    id={`problem-card-${problem.id}`}
                    onClick={() => setSelectedProblemId(isSelected ? null : problem.id)}
                    className={`rounded-2xl border p-5 transition cursor-pointer group ${
                      isSelected
                        ? 'border-nexus-primary ring-4 ring-nexus-primary/20 bg-emerald-50/40 shadow-lg scale-[1.005]'
                        : 'border-slate-200 bg-white hover:border-nexus-primary/40 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-nexus-primary/10 text-nexus-primary">
                            {formatDomainName(problem.domain)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              problem.status === 'OPEN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : problem.status === 'IN_PROGRESS' || problem.status === 'CLAIMED'
                                ? 'bg-blue-100 text-blue-800'
                                : problem.status === 'RESOLVED' || problem.status === 'MERGED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {problem.status.replace(/_/g, ' ')}
                          </span>

                          {isSelected && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-nexus-primary text-white flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3 text-nexus-primary-fixed" /> Selected on Map
                            </span>
                          )}

                          {problem.active_claims_count > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> {problem.active_claims_count}{' '}
                              {problem.active_claims_count === 1 ? 'Claim' : 'Claims'}
                            </span>
                          )}
                        </div>
                        <h4
                          className={`font-bold text-sm transition ${
                            isSelected ? 'text-nexus-primary text-base' : 'text-slate-900 group-hover:text-nexus-primary'
                          }`}
                        >
                          {problem.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>

                      {problem.image_url && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={problem.image_url}
                            alt={problem.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {problem.region_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{new Date(problem.created_at).toLocaleDateString()}</span>
                        {isSelected && (
                          <span className="text-[10px] text-nexus-primary font-bold">● Active on Map</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Right: Regional Stats Dashboard (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-nexus-primary" />
              <h3 className="font-bold text-base text-slate-900">
                {selectedRegion ? `${selectedRegion} Stats` : 'Platform Metrics'}
              </h3>
            </div>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Problems
              </span>
              <p className="font-serif text-3xl font-bold text-nexus-primary mt-1">
                {activeStats.total}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Open for Research
              </span>
              <p className="font-serif text-3xl font-bold text-emerald-900 mt-1">
                {activeStats.open}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Under Active Capstone
              </span>
              <p className="font-serif text-3xl font-bold text-blue-900 mt-1">
                {activeStats.inProgress + activeStats.claimed}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Active Uni Claims
              </span>
              <p className="font-serif text-3xl font-bold text-amber-900 mt-1">
                {activeClaimsInScope}
              </p>
            </div>
          </div>

          {/* Domain Category Breakdown */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-nexus-primary" /> Domain Breakdown
            </h4>

            {Object.keys(activeStats.domains).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No domain categorical data recorded.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(activeStats.domains)
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .map(([domain, count]) => {
                    const percentage = activeStats.total > 0 ? Math.round((Number(count) / activeStats.total) * 100) : 0;
                    return (
                      <div key={domain} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{formatDomainName(domain)}</span>
                          <span className="font-bold text-slate-900">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-nexus-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
