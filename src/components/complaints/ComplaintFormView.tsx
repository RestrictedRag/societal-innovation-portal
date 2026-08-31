'use client';

import type { AttachedMediaItem, Coordinates } from './useComplaintForm';

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

export function ComplaintFormView({
  title,
  description,
  domain,
  imageUrl: _imageUrl,
  location: _location,
  locationDisplay,
  locationDisplayNote,
  isResolvingLocation,
  mediaMenuOpen,
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
  setMediaMenuOpen,
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
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-5 text-ink shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Citizen report</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Add Complaint</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-white px-2.5 py-1.5 text-sm text-muted hover:border-brand-500/40"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
            placeholder="Broken streetlight near market square"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
            placeholder="Describe the issue in detail, the impact, and any nearby landmarks."
          />
          <div className="mt-1 text-xs text-muted">{words} words minimum 30</div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Category</label>
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none"
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
          <label className="mb-1 block text-sm font-medium text-muted">Location</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isResolvingLocation}
              className="rounded-xl border border-brand-500/30 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResolvingLocation ? 'Resolving location...' : 'Use my current location'}
            </button>
            <div className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted">
              {isResolvingLocation ? 'Finding your city and state...' : locationValue}
            </div>
          </div>
          {locationDisplayNote ? (
            <div className="mt-1 text-[11px] text-amber-700">{locationDisplayNote}</div>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Media</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMediaMenuOpen(!mediaMenuOpen)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-left text-sm font-medium text-muted"
            >
              {attachedMedia.length ? 'Add another photo' : 'Add photo'}
            </button>

            {mediaMenuOpen ? (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-border bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    void openCamera();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-canvas"
                >
                  Take a photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    galleryInputRef.current?.click();
                  }}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-canvas"
                >
                  Choose from gallery
                </button>
              </div>
            ) : null}

            {isCameraOpen ? (
              <div className="mt-3 rounded-xl border border-border bg-white p-3">
                <video ref={cameraVideoRef} autoPlay playsInline muted className="h-56 w-full rounded-lg object-cover" />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={captureCameraPhoto}
                    className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Capture photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {attachedMedia.length ? (
              <div className="mt-3 space-y-3">
                {attachedMedia.map((media) => (
                  <div key={media.previewUrl} className="flex items-center gap-3 rounded-xl border border-border bg-white p-2">
                    <img
                      src={media.previewUrl}
                      alt="Selected complaint media preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        Under review
                      </span>
                      <button
                        type="button"
                        onClick={() => clearSelectedPhoto(media.id, media.previewUrl)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
                        aria-label="Remove selected photo"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void addAttachedPhoto(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void addAttachedPhoto(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>

        {cameraError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{cameraError}</div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}
