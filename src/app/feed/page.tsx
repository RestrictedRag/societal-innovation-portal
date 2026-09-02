import { Suspense } from 'react';
import { ProblemFeed } from '@/components/feed/ProblemFeed';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-nexus-primary" />
        </div>
      }
    >
      <ProblemFeed />
    </Suspense>
  );
}

