'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Building2,
  DollarSign,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Droplet,
  Recycle,
  Sun,
  GraduationCap,
} from 'lucide-react';

export function CompanyImpactDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/industry/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
        <span>Calculating measurable CSR social impact...</span>
      </div>
    );
  }

  const summary = analytics.summary || {};
  const domainDistribution = analytics.domainDistribution || [];
  const csrMetrics = analytics.csrMetrics || [];
  const pilotsTimeline = analytics.pilotsTimeline || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Public Sector CSR Impact
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Measurable Social Impact Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Independent ledger-verified metrics tracking societal transformation, civic problem resolution, and academic workforce development funded by your corporate innovation grants.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* Global Impact Bento KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            Estimated Citizens Impacted
          </span>
          <p className="font-serif text-3xl font-bold text-emerald-700">
            {Number(summary.citizensImpactedEstimate || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Across live municipal testbeds</p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            University Projects Funded
          </span>
          <p className="font-serif text-3xl font-bold text-slate-900">
            {summary.totalProjectsSupported || 0}
          </p>
          <p className="text-[11px] text-slate-500">{summary.studentsSupported || 0} student researchers supported</p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            Escrow Capital Deployed
          </span>
          <p className="font-serif text-3xl font-bold text-amber-700">
            ${Number(summary.totalCommittedFunding || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            ${Number(summary.totalReleasedFunding || 0).toLocaleString()} milestone-verified
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            Municipal Pilots Completed
          </span>
          <p className="font-serif text-3xl font-bold text-blue-700">
            {summary.completedPilots || 0}
          </p>
          <p className="text-[11px] text-slate-500">{summary.activePilots || 0} active live testbeds</p>
        </div>
      </div>

      {/* Environmental & Operational Impact Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-slate-900">Environmental & Operational Savings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {csrMetrics.map((m: any, idx: number) => {
            const isWater = m.domain === 'water_management';
            const isWaste = m.domain === 'waste_management';
            const isEnergy = m.domain === 'clean_energy';

            return (
              <div
                key={idx}
                className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isWater
                        ? 'bg-blue-50 text-blue-600'
                        : isWaste
                        ? 'bg-emerald-50 text-emerald-600'
                        : isEnergy
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {isWater ? (
                      <Droplet className="w-5 h-5" />
                    ) : isWaste ? (
                      <Recycle className="w-5 h-5" />
                    ) : isEnergy ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <GraduationCap className="w-5 h-5" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {m.domain?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <p className="font-serif text-2xl font-bold text-slate-900">{m.value}</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{m.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Breakdown Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Civic Domain Distribution</h3>
            <p className="text-xs text-slate-500">Number of university initiatives supported across focus domains</p>
          </div>

          <div className="space-y-3 pt-2">
            {domainDistribution.map((d: any, idx: number) => {
              const totalProjects = domainDistribution.reduce((sum: number, item: any) => sum + item.projectCount, 0) || 1;
              const percent = Math.round((d.projectCount / totalProjects) * 100);

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="capitalize text-slate-700">{d.domain}</span>
                    <span className="text-slate-500">
                      {d.projectCount} Projects ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-nexus-primary rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Pilot Progression List */}
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Live Pilot Deployments</h3>
            <p className="text-xs text-slate-500">Real-time municipal testbed status</p>
          </div>

          <div className="space-y-3 pt-2">
            {pilotsTimeline.map((p: any) => (
              <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{p.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>📍 {p.location}</span>
                  <span>{p.progressPercent}% Deployed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
