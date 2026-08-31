'use client';

import { useEffect, useRef, useState } from 'react';

type Animation = 'fade-in-up' | 'fade-in' | 'scale-in' | 'slide-in-left' | 'slide-in-right';

interface ScrollAnimatorProps {
  children: React.ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
  threshold?: number;
}

const animationClassMap: Record<Animation, string> = {
  'fade-in-up': 'animate-fade-in-up',
  'fade-in': 'animate-fade-in',
  'scale-in': 'animate-scale-in',
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-right': 'animate-slide-in-right',
};

export function ScrollAnimator({
  children,
  animation = 'fade-in-up',
  delay = 0,
  className = '',
  threshold = 0.15,
}: ScrollAnimatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={[
        className,
        visible ? animationClassMap[animation] : 'opacity-0',
      ].join(' ')}
      style={visible && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
