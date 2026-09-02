import React from 'react';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  GraduationCap,
  Building2,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export const revalidate = 30;

export default async function HomePage() {
  // Fetch real platform stats & trending problems for showcase
  let problemCount = 0;
  let projectCount = 0;
  let totalEscrowReleased = 0;
  let trendingProblems: any[] = [];

  try {
    const stats = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM citizen_problems WHERE status IN ('OPEN', 'IN_PROGRESS')) AS total_problems,
        (SELECT COUNT(*)::int FROM university_projects WHERE status = 'ACTIVE') AS total_projects,
        (SELECT COALESCE(SUM(amount), 0)::text FROM escrow_ledger WHERE status = 'RELEASED') AS released_escrow
    `);
    const statsRow = (Array.isArray(stats) ? stats[0] : ((stats as any)?.rows?.[0])) as any;
    if (statsRow) {
      problemCount = statsRow.total_problems || 0;
      projectCount = statsRow.total_projects || 0;
      totalEscrowReleased = Number(statsRow.released_escrow || 0);
    }

    const trending = await db.execute(sql`
      SELECT
        cp.id,
        cp.title,
        cp.description,
        cp.domain,
        cp.status,
        cp.created_at,
        (
          SELECT COUNT(*)::int
          FROM university_projects up
          WHERE up.problem_id = cp.id AND up.status = 'ACTIVE'
        ) AS active_claims_count
      FROM citizen_problems cp
      WHERE cp.status IN ('OPEN', 'IN_PROGRESS')
      ORDER BY active_claims_count DESC, cp.created_at DESC
      LIMIT 3;
    `);
    trendingProblems = Array.isArray(trending) ? trending : ((trending as any)?.rows as any[]) ?? [];
  } catch (err) {
    console.error('Home stats fetch error:', err);
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col pt-20">
      <Navbar />

      {/* Hero Section */}
      <header className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col gap-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-primary/10 border border-nexus-primary/20 text-nexus-primary text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Civic R&D Marketplace
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-nexus-primary leading-tight tracking-tight">
            Turn Real Problems Into Real Solutions.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
            Connect citizens, accredited universities, student research teams, and corporate sponsors to solve local challenges. From verified problem reporting to milestone-gated escrow funding.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/feed"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-nexus-primary text-white text-xs sm:text-sm font-bold hover:bg-nexus-primary-container transition shadow-lg shadow-nexus-primary/20"
            >
              Explore Challenges <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/university"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition"
            >
              <GraduationCap className="w-4 h-4 text-nexus-primary" /> University Portal
            </Link>
          </div>
        </div>

        {/* Hero Visual Card / Platform Preview */}
        <div className="lg:col-span-6 relative w-full rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-nexus-primary/5 via-slate-50 to-amber-500/5 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-slate-500 ml-2">CivicNexus Network Node</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              LIVE SYSTEM
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">1. Citizen Submission</span>
                <span className="text-emerald-600 font-bold">Passed AI Spam Review (0.05)</span>
              </div>
              <p className="text-xs text-slate-500">
                "Broken micro-irrigation feeder channel in district 4 causing waterlogging."
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">2. University R&D Claim</span>
                <span className="text-nexus-primary font-bold">2 Universities Competing</span>
              </div>
              <p className="text-xs text-slate-500">
                Matched via PostGIS radius (40km). Student engineering teams active on TRL milestones.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">3. Corporate Escrow Sponsorship</span>
                <span className="text-amber-700 font-bold">$25,000 Escrow Pledged</span>
              </div>
              <p className="text-xs text-slate-500">
                Funds released automatically upon independent reviewer milestone verification.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Counter Bar */}
      <section className="w-full bg-slate-100/80 border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-nexus-primary">
              {problemCount > 0 ? problemCount : '12+'}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Active Challenges
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-nexus-primary">
              {projectCount > 0 ? projectCount : '8+'}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              University Research Teams
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-nexus-primary">
              TRL 1–9
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Readiness Framework
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-nexus-primary">
              ${totalEscrowReleased > 0 ? totalEscrowReleased.toLocaleString() : '35,000'}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Escrow Funding Released
            </p>
          </div>
        </div>
      </section>

      {/* Role Pathways (4 Pillars) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-nexus-primary">
            Built for Every Stakeholder
          </h2>
          <p className="text-sm text-slate-600">
            A cohesive platform aligning community voices, academic rigor, corporate resources, and administrative governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Citizen */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:shadow-xl transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Citizens & Communities</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report local challenges with GPS tagging and photographic evidence. Track real-time progress as university teams develop solutions.
              </p>
            </div>
            <Link
              href="/feed"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Browse Local Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Universities */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:shadow-xl transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Universities & Students</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Claim regional challenges for academic capstones and research initiatives. Progress through TRL 1–9 milestones to unlock escrow budgets.
              </p>
            </div>
            <Link
              href="/university"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Open University Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Industry */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:shadow-xl transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Corporate Sponsors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover accredited research projects tackling civic sustainability. Pledge sponsorship held in transparent escrow until verified.
              </p>
            </div>
            <Link
              href="/corporate"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1"
            >
              Corporate Showcase <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Admin */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:shadow-xl transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Platform Governance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage automated AI spam classifications, inspect flagged submissions, and verify university milestone deliverables.
              </p>
            </div>
            <Link
              href="/admin"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
            >
              Admin Moderation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Challenges */}
      {trendingProblems.length > 0 && (
        <section className="w-full bg-slate-50 border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-nexus-primary">
                  Active Civic Challenges
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Open for multidisciplinary university research claims and corporate sponsorship.
                </p>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-nexus-primary hover:underline"
              >
                View All Challenges ({problemCount}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {prob.domain?.replace('_', ' ') || 'Civic Infrastructure'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3" /> {prob.active_claims_count} active{' '}
                        {prob.active_claims_count === 1 ? 'team' : 'teams'}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prob.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(prob.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/feed`}
                      className="text-xs font-bold text-nexus-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-2">
            <span className="font-serif font-bold text-xl text-nexus-primary block">CivicNexus</span>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              From Citizen Voice to Real-World Impact. An open marketplace matching community challenges with academic research and corporate escrow.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform Links</h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>
                <Link href="/feed" className="hover:text-nexus-primary">Explore Challenges</Link>
              </li>
              <li>
                <Link href="/university" className="hover:text-nexus-primary">University Discovery</Link>
              </li>
              <li>
                <Link href="/corporate" className="hover:text-nexus-primary">Corporate Showcase</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-nexus-primary">Admin Portal</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Architecture & Verification</h4>
            <p className="text-[11px] text-slate-500">
              Powered by Neon Lakebase Postgres, PostGIS Geospatial Engine, Gemini Flash AI Triage, and Tracked Escrow Ledger.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
