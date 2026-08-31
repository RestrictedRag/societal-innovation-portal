import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/login',
});

export const config = {
  matcher: [
    '/feed',
    '/problems/new',
    '/problems/:id/claim',
    '/problems/:id/milestones',
    '/problems/:id/sponsor',
    '/problems/:id/resolve',
  ],
};

