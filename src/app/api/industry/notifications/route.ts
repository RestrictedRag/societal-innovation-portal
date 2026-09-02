import { NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const notifs = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 30,
    });

    const unreadCount = notifs.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notifs,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body?.id === 'string' ? body.id : null;
    const markAllAsRead = body?.markAll === true;

    if (markAllAsRead) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.id));
      return NextResponse.json({ message: 'All notifications marked as read.' });
    }

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));
      return NextResponse.json({ message: 'Notification marked as read.' });
    }

    return NextResponse.json({ error: 'id or markAll parameter required.' }, { status: 400 });
  } catch (error: any) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ error: 'Failed to update notification.' }, { status: 500 });
  }
}
