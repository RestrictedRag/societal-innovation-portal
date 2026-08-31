'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, GraduationCap, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UniversityOption {
  id: string;
  name: string;
  isVerified?: boolean;
}

interface UniversitySelectorProps {
  value?: string | null;
  onChange: (universityId: string | null) => void;
  error?: string;
  label?: string;
}

export function UniversitySelector({
  value,
  onChange,
  error,
  label = 'Select your university',
}: UniversitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUniversities() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/universities');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.universities)) {
            setUniversities(data.universities);
          }
        }
      } catch (err) {
        console.error('Failed to load universities list:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUniversities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === value),
    [universities, value],
  );

  const filteredUniversities = useMemo(() => {
    if (!searchTerm.trim()) return universities;
    const term = searchTerm.toLowerCase();
    return universities.filter((u) => u.name.toLowerCase().includes(term));
  }, [universities, searchTerm]);

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="block text-sm font-medium text-ink">
        {label} <span className="text-rose-500">*</span>
      </label>

      {/* Selector Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border bg-surface px-3.5 py-2 text-sm transition cursor-pointer',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
            : isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : 'border-border hover:border-brand-500/50',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          {selectedUniversity ? (
            <span className="truncate font-medium text-ink">
              {selectedUniversity.name}
            </span>
          ) : (
            <span className="text-muted">Choose your university or institute...</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedUniversity ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setSearchTerm('');
              }}
              className="rounded p-1 text-muted hover:bg-canvas hover:text-ink transition"
              aria-label="Clear selected university"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          ) : (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
            />
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen ? (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 rounded-xl border border-border bg-surface p-2 shadow-xl backdrop-blur-md">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search universities..."
              className="w-full rounded-lg border border-border bg-canvas pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredUniversities.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted">
                {isLoading ? 'Loading universities...' : 'No universities found.'}
              </div>
            ) : (
              filteredUniversities.map((u) => {
                const isSelected = u.id === value;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onChange(u.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition',
                      isSelected
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-ink hover:bg-canvas',
                    )}
                  >
                    <span className="truncate">{u.name}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
