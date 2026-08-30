import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'citizen',
  'university',
  'corporate',
  'admin',
] as const);

export const problemStatusEnum = pgEnum('problem_status', [
  'PENDING',
  'OPEN',
  'NEEDS_REVIEW',
  'REJECTED',
  'CLAIMED',
] as const);

export const problemDomainEnum = pgEnum('problem_domain', [
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
] as const);

export const universityProjectStatusEnum = pgEnum('university_project_status', [
  'ACTIVE',
  'COMPLETED',
  'ABANDONED',
] as const);

export const escrowLedgerStatusEnum = pgEnum('escrow_ledger_status', [
  'HELD',
  'RELEASED',
  'REFUNDED',
] as const);

const vector = customType<{ data: number[] | null; driverData: string }>({
  dataType() {
    return 'vector(1024)';
  },
  toDriver(value: number[] | null | undefined): string {
    if (value === null || value === undefined) {
      return '[]';
    }

    return `[${value.map((item) => Number(item).toFixed(6)).join(',')}]`;
  },
  fromDriver(value: string | null): number[] {
    if (!value) {
      return [];
    }

    const normalized = value.replace(/[\[\]]/g, '');
    if (!normalized.trim()) {
      return [];
    }

    return normalized
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  },
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: userRoleEnum('role').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const citizenProblems = pgTable(
  'citizen_problems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    status: problemStatusEnum('status').notNull().default('PENDING'),
    spamScore: real('spam_score'),
    domain: problemDomainEnum('domain'),
    secondaryTags: problemDomainEnum('secondary_tags').array(),
    claimedBy: uuid('claimed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    secondaryTagsMaxTwo: check(
      'citizen_problems_secondary_tags_max_2',
      sql`array_length(${table.secondaryTags}, 1) <= 2`,
    ),
  }),
);

export const problemEmbeddings = pgTable(
  'problem_embeddings',
  {
    problemId: uuid('problem_id')
      .primaryKey()
      .references(() => citizenProblems.id, { onDelete: 'cascade' }),
    embedding: vector('embedding', { dimensions: 1024 }),
    modelVersion: text('model_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    embeddingHnswIndex: index('problem_embeddings_embedding_hnsw_idx')
      .using('hnsw', sql`${table.embedding} vector_l2_ops`),
  }),
);

export const universityProjects = pgTable('university_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => citizenProblems.id, { onDelete: 'cascade' }),
  universityId: uuid('university_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: universityProjectStatusEnum('status').notNull().default('ACTIVE'),
  budget: numeric('budget', { precision: 16, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projectUpdates = pgTable('project_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => universityProjects.id, { onDelete: 'cascade' }),
  trlLevel: integer('trl_level').notNull(),
  description: text('description').notNull(),
  evidenceUrl: text('evidence_url'),
  verified: boolean('verified').notNull().default(false),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const escrowLedger = pgTable('escrow_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => universityProjects.id, { onDelete: 'cascade' }),
  milestoneId: uuid('milestone_id').references(() => projectUpdates.id, { onDelete: 'set null' }),
  corporateId: uuid('corporate_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
  status: escrowLedgerStatusEnum('status').notNull().default('HELD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  releasedAt: timestamp('released_at', { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  citizenProblems: many(citizenProblems, { relationName: 'userCitizenProblems' }),
  claimedProblems: many(citizenProblems, { relationName: 'claimedProblems' }),
  universityProjects: many(universityProjects, { relationName: 'universityProjects' }),
  projectUpdates: many(projectUpdates, { relationName: 'verifiedByProjectUpdates' }),
  escrowLedgers: many(escrowLedger, { relationName: 'corporateEscrowLedgers' }),
}));

export const citizenProblemsRelations = relations(citizenProblems, ({ one, many }) => ({
  user: one(users, {
    fields: [citizenProblems.userId],
    references: [users.id],
    relationName: 'userCitizenProblems',
  }),
  claimedByUser: one(users, {
    fields: [citizenProblems.claimedBy],
    references: [users.id],
    relationName: 'claimedProblems',
  }),
  embedding: one(problemEmbeddings, {
    fields: [citizenProblems.id],
    references: [problemEmbeddings.problemId],
  }),
  universityProjects: many(universityProjects),
}));

export const problemEmbeddingsRelations = relations(problemEmbeddings, ({ one }) => ({
  problem: one(citizenProblems, {
    fields: [problemEmbeddings.problemId],
    references: [citizenProblems.id],
  }),
}));

export const universityProjectsRelations = relations(universityProjects, ({ one, many }) => ({
  problem: one(citizenProblems, {
    fields: [universityProjects.problemId],
    references: [citizenProblems.id],
  }),
  university: one(users, {
    fields: [universityProjects.universityId],
    references: [users.id],
    relationName: 'universityProjects',
  }),
  updates: many(projectUpdates),
  ledgers: many(escrowLedger),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(universityProjects, {
    fields: [projectUpdates.projectId],
    references: [universityProjects.id],
  }),
  verifier: one(users, {
    fields: [projectUpdates.verifiedBy],
    references: [users.id],
    relationName: 'verifiedByProjectUpdates',
  }),
}));

export const escrowLedgerRelations = relations(escrowLedger, ({ one }) => ({
  project: one(universityProjects, {
    fields: [escrowLedger.projectId],
    references: [universityProjects.id],
  }),
  milestone: one(projectUpdates, {
    fields: [escrowLedger.milestoneId],
    references: [projectUpdates.id],
  }),
  corporate: one(users, {
    fields: [escrowLedger.corporateId],
    references: [users.id],
    relationName: 'corporateEscrowLedgers',
  }),
}));

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ProblemStatus = (typeof problemStatusEnum.enumValues)[number];
export type ProblemDomain = (typeof problemDomainEnum.enumValues)[number];
export type UniversityProjectStatus = (typeof universityProjectStatusEnum.enumValues)[number];
export type EscrowLedgerStatus = (typeof escrowLedgerStatusEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CitizenProblem = typeof citizenProblems.$inferSelect;
export type NewCitizenProblem = typeof citizenProblems.$inferInsert;
export type ProblemEmbedding = typeof problemEmbeddings.$inferSelect;
export type NewProblemEmbedding = typeof problemEmbeddings.$inferInsert;
export type UniversityProject = typeof universityProjects.$inferSelect;
export type NewUniversityProject = typeof universityProjects.$inferInsert;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;
export type EscrowEntry = typeof escrowLedger.$inferSelect;
export type NewEscrowEntry = typeof escrowLedger.$inferInsert;

