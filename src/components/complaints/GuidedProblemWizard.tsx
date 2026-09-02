'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  MapPin,
  Navigation,
  FileText,
  Layers,
  ShieldCheck,
  Building2,
  Trees,
  Trash2,
  Droplets,
  Accessibility,
  HelpCircle,
  Car,
  Droplet,
  Trash,
  Wheat,
  Zap,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  Landmark,
  X,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import {
  PROBLEM_TYPES,
  CATEGORIES,
  getCategoryById,
  getDomainForCategory,
  type ProblemTypeDefinition,
  type CategoryDefinition,
} from '@/lib/constants/categories';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AttachedMediaItem {
  id: string | null;
  file?: File;
  previewUrl: string;
}

interface GuidedProblemWizardProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function GuidedProblemWizard({ onClose, onSuccess }: GuidedProblemWizardProps) {
  // Wizard Step (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedType, setSelectedType] = useState<string>('INFRASTRUCTURE');
  const [selectedCategory, setSelectedCategory] = useState<string>('transport_traffic');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('road_damage');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationDisplay, setLocationDisplay] = useState<string>('');
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState<boolean>(false);
  const [attachedMedia, setAttachedMedia] = useState<AttachedMediaItem[]>([]);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    id: string;
    title: string;
    domain: string;
  } | null>(null);

  // Word Count Calculation
  const words = description.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountMet = words >= 30;

  // Selected Category Entity
  const currentCategoryDef = getCategoryById(selectedCategory) || CATEGORIES[0];

  // Auto-switch subcategory when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = getCategoryById(catId);
    if (cat && cat.subcategories.length > 0) {
      setSelectedSubcategory(cat.subcategories[0].id);
    }
  };

  // Location Geolocation Handler
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationNote('Geolocation is not supported by your browser.');
      return;
    }

    setIsResolvingLocation(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setLocationDisplay(`GPS Coordinates: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);

        // Reverse geocoding lookup
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              setLocationDisplay(data.address);
              setLocationNote('Address verified via geospatial registry.');
            }
          }
        } catch {
          setLocationNote('Lat/Lng pinned. Approximate civic boundary tagged.');
        } finally {
          setIsResolvingLocation(false);
        }
      },
      (err) => {
        setIsResolvingLocation(false);
        setLocationNote(`Unable to retrieve GPS coordinates: ${err.message}. You can enter manual address.`);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  // WebRTC Camera Management
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraError('Camera access denied or unavailable. You can upload an image from your device.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureSnapshot = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setAttachedMedia((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        previewUrl: dataUrl,
      },
    ]);

    stopCamera();
  };

  const handleFileUpload = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setAttachedMedia((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file,
        previewUrl,
      },
    ]);
  };

  const removeMedia = (id: string | null, previewUrl: string) => {
    setAttachedMedia((prev) => prev.filter((m) => m.previewUrl !== previewUrl));
  };

  // Final Submission Handler
  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const domain = getDomainForCategory(selectedCategory);

      // Upload first image if present
      let imageUrl: string | null = null;
      if (attachedMedia.length > 0 && attachedMedia[0].previewUrl) {
        imageUrl = attachedMedia[0].previewUrl;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        problemType: selectedType,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        domain,
        imageUrl,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        clientId: crypto.randomUUID(),
      };

      const res = await fetch('/api/problems/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit problem report.');
      }

      setSubmissionSuccess({
        id: data.problem.id,
        title: data.problem.title,
        domain,
      });

      setCurrentStep(7); // Jump to success step
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Icons & Labels
  const STEP_TITLES = [
    '1. Problem Type',
    '2. Category',
    '3. Description',
    '4. Live Camera / Proof',
    '5. Location',
    '6. Review Summary',
    '7. Submitted',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden font-sans text-slate-900 animate-in fade-in zoom-in-95 flex flex-col">
      {/* Wizard Header */}
      <header className="py-4 px-6 md:px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-nexus-primary">Report a Civic Problem</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium">
              Guided 7-Step Workflow
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Step Progress Indicator Bar */}
      {currentStep < 7 && (
        <div className="w-full bg-slate-100 px-6 py-3 border-b border-slate-200/60 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-[11px] font-bold">
          {STEP_TITLES.slice(0, 6).map((titleText, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <button
                key={titleText}
                type="button"
                onClick={() => {
                  if (currentStep > stepNum) setCurrentStep(stepNum);
                }}
                disabled={currentStep < stepNum}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap transition ${
                  isCurrent
                    ? 'bg-nexus-primary text-white shadow-sm'
                    : isDone
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-400 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                    {stepNum}
                  </span>
                )}
                <span>{titleText.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Step Content Body */}
      <div className="p-6 md:p-8 flex-grow space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Submission Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 1: Problem Type Selection */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 1: What kind of problem are you reporting?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Select the primary classification that best describes the issue in your community.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PROBLEM_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-nexus-primary bg-nexus-primary/5 ring-2 ring-nexus-primary/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${type.badgeColor}`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900">{type.label}</h3>
                        {isSelected && <Check className="w-4 h-4 text-nexus-primary" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 2: Category & Subcategory Selection */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 2: Select Category & Specific Issue
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Pinpoint the exact municipal or technical category for targeted university matching.
              </p>
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-nexus-primary bg-nexus-primary text-white shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs leading-snug">{cat.label}</span>
                      <span
                        className={`text-[10px] mt-1 capitalize ${
                          isSelected ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {cat.subcategories.length} sub-issues
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategory List */}
            {currentCategoryDef.subcategories.length > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Specific Subcategory ({currentCategoryDef.label})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentCategoryDef.subcategories.map((sub) => {
                    const isSelected = selectedSubcategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-nexus-primary bg-nexus-primary/5 ring-1 ring-nexus-primary text-nexus-primary font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span>{sub.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-nexus-primary" />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{sub.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 3: Description & Quality Guidance */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 3: Describe the Problem in Detail
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Detailed descriptions ensure that research teams accurately grasp the root cause and engineering constraints.
              </p>
            </div>

            {/* Quality Guidance Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 text-xs text-blue-900">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <FileText className="w-3.5 h-3.5 text-blue-700" /> Guidance for High-Quality Reports
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-800">
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>State what happens, when it started, and who is affected.</span>
                </li>
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mention specific landmarks, road names, or building numbers.</span>
                </li>
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Describe any safety or environmental risks.</span>
                </li>
                <li className="flex items-start gap-1">
                  <X className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                  <span>Do not include personal advertisements, abusive text, or private phone numbers.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Challenge Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken drainage culvert causing persistent waterlogging on Ring Road"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white focus:ring-2 focus:ring-nexus-primary/10 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Detailed Problem Statement <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isWordCountMet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {words} / 30 words minimum
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the systemic failure, observable impacts on residents, and any attempted fixes..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white focus:ring-2 focus:ring-nexus-primary/10 transition resize-y"
                />
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 4: Live Camera & Photographic Evidence */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 4: Attach Photographic Evidence (Optional)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Visual proof significantly improves AI verification accuracy and gives university labs immediate clarity.
              </p>
            </div>

            {cameraError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {cameraError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                <Camera className="w-4 h-4" /> Open Device Camera
              </button>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer">
                <Upload className="w-4 h-4 text-nexus-primary" /> Upload Photo from Device
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>

            {/* Live Camera Viewport */}
            {isCameraOpen && (
              <div className="rounded-3xl border border-slate-300 bg-black p-4 space-y-3">
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-72 rounded-2xl object-contain bg-black"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition"
                  >
                    Close Camera
                  </button>
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg"
                  >
                    Capture Snapshot
                  </button>
                </div>
              </div>
            )}

            {/* Image Previews */}
            {attachedMedia.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attached Proof ({attachedMedia.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachedMedia.map((media) => (
                    <div
                      key={media.previewUrl}
                      className="relative rounded-2xl border border-slate-200 overflow-hidden aspect-video bg-slate-100 group shadow-sm"
                    >
                      <img
                        src={media.previewUrl}
                        alt="Evidence preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(media.id, media.previewUrl)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                No images attached. You can continue without images if none are available.
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 5: Location Details */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 5: Provide Problem Location
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Geotagging enables PostGIS radius queries to instantly alert nearby accredited universities.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Location Coordinates / Address
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isResolvingLocation}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-nexus-primary bg-nexus-primary/10 hover:bg-nexus-primary/20 px-3.5 py-1.5 rounded-full transition disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isResolvingLocation ? 'animate-spin' : ''}`} />
                  {isResolvingLocation ? 'Resolving GPS...' : 'Use Current GPS Location'}
                </button>
              </div>

              <input
                type="text"
                value={locationDisplay}
                onChange={(e) => setLocationDisplay(e.target.value)}
                placeholder="Click 'Use Current GPS Location' or type address / sector..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />

              {locationNote && <p className="text-xs text-slate-500">{locationNote}</p>}

              {location && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    GPS Pin: <strong>{location.lat.toFixed(5)}</strong>, <strong>{location.lng.toFixed(5)}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 6: Review & Confirmation Screen */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Step 6: Review Your Report Before Submission
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Please verify all details. Once submitted, our AI triage pipeline will assess spam and trigger regional university notifications.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Classification</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-nexus-primary font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Problem Type</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {PROBLEM_TYPES.find((p) => p.id === selectedType)?.label || selectedType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                  <span className="font-bold text-slate-800 text-sm">{currentCategoryDef.label}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Subcategory</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {currentCategoryDef.subcategories.find((s) => s.id === selectedSubcategory)?.label ||
                      selectedSubcategory}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 pt-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Content & Statement</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-nexus-primary font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Title</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{title}</p>
                <span className="text-slate-400 block text-[10px] uppercase mt-2">Description</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">{description}</p>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 pt-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Location & Media</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="text-nexus-primary font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Location</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {locationDisplay || 'No specific GPS coordinates provided'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Photographic Evidence</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {attachedMedia.length > 0 ? `${attachedMedia.length} image(s) attached` : 'None attached'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 7: Submission Confirmation & Success */}
        {/* ───────────────────────────────────────────────────────────── */}
        {currentStep === 7 && submissionSuccess && (
          <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-nexus-primary">
                Challenge Submitted Successfully!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your report has been queued in the <strong>CivicNexus AI Pipeline</strong> for automated spam review, 1024-dimension vector embedding, and PostGIS regional matching.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Challenge ID:</span>
                <span className="font-mono font-bold text-slate-800">{submissionSuccess.id.substring(0, 12)}…</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Domain:</span>
                <span className="font-bold text-nexus-primary capitalize">{submissionSuccess.domain.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Initial Status:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  PENDING_MODERATION
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                Track in My Reported Problems
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Navigation Controls */}
      {currentStep < 7 && (
        <footer className="py-4 px-6 md:px-8 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 3 && (!title.trim() || !isWordCountMet)) {
                    setError('Please provide a title and at least 30 descriptive words.');
                    return;
                  }
                  setError(null);
                  setCurrentStep(currentStep + 1);
                }}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || !title.trim() || !isWordCountMet}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-lg shadow-nexus-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Challenge <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
