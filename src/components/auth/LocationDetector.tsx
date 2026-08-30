'use client';

import { useEffect } from 'react';
import { LocateFixed, MapPin, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useGeolocation } from './useGeolocation';

interface LocationDetectorProps {
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCoordinatesChange: (coords: { latitude: number; longitude: number } | null) => void;
  error?: string;
}

export function LocationDetector({
  city,
  state,
  latitude,
  longitude,
  onCityChange,
  onStateChange,
  onCoordinatesChange,
  error,
}: LocationDetectorProps) {
  const { status, coordinates, errorMessage, requestLocation, reset } = useGeolocation();

  const displayCoordinates = coordinates ?? (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null ? { latitude, longitude } : null);

  useEffect(() => {
    if (status === 'success' && coordinates) {
      onCoordinatesChange(coordinates);
    }
  }, [coordinates, onCoordinatesChange, status]);

  const handleRequest = () => {
    requestLocation();
  };

  const handleManualReset = () => {
    reset();
    onCoordinatesChange(null);
  };

  const statusStyles = {
    idle: 'border-slate-700 bg-slate-950/70 text-slate-200',
    locating: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200',
    success: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200',
    denied: 'border-amber-500/60 bg-amber-500/10 text-amber-200',
    error: 'border-red-500/60 bg-red-500/10 text-red-200',
  } as const;

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-100">Location</p>
          <p className="text-xs text-slate-400">Detect your location or enter it manually</p>
        </div>
        <button
          type="button"
          onClick={displayCoordinates ? handleManualReset : handleRequest}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
            statusStyles[status]
          )}
        >
          {displayCoordinates ? <MapPin className="h-3.5 w-3.5" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {displayCoordinates ? 'Reset' : status === 'locating' ? 'Locating...' : 'Use my location'}
        </button>
      </div>

      {(status === 'success' || displayCoordinates) && displayCoordinates ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          Location captured: {displayCoordinates.latitude.toFixed(4)}, {displayCoordinates.longitude.toFixed(4)}
        </div>
      ) : null}

      {(status === 'denied' || status === 'error' || errorMessage) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {errorMessage ?? error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-slate-200">
            City
          </label>
          <input
            id="city"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            placeholder="e.g. Bengaluru"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium text-slate-200">
            State
          </label>
          <input
            id="state"
            value={state}
            onChange={(event) => onStateChange(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            placeholder="e.g. Karnataka"
          />
        </div>
      </div>

      {status === 'success' && displayCoordinates ? (
        <input type="hidden" name="latitude" value={String(displayCoordinates.latitude)} />
      ) : null}
      {status === 'success' && displayCoordinates ? (
        <input type="hidden" name="longitude" value={String(displayCoordinates.longitude)} />
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
