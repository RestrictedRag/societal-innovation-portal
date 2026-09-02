import { eq, sql, desc } from 'drizzle-orm';
import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import {
  chatMessages,
  chatSessions,
  citizenProblems,
  escrowLedger,
  projectUpdates,
  universities,
  universityProjects,
  users,
} from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/chat-system-prompt';
import { searchHelpKnowledge } from '@/lib/ai/help-knowledge';
import { logger } from '@/lib/logger';
import { checkChatRateLimit } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user server-side
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the assistant.' },
        { status: 401 },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.authUserId, session.user.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete registration.' },
        { status: 401 },
      );
    }

    const userId = user.id;

    // 2. Redis Rate Limiting (15 messages / minute per user)
    const isAllowed = await checkChatRateLimit(userId, 15, 60);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit reached (15 messages/minute). Please slow down and try again shortly.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { messages, sessionId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // 3. User-Scoped Tools Definition
    const tools = {
      getMyProblemStatus: tool({
        description: `Retrieves the list of civic problems submitted by the currently logged-in user, along with their current review status, domain, spam assessment, and university claim info.`,
        parameters: z.object({
          limit: z.number().min(1).max(20).default(5).describe('Maximum number of submitted problems to retrieve (default: 5)'),
        }),
        execute: async ({ limit }) => {
          try {
            logger.info('Tool call: getMyProblemStatus', { userId, limit });
            const problems = await db.execute<{
              id: string;
              title: string;
              description: string;
              status: string;
              domain: string | null;
              spam_score: number | null;
              created_at: string;
              claimed_by: string | null;
              lead_university_name: string | null;
            }>(sql`
              SELECT
                cp.id,
                cp.title,
                cp.description,
                cp.status,
                cp.domain,
                cp.spam_score,
                cp.created_at,
                cp.claimed_by,
                u.name AS lead_university_name
              FROM citizen_problems cp
              LEFT JOIN users usr ON usr.id = cp.claimed_by
              LEFT JOIN universities u ON u.id = usr.university_id
              WHERE cp.user_id = ${userId}
              ORDER BY cp.created_at DESC
              LIMIT ${limit};
            `);

            const rows = Array.isArray(problems) ? problems : (problems as any)?.rows ?? [];
            if (rows.length === 0) {
              return {
                totalCount: 0,
                message: 'You have not submitted any civic problem reports yet.',
                problems: [],
              };
            }

            return {
              totalCount: rows.length,
              problems: rows.map((row: any) => ({
                id: row.id,
                title: row.title,
                status: row.status,
                domain: row.domain ?? 'Unassigned',
                spamScore: row.spam_score,
                claimedByUniversity: row.lead_university_name ?? (row.claimed_by ? 'Claimed by Academic Team' : 'Not yet claimed'),
                submittedAt: new Date(row.created_at).toLocaleDateString(),
              })),
            };
          } catch (toolErr) {
            logger.error('Tool getMyProblemStatus error', { userId, error: String(toolErr) });
            return { error: 'Unable to retrieve problem records at this moment.' };
          }
        },
      }),

      getMyProjectStatus: tool({
        description: `Retrieves claimed university projects for the current user, including milestone progress, TRL levels, and escrow funding state.`,
        parameters: z.object({
          limit: z.number().min(1).max(10).default(5).describe('Maximum number of projects to return'),
        }),
        execute: async ({ limit }) => {
          try {
            logger.info('Tool call: getMyProjectStatus', { userId, limit });
            const projects = await db.execute<{
              id: string;
              problem_title: string;
              status: string;
              budget: string;
              lead_university_name: string;
              total_milestones: number;
              verified_milestones: number;
              held_escrow: string;
              released_escrow: string;
            }>(sql`
              SELECT
                up.id,
                cp.title AS problem_title,
                up.status,
                up.budget,
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
                 OR ( ${user.universityId ? sql`up.lead_university_id = ${user.universityId}` : sql`1=0`} )
              GROUP BY up.id, cp.title, up.status, up.budget, u.name
              ORDER BY up.created_at DESC
              LIMIT ${limit};
            `);

            const rows = Array.isArray(projects) ? projects : (projects as any)?.rows ?? [];
            if (rows.length === 0) {
              return {
                totalCount: 0,
                message: 'No active or claimed research projects found for your account.',
                projects: [],
              };
            }

            return {
              totalCount: rows.length,
              projects: rows.map((p: any) => ({
                id: p.id,
                problemTitle: p.problem_title,
                status: p.status,
                allocatedBudget: `$${Number(p.budget || 0).toLocaleString()}`,
                leadUniversity: p.lead_university_name,
                milestones: `${p.verified_milestones} of ${p.total_milestones} verified`,
                escrow: {
                  held: `$${Number(p.held_escrow || 0).toLocaleString()}`,
                  released: `$${Number(p.released_escrow || 0).toLocaleString()}`,
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
        description: `Searches the curated Civic Innovation Marketplace platform knowledge base for explanations of how submission, spam review, university claiming, milestones, and escrow work.`,
        parameters: z.object({
          query: z.string().describe('Search terms or questions regarding how the platform works'),
        }),
        execute: async ({ query }) => {
          logger.info('Tool call: searchAppHelp', { query });
          const matches = searchHelpKnowledge(query, 3);
          if (matches.length === 0) {
            return {
              results: [],
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

    // 4. Resolve Active Session for Persistence
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          userId,
          title: messages[messages.length - 1]?.content?.slice(0, 50) || 'New Conversation',
        })
        .returning();
      currentSessionId = newSession.id;
    }

    // Persist the latest user message
    const latestUserMsg = messages[messages.length - 1];
    if (latestUserMsg && latestUserMsg.role === 'user') {
      await db.insert(chatMessages).values({
        sessionId: currentSessionId,
        role: 'user',
        content: String(latestUserMsg.content || ''),
      }).catch((e) => logger.warn('Failed to record user chat message', { error: String(e) }));
    }

    // 5. Model Execution: Evaluator-Optimizer Loop with streamText & maxSteps
    const hasApiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY);

    if (hasApiKey && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const result = streamText({
        model: google('gemini-flash-latest'),
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools,
        maxSteps: 5,
        onFinish: async (event) => {
          // Persist the final assistant reply
          if (event.text) {
            await db.insert(chatMessages).values({
              sessionId: currentSessionId,
              role: 'assistant',
              content: event.text,
            }).catch((e) => logger.warn('Failed to record assistant message', { error: String(e) }));
          }
        },
      });

      return result.toDataStreamResponse({
        headers: {
          'x-chat-session-id': currentSessionId,
        },
      });
    }

    // Fallback streaming mode when API key is unconfigured
    const lastUserQuery = (latestUserMsg?.content || '').toLowerCase();
    let fallbackReply = "I am the Civic Innovation Marketplace assistant. How can I help you understand problem reporting, university projects, or corporate escrow funding?";

    if (lastUserQuery.includes('capital') || lastUserQuery.includes('france') || lastUserQuery.includes('weather') || lastUserQuery.includes('python')) {
      fallbackReply = "I can only help with Civic Innovation Marketplace-related questions — for general knowledge or coding, you're better off searching the web or asking a general assistant.";
    } else if (lastUserQuery.includes('status') || lastUserQuery.includes('problem') || lastUserQuery.includes('report') || lastUserQuery.includes('my')) {
      const toolRes = await tools.getMyProblemStatus.execute({ limit: 5 }, {} as any);
      if (toolRes && 'problems' in toolRes && (toolRes as any).problems.length > 0) {
        const top = (toolRes as any).problems[0];
        fallbackReply = `Here is the status of your reported problem:\n\n• **Title:** ${top.title}\n• **Status:** ${top.status}\n• **Domain:** ${top.domain}\n• **Claimed By:** ${top.claimedByUniversity}\n• **Submitted:** ${top.submittedAt}`;
      } else {
        fallbackReply = "I checked your account records. You currently do not have any submitted problems in the database.";
      }
    } else if (lastUserQuery.includes('escrow') || lastUserQuery.includes('how') || lastUserQuery.includes('sponsor') || lastUserQuery.includes('claim')) {
      const helpRes = await tools.searchAppHelp.execute({ query: lastUserQuery }, {} as any);
      if (helpRes && 'results' in helpRes && (helpRes as any).results.length > 0) {
        fallbackReply = (helpRes as any).results[0].content;
      }
    }

    // Return mock streaming response conforming to AI SDK data stream
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
        'x-chat-session-id': currentSessionId,
      },
    });
  } catch (err: any) {
    logger.error('Chat API unhandled error', { error: String(err), stack: err?.stack });
    return NextResponse.json(
      { error: err?.message || 'Something went wrong processing your message.' },
      { status: 500 },
    );
  }
}
