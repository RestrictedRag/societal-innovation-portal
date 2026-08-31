import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Lightbulb,
  MapPin,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

import { Navbar } from '@/components/landing/Navbar';
import { ScrollAnimator } from '@/components/landing/ScrollAnimator';

/* ── Feature data ── */
const features = [
  {
    icon: MapPin,
    title: 'Geo-Tagged Issues',
    description:
      'Report civic problems pinned to exact locations. Your community sees what matters nearby.',
    gradient: 'from-brand-500 to-accent-500',
  },
  {
    icon: Users,
    title: 'Research Collaboration',
    description:
      'Universities and students collaborate on real-world problems with faculty mentorship.',
    gradient: 'from-accent-500 to-purple-500',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Corporate Sponsorship',
    description:
      'Companies fund solutions and pilot innovative technologies for civic challenges.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description:
      'Smart recommendations connect problems with the right teams, skills, and resources.',
    gradient: 'from-pink-500 to-orange-500',
  },
];

/* ── Steps data ── */
const steps = [
  {
    number: '01',
    icon: Megaphone,
    title: 'Report',
    description:
      'Citizens report real civic problems — potholes, broken streetlights, water issues — geo-tagged and categorized.',
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Collaborate',
    description:
      'Students and faculty form teams. Companies offer sponsorship. Everyone works together toward a solution.',
  },
  {
    number: '03',
    icon: Target,
    title: 'Resolve',
    description:
      'Track milestones, validate outcomes, and celebrate impact. Transparent from start to finish.',
  },
];

/* ── Role data ── */
const roles = [
  {
    icon: UserRound,
    role: 'Citizen',
    description: 'Report local issues, upvote problems, and track resolutions in your community.',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    icon: GraduationCap,
    role: 'Student',
    description: 'Join research projects, build your portfolio, and solve real-world problems.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: ShieldCheck,
    role: 'Faculty',
    description: 'Lead academic projects, mentor students, and bridge research with civic impact.',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    icon: BriefcaseBusiness,
    role: 'Company',
    description: 'Sponsor pilot programs, fund innovations, and demonstrate corporate responsibility.',
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    iconBg: 'bg-violet-100',
  },
];

export default function HomePage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <Navbar />

      {/* ═══════════════════════════════════ HERO ═══════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 pb-20 pt-32 lg:px-8 lg:pb-32 lg:pt-44">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-accent-500/5 blur-3xl" />

        <div className="mx-auto max-w-5xl text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-600">
              <Sparkles className="h-3.5 w-3.5" />
              Civic Problem-Solving Reimagined
            </span>
          </div>

          <h1 className="animate-fade-in-up stagger-1 mt-8 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            Where communities{' '}
            <span className="text-gradient">innovate</span>
            <br className="hidden sm:block" />
            {' '}to solve real problems
          </h1>

          <p className="animate-fade-in-up stagger-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            A marketplace connecting citizens, universities, and corporations to
            collaboratively solve civic challenges — from broken infrastructure to
            public health to clean energy.
          </p>

          <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-brand-600 hover:shadow-glow-lg hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white/80 px-8 py-4 text-base font-semibold text-ink shadow-soft backdrop-blur transition-all hover:border-brand-300 hover:shadow-glow hover:scale-[1.02]"
            >
              Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <ScrollAnimator className="mt-16 sm:mt-20" animation="fade-in-up">
            <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border border-border bg-white/70 p-6 shadow-soft backdrop-blur sm:p-8">
              <div>
                <p className="text-2xl font-extrabold text-brand-500 sm:text-3xl">10+</p>
                <p className="mt-1 text-xs font-medium text-muted sm:text-sm">Issue Domains</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-brand-500 sm:text-3xl">4</p>
                <p className="mt-1 text-xs font-medium text-muted sm:text-sm">User Roles</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-brand-500 sm:text-3xl">∞</p>
                <p className="mt-1 text-xs font-medium text-muted sm:text-sm">Community Impact</p>
              </div>
            </div>
          </ScrollAnimator>
        </div>
      </section>

      {/* ═══════════════════════════════ FEATURES ═══════════════════════════════ */}
      <section id="features" className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimator animation="fade-in-up" className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
              Platform Capabilities
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              Everything you need to{' '}
              <span className="text-gradient">drive change</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              A comprehensive toolkit for civic engagement, from problem reporting to collaborative resolution.
            </p>
          </ScrollAnimator>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <ScrollAnimator
                key={feature.title}
                animation="fade-in-up"
                delay={index * 100}
              >
                <article className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-brand-200">
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                  {/* Hover gradient accent */}
                  <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-500/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                </article>
              </ScrollAnimator>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════════════ */}
      <section id="how-it-works" className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <ScrollAnimator animation="fade-in-up" className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
              Simple Process
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              Three steps to{' '}
              <span className="text-gradient">civic impact</span>
            </h2>
          </ScrollAnimator>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <ScrollAnimator
                key={step.number}
                animation="fade-in-up"
                delay={index * 150}
              >
                <div className="group relative rounded-2xl border border-border bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-brand-200">
                  {/* Step number */}
                  <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow-glow">
                    {step.number}
                  </span>

                  <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-100">
                    <step.icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>

                  {/* Connector line (not on last) */}
                  {index < steps.length - 1 && (
                    <div className="pointer-events-none absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-brand-300 to-transparent md:block" />
                  )}
                </div>
              </ScrollAnimator>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ ROLES ═══════════════════════════════ */}
      <section id="roles" className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimator animation="fade-in-up" className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
              For Everyone
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              Built for every{' '}
              <span className="text-gradient">changemaker</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Whether you&apos;re a concerned citizen or a corporate partner, there&apos;s a role for you in this ecosystem.
            </p>
          </ScrollAnimator>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r, index) => (
              <ScrollAnimator
                key={r.role}
                animation="scale-in"
                delay={index * 100}
              >
                <div className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated ${r.color}`}>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${r.iconBg} transition-transform group-hover:scale-110`}
                  >
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{r.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">
                    {r.description}
                  </p>
                </div>
              </ScrollAnimator>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ CTA ═══════════════════════════════ */}
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <ScrollAnimator animation="scale-in">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-accent-500 to-purple-600 p-10 text-center text-white shadow-glow-lg sm:p-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Ready to make a difference?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
              Join thousands of citizens, students, and organizations working together
              to build better communities.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-600 shadow-elevated transition-all hover:bg-brand-50 hover:scale-[1.02]"
              >
                Create Your Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 hover:scale-[1.02]"
              >
                Browse Issues
              </Link>
            </div>
          </div>
        </ScrollAnimator>
      </section>

      {/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */}
      <footer className="border-t border-border bg-white/50 px-5 py-12 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              CI
            </span>
            <span className="text-sm font-bold text-ink">
              Civic Innovation Marketplace
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="transition hover:text-brand-500">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-brand-500">
              How It Works
            </a>
            <Link href="/login" className="transition hover:text-brand-500">
              Sign In
            </Link>
            <Link href="/signup" className="transition hover:text-brand-500">
              Sign Up
            </Link>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Civic Innovation Marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}
