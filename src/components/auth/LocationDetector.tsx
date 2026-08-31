'use client';

import { useEffect, useRef } from 'react';
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
  const lastGeocodeKeyRef = useRef<string | null>(null);

  const displayCoordinates =
    coordinates ??
    (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null);

  useEffect(() => {
    if (status !== 'success' || !coordinates) {
      return;
    }

    const geocodeKey = `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`;
    if (lastGeocodeKeyRef.current === geocodeKey) {
      return;
    }

    lastGeocodeKeyRef.current = geocodeKey;
    onCoordinatesChange(coordinates);

    const fillLocationFromCoordinates = async () => {
      try {
        const response = await fetch(
          `/api/geocode/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
        );

        if (!response.ok) {
          return;
        }

        const geoapifyLocation = (await response.json()) as { city?: string; state?: string };

        if (geoapifyLocation.city) {
          onCityChange(geoapifyLocation.city);
        }

        if (geoapifyLocation.state) {
          onStateChange(geoapifyLocation.state);
        }
      } catch {
        // Ignore reverse-geocoding failures and allow manual entry fallback.
      }
    };

    void fillLocationFromCoordinates();
  }, [coordinates, onCityChange, onCoordinatesChange, onStateChange, status]);

  const handleRequest = () => {
    requestLocation();
  };

  const handleManualReset = () => {
    reset();
    onCoordinatesChange(null);
  };

  const statusStyles = {
    idle: 'border-border bg-surface text-ink',
    locating: 'border-brand-500/30 bg-brand-50 text-brand-700',
    success: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700',
    denied: 'border-amber-500/60 bg-amber-500/10 text-amber-700',
    error: 'border-red-500/60 bg-red-500/10 text-red-700',
  } as const;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-canvas p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Location</p>
          <p className="text-xs text-muted">Detect your location or enter it manually</p>
        </div>
        <button
          type="button"
          onClick={displayCoordinates ? handleManualReset : handleRequest}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
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
          Location verified: {displayCoordinates.latitude.toFixed(4)}, {displayCoordinates.longitude.toFixed(4)}
        </div>
      ) : null}

      {(status === 'denied' || status === 'error' || errorMessage) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {errorMessage ?? error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-ink">
            City
          </label>
          <input
            id="city"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            placeholder="e.g. Bengaluru"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium text-ink">
            State
          </label>
          <input
            id="state"
            value={state}
            onChange={(event) => onStateChange(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
