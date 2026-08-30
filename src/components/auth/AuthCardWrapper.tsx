'use client';

import { cn } from '@/lib/utils';

interface AuthCardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  title: string;
  subtitle: string;
  footerText: string;
  footerLink: string;
  footerHref: string;
  roleBadge?: string;
}

export function AuthCardWrapper({
  children,
  headerLabel,
  title,
  subtitle,
  footerText,
  footerLink,
  footerHref,
  roleBadge,
}: AuthCardWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-400">{headerLabel}</p>
          </div>
          {roleBadge ? (
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              {roleBadge}
            </span>
          ) : null}
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 border-t border-slate-800 pt-5 text-center text-sm text-slate-400">
          {footerText}{' '}
          <a href={footerHref} className={cn('font-medium text-cyan-400 transition hover:text-cyan-300')}>
            {footerLink}
          </a>
        </div>
      </div>
    </div>
  );
}
