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
  'MERGED',
  'PROCESSING_FAILED',
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

export const projectTypeEnum = pgEnum('project_type', [
  'RESEARCH',
  'PROBLEM_SOLVING',
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
    authUserId: text('auth_user_id').notNull().unique(),
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
    department: text('department'),
    yearOfStudy: integer('year_of_study'),
    skills: text('skills').array(),
    interests: text('interests').array(),
    preferredProjectType: text('preferred_project_type'),
    expertise: text('expertise').array(),
    bio: text('bio'),
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
    problemType: text('problem_type'),
    category: text('category'),
    subcategory: text('subcategory'),
    claimedBy: uuid('claimed_by').references(() => users.id, { onDelete: 'set null' }),
    claimedByEmail: text('claimed_by_email'),
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

export const problemUpvotes = pgTable(
  'problem_upvotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => citizenProblems.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserProblemUpvote: uniqueIndex('problem_upvotes_user_problem_unique').on(
      table.problemId,
      table.userId,
    ),
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
    claimedByEmail: text('claimed_by_email'),
    projectType: projectTypeEnum('project_type').notNull().default('PROBLEM_SOLVING'),
    status: universityProjectStatusEnum('status').notNull().default('ACTIVE'),
    healthStatus: text('health_status').notNull().default('HEALTHY'),
    budget: numeric('budget', { precision: 16, scale: 2 }).notNull().default('0'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
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

export const industryNeeds = pgTable('industry_needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyUserId: uuid('company_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  domain: problemDomainEnum('domain'),
  targetTrl: integer('target_trl').notNull().default(4),
  resourceOfferings: text('resource_offerings').array(),
  status: text('status').notNull().default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const resourceOffers = pgTable('resource_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => universityProjects.id, { onDelete: 'cascade' }),
  corporateUserId: uuid('corporate_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  offeringType: text('offering_type').notNull(),
  details: text('details').notNull(),
  status: text('status').notNull().default('OFFERED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: text('tool_calls'),
  toolResults: text('tool_results'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
    relationName: 'universityMembers',
  }),
  citizenProblems: many(citizenProblems, { relationName: 'userCitizenProblems' }),
  claimedProblems: many(citizenProblems, { relationName: 'claimedProblems' }),
  upvotes: many(problemUpvotes, { relationName: 'userProblemUpvotes' }),
  chatSessions: many(chatSessions, { relationName: 'userChatSessions' }),
  universityProjects: many(universityProjects, { relationName: 'claimedByUserUniversityProjects' }),
  projectUpdates: many(projectUpdates, { relationName: 'verifiedByProjectUpdates' }),
  escrowLedgers: many(escrowLedger, { relationName: 'corporateEscrowLedgers' }),
  industryNeeds: many(industryNeeds, { relationName: 'companyIndustryNeeds' }),
  resourceOffers: many(resourceOffers, { relationName: 'corporateResourceOffers' }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
    relationName: 'userChatSessions',
  }),
  messages: many(chatMessages, { relationName: 'sessionMessages' }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
    relationName: 'sessionMessages',
  }),
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
  upvotes: many(problemUpvotes, { relationName: 'problemUpvotes' }),
  media: many(problemMedia),
  universityProjects: many(universityProjects),
}));

export const problemUpvotesRelations = relations(problemUpvotes, ({ one }) => ({
  problem: one(citizenProblems, {
    fields: [problemUpvotes.problemId],
    references: [citizenProblems.id],
    relationName: 'problemUpvotes',
  }),
  user: one(users, {
    fields: [problemUpvotes.userId],
    references: [users.id],
    relationName: 'userProblemUpvotes',
  }),
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
  resourceOffers: many(resourceOffers),
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

export const industryNeedsRelations = relations(industryNeeds, ({ one }) => ({
  companyUser: one(users, {
    fields: [industryNeeds.companyUserId],
    references: [users.id],
    relationName: 'companyIndustryNeeds',
  }),
}));

export const resourceOffersRelations = relations(resourceOffers, ({ one }) => ({
  project: one(universityProjects, {
    fields: [resourceOffers.projectId],
    references: [universityProjects.id],
  }),
  corporateUser: one(users, {
    fields: [resourceOffers.corporateUserId],
    references: [users.id],
    relationName: 'corporateResourceOffers',
  }),
}));

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ProblemStatus = (typeof problemStatusEnum.enumValues)[number];
export type MediaStatus = (typeof mediaStatusEnum.enumValues)[number];
export type ProblemDomain = (typeof problemDomainEnum.enumValues)[number];
export type UniversityProjectStatus = (typeof universityProjectStatusEnum.enumValues)[number];
export type ProjectType = (typeof projectTypeEnum.enumValues)[number];
export type EscrowLedgerStatus = (typeof escrowLedgerStatusEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CitizenProblem = typeof citizenProblems.$inferSelect;
export type NewCitizenProblem = typeof citizenProblems.$inferInsert;
export type ProblemMedia = typeof problemMedia.$inferSelect;
export type NewProblemMedia = typeof problemMedia.$inferInsert;
export type ProblemEmbedding = typeof problemEmbeddings.$inferSelect;
export type NewProblemEmbedding = typeof problemEmbeddings.$inferInsert;
export type ProblemUpvote = typeof problemUpvotes.$inferSelect;
export type NewProblemUpvote = typeof problemUpvotes.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type UniversityProject = typeof universityProjects.$inferSelect;
export type NewUniversityProject = typeof universityProjects.$inferInsert;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;
export type EscrowEntry = typeof escrowLedger.$inferSelect;
export type NewEscrowEntry = typeof escrowLedger.$inferInsert;
export type IndustryNeed = typeof industryNeeds.$inferSelect;
export type NewIndustryNeed = typeof industryNeeds.$inferInsert;
export type ResourceOffer = typeof resourceOffers.$inferSelect;
export type NewResourceOffer = typeof resourceOffers.$inferInsert;


