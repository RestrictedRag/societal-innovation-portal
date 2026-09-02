'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Compass,
  Map,
  GraduationCap,
  Building2,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { GuidedProblemWizard } from '@/components/complaints/GuidedProblemWizard';
import { useAuth } from '@/lib/auth/use-auth';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAuthenticated, loading, signOut } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/feed', label: 'Explore', icon: Compass },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/university', label: 'Universities', icon: GraduationCap },
    { href: '/corporate', label: 'Industry & Escrow', icon: Building2 },
    ...(profile?.role === 'ADMIN'
      ? [{ href: '/admin', label: 'Admin Portal', icon: ShieldCheck }]
      : []),
  ];

  // Derive display initials
  const displayName = profile?.fullName || user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full z-40 bg-white/75 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_24px_rgba(0,53,39,0.04)] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-nexus-primary flex items-center justify-center text-white shadow-md shadow-nexus-primary/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-nexus-primary-fixed" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl text-nexus-primary tracking-tight">
                CivicNexus
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 -mt-1">
                Innovation Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href as any}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-nexus-primary/10 text-nexus-primary'
                      : 'text-slate-600 hover:text-nexus-primary hover:bg-slate-100'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/15"
            >
              <Plus className="w-4 h-4" /> Report a Challenge
            </button>

            {loading ? (
              <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse border border-slate-200" />
            ) : isAuthenticated ? (
              /* User Avatar Popout Dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 transition border border-slate-200/80 bg-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-nexus-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {initials || <User className="w-4 h-4" />}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {profile?.role && (
                        <span className="inline-block mt-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-nexus-primary/10 text-nexus-primary">
                          {profile.role.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="p-1 space-y-0.5">
                      <Link
                        href={'/my-problems' as any}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-nexus-primary transition"
                      >
                        <FileText className="w-4 h-4 text-nexus-primary" />
                        <span>My Problems</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          void signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-nexus-primary hover:bg-slate-100 transition border border-slate-200 bg-white"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="p-2 rounded-xl bg-nexus-primary text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-xl">
            {isAuthenticated && (
              <div className="px-3.5 py-3 border-b border-slate-100 mb-2">
                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as any}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <link.icon className="w-4 h-4 text-nexus-primary" />
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                href={'/my-problems' as any}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-nexus-primary hover:bg-slate-100"
              >
                <FileText className="w-4 h-4" />
                My Problems
              </Link>
            )}

            <div className="pt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Account
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Report Challenge Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <GuidedProblemWizard onClose={() => setIsReportModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
