import { MIN_DESCRIPTION_WORDS } from '@/lib/constants';

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function isTitleValid(value: string): boolean {
  return value.trim().length > 0;
}

export function isDescriptionValid(value: string): boolean {
  return countWords(value) >= MIN_DESCRIPTION_WORDS;
}

export function normalizeProblemTitle(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeProblemDescription(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeProblemDomain(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeProblemMedia(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry): entry is string => Boolean(entry));
}

export function normalizeProblemImageUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getComplaintValidationError(
  title: string,
  description: string,
  location: { lat: number; lng: number } | null,
): string | null {
  if (!isTitleValid(title)) {
    return 'Title is required.';
  }

  if (!isDescriptionValid(description)) {
    return 'Description must be at least 30 words.';
  }

  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    return 'Please choose the location of the problem before submitting.';
  }

  return null;
}
