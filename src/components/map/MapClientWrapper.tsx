'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const RegionalMapDashboard = dynamic(
  () => import('./RegionalMapDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[600px] rounded-3xl bg-slate-50 border border-slate-200 animate-pulse flex flex-col items-center justify-center p-12 text-center">
        <MapPin className="w-10 h-10 text-nexus-primary animate-bounce mb-3" />
        <h3 className="font-serif text-lg font-bold text-nexus-primary">Loading Regional Civic Map</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Preparing geographic density metrics, municipal centroids, and capstone research data...
        </p>
      </div>
    ),
  },
);

export default function MapClientWrapper() {
  return <RegionalMapDashboard />;
}
