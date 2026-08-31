interface FeatureCardProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function FeatureCard({ eyebrow, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand-500">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </article>
  );
}
