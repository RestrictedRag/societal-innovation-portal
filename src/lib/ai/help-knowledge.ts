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
    content: `### Submission Requirements
Before submitting your civic challenge, ensure you meet the 4 core criteria:

- [x] **Title & Detailed Description**: Must provide a clear title and at least **30 words** detailing what happens, who is impacted, and the community urgency.
- [x] **Civic Domain**: Select the most relevant category (Urban Infrastructure, Water Management, Clean Energy, Healthcare, etc.).
- [x] **Precise Geolocation**: Use current GPS or pin the exact street address / coordinates on the PostGIS map.
- [x] **Photographic Evidence**: (Recommended) Attach photos or live camera captures to accelerate AI quality validation.

### What Happens After You Submit
Once submitted, your report undergoes automated AI triage (Gemini Flash spam check and BGE-M3 semantic deduplication) resulting in one of four states:

| Outcome State | Description | Next Step |
| :--- | :--- | :--- |
| **OPEN** | Passed quality checks (<0.40 spam score, unique). | Visible immediately on regional feed for universities to claim. |
| **NEEDS_REVIEW** | Borderline quality or ambiguous context (0.40–0.85 spam score). | Sent to Admin Moderation Queue for human review. |
| **MERGED** | >92% semantic duplicate of an existing nearby issue. | Auto-merged into parent report and recorded as an upvote. |
| **REJECTED** | Incoherent or promotional spam (>0.85 spam score). | Rejected with notification to citizen. |`,
  },
  {
    id: 'ai-moderation-lifecycle',
    title: 'Problem Statuses and AI Processing Lifecycle',
    category: 'moderation',
    keywords: ['status', 'pending', 'open', 'rejected', 'needs review', 'merged', 'duplicate', 'spam'],
    content: `### AI Pipeline Overview
Every submission is analyzed by the background worker:

1. **AI Classification & Spam Score**: Gemini Flash analyzes description text and flags spam scores between 0.00 and 1.00.
2. **Semantic Deduplication**: BGE-M3 1024-dimension embeddings calculate cosine similarity against nearby problems within 25km.
3. **Regional Routing**: PostGIS coordinates map the challenge to accredited universities within their service radius.

### Status Definitions
- \`OPEN\`: Available for university research teams to claim.
- \`NEEDS_REVIEW\`: Under administrative moderation review.
- \`MERGED\`: Combined with an earlier duplicate submission.
- \`REJECTED\`: Flagged as spam or violating submission guidelines.
- \`IN_PROGRESS\`: One or more universities have actively claimed this challenge.`,
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
