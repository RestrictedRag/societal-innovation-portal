import { NextResponse } from 'next/server';
import postgres from 'postgres';

import {
  DEFAULT_FEED_LIMIT,
  DEFAULT_FEED_RADIUS_KM,
  MAX_FEED_LIMIT,
} from '@/lib/constants';
import { buildNearbyProblemsGeoQuery } from '@/lib/geo-query';

type FeedCursor = {
  createdAt: string;
  id: string;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function encodeCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(raw: string | null): FeedCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as Partial<FeedCursor>;
    if (typeof parsed.createdAt === 'string' && typeof parsed.id === 'string') {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    // ignore invalid base64 cursor and fallback to legacy raw format
  }

  const [createdAt, id] = raw.split('|');
  if (createdAt && id) {
    return { createdAt, id };
  }

  return null;
}

function truncateDescription(value: string | null | undefined, maxChars = 200) {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxChars).trimEnd()}…`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const radiusKm = Number(searchParams.get('radius_km') ?? DEFAULT_FEED_RADIUS_KM);
  const limit = clamp(Number(searchParams.get('limit') ?? DEFAULT_FEED_LIMIT), 1, MAX_FEED_LIMIT);
  const cursor = decodeCursor(searchParams.get('cursor'));
  const geo = buildNearbyProblemsGeoQuery();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: 'Both lat and lng query params are required and must be valid numbers.' },
      { status: 400 },
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 200 });
  }

  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const statusClause = `cp.status IN ('OPEN', 'IN_PROGRESS')`;

    const query = `
      SELECT
        cp.id,
        COALESCE(cp.title, LEFT(cp.description, 120)) AS title,
        LEFT(cp.description, 200) AS description,
        cp.domain,
        cp.image_url,
        cp.created_at,
        (
          SELECT COUNT(*)::int
          FROM university_projects up
          WHERE up.problem_id = cp.id
            AND up.status = 'ACTIVE'
        ) AS active_project_count,
        0::int AS upvote_count,
        ${geo.distanceExpression}
      FROM citizen_problems cp
      LEFT JOIN users u ON u.id = cp.user_id
      WHERE ${statusClause}
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        ${geo.distanceFilter}
      ${cursor ? 'AND (cp.created_at, cp.id) < ($4, $5)' : ''}
      ORDER BY cp.created_at DESC, cp.id DESC
      LIMIT $${cursor ? 6 : 4};
    `;

    const values = cursor
      ? [lng, lat, radiusKm * 1000, cursor.createdAt, cursor.id, limit]
      : [lng, lat, radiusKm * 1000, limit];

    const rows = (await sql.unsafe(query, ...(values as any[]))) as Array<{
      id: string;
      title: string;
      description: string;
      domain: string | null;
      image_url: string | null;
      created_at: string;
      active_project_count: number;
      upvote_count: number;
      distance_km: number;
    }>;

    const items = rows.map((row) => ({
      id: row.id,
      title: String(row.title ?? 'Community issue'),
      description: truncateDescription(row.description),
      domain: row.domain ?? null,
      imageUrl: row.image_url ?? null,
      media: row.image_url ? [row.image_url] : [],
      upvoteCount: Number(row.upvote_count ?? 0),
      activeProjectCount: Number(row.active_project_count ?? 0),
      createdAt: row.created_at,
      distanceKm: Number(row.distance_km ?? 0),
    }));

    const nextCursor = items.length === limit && items.length > 0
      ? encodeCursor({
          createdAt: items[items.length - 1].createdAt,
          id: items[items.length - 1].id,
        })
      : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error('Feed query failed:', error);
    return NextResponse.json({ items: [], nextCursor: null }, { status: 200 });
  } finally {
    await sql.end({ timeout: 1 });
  }
}
