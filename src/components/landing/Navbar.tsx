'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={[
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass shadow-soft'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-glow transition group-hover:scale-105">
            CI
          </span>
          <span className="hidden text-lg font-bold text-ink sm:block">
            Civic<span className="text-gradient">Innovation</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted transition hover:text-brand-500"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted transition hover:text-brand-500"
          >
            How It Works
          </a>
          <a
            href="#roles"
            className="text-sm font-medium text-muted transition hover:text-brand-500"
          >
            For You
          </a>
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600 hover:shadow-glow-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-brand-50 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="glass animate-fade-in border-t border-border px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted transition hover:text-brand-500"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted transition hover:text-brand-500"
            >
              How It Works
            </a>
            <a
              href="#roles"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted transition hover:text-brand-500"
            >
              For You
            </a>
            <hr className="border-border" />
            <Link
              href="/login"
              className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
