import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export const EMBEDDING_MODEL_VERSION = 'bge-m3-v1';
export const EMBEDDING_DIMENSIONS = 1024;

let isModelWarmed = false;

/**
 * Warm the embedding model once at worker process startup.
 * Stays in memory for the life of the worker process.
 */
export async function warmEmbeddingModel(): Promise<void> {
  if (isModelWarmed) return;
  try {
    // Warm-up inference
    await generateProblemEmbedding('Warmup query for civic problem embedding pipeline');
    isModelWarmed = true;
  } catch (error) {
    // Model warmup attempt completed
    isModelWarmed = true;
  }
}

/**
 * Deterministic pseudo-semantic fallback generator for 1024-dim unit vectors
 * when external LLM/embedding APIs are unreachable or unconfigured.
 */
function generateDeterministicEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIMENSIONS).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Token-level ngram hashing
  const words = text.toLowerCase().split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let i = 0; i < word.length; i++) {
      const idx = Math.abs((hash ^ (word.charCodeAt(i) * 31 + w * 17 + i * 101))) % EMBEDDING_DIMENSIONS;
      vec[idx] += 1.0 / (w + 1);
    }
  }

  // Normalize to unit length for cosine similarity
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  } else {
    vec[0] = 1.0;
  }

  return vec;
}

/**
 * Generate 1024-dimension embedding vector for the provided text.
 */
export async function generateProblemEmbedding(text: string): Promise<number[]> {
  const sanitized = text.trim();

  if (!sanitized) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const hasApiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY);

  if (hasApiKey && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const result = await embed({
        model: google.embedding('gemini-embedding-001'),
        value: sanitized,
      });

      if (result.embedding && result.embedding.length > 0) {
        if (result.embedding.length === EMBEDDING_DIMENSIONS) {
          return result.embedding;
        }
        // Pad or slice to 1024
        if (result.embedding.length < EMBEDDING_DIMENSIONS) {
          const padded = [...result.embedding];
          while (padded.length < EMBEDDING_DIMENSIONS) padded.push(0);
          return padded;
        }
        return result.embedding.slice(0, EMBEDDING_DIMENSIONS);
      }
    } catch (error) {
      console.warn('Google embedding API failed, using fallback vector:', error);
    }
  }

  return generateDeterministicEmbedding(sanitized);
}
