import { google } from '@ai-sdk/google';

/**
 * Centralized AI Model Registry
 * Configures model identifiers and factory helpers in one place across all features.
 */
export const AI_MODELS = {
  SPAM_SCORING: 'gemini-1.5-flash',
  TRIAGE: 'gemini-1.5-flash',
  CHAT: 'gemini-1.5-flash',
  EMBEDDING: 'text-embedding-004',
} as const;

export const getSpamScoringModel = () => google(AI_MODELS.SPAM_SCORING);
export const getTriageModel = () => google(AI_MODELS.TRIAGE);
export const getChatModel = () => google(AI_MODELS.CHAT);
export const getEmbeddingModel = () => google.embedding(AI_MODELS.EMBEDDING);
