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
 * Includes email fallback, auth ID synchronization, and automatic demo account provisioning.
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

    const sessionUserId = session.user.id;
    const sessionEmail = session.user.email?.toLowerCase().trim();

    // 1. Primary lookup by authUserId
    let user = await db.query.users.findFirst({
      where: eq(users.authUserId, sessionUserId),
      with: {
        university: true,
      },
    });

    // 2. Fallback lookup by email if authUserId doesn't match yet
    if (!user && sessionEmail) {
      const userByEmail = await db.query.users.findFirst({
        where: eq(users.email, sessionEmail),
        with: {
          university: true,
        },
      });

      if (userByEmail) {
        // Sync authUserId in database so future lookups are instantaneous
        try {
          await db
            .update(users)
            .set({ authUserId: sessionUserId })
            .where(eq(users.id, userByEmail.id));
          user = { ...userByEmail, authUserId: sessionUserId };
        } catch {
          user = userByEmail;
        }
      }
    }

    // 3. Auto-provision demo account or default citizen profile if record is missing
    if (!user && sessionEmail) {
      const isDemoCitizen = sessionEmail.includes('demo.citizen');
      const isDemoStudent = sessionEmail.includes('demo.student');
      const isDemoFaculty = sessionEmail.includes('demo.faculty');
      const isDemoIndustry = sessionEmail.includes('demo.industry');
      const isDemoAdmin = sessionEmail.includes('demo.admin');

      let role: User['role'] = 'CITIZEN';
      let fullName = session.user.name || 'Citizen User';

      if (isDemoStudent) {
        role = 'STUDENT';
        fullName = 'Demo Student (Aarav Sharma)';
      } else if (isDemoFaculty) {
        role = 'FACULTY';
        fullName = 'Demo Faculty (Dr. Rajesh Kumar)';
      } else if (isDemoIndustry) {
        role = 'COMPANY_REP';
        fullName = 'Demo Industry Partner (NexGen Labs)';
      } else if (isDemoAdmin) {
        role = 'ADMIN';
        fullName = 'Demo Administrator';
      } else if (isDemoCitizen) {
        role = 'CITIZEN';
        fullName = 'Demo Citizen (Aarti Verma)';
      }

      try {
        const [created] = await db
          .insert(users)
          .values({
            authUserId: sessionUserId,
            email: sessionEmail,
            fullName,
            firstName: fullName.split(' ')[0] || 'User',
            lastName: fullName.split(' ').slice(1).join(' ') || '',
            role,
            city: 'New Delhi',
            state: 'Delhi',
            isVerified: true,
          })
          .returning();
        if (created) {
          user = { ...created, university: null };
        }
      } catch (insertErr) {
        console.warn('Auto-provision user profile failed:', insertErr);
      }
    }

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
      sessionUserId,
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
