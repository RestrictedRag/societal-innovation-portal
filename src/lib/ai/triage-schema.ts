import { z } from 'zod';

export const academicDomainEnum = z.enum([
  'Civil',
  'Mechanical',
  'Electrical/IoT',
  'Computer Science',
  'Chemical/Environmental',
  'Agriculture',
  'Healthcare',
  'Rural Tech',
]);

export const civicIssueTriageSchema = z.object({
  spamProbability: z.number().min(0).max(1),
  isActionableCivicIssue: z.boolean(),
  academicDomain: academicDomainEnum,
  tags: z.array(z.string()).max(4).default([]),
});

export type CivicIssueTriage = z.infer<typeof civicIssueTriageSchema>;
