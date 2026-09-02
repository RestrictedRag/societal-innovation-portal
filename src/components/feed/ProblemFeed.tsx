'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Flame,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUp,
  Plus,
  Compass,
  ThumbsUp,
  BookOpen,
} from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { Navbar } from '@/components/layout/Navbar';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { PostDetailModal, type PostDetailData } from './PostDetailModal';
import {
  type ConfirmedProblem,
  type OptimisticSubmission,
  getStoredSubmissions,
  submitWithRetry,
} from '@/lib/optimistic-submissions';

const DEFAULT_RADIUS_KM = 50;
const DEFAULT_LIMIT = 20;
const LOCATION_STORAGE_KEY = 'civic-feed-location-v1';

type FeedItem = {
  id: string;
  clientId?: string;
  backupId?: string;
  title: string;
  description: string;
  fullDescription?: string;
  domain: string | null;
  category?: string | null;
  subcategory?: string | null;
  imageUrl: string | null;
  media: string[];
  upvoteCount: number;
  activeProjectCount: number;
  createdAt: string;
  distanceKm: number;
  status?: 'pending' | 'confirmed' | 'failed' | 'pending_moderation';
  errorMessage?: string;
  isAuthError?: boolean;
};

type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'urban_infrastructure', label: 'Urban Infrastructure' },
  { id: 'water_management', label: 'Water Management' },
  { id: 'clean_energy', label: 'Clean Energy' },
  { id: 'waste_management', label: 'Waste Management' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'agriculture', label: 'Agriculture' },
];

export function ProblemFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* ── Geolocation ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (storedLocation) {
        const parsed = JSON.parse(storedLocation);
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          setUserLocation({ lat: Number(parsed.lat), lng: Number(parsed.lng) });
          setIsInitialLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to live navigator
    }

    if (!navigator.geolocation) {
      setUserLocation({ lat: 38.9072, lng: -77.0369 }); // Default fallback
      setIsInitialLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(nextLoc);
        try {
          window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLoc));
        } catch {}
      },
      () => {
        setUserLocation({ lat: 38.9072, lng: -77.0369 });
        setIsInitialLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  /* ── Feed fetch ── */
  const fetchFeed = async (cursor?: string | null) => {
    if (!userLocation) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams({
        lat: String(userLocation.lat),
        lng: String(userLocation.lng),
        radius_km: String(DEFAULT_RADIUS_KM),
        limit: String(DEFAULT_LIMIT),
      });

      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/feed?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load challenges.');

      const data: FeedResponse = await res.json();

      setItems((prev) => {
        if (!cursor) return data.items;
        const seen = new Set(prev.map((i) => i.id));
        const newOnes = data.items.filter((i) => !seen.has(i.id));
        return [...prev, ...newOnes];
      });

      setNextCursor(data.nextCursor);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load challenges.');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      void fetchFeed(null);
    }
  }, [userLocation]);

  /* ── URL Deep Link for Post ── */
  useEffect(() => {
    const postId = searchParams?.get('post');
    if (postId) {
      const match = items.find((i) => i.id === postId);
      if (match) {
        setSelectedPost(match);
      } else if (!selectedPost) {
        fetch(`/api/problems/${postId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.problem) {
              setSelectedPost({
                id: data.problem.id,
                title: data.problem.title,
                description: data.problem.description,
                fullDescription: data.problem.description,
                domain: data.problem.domain,
                category: data.problem.category,
                subcategory: data.problem.subcategory,
                imageUrl: data.problem.imageUrl || data.problem.media?.[0]?.url || null,
                media: data.problem.media?.map((m: any) => m.url) || [],
                upvoteCount: data.problem.upvotesCount || 0,
                activeProjectCount: data.problem.projects?.length || 0,
                createdAt: data.problem.createdAt,
                distanceKm: 0,
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [searchParams, items]);

  /* ── Infinite Scroll Observer ── */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !userLocation) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && nextCursor) {
          void fetchFeed(nextCursor);
        }
      },
      { rootMargin: '200px' },
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [isLoading, nextCursor, userLocation]);

  // Client-side filtering for immediate responsiveness
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        item.domain?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex-grow">
        {/* Page Title Header */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-nexus-primary tracking-tight">
                Explore Societal Challenges
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Discover verified civic issues waiting for university capstone teams, academic research, and corporate escrow sponsorship.
              </p>
            </div>

            <button
              onClick={() => setIsComplaintOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Report a Challenge
            </button>
          </div>
        </header>

        {/* Layout Grid: Sidebar Filters (3 cols) + Challenges Grid (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-28">
            <div className="flex items-center gap-2 text-nexus-primary border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Search & Filters</h2>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keywords</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search challenges..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Domain Category</label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === cat.id
                        ? 'bg-nexus-primary text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {selectedCategory === cat.id && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Challenges Grid */}
          <section className="lg:col-span-9 space-y-6">
            {fetchError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
                <span>{fetchError}</span>
                <button
                  onClick={() => void fetchFeed(null)}
                  className="text-xs font-bold text-rose-800 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-nexus-primary" />
                <p className="text-xs font-medium">Scanning nearby civic challenges...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm space-y-3">
                <Compass className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Challenges Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No issues matched your current search filters in this geographic radius. Be the first to report a challenge in your area!
                </p>
                <button
                  onClick={() => setIsComplaintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-primary text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Report New Challenge
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <article
                    key={item.id || item.clientId}
                    onClick={() => setSelectedPost(item)}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-nexus-primary/40 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {item.domain?.replace(/_/g, ' ') || 'Civic Problem'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.upvoteCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                              <ThumbsUp className="w-3 h-3 text-emerald-600" /> {item.upvoteCount}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                            <Flame className="w-3 h-3" /> {item.activeProjectCount} active{' '}
                            {item.activeProjectCount === 1 ? 'team' : 'teams'}
                          </span>
                        </div>
                      </div>

                      <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug group-hover:text-nexus-primary transition-colors">
                        {item.title}
                      </h2>

                      {item.imageUrl && (
                        <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-100">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.fullDescription || item.description}
                      </p>

                      <div className="text-xs font-bold text-nexus-primary group-hover:underline flex items-center gap-1 pt-0.5">
                        <BookOpen className="w-3.5 h-3.5" /> Read full post & evidence →
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.distanceKm.toFixed(1)} km away
                      </span>

                      <Link
                        href={`/university`}
                        className="text-xs font-bold text-nexus-primary hover:underline inline-flex items-center gap-1"
                      >
                        Claim for Research <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {isLoading && !isInitialLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-nexus-primary" />
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />
          </section>
        </div>
      </main>

      {/* Full Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpvoteToggle={(id, newCount) => {
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, upvoteCount: newCount } : i))
            );
          }}
        />
      )}

      {/* Report Modal */}
      {isComplaintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <ComplaintForm
              onClose={() => setIsComplaintOpen(false)}
              onSuccess={() => {
                setIsComplaintOpen(false);
                void fetchFeed(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
