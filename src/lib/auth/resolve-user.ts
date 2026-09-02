import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { users, type User } from '@/db/schema';

export type ResolvedAuthResult =
  | { success: true; user: User; sessionUserId: string }
  | { success: false; error: string; status: 401 | 404 };

/**
 * Standardized helper to resolve the active Neon Auth session and query the database user profile.
 * Centralizes session extraction, error mapping, and user retrieval across all server routes.
 */
export async function resolveAuthUser(): Promise<ResolvedAuthResult> {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized: missing or invalid session.',
        status: 401,
      };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.authUserId, session.user.id),
    });

    if (!user) {
      return {
        success: false,
        error: 'User profile not found. Please complete registration.',
        status: 404,
      };
    }

    return {
      success: true,
      user,
      sessionUserId: session.user.id,
    };
  } catch (err: any) {
    console.error('Failed to resolve auth user:', err);
    return {
      success: false,
      error: 'Authentication verification failed.',
      status: 401,
    };
  }
}
