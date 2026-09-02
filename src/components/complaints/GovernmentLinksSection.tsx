'use client';

import React, { useState } from 'react';
import {
  Landmark,
  ExternalLink,
  Phone,
  ShieldCheck,
  ChevronDown,
  Info,
  Filter,
} from 'lucide-react';
import { GOVERNMENT_PORTALS, getGovernmentPortalsByCategory } from '@/lib/constants/government-portals';
import { CATEGORIES } from '@/lib/constants/categories';

export function GovernmentLinksSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  const portals = getGovernmentPortalsByCategory(selectedCategory);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-nexus-primary flex items-center gap-2">
              Official Government Reporting Directory
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Official Grievance Portals
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Need to file a formal statutory complaint with municipal authorities or central ministries? Access verified official portals here.
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
        <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
          {/* Important Regulatory Notice */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice to Citizens</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                <strong>CivicNexus</strong> connects community issues with accredited universities for research, engineering capstones, and corporate escrow sponsorship. If your issue requires an immediate statutory municipal order, emergency intervention, or legal notice, please file concurrently on the appropriate official portal below.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-nexus-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Official Portals
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-nexus-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3 hover:bg-white hover:shadow-md transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{portal.isNational ? 'National Portal' : 'State / Municipal'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {portal.portalName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{portal.departmentName}</p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {portal.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  {portal.helpline ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" /> {portal.helpline}
                    </span>
                  ) : (
                    <span />
                  )}

                  <a
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-nexus-primary hover:underline"
                  >
                    Visit Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
