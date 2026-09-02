'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  MapPin,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Check,
  X,
  User,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

type FlaggedProblem = {
  id: string;
  title: string;
  description: string;
  status: string;
  spamScore: number | null;
  domain: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  authorName: string;
  authorEmail: string;
  hasEmbedding: boolean;
  createdAt: string;
};

export default function AdminModerationPage() {
  const [problems, setProblems] = useState<FlaggedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'PENDING_MODERATION' | 'REJECTED'>('ALL');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === 'ALL' ? '/api/admin/problems' : `/api/admin/problems?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. You must be logged in with ADMIN role to access this portal.');
        }
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in with your administrative credentials.');
        }
        throw new Error('Failed to load moderation queue.');
      }
      const data = await res.json();
      setProblems(data.problems || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQueue();
  }, [filter]);

  const handleModerate = async (problemId: string, action: 'APPROVE' | 'REJECT') => {
    setActingId(problemId);
    try {
      const res = await fetch('/api/admin/problems/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, action }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Moderation action failed.');
      }

      // Remove from active queue view
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
    } catch (err: any) {
      alert(`Moderation Error: ${err.message}`);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex-grow space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Governance & Oversight
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-nexus-primary tracking-tight">
              AI Moderation Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Review flagged citizen submissions, override AI spam classification confidence scores, and verify public challenge integrity.
            </p>
          </div>

          <button
            onClick={() => void fetchQueue()}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </header>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In Queue</p>
              <p className="font-serif text-3xl font-bold text-nexus-primary mt-1">{problems.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-nexus-primary/10 flex items-center justify-center text-nexus-primary">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Flagged by Gemini Flash</p>
              <p className="font-serif text-3xl font-bold text-amber-700 mt-1">
                {problems.filter((p) => p.status === 'NEEDS_REVIEW').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Background Worker</p>
              <p className="font-serif text-3xl font-bold text-blue-700 mt-1">
                {problems.filter((p) => p.status === 'PENDING_MODERATION').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {(['ALL', 'NEEDS_REVIEW', 'PENDING_MODERATION', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                filter === tab
                  ? 'bg-nexus-primary text-white shadow-md shadow-nexus-primary/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Moderation Grid */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs text-rose-800">
            <p className="font-bold mb-1">Access Restricted</p>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-nexus-primary" />
            <p className="text-xs font-semibold">Scanning administrative moderation tasks...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Moderation Queue is Clean</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All citizen reports have been verified or resolved. No pending moderation issues found.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {problems.map((prob) => (
              <div
                key={prob.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        prob.status === 'NEEDS_REVIEW'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : prob.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {prob.status}
                    </span>

                    {prob.spamScore !== null && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          prob.spamScore >= 0.5
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        AI Spam Score: {(prob.spamScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug">
                      {prob.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Domain: <strong className="text-slate-700">{prob.domain || 'Uncategorized'}</strong>
                    </p>
                  </div>

                  {prob.imageUrl && (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-100">
                      <img
                        src={prob.imageUrl}
                        alt={prob.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {prob.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prob.authorName || prob.authorEmail || 'Anonymous Citizen'}</span>
                    </div>
                    {prob.latitude && prob.longitude && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {prob.latitude.toFixed(2)}, {prob.longitude.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => void handleModerate(prob.id, 'REJECT')}
                    disabled={actingId === prob.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject Report
                  </button>

                  <button
                    onClick={() => void handleModerate(prob.id, 'APPROVE')}
                    disabled={actingId === prob.id}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve & Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
