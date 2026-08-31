'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ComplaintButton } from '@/components/complaints/ComplaintButton';

const DEFAULT_RADIUS_KM = 25;
const DEFAULT_LIMIT = 20;
const LOCATION_STORAGE_KEY = 'civic-feed-location-v1';

type FeedItem = {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  imageUrl: string | null;
  media: string[];
  upvoteCount: number;
  activeProjectCount: number;
  createdAt: string;
  distanceKm: number;
};

type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

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
    return '0.0 km away';
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} km away`;
}

export function ProblemFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [problemDraft, setProblemDraft] = useState({
    title: '',
    description: '',
    domain: 'healthcare',
    imageUrl: '',
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

      const response = await fetch(`/api/feed?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Unable to load the feed.');
      }

      const data = (await response.json()) as FeedResponse;

      setItems((previous) => {
        const merged = cursor ? [...previous, ...data.items] : data.items;
        const seen = new Set<string>();
        return merged.filter((item) => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
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
    if (!userLocation || !queryKey) {
      return;
    }

    void fetchFeed(null);
  }, [queryKey, userLocation]);

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

  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!isCurrent) {
          return;
        }
        setIsSignedIn(response.ok);
      } catch {
        if (isCurrent) {
          setIsSignedIn(false);
        }
      }
    };

    void loadSession();

    return () => {
      isCurrent = false;
    };
  }, []);

  const emptyState = !isInitialLoading && !isLoading && items.length === 0 && !locationError;
  const endOfFeed = !isInitialLoading && !isLoading && nextCursor === null && items.length > 0;

  const handleSubmitProblem = async () => {
    if (!isSignedIn) {
      window.location.href = '/login';
      return;
    }

    if (!problemDraft.title.trim() || !problemDraft.description.trim()) {
      setSubmitMessage('Please add a title and a description before submitting.');
      return;
    }

    setIsSubmittingProblem(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/problems/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: problemDraft.title,
          description: problemDraft.description,
          domain: problemDraft.domain,
          imageUrl: problemDraft.imageUrl || null,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to submit problem.');
      }

      const newItem: FeedItem = {
        id: payload.problem.id,
        title: payload.problem.title,
        description: payload.problem.description,
        domain: payload.problem.domain ?? null,
        imageUrl: payload.problem.imageUrl ?? null,
        media: payload.problem.imageUrl ? [payload.problem.imageUrl] : [],
        upvoteCount: 0,
        activeProjectCount: 0,
        createdAt: payload.problem.createdAt,
        distanceKm: 0,
      };

      setItems((previous) => [newItem, ...previous]);
      setProblemDraft({ title: '', description: '', domain: 'healthcare', imageUrl: '' });
      setIsComposerOpen(false);
      setSubmitMessage('Your problem has been submitted and will appear in the feed after review.');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Unable to submit your problem.');
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted">Nearby issues</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Civic feed</h1>
          </div>
          <ComplaintButton />
        </header>

        {isComposerOpen ? (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Share a local issue</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Title</label>
                <input
                  value={problemDraft.title}
                  onChange={(event) => setProblemDraft((draft) => ({ ...draft, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none ring-0 placeholder:text-muted"
                  placeholder="Broken streetlight near the bus stop"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Category</label>
                <select
                  value={problemDraft.domain}
                  onChange={(event) => setProblemDraft((draft) => ({ ...draft, domain: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none"
                >
                  <option value="healthcare">Healthcare</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="education">Education</option>
                  <option value="disaster_management">Disaster Management</option>
                  <option value="clean_energy">Clean Energy</option>
                  <option value="water_management">Water Management</option>
                  <option value="urban_infrastructure">Urban Infrastructure</option>
                  <option value="governance">Governance</option>
                  <option value="financial_inclusion">Financial Inclusion</option>
                  <option value="waste_management">Waste Management</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Description</label>
                <textarea
                  value={problemDraft.description}
                  onChange={(event) => setProblemDraft((draft) => ({ ...draft, description: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
                  placeholder="Describe the issue, the impact, and any nearby landmarks."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Image URL (optional)</label>
                <input
                  value={problemDraft.imageUrl}
                  onChange={(event) => setProblemDraft((draft) => ({ ...draft, imageUrl: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
                  placeholder="https://..."
                />
              </div>

              {submitMessage ? (
                <div className="rounded-xl border border-border bg-canvas p-3 text-sm text-muted">
                  {submitMessage}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProblem}
                  disabled={isSubmittingProblem}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingProblem ? 'Submitting...' : 'Submit issue'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {locationError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {locationError}
          </div>
        ) : null}

        {fetchError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {fetchError}
          </div>
        ) : null}

        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
            >
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-500">
                    {item.domain ?? 'Community issue'}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{item.title}</h2>
                </div>
                <span className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-muted">
                  {formatDistance(item.distanceKm)}
                </span>
              </div>

              {item.imageUrl ? (
                <div className="border-y border-border bg-canvas">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-4 px-4 py-4">
                <p className="text-sm leading-6 text-muted">{item.description}</p>

                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <div className="flex items-center gap-4">
                    <span>▲ {item.upvoteCount}</span>
                    <span>{item.activeProjectCount} active projects</span>
                  </div>
                  <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt)}</time>
                </div>
              </div>
            </article>
          ))}
        </div>

        {emptyState ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
            <h2 className="text-xl font-semibold text-ink">No issues nearby yet</h2>
            <p className="mt-2 text-sm text-muted">
              Nothing is open in your current area yet. Try moving a little or check back soon.
            </p>
          </div>
        ) : null}

        {endOfFeed ? (
          <div className="mt-6 text-center text-sm text-muted">You’ve reached the end of the feed.</div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 space-y-4" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-border bg-surface p-4 shadow-soft">
                <div className="h-3 w-24 rounded bg-border" />
                <div className="mt-3 h-6 w-3/4 rounded bg-border" />
                <div className="mt-4 h-40 rounded-lg bg-canvas" />
                <div className="mt-4 h-4 w-full rounded bg-canvas" />
                <div className="mt-2 h-4 w-5/6 rounded bg-canvas" />
              </div>
            ))}
          </div>
        ) : null}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </main>
  );
}
