'use client';

import { useEffect, useState } from 'react';

import { ComplaintForm } from './ComplaintForm';

export function ComplaintButton() {
  const [isCitizen, setIsCitizen] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          setIsCitizen(false);
          return;
        }

        const payload = (await response.json()) as { user?: { role?: string } };
        setIsCitizen(payload.user?.role === 'CITIZEN');
      } catch {
        setIsCitizen(false);
      }
    };

    void loadStatus();
  }, []);

  if (!isCitizen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        <span className="text-base leading-none">＋</span>
        Add Complaint
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/5 p-4 backdrop-blur-sm">
          <ComplaintForm onClose={() => setIsOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
