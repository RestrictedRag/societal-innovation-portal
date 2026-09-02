import { z } from 'zod';

export const canonicalDomainEnum = z.enum([
  'healthcare',
  'agriculture',
  'education',
  'disaster_management',
  'clean_energy',
  'water_management',
  'urban_infrastructure',
  'governance',
  'financial_inclusion',
  'waste_management',
]);

export const spamScoringSchema = z.object({
  spamProbability: z.number().min(0).max(1),
  isLowEffort: z.boolean(),
  reasoning: z.string().max(300),
});

export const problemTriageSchema = z.object({
  domain: canonicalDomainEnum,
  secondaryTags: z.array(canonicalDomainEnum).max(2).default([]),
  summary: z.string().max(200).optional(),
});

export const mediaAssessmentSchema = z.object({
  isAppropriate: z.boolean(),
  isRelevantToCivicIssue: z.boolean(),
  reasoning: z.string().max(200),
});

export type SpamScoringResult = z.infer<typeof spamScoringSchema>;
export type ProblemTriageResult = z.infer<typeof problemTriageSchema>;
export type MediaAssessmentResult = z.infer<typeof mediaAssessmentSchema>;

