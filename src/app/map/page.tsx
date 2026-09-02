import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import MapClientWrapper from '@/components/map/MapClientWrapper';

export const metadata: Metadata = {
  title: 'Regional Map & Problem Density | CivicNexus',
  description:
    'Explore geographic civic problem density across municipal regions, monitor domain breakdowns, and discover university research capstones.',
};

export default function RegionalMapPage() {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex-grow">
        <MapClientWrapper />
      </main>
    </div>
  );
}
