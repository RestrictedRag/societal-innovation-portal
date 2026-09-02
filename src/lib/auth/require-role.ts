import { NextResponse } from 'next/server';
import type { User, UserRole } from '@/db/schema';
import { resolveAuthUser, type ResolvedAuthResult } from './resolve-user';

export type RequireRoleOptions = {
  requireVerified?: boolean;
  requireUniversity?: boolean;
};

export type RequireRoleResult =
  | {
      success: true;
      user: User;
      sessionUserId: string;
    }
  | {
      success: false;
      error: string;
      status: number;
    };

/**
 * Centralized Role-Based Access Control (RBAC) resolver.
 * Validates authentication session and verifies user has one of the allowed roles.
 *
 * @param allowedRoles Array of allowed UserRole values (e.g. ['STUDENT', 'FACULTY'])
 * @param options Optional constraints (e.g. requireVerified, requireUniversity)
 */
export async function requireRole(
  allowedRoles: UserRole[] | readonly UserRole[],
  options?: RequireRoleOptions,
): Promise<RequireRoleResult> {
  const authResult = await resolveAuthUser();
  if (!authResult.success) {
    return authResult;
  }

  const { user, sessionUserId } = authResult;

  // 1. Role validation
  if (!allowedRoles.includes(user.role as UserRole)) {
    return {
      success: false,
      error: `Forbidden: Action requires role in [${allowedRoles.join(', ')}]. Current user role is ${user.role}.`,
      status: 403,
    };
  }

  // 2. Verification constraint
  if (options?.requireVerified && !user.isVerified) {
    return {
      success: false,
      error: 'Forbidden: User account is not verified.',
      status: 403,
    };
  }

  // 3. University affiliation constraint
  if (options?.requireUniversity && !user.universityId) {
    return {
      success: false,
      error: 'Forbidden: User is not associated with an accredited university.',
      status: 400,
    };
  }

  return {
    success: true,
    user,
    sessionUserId,
  };
}

/**
 * Utility helper to convert RequireRoleResult into a NextResponse when unauthorized.
 */
export function createRbacErrorResponse(result: { success: false; error: string; status: number }) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
