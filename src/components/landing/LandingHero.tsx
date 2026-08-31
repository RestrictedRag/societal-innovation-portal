interface LandingHeroProps {
  badge: string;
  title: string;
  description: string;
}

export function LandingHero({ badge, title, description }: LandingHeroProps) {
  return (
    <div className="max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-soft">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-brand-500">{badge}</p>
      <h1 className="text-4xl font-bold text-ink">{title}</h1>
      <p className="mt-4 text-muted">{description}</p>
    </div>
  );
}
