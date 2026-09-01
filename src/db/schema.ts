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
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { relations, sql, type SQL } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'CITIZEN',
  'STUDENT',
  'FACULTY',
  'COMPANY_REP',
  'ADMIN',
] as const);

export const problemStatusEnum = pgEnum('problem_status', [
  'PENDING',
  'PENDING_MODERATION',
  'OPEN',
  'IN_PROGRESS',
  'NEEDS_REVIEW',
  'REJECTED',
  'CLAIMED',
] as const);

export const mediaStatusEnum = pgEnum('media_status', [
  'PENDING_MODERATION',
  'APPROVED',
  'REJECTED',
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

const geographyPoint = customType<{ data: string | null; driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    return value;
  },
  fromDriver(value: string | null) {
    return value ?? null;
  },
});

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

export const universities = pgTable(
  'universities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    location: geographyPoint('location'),
    serviceRadiusKm: real('service_radius_km'),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    fullName: text('full_name').notNull(),
    role: userRoleEnum('role').notNull(),
    universityId: uuid('university_id').references(() => universities.id, { onDelete: 'set null' }),
    city: text('city').notNull(),
    state: text('state').notNull(),
    formattedAddress: text('formatted_address'),
    country: text('country'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    universityMembershipCheck: check(
      'users_university_membership_check',
      sql`(((${table.role} = 'STUDENT' OR ${table.role} = 'FACULTY') AND ${table.universityId} IS NOT NULL) OR (${table.role} IN ('CITIZEN', 'COMPANY_REP', 'ADMIN') AND ${table.universityId} IS NULL))`,
    ),
  }),
);

export const citizenProblems = pgTable(
  'citizen_problems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().unique().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    status: problemStatusEnum('status').notNull().default('PENDING_MODERATION'),
    spamScore: real('spam_score'),
    domain: problemDomainEnum('domain'),
    secondaryTags: problemDomainEnum('secondary_tags').array(),
    claimedBy: uuid('claimed_by').references(() => users.id, { onDelete: 'set null' }),
    latitude: real('latitude'),
    longitude: real('longitude'),
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

export const problemMedia = pgTable('problem_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id').references(() => citizenProblems.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  mimeType: text('mime_type'),
  status: mediaStatusEnum('status').notNull().default('PENDING_MODERATION'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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

export const universityProjects = pgTable(
  'university_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => citizenProblems.id, { onDelete: 'cascade' }),
    leadUniversityId: uuid('lead_university_id')
      .notNull()
      .references(() => universities.id, { onDelete: 'cascade' }),
    claimedByUserId: uuid('claimed_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    status: universityProjectStatusEnum('status').notNull().default('ACTIVE'),
    budget: numeric('budget', { precision: 16, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueLeadUniversityPerProblem: uniqueIndex('university_projects_problem_lead_university_unique').on(
      table.problemId,
      table.leadUniversityId,
    ),
  }),
);

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

export const usersRelations = relations(users, ({ many, one }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
    relationName: 'universityMembers',
  }),
  citizenProblems: many(citizenProblems, { relationName: 'userCitizenProblems' }),
  claimedProblems: many(citizenProblems, { relationName: 'claimedProblems' }),
  universityProjects: many(universityProjects, { relationName: 'claimedByUserUniversityProjects' }),
  projectUpdates: many(projectUpdates, { relationName: 'verifiedByProjectUpdates' }),
  escrowLedgers: many(escrowLedger, { relationName: 'corporateEscrowLedgers' }),
}));

export const universitiesRelations = relations(universities, ({ many, one }) => ({
  members: many(users, { relationName: 'universityMembers' }),
  leadProjects: many(universityProjects, { relationName: 'leadUniversityProjects' }),
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
  media: many(problemMedia),
  universityProjects: many(universityProjects),
}));

export const problemMediaRelations = relations(problemMedia, ({ one }) => ({
  problem: one(citizenProblems, {
    fields: [problemMedia.problemId],
    references: [citizenProblems.id],
  }),
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
  leadUniversity: one(universities, {
    fields: [universityProjects.leadUniversityId],
    references: [universities.id],
    relationName: 'leadUniversityProjects',
  }),
  claimedByUser: one(users, {
    fields: [universityProjects.claimedByUserId],
    references: [users.id],
    relationName: 'claimedByUserUniversityProjects',
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
export type MediaStatus = (typeof mediaStatusEnum.enumValues)[number];
export type ProblemDomain = (typeof problemDomainEnum.enumValues)[number];
export type UniversityProjectStatus = (typeof universityProjectStatusEnum.enumValues)[number];
export type EscrowLedgerStatus = (typeof escrowLedgerStatusEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CitizenProblem = typeof citizenProblems.$inferSelect;
export type NewCitizenProblem = typeof citizenProblems.$inferInsert;
export type ProblemMedia = typeof problemMedia.$inferSelect;
export type NewProblemMedia = typeof problemMedia.$inferInsert;
export type ProblemEmbedding = typeof problemEmbeddings.$inferSelect;
export type NewProblemEmbedding = typeof problemEmbeddings.$inferInsert;
export type UniversityProject = typeof universityProjects.$inferSelect;
export type NewUniversityProject = typeof universityProjects.$inferInsert;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;
export type EscrowEntry = typeof escrowLedger.$inferSelect;
export type NewEscrowEntry = typeof escrowLedger.$inferInsert;

