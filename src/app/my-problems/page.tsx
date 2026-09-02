import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import MyProblemsView from '@/components/problems/MyProblemsView';

export const metadata: Metadata = {
  title: 'My Reported Challenges | CivicNexus',
  description:
    'Track and manage your submitted civic challenges, monitor moderation progress, and view university research capstone activity.',
};

export default function MyProblemsPage() {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex-grow">
        <MyProblemsView />
      </main>
    </div>
  );
}
