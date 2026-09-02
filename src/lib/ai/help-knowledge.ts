export interface HelpArticle {
  id: string;
  title: string;
  category: 'submission' | 'moderation' | 'universities' | 'milestones' | 'sponsorship' | 'general';
  keywords: string[];
  content: string;
}

export const APP_HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'problem-submission',
    title: 'How Citizen Problem Submission Works',
    category: 'submission',
    keywords: ['report', 'submit', 'problem', 'words', 'description', 'location', 'image', 'photo', 'pin'],
    content: `To submit a civic problem on Civic Innovation Marketplace:
1. Provide a clear title and a detailed description of at least 30 words explaining what the issue is and where it is occurring.
2. Select an academic/civic domain (e.g. Healthcare, Water Management, Urban Infrastructure, Clean Energy, etc.).
3. Tag your exact GPS location or use your current browser location.
4. Optionally attach photos (compressed and uploaded securely).
Once submitted, your problem is queued for automated AI quality checks before becoming visible to nearby universities.`,
  },
  {
    id: 'ai-moderation-lifecycle',
    title: 'Problem Statuses and AI Processing Lifecycle',
    category: 'moderation',
    keywords: ['status', 'pending', 'open', 'rejected', 'needs review', 'merged', 'duplicate', 'spam'],
    content: `When a problem is submitted, it goes through an automated processing pipeline:
- PENDING_MODERATION: The problem is in the processing queue.
- OPEN: The problem passed the spam gate and deduplication check and is now live on the public feed for universities to claim.
- NEEDS_REVIEW: The AI detected ambiguous or low-effort details (spam score 0.40–0.85); an administrator will manually review and approve it.
- REJECTED: The report was flagged as spam, promotional, or too incoherent (spam score > 0.85).
- MERGED: A near-duplicate problem with >92% semantic similarity was already reported nearby. Your submission was automatically merged into the original report and recorded as an upvote.
- CLAIMED: A university research or student team has claimed this problem to work on a solution.`,
  },
  {
    id: 'university-discovery-claim',
    title: 'How Universities Discover and Claim Projects',
    category: 'universities',
    keywords: ['university', 'claim', 'student', 'faculty', 'research', 'service radius', 'recommendations'],
    content: `Accredited university students and faculty can browse civic problems matching their domain and geographic service area:
1. Issues within the university's defined service radius (in kilometers) are recommended on the university discovery feed.
2. Students and faculty can form multidisciplinary teams to claim an 'OPEN' problem.
3. Claiming atomically transitions the issue status to 'CLAIMED' and creates an active university project workspace.`,
  },
  {
    id: 'milestones-trl-verification',
    title: 'Project Milestones, TRL Levels, and Verification',
    category: 'milestones',
    keywords: ['milestone', 'trl', 'technology readiness', 'verification', 'evidence', 'reviewer', 'update'],
    content: `University teams track their solution progress by submitting structured milestone updates:
- TRL Levels: Solutions progress from Concept (TRL 1–3) to Prototype/Validation (TRL 4–6) to Deployment/Field Testing (TRL 7–9).
- Evidence: Teams submit proof (code, schematics, field test reports, photos/videos).
- Reviewer Verification: Faculty mentors and independent reviewers inspect evidence and mark verified=true. Verified milestones are showcased on the corporate feed.`,
  },
  {
    id: 'corporate-sponsorship-escrow',
    title: 'Corporate Sponsorship and Gated Escrow Funding',
    category: 'sponsorship',
    keywords: ['sponsor', 'corporate', 'escrow', 'funds', 'budget', 'held', 'released', 'money', 'funding'],
    content: `Corporate partners fund promising university solutions through a transparent escrow ledger:
1. Companies browse verified university showcase projects and commit milestone-based sponsorship.
2. Committed funds are deposited into an escrow ledger with status 'HELD'.
3. Funds are only released ('RELEASED') to the university project's budget when the milestone is formally verified with evidence.
4. If a project is abandoned, unreleased escrow funds are refunded to the sponsor.`,
  },
];

/**
 * Search the curated help articles using keyword matching and relevance scoring.
 */
export function searchHelpKnowledge(query: string, maxResults = 3): HelpArticle[] {
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

  const scored = APP_HELP_ARTICLES.map((article) => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    // Exact title match bonus
    if (titleLower.includes(normalizedQuery)) score += 10;

    // Keyword matching
    for (const kw of article.keywords) {
      if (normalizedQuery.includes(kw)) score += 5;
    }

    // Word occurrences
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 3;
      if (contentLower.includes(word)) score += 1;
    }

    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, maxResults).map((s) => s.article);
}
