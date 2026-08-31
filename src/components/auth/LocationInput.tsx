'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, MapPin, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDebounce } from './useDebounce';

export interface LocationPayload {
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface LocationInputProps {
  value?: string;
  onLocationSelect: (location: LocationPayload) => void;
  onLocationClear?: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface LocationSuggestion extends LocationPayload {
  id: string;
  placeName: string;
  district: string;
}

export function LocationInput({
  value = '',
  onLocationSelect,
  onLocationClear,
  error,
  label = 'Location',
  placeholder = 'Search for your city or state',
  disabled = false,
}: LocationInputProps) {
  const inputId = useId();
  const listId = `${inputId}-suggestions`;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const skipNextSearchRef = useRef(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const programmaticSelectionRef = useRef(false);
  const debouncedQuery = useDebounce(query.trim(), 350);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (programmaticSelectionRef.current) {
      programmaticSelectionRef.current = false;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    searchControllerRef.current = controller;
    setIsSearching(true);
    setMessage(null);
    setIsOpen(true);

    fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Search failed.');
        return (await response.json()) as { suggestions?: LocationSuggestion[] };
      })
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch((requestError: unknown) => {
        if ((requestError as { name?: string }).name !== 'AbortError') {
          setSuggestions([]);
          setMessage('Unable to search locations right now. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const selectLocation = (location: LocationPayload) => {
    searchControllerRef.current?.abort();
    searchControllerRef.current = null;
    skipNextSearchRef.current = true;
    programmaticSelectionRef.current = true;
    setQuery(location.formattedAddress);
    setSuggestions([]);
    setIsOpen(false);
    setMessage(null);
    onLocationSelect(location);
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}`
          );
          if (!response.ok) throw new Error('Reverse geocoding failed.');
          selectLocation((await response.json()) as LocationPayload);
        } catch {
          setMessage('Unable to resolve your current location. Please enter it manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        setMessage(
          geoError.code === 1
            ? 'Location access was denied. Please enter your location manually.'
            : 'Unable to retrieve your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          value={query}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          onFocus={() => query.trim().length >= 3 && setIsOpen(true)}
          onChange={(event) => {
            skipNextSearchRef.current = false;
            setQuery(event.target.value);
            setMessage(null);
            setIsOpen(event.target.value.trim().length >= 3);
          }}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-white py-2 pl-10 pr-10 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            error ? 'border-red-500' : 'border-border'
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              onLocationClear?.();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {isOpen ? (
          <div id={listId} role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
            {isSearching ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted"><LoaderCircle className="h-4 w-4 animate-spin" /> Searching...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectLocation(suggestion)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm text-ink transition hover:bg-canvas"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{suggestion.placeName}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {[suggestion.district, suggestion.state, suggestion.country].filter(Boolean).join(' / ')}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted">No locations found.</p>
            )}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || isLocating}
        onClick={requestCurrentLocation}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLocating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {isLocating ? 'Finding your location...' : 'Use My Current Location'}
      </button>
      {message ? <p role="status" className="text-xs text-amber-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}