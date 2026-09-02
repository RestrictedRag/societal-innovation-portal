'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  Flame,
  Share2,
  ExternalLink,
  GraduationCap,
  Building2,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

export interface PostDetailData {
  id: string;
  clientId?: string;
  title: string;
  description: string;
  fullDescription?: string;
  domain: string | null;
  category?: string | null;
  subcategory?: string | null;
  imageUrl: string | null;
  media?: string[];
  upvoteCount: number;
  activeProjectCount: number;
  createdAt: string;
  distanceKm?: number;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface PostDetailModalProps {
  post: PostDetailData;
  onClose: () => void;
  onUpvoteToggle?: (postId: string, newCount: number, hasUpvoted: boolean) => void;
}

export function PostDetailModal({
  post,
  onClose,
  onUpvoteToggle,
}: PostDetailModalProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [upvotes, setUpvotes] = useState(post.upvoteCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [fullPostData, setFullPostData] = useState<any | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Combine media
  const allMedia: string[] = [];
  if (post.imageUrl) allMedia.push(post.imageUrl);
  if (post.media && Array.isArray(post.media)) {
    for (const m of post.media) {
      if (m && !allMedia.includes(m)) allMedia.push(m);
    }
  }

  // Fetch full details if available from API
  useEffect(() => {
    let isMounted = true;
    if (post.id && !post.id.startsWith('client-')) {
      setIsLoadingFull(true);
      fetch(`/api/problems/${post.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.problem) {
            setFullPostData(data.problem);
            if (typeof data.problem.upvotesCount === 'number') {
              setUpvotes(data.problem.upvotesCount);
            }
          }
        })
        .catch((err) => console.error('Error fetching full post details:', err))
        .finally(() => {
          if (isMounted) setIsLoadingFull(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [post.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (allMedia.length > 1) {
        if (e.key === 'ArrowRight') {
          setActiveMediaIndex((prev) => (prev + 1) % allMedia.length);
        } else if (e.key === 'ArrowLeft') {
          setActiveMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allMedia.length, onClose]);

  // Upvote action
  const handleUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);

    const prevUpvotes = upvotes;
    const prevHasUpvoted = hasUpvoted;

    // Optimistic update
    const nextHasUpvoted = !prevHasUpvoted;
    const nextCount = nextHasUpvoted ? prevUpvotes + 1 : Math.max(0, prevUpvotes - 1);
    setUpvotes(nextCount);
    setHasUpvoted(nextHasUpvoted);

    try {
      const res = await fetch(`/api/problems/${post.id}/upvote`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotesCount);
        setHasUpvoted(data.hasUpvoted);
        if (onUpvoteToggle) {
          onUpvoteToggle(post.id, data.upvotesCount, data.hasUpvoted);
        }
      } else {
        // Revert on error
        setUpvotes(prevUpvotes);
        setHasUpvoted(prevHasUpvoted);
      }
    } catch {
      setUpvotes(prevUpvotes);
      setHasUpvoted(prevHasUpvoted);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/feed?post=${post.id}` : '';
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formattedDescription =
    fullPostData?.description || post.fullDescription || post.description || 'No detailed description provided.';

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const relativeTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formattedDate;
  };

  const activeProjects = fullPostData?.projects || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-6 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-nexus-primary/10 text-nexus-primary">
              {post.domain?.replace(/_/g, ' ') || 'Civic Problem'}
            </span>

            {post.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                {post.category}
                {post.subcategory ? ` • ${post.subcategory}` : ''}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              {post.activeProjectCount || activeProjects.length} Active Solutions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Share / Copy Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 hidden sm:inline text-xs font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Post Title & Location Metadata */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Reported {relativeTimeAgo(post.createdAt)} ({formattedDate})
              </span>

              {post.distanceKm !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {post.distanceKm.toFixed(1)} km away from your location
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Media Viewer & Photo Gallery */}
          {allMedia.length > 0 && (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center shadow-inner group">
                <img
                  src={allMedia[activeMediaIndex]}
                  alt={post.title}
                  className="w-full h-full object-contain"
                />

                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveMediaIndex((prev) => (prev + 1) % allMedia.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row if multiple images */}
              {allMedia.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allMedia.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                        activeMediaIndex === idx
                          ? 'border-nexus-primary ring-2 ring-nexus-primary/20'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Post Description */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Challenge Overview & Detailed Evidence
            </h3>
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-sm text-slate-800 leading-relaxed space-y-3 whitespace-pre-line font-normal">
              {formattedDescription}
            </div>
          </div>

          {/* Citizen Upvote & Endorsement Bar */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpvote}
                disabled={isUpvoting}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm ${
                  hasUpvoted
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                <span>{hasUpvoted ? 'Endorsed' : 'Upvote Challenge'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 text-[11px]">{upvotes}</span>
              </button>
              <span className="text-xs text-emerald-900 font-medium hidden sm:inline">
                Community backing signals high-priority urgency to municipal teams
              </span>
            </div>
          </div>

          {/* University R&D Solutions Section */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-nexus-primary" /> Active University Response Initiatives
            </h3>

            {isLoadingFull ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-nexus-primary" />
                <span>Checking accredited laboratory responses...</span>
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  Open for University Capstone Projects & Student Research
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Engineering faculties and student researchers can claim this challenge to develop verified hardware prototypes and claim escrow grants.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeProjects.map((proj: any) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{proj.universityName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            proj.projectType === 'RESEARCH'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {proj.projectType === 'RESEARCH' ? 'Academic Research' : 'Prototype Solution'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Lead Researcher: <strong className="text-slate-700">{proj.studentName || 'Capstone Lab'}</strong>
                        {proj.studentDepartment ? ` (${proj.studentDepartment})` : ''}
                      </p>
                    </div>

                    <Link
                      href={`/university`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
                    >
                      View Lab Workspace →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Close Post
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/corporate"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5" /> Sponsor Escrow / Pilot
            </Link>

            <Link
              href="/university"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Claim for University Research
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
