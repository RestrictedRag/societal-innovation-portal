'use client';

import React from 'react';
import type { AttachedMediaItem, Coordinates } from './useComplaintForm';
import {
  FileText,
  Layers,
  MapPin,
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  ShieldCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';

export type ComplaintFormViewProps = {
  title: string;
  description: string;
  domain: string;
  imageUrl: string;
  location: Coordinates | null;
  locationDisplay: string;
  locationDisplayNote: string | null;
  isResolvingLocation: boolean;
  mediaMenuOpen: boolean;
  attachedMedia: AttachedMediaItem[];
  isSubmitting: boolean;
  error: string | null;
  statusMessage: string | null;
  isCameraOpen: boolean;
  cameraError: string | null;
  words: number;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraVideoRef: React.RefObject<HTMLVideoElement | null>;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setDomain: (value: string) => void;
  setMediaMenuOpen: (value: boolean) => void;
  setLocationDisplay: (value: string) => void;
  setLocationDisplayNote: (value: string | null) => void;
  stopCameraStream: () => void;
  openCamera: () => Promise<void>;
  captureCameraPhoto: () => void;
  clearSelectedPhoto: (mediaId: string | null, previewUrl: string) => void;
  addAttachedPhoto: (file: File | null | undefined) => Promise<void>;
  useCurrentLocation: () => void;
  handleSubmit: () => Promise<void>;
  onClose?: () => void;
  locationValue: string;
};

const DOMAIN_OPTIONS = [
  { value: 'urban_infrastructure', label: 'Urban Infrastructure & Transport' },
  { value: 'water_management', label: 'Water Management & Sanitation' },
  { value: 'clean_energy', label: 'Clean Energy & Power' },
  { value: 'waste_management', label: 'Waste Management & Recycling' },
  { value: 'healthcare', label: 'Public Health & Healthcare' },
  { value: 'education', label: 'Education & Digital Access' },
  { value: 'agriculture', label: 'Agriculture & Food Systems' },
  { value: 'disaster_management', label: 'Disaster Management & Safety' },
  { value: 'governance', label: 'Civic Governance & Transparency' },
  { value: 'financial_inclusion', label: 'Financial Inclusion & Commerce' },
];

export function ComplaintFormView({
  title,
  description,
  domain,
  location,
  locationDisplay,
  locationDisplayNote,
  isResolvingLocation,
  attachedMedia,
  isSubmitting,
  error,
  statusMessage,
  isCameraOpen,
  cameraError,
  words,
  cameraInputRef,
  galleryInputRef,
  cameraVideoRef,
  setTitle,
  setDescription,
  setDomain,
  stopCameraStream,
  openCamera,
  captureCameraPhoto,
  clearSelectedPhoto,
  addAttachedPhoto,
  useCurrentLocation,
  handleSubmit,
  onClose,
  locationValue,
}: ComplaintFormViewProps) {
  const isWordCountMet = words >= 30;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/80 bg-surface shadow-2xl overflow-hidden font-sans text-on-surface animate-in fade-in zoom-in-95">
      {/* Top Focused Header */}
      <header className="w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-nexus-primary/10 border border-nexus-primary/20 flex items-center justify-center text-nexus-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-nexus-primary tracking-tight">CivicNexus</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500">
              Societal Challenge Submission
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </header>

      {/* Main Grid: Form (8 cols) + Contextual Sidebar (4 cols) */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/50">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-nexus-primary tracking-tight">
              Report a Societal Challenge
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
              Describe the problem in detail. CivicNexus analyzes the report with AI and connects it to accredited university research teams and corporate sponsors equipped to build real-world solutions.
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Submission Requirement Notice</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Status Update</p>
                <p className="mt-0.5 text-emerald-700">{statusMessage}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="space-y-6"
          >
            {/* Section 1: Challenge Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-nexus-primary">
                <FileText className="w-4 h-4 text-nexus-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider">1. Challenge Details</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="challenge-title">
                  Challenge Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="challenge-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken irrigation pipeline causing crop water shortages in sector 4"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-nexus-primary focus:bg-white focus:ring-2 focus:ring-nexus-primary/10 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="challenge-description">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isWordCountMet
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {words} / 30 words min
                  </span>
                </div>
                <textarea
                  id="challenge-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happens, when it happens, who is affected, and any observable impacts on the local community..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-nexus-primary focus:bg-white focus:ring-2 focus:ring-nexus-primary/10 transition resize-y"
                />
              </div>
            </section>

            {/* Section 2: Classification */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-nexus-primary">
                <Layers className="w-4 h-4 text-nexus-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider">2. Domain Classification</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="challenge-domain">
                  Primary Civic Domain <span className="text-rose-500">*</span>
                </label>
                <select
                  id="challenge-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white focus:ring-2 focus:ring-nexus-primary/10 transition"
                >
                  <option value="" disabled>
                    Select relevant domain
                  </option>
                  {DOMAIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Section 3: Location */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-nexus-primary">
                  <MapPin className="w-4 h-4 text-nexus-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider">3. Location</h2>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isResolvingLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-nexus-primary bg-nexus-primary/10 hover:bg-nexus-primary/20 px-3 py-1 rounded-full transition disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isResolvingLocation ? 'animate-spin' : ''}`} />
                  {isResolvingLocation ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={locationDisplay || locationValue}
                  readOnly
                  placeholder="Click 'Use Current Location' or pin your coordinates"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none"
                />
                {locationDisplayNote && (
                  <p className="text-[11px] text-slate-500 mt-1">{locationDisplayNote}</p>
                )}
                {location && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    GPS Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </div>
                )}
              </div>
            </section>

            {/* Section 4: Photographic Evidence */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-nexus-primary">
                <Camera className="w-4 h-4 text-nexus-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider">4. Photographic Evidence (Optional)</h2>
              </div>

              <p className="text-xs text-slate-600">
                Visual proof accelerates AI spam verification and helps research teams assess requirements.
              </p>

              {/* Upload & Camera Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void openCamera()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-semibold hover:bg-nexus-primary/90 transition shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Take Photo
                </button>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-nexus-primary text-nexus-primary text-xs font-semibold hover:bg-nexus-primary/5 transition cursor-pointer">
                  <Upload className="w-4 h-4" /> Upload Photo
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/jpeg,image/png,image/webp,image/jpg,image/heic,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void addAttachedPhoto(file);
                    }}
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Only photo files (JPG, PNG, WebP) up to 5MB are accepted.
              </p>

              {/* Camera Stream Viewport */}
              {isCameraOpen && (
                <div className="rounded-2xl border border-slate-300 bg-black p-4 space-y-3">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    className="w-full max-h-64 rounded-xl object-contain bg-black"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
                    >
                      Close Camera
                    </button>
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                    >
                      Capture Snapshot
                    </button>
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {attachedMedia.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {attachedMedia.map((media) => (
                    <div
                      key={media.previewUrl}
                      className="relative rounded-xl border border-slate-200 overflow-hidden group aspect-video bg-slate-100"
                    >
                      <img
                        src={media.previewUrl}
                        alt="Evidence thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => clearSelectedPhoto(media.id, media.previewUrl)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Form Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !isWordCountMet || !title.trim()}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary/90 transition shadow-lg shadow-nexus-primary/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Challenge...
                  </>
                ) : (
                  <>
                    Submit Challenge <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Contextual Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border-l-4 border-l-nexus-primary border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-nexus-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-nexus-primary" />
              Why Reporting Matters
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your submissions act as actionable civic signal nodes. CivicNexus structures and routes systemic issues directly to accredited universities and corporate sponsors.
            </p>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-nexus-primary/10 flex items-center justify-center shrink-0 text-nexus-primary">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Academic R&D Routing</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Universities claim local challenges for engineering capstones, research grants, and lab prototypes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Milestone-Gated Escrow</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Corporate partners pledge funding into escrow, released upon verified TRL milestones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Trackable Real Impact</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Receive transparent timeline updates as student teams test and deploy solutions in your area.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
