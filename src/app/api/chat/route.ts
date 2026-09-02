import { eq, sql } from 'drizzle-orm';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import {
  chatMessages,
  chatSessions,
  citizenProblems,
  users,
} from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/chat-system-prompt';
import { getChatModel } from '@/lib/ai/models';
import { searchHelpKnowledge } from '@/lib/ai/help-knowledge';
import { logger } from '@/lib/logger';
import { checkChatRateLimit } from '@/lib/redis';

type ChatCoreMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Helper to extract text content from a message (v7 UIMessage uses parts, not content)
function getMessageText(msg: Record<string, unknown>): string {
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.parts)) {
    return (msg.parts as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
      .join('\n');
  }
  return '';
}

// Convert UIMessage[] from @ai-sdk/react into valid CoreMessage[] for streamText
function sanitizeToCoreMessages(rawMessages: unknown[]): ChatCoreMessage[] {
  return rawMessages.map((msg: any) => {
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.parts)) {
      content = msg.parts
        .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('\n');
    }

    return {
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
      content: content || ' ',
    };
  });
}

export async function POST(request: Request) {
  try {
    // 1. Resolve user session (optional for general help, required for personalized tools)
    let userId: string | null = null;
    try {
      const { data: session } = await auth.getSession();
      if (session?.user?.id) {
        const user = await db.query.users.findFirst({
          where: eq(users.authUserId, session.user.id),
        });
        if (user) {
          userId = user.id;
        }
      }
    } catch {
      // Allow guest exploration
    }

    // 2. Redis Rate Limiting (15 messages / minute per user/guest)
    const rateLimitKey = userId || 'guest_chat_user';
    const isAllowed = await checkChatRateLimit(rateLimitKey, 20, 60);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit reached (20 messages/minute). Please slow down and try again shortly.' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { messages, sessionId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const coreMessages = sanitizeToCoreMessages(messages);

    // 3. User-Scoped Tools Definition
    const tools = {
      getMyProblemStatus: tool({
        description: 'Retrieves the list of civic problems submitted by the currently logged-in user, along with their current review status, domain, spam assessment, and university claim info.',
        inputSchema: z.object({
          limit: z.number().min(1).max(20).default(5).describe('Maximum number of submitted problems to retrieve (default: 5)'),
        }),
        execute: async ({ limit }) => {
          if (!userId) {
            return {
              error: 'User is not signed in. Please sign in to view your personal reported problems.',
            };
          }

          try {
            logger.info('Tool call: getMyProblemStatus', { userId, limit });
            const problems = await db.execute(sql`
              SELECT
                cp.id,
                cp.title,
                cp.description,
                cp.status,
                cp.domain,
                cp.spam_score,
                cp.created_at,
                (
                  SELECT u.name
                  FROM university_projects up
                  JOIN universities u ON u.id = up.lead_university_id
                  WHERE up.problem_id = cp.id AND up.status = 'ACTIVE'
                  LIMIT 1
                ) AS lead_university_name
              FROM citizen_problems cp
              WHERE cp.user_id = ${userId}
              ORDER BY cp.created_at DESC
              LIMIT ${limit};
            `);

            const rows = Array.isArray(problems)
              ? problems
              : ((problems as any)?.rows as any[]) ?? [];

            if (rows.length === 0) {
              return {
                totalCount: 0,
                message: 'You have not submitted any civic problem reports yet. Use the "Report Issue" button to submit a local problem.',
                problems: [],
              };
            }

            return {
              totalCount: rows.length,
              problems: rows.map((p: any) => ({
                id: p.id,
                title: p.title,
                status: p.status,
                domain: p.domain || 'Unclassified',
                spamScore: p.spam_score != null ? `${Math.round(p.spam_score * 100)}%` : 'Pending review',
                submittedAt: new Date(p.created_at).toLocaleDateString(),
                claimedByUniversity: p.lead_university_name || 'Not yet claimed by a university team',
              })),
            };
          } catch (toolErr) {
            logger.error('Tool getMyProblemStatus error', { userId, error: String(toolErr) });
            return { error: 'Unable to retrieve problem records at this moment.' };
          }
        },
      }),

      getMyProjectStatus: tool({
        description: 'Retrieves the list of university research projects associated with the logged-in student, faculty, or corporate representative.',
        inputSchema: z.object({
          limit: z.number().min(1).max(20).default(5).describe('Maximum number of projects to retrieve (default: 5)'),
        }),
        execute: async ({ limit }) => {
          if (!userId) {
            return {
              error: 'User is not signed in. Please sign in to view your university projects.',
            };
          }

          try {
            logger.info('Tool call: getMyProjectStatus', { userId, limit });
            const projects = await db.execute(sql`
              SELECT
                up.id,
                up.status,
                up.budget,
                cp.title AS problem_title,
                u.name AS lead_university_name,
                COUNT(DISTINCT pu.id)::int AS total_milestones,
                COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
                COALESCE(SUM(CASE WHEN el.status = 'HELD' THEN el.amount ELSE 0 END), 0)::text AS held_escrow,
                COALESCE(SUM(CASE WHEN el.status = 'RELEASED' THEN el.amount ELSE 0 END), 0)::text AS released_escrow
              FROM university_projects up
              JOIN citizen_problems cp ON cp.id = up.problem_id
              JOIN universities u ON u.id = up.lead_university_id
              LEFT JOIN project_updates pu ON pu.project_id = up.id
              LEFT JOIN escrow_ledger el ON el.project_id = up.id
              WHERE up.claimed_by_user_id = ${userId}
              GROUP BY up.id, up.status, up.budget, cp.title, u.name
              ORDER BY up.created_at DESC
              LIMIT ${limit};
            `);

            const rows = Array.isArray(projects)
              ? projects
              : ((projects as any)?.rows as any[]) ?? [];

            if (rows.length === 0) {
              return {
                totalCount: 0,
                message: 'You are not leading any active research projects. You can claim open problems from the University Portal.',
                projects: [],
              };
            }

            return {
              totalCount: rows.length,
              projects: rows.map((r: any) => ({
                id: r.id,
                problemTitle: r.problem_title,
                status: r.status,
                allocatedBudget: `$${Number(r.budget || 0).toLocaleString()}`,
                leadUniversity: r.lead_university_name,
                milestones: `${r.verified_milestones} of ${r.total_milestones} verified`,
                escrow: {
                  held: `$${Number(r.held_escrow || 0).toLocaleString()}`,
                  released: `$${Number(r.released_escrow || 0).toLocaleString()}`,
                },
              })),
            };
          } catch (toolErr) {
            logger.error('Tool getMyProjectStatus error', { userId, error: String(toolErr) });
            return { error: 'Unable to retrieve project records at this moment.' };
          }
        },
      }),

      searchAppHelp: tool({
        description: 'Searches the curated Civic Innovation Marketplace platform knowledge base for explanations of how submission, spam review, university claiming, milestones, and escrow work.',
        inputSchema: z.object({
          query: z.string().describe('Search terms or questions regarding how the platform works'),
        }),
        execute: async ({ query }) => {
          logger.info('Tool call: searchAppHelp', { query });
          const matches = searchHelpKnowledge(query, 3);
          if (matches.length === 0) {
            return {
              results: [] as Array<{ title: string; category: string; content: string }>,
              message: 'No specific help article matched your query. You can ask about submission rules, spam scoring, university claiming, or escrow funding.',
            };
          }

          return {
            results: matches.map((m) => ({
              title: m.title,
              category: m.category,
              content: m.content,
            })),
          };
        },
      }),
    };

    // 4. Resolve Active Session for Persistence (if logged in)
    let currentSessionId = sessionId as string | undefined;
    if (userId && !currentSessionId) {
      const latestMsg = messages[messages.length - 1] as Record<string, unknown>;
      const titleText = getMessageText(latestMsg).slice(0, 50) || 'New Conversation';
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          userId,
          title: titleText,
        })
        .returning();
      currentSessionId = newSession.id;
    }

    // Persist the latest user message (if logged in)
    const latestUserMsg = messages[messages.length - 1] as Record<string, unknown> | undefined;
    if (userId && currentSessionId && latestUserMsg && latestUserMsg.role === 'user') {
      const userText = getMessageText(latestUserMsg);
      await db.insert(chatMessages).values({
        sessionId: currentSessionId,
        role: 'user',
        content: userText || '',
      }).catch((e: unknown) => logger.warn('Failed to record user chat message', { error: String(e) }));
    }

    // 5. Model Execution: Evaluator-Optimizer Loop with streamText
    const hasApiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY);

    if (hasApiKey && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const result = streamText({
        model: getChatModel(),
        system: CHAT_SYSTEM_PROMPT,
        messages: coreMessages,
        tools,
        stopWhen: stepCountIs(5),
        onFinish: async (event) => {
          if (userId && currentSessionId && event.text) {
            await db.insert(chatMessages).values({
              sessionId: currentSessionId,
              role: 'assistant',
              content: event.text,
            }).catch((e: unknown) => logger.warn('Failed to record assistant message', { error: String(e) }));
          }
        },
      });

      return result.toUIMessageStreamResponse({
        headers: {
          ...(currentSessionId ? { 'x-chat-session-id': currentSessionId } : {}),
        },
      });
    }

    // Fallback response if API key is not present
    const lastUserQuery = getMessageText(latestUserMsg ?? {}).toLowerCase();
    let fallbackReply = "I am the Civic Innovation Marketplace assistant. How can I help you understand problem reporting, university projects, or corporate escrow funding?";

    const helpRes = await tools.searchAppHelp.execute({ query: lastUserQuery }, {} as never);
    if (helpRes && typeof helpRes === 'object' && 'results' in helpRes && Array.isArray(helpRes.results) && helpRes.results.length > 0) {
      fallbackReply = helpRes.results[0].content;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fallbackReply)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(currentSessionId ? { 'x-chat-session-id': currentSessionId } : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong processing your message.';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Chat API unhandled error', { error: message, stack });
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
