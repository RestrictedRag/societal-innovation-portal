'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import {
  type ConfirmedProblem,
  type OptimisticSubmission,
  getStoredSubmissions,
  submitWithRetry,
} from '@/lib/optimistic-submissions';

const DEFAULT_RADIUS_KM = 25;
const DEFAULT_LIMIT = 20;
const LOCATION_STORAGE_KEY = 'civic-feed-location-v1';

type FeedItem = {
  id: string;
  clientId?: string;
  backupId?: string;
  title: string;
  description: string;
  domain: string | null;
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

type SessionUser = {
  name?: string;
  email?: string;
};

/* ── Helpers ── */

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDistance(value: number) {
  if (!Number.isFinite(value)) {
    return '0.0 km';
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} km`;
}

function domainLabel(domain: string | null) {
  if (!domain) return 'Community';
  return domain
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const DOMAIN_COLORS: Record<string, string> = {
  healthcare: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  agriculture: 'bg-lime-100 text-lime-700 border-lime-200',
  education: 'bg-blue-100 text-blue-700 border-blue-200',
  disaster_management: 'bg-red-100 text-red-700 border-red-200',
  clean_energy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  water_management: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  urban_infrastructure: 'bg-orange-100 text-orange-700 border-orange-200',
  governance: 'bg-violet-100 text-violet-700 border-violet-200',
  financial_inclusion: 'bg-pink-100 text-pink-700 border-pink-200',
  waste_management: 'bg-amber-100 text-amber-700 border-amber-200',
};

function getDomainColor(domain: string | null) {
  if (!domain) return 'bg-gray-100 text-gray-600 border-gray-200';
  return DOMAIN_COLORS[domain] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

/* ── Upvote icon (reddit-style arrow) ── */
function UpvoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 3l7 7h-4v7H7v-7H3l7-7z" />
    </svg>
  );
}

/* ── Location pin icon ── */
function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

/* ── Comment icon ── */
function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  );
}

/* ── Plus icon ── */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Main component ── */

export function ProblemFeed() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* Complaint modal */
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);

  /* Session */
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const queryKey = useMemo(() => {
    if (!userLocation) {
      return null;
    }

    return new URLSearchParams({
      lat: String(userLocation.lat),
      lng: String(userLocation.lng),
      radius_km: String(DEFAULT_RADIUS_KM),
      limit: String(DEFAULT_LIMIT),
    }).toString();
  }, [userLocation]);

  /* ── Load session ── */
  useEffect(() => {
    let isCurrent = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!isCurrent) return;
        if (response.ok) {
          const payload = (await response.json()) as { user?: SessionUser };
          setSessionUser(payload.user ?? null);
        }
      } catch {
        if (isCurrent) setSessionUser(null);
      } finally {
        if (isCurrent) setSessionResolved(true);
      }
    };

    void loadSession();
    return () => { isCurrent = false; };
  }, []);

  /* ── Geolocate ── */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (storedLocation) {
        const parsed = JSON.parse(storedLocation) as { lat?: number; lng?: number };
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          setUserLocation({ lat: Number(parsed.lat), lng: Number(parsed.lng) });
          setLocationError(null);
          setIsInitialLoading(false);
          return;
        }
      }
    } catch {
      // ignore invalid localStorage data and fall back to live geolocation
    }

    if (!navigator.geolocation) {
      setLocationError('Location access is unavailable in this browser.');
      setIsInitialLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setLocationError(null);
        try {
          window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLocation));
        } catch {
          // ignore persistence failures silently
        }
      },
      () => {
        setLocationError('We need your location to show nearby civic issues.');
        setIsInitialLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  /* ── Fetch feed ── */
  const fetchFeed = async (cursor?: string | null) => {
    if (!userLocation) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams({
        lat: String(userLocation.lat),
        lng: String(userLocation.lng),
        radius_km: String(DEFAULT_RADIUS_KM),
        limit: String(DEFAULT_LIMIT),
      });

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/feed?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Unable to load the feed.');
      }

      const data = (await response.json()) as FeedResponse;

      setItems((previous) => {
        const pendingOrFailed = previous.filter(
          (item) => item.status === 'pending' || item.status === 'failed',
        );

        const serverItems = data.items;
        const serverClientIds = new Set(serverItems.map((s) => s.clientId).filter(Boolean));
        const serverIds = new Set(serverItems.map((s) => s.id));

        const remainingPending = pendingOrFailed.filter(
          (p) =>
            (!p.clientId || !serverClientIds.has(p.clientId)) &&
            !serverIds.has(p.id) &&
            (!p.backupId || !serverIds.has(p.backupId)),
        );

        const merged = cursor
          ? [...previous, ...serverItems]
          : [...remainingPending, ...serverItems];

        const seen = new Set<string>();
        const finalItems = merged.filter((item) => {
          const key = item.clientId || item.id || item.backupId;
          if (!key || seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });

        return finalItems;
      });

      setNextCursor(data.nextCursor ?? null);
    } catch {
      setFetchError('Unable to load more nearby issues right now.');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionResolved || !userLocation || !queryKey) {
      return;
    }

    void fetchFeed(null);
  }, [sessionResolved, queryKey, userLocation]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !userLocation) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first || !first.isIntersecting || isLoading || !nextCursor) {
          return;
        }

        void fetchFeed(nextCursor);
      },
      { rootMargin: '200px' },
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isLoading, nextCursor, userLocation]);

  /* ── Resume pending submissions from localStorage on mount ── */
  useEffect(() => {
    const stored = getStoredSubmissions();
    if (stored.length > 0) {
      const storedFeedItems: FeedItem[] = stored.map((s) => ({
        id: s.backupId,
        backupId: s.backupId,
        clientId: s.clientId,
        title: s.title,
        description: s.description,
        domain: s.domain,
        imageUrl: s.imageUrl,
        media: s.media,
        upvoteCount: 0,
        activeProjectCount: 0,
        createdAt: s.createdAt,
        distanceKm: 0,
        status: s.status,
        errorMessage: s.errorMessage,
        isAuthError: s.isAuthError,
      }));

      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.clientId || item.id));
        const newOnes = storedFeedItems.filter((item) => item.clientId && !existingIds.has(item.clientId));
        return [...newOnes, ...prev];
      });

      // Auto-retry any items that were left in 'pending' state
      stored.forEach((s) => {
        if (s.status === 'pending') {
          void submitWithRetry(s, {
            onSuccess: (confirmed) => handleConfirmedSuccess(s.clientId, confirmed),
            onFail: (failed) => handleOptimisticFail(failed),
          });
        }
      });
    }
  }, []);

  /* ── Sign out ── */
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } catch {
      setIsSigningOut(false);
    }
  };

  /* ── Optimistic complaint handlers ── */
  const handleOptimisticAdd = (submission: OptimisticSubmission) => {
    const newItem: FeedItem = {
      id: submission.backupId,
      backupId: submission.backupId,
      clientId: submission.clientId,
      title: submission.title,
      description: submission.description,
      domain: submission.domain,
      imageUrl: submission.imageUrl,
      media: submission.media,
      upvoteCount: 0,
      activeProjectCount: 0,
      createdAt: submission.createdAt,
      distanceKm: 0,
      status: 'pending',
    };

    setItems((previous) => [newItem, ...previous.filter((i) => i.clientId !== submission.clientId)]);
  };

  const handleConfirmedSuccess = (clientId: string, problem: ConfirmedProblem) => {
    setItems((previous) =>
      previous.map((item) =>
        item.clientId === clientId || item.id === clientId || item.backupId === clientId
          ? {
              ...item,
              id: problem.id,
              clientId: problem.clientId,
              backupId: undefined,
              status: 'confirmed',
              errorMessage: undefined,
              isAuthError: undefined,
              createdAt: problem.createdAt,
            }
          : item,
      ),
    );
  };

  const handleOptimisticFail = (failed: OptimisticSubmission) => {
    setItems((previous) =>
      previous.map((item) =>
        item.clientId === failed.clientId
          ? {
              ...item,
              status: 'failed',
              errorMessage: failed.errorMessage,
              isAuthError: failed.isAuthError,
            }
          : item,
      ),
    );
  };

  const handleManualRetry = (item: FeedItem) => {
    if (!item.clientId) return;

    const sub: OptimisticSubmission = {
      backupId: item.backupId || item.id,
      clientId: item.clientId,
      title: item.title,
      description: item.description,
      domain: item.domain,
      imageUrl: item.imageUrl,
      media: item.media,
      createdAt: item.createdAt,
      status: 'pending',
      retryCount: 0,
    };

    setItems((prev) =>
      prev.map((i) =>
        i.clientId === item.clientId ? { ...i, status: 'pending', errorMessage: undefined } : i,
      ),
    );

    void submitWithRetry(sub, {
      onSuccess: (confirmed) => handleConfirmedSuccess(item.clientId!, confirmed),
      onFail: (failed) => handleOptimisticFail(failed),
    });
  };

  const emptyState = !isInitialLoading && !isLoading && sessionResolved && items.length === 0 && !locationError;
  const endOfFeed = !isInitialLoading && !isLoading && nextCursor === null && items.length > 0;

  /* ── Derive user initials for avatar ── */
  const userInitials = sessionUser?.name
    ? sessionUser.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : sessionUser?.email
      ? sessionUser.email[0].toUpperCase()
      : '?';

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Sticky top navbar ── */}
      <nav className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink leading-tight">Civic Feed</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">Nearby Issues</p>
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            {sessionUser ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <span className="max-w-[120px] truncate text-sm font-medium text-ink">
                    {sessionUser.name || sessionUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Location / fetch errors */}
        {locationError ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <PinIcon className="shrink-0 text-amber-500" />
            {locationError}
          </div>
        ) : null}

        {fetchError ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {fetchError}
          </div>
        ) : null}

        {/* ── Feed cards ── */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <article
              key={item.id || item.backupId || item.clientId}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-soft ${
                item.status === 'failed'
                  ? 'border-rose-300 bg-rose-50/20'
                  : item.status === 'pending'
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-border'
              }`}
              style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
            >
              {/* Card header */}
              <div className="flex items-start gap-4 px-5 pt-5 pb-3">
                {/* Upvote column (reddit-style) */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    disabled={item.status === 'pending' || item.status === 'failed'}
                    className="rounded p-1 text-muted transition hover:bg-brand-50 hover:text-brand-500 disabled:opacity-40"
                    aria-label="Upvote"
                  >
                    <UpvoteIcon />
                  </button>
                  <span className="text-xs font-bold text-ink tabular-nums">{item.upvoteCount}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {item.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                        Sending...
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-800">
                        <AlertCircle className="h-3 w-3 text-rose-600" />
                        Failed to send
                      </span>
                    ) : item.status === 'pending_moderation' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Loader2 className="h-3 w-3 text-amber-600" />
                        In Review (Visible only to you)
                      </span>
                    ) : null}

                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${getDomainColor(item.domain)}`}>
                      {domainLabel(item.domain)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <PinIcon className="text-muted/60" />
                      {formatDistance(item.distanceKm)}
                    </span>
                    <span className="text-[11px] text-muted/60">•</span>
                    <time className="text-[11px] text-muted" dateTime={item.createdAt}>
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </div>

                  <h2 className="text-base font-semibold text-ink leading-snug group-hover:text-brand-600 transition-colors">
                    {item.title}
                  </h2>
                </div>
              </div>

              {/* Failed Error Banner with Action */}
              {item.status === 'failed' ? (
                <div className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    {item.errorMessage || 'Failed to send problem.'}
                  </span>
                  {item.isAuthError ? (
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition"
                    >
                      Log in
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleManualRetry(item)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
              ) : null}

              {/* Image */}
              {item.imageUrl ? (
                <div className="mx-5 mb-3 overflow-hidden rounded-xl border border-border/50">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}

              {/* Description */}
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-muted line-clamp-3">{item.description}</p>
              </div>

              {/* Card footer */}
              <div className="flex items-center gap-4 border-t border-border/50 bg-canvas/40 px-5 py-2.5">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-brand-50 hover:text-brand-600"
                >
                  <ProjectIcon />
                  {item.activeProjectCount} project{item.activeProjectCount !== 1 ? 's' : ''}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* ── Empty state ── */}
        {emptyState ? (
          <div className="mt-12 flex flex-col items-center rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-brand-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink">No issues nearby yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Nothing is open in your area. Be the first to report a civic issue!
            </p>
            <button
              type="button"
              onClick={() => setIsComplaintOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md"
            >
              <PlusIcon className="h-4 w-4" />
              Report an issue
            </button>
          </div>
        ) : null}

        {/* ── End of feed ── */}
        {endOfFeed ? (
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted">You've reached the end</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {/* ── Loading skeletons ── */}
        {isLoading ? (
          <div className="mt-4 space-y-4" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-6 w-6 rounded bg-border/60" />
                    <div className="h-3 w-4 rounded bg-border/60" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-3 flex gap-2">
                      <div className="h-5 w-20 rounded-full bg-border/60" />
                      <div className="h-5 w-14 rounded-full bg-border/40" />
                    </div>
                    <div className="h-5 w-3/4 rounded bg-border/60" />
                    <div className="mt-4 h-40 rounded-xl bg-canvas" />
                    <div className="mt-3 h-4 w-full rounded bg-canvas" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-canvas" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </main>

      {/* ── Floating Action Button ── */}
      <button
        type="button"
        onClick={() => setIsComplaintOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-elevated transition-all hover:scale-105 hover:shadow-glow-lg active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3"
        aria-label="Add Complaint"
      >
        <PlusIcon className="h-6 w-6 sm:h-5 sm:w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Add Complaint</span>
      </button>

      {/* ── Complaint modal ── */}
      {isComplaintOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10 p-4 backdrop-blur-sm">
          <ComplaintForm
            onClose={() => setIsComplaintOpen(false)}
            onOptimisticSubmit={handleOptimisticAdd}
            onSuccess={(confirmed) => handleConfirmedSuccess(confirmed.clientId, confirmed)}
            onFail={handleOptimisticFail}
          />
        </div>
      ) : null}
    </div>
  );
}
