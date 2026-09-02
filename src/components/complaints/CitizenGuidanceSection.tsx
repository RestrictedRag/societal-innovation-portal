'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  FileCheck,
  ChevronDown,
  Info,
  Sparkles,
  MapPin,
  Camera,
  ShieldCheck,
} from 'lucide-react';

export function CitizenGuidanceSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-nexus-primary flex items-center gap-2">
              How to Report a Problem effectively
              <span className="text-[10px] font-bold uppercase tracking-wider bg-nexus-primary/10 text-nexus-primary px-2 py-0.5 rounded-full">
                Reporting Guide
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Learn what to include, how our AI pipeline analyzes reports, and what makes a high-impact submission.
            </p>
          </div>
        </div>

        <div
          className={`w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {/* 1. What to Report */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-nexus-primary font-bold text-xs uppercase tracking-wide">
              <FileCheck className="w-4 h-4" />
              <span>What to Report</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Real civic infrastructure failures (potholes, water leaks, dark roads).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Community hazards affecting neighborhood health and safety.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Systemic municipal problems suitable for engineering R&D.</span>
              </li>
            </ul>
          </div>

          {/* 2. How to Report */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-nexus-primary font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>How to Report</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-nexus-primary/10 text-nexus-primary font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <span>Select the accurate problem type & subcategory.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-nexus-primary/10 text-nexus-primary font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <span>Write 30+ descriptive words outlining impact.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-nexus-primary/10 text-nexus-primary font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <span>Tag your exact GPS location for regional university matching.</span>
              </li>
            </ul>
          </div>

          {/* 3. What to Include */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>What to Include</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Clear photographic evidence or field snapshots.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Exact landmark, sector, or street coordinates.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Estimated duration (e.g., "persisting for 3 weeks").</span>
              </li>
            </ul>
          </div>

          {/* 4. What NOT to Include */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>What NOT to Submit</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>Commercial advertisements, promotional links, or spam.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>Private interpersonal disputes or landlord disputes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>Offensive language, abusive claims, or fake reports.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
