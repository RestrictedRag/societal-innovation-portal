export type OptimisticSubmission = {
  backupId: string;
  clientId: string;
  title: string;
  description: string;
  domain: string | null;
  imageUrl: string | null;
  media: string[];
  location?: { lat: number; lng: number } | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  status: 'pending' | 'failed';
  errorMessage?: string;
  isAuthError?: boolean;
  retryCount: number;
};

export type ConfirmedProblem = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  domain: string | null;
  imageUrl: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
};

const STORAGE_KEY = 'civic_pending_submissions_v1';

export function getStoredSubmissions(): OptimisticSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSubmission(item: OptimisticSubmission): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredSubmissions();
    const existingIndex = current.findIndex((i) => i.clientId === item.clientId);
    let next: OptimisticSubmission[];
    if (existingIndex >= 0) {
      next = [...current];
      next[existingIndex] = item;
    } else {
      next = [item, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to save optimistic submission to localStorage:', err);
  }
}

export function removeStoredSubmission(clientId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredSubmissions();
    const next = current.filter((i) => i.clientId !== clientId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to remove optimistic submission from localStorage:', err);
  }
}

export function updateStoredSubmission(
  clientId: string,
  updates: Partial<OptimisticSubmission>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredSubmissions();
    const next = current.map((item) => (item.clientId === clientId ? { ...item, ...updates } : item));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to update optimistic submission in localStorage:', err);
  }
}

export async function submitWithRetry(
  submission: OptimisticSubmission,
  callbacks: {
    onSuccess: (confirmed: ConfirmedProblem) => void;
    onFail: (failedItem: OptimisticSubmission) => void;
    onStatusChange?: (status: 'pending' | 'failed', message?: string, isAuthError?: boolean) => void;
  },
): Promise<void> {
  // Ensure persisted before first attempt
  saveStoredSubmission({ ...submission, status: 'pending' });
  callbacks.onStatusChange?.('pending');

  let attempt = submission.retryCount || 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch('/api/problems/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: submission.clientId,
          title: submission.title,
          description: submission.description,
          domain: submission.domain,
          imageUrl: submission.imageUrl,
          media: submission.media,
          latitude: submission.latitude ?? submission.location?.lat ?? null,
          longitude: submission.longitude ?? submission.location?.lng ?? null,
          location: submission.location ?? (submission.latitude && submission.longitude ? { lat: submission.latitude, lng: submission.longitude } : null),
        }),
      });

      // 1. Non-retryable: 401 Unauthorized
      if (response.status === 401) {
        const failedItem: OptimisticSubmission = {
          ...submission,
          status: 'failed',
          isAuthError: true,
          errorMessage: 'Session expired. Please log in again to submit.',
          retryCount: attempt,
        };
        saveStoredSubmission(failedItem);
        callbacks.onStatusChange?.('failed', failedItem.errorMessage, true);
        callbacks.onFail(failedItem);
        return;
      }

      // 2. Non-retryable: Other 4xx Client Errors (validation, bad request)
      if (response.status >= 400 && response.status < 500) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const msg = payload?.error || 'Submission rejected. Please check your details.';
        const failedItem: OptimisticSubmission = {
          ...submission,
          status: 'failed',
          isAuthError: false,
          errorMessage: msg,
          retryCount: attempt,
        };
        saveStoredSubmission(failedItem);
        callbacks.onStatusChange?.('failed', failedItem.errorMessage, false);
        callbacks.onFail(failedItem);
        return;
      }

      // 3. Retryable: 5xx Server Errors
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      // 4. Success (200 OK / 201 Created)
      const data = (await response.json()) as { problem: ConfirmedProblem };
      removeStoredSubmission(submission.clientId);
      callbacks.onSuccess(data.problem);
      return;
    } catch (networkError: any) {
      console.warn(`Submission attempt ${attempt}/${maxAttempts} failed for clientId ${submission.clientId}:`, networkError);

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      } else {
        // Exhausted retries
        const failedItem: OptimisticSubmission = {
          ...submission,
          status: 'failed',
          isAuthError: false,
          errorMessage: 'Network connection failed. Click to retry.',
          retryCount: attempt,
        };
        saveStoredSubmission(failedItem);
        callbacks.onStatusChange?.('failed', failedItem.errorMessage, false);
        callbacks.onFail(failedItem);
        return;
      }
    }
  }
}
