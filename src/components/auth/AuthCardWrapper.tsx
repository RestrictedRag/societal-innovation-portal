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
    <div className="flex min-h-screen items-center justify-center bg-canvas p-3 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-soft backdrop-blur sm:max-w-2xl sm:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-500 sm:text-xs">
              {headerLabel}
            </p>
          </div>
          {roleBadge ? (
            <span className="inline-flex self-start rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-[10px] font-medium text-brand-700 sm:text-xs">
              {roleBadge}
            </span>
          ) : null}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
          {footerText}{' '}
          <a href={footerHref} className={cn('font-medium text-brand-500 transition hover:text-brand-600')}>
            {footerLink}
          </a>
        </div>
      </div>
    </div>
  );
}
