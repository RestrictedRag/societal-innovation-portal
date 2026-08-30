import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateProblemEmbedding(text: string): Promise<number[]> {
  const sanitized = text.trim();

  if (!sanitized) {
    return new Array(1024).fill(0);
  }

  try {
    const result = await embed({
      model: google.embedding('gemini-embedding-001'),
      value: sanitized,
    });

    return result.embedding ?? new Array(1024).fill(0);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return new Array(1024).fill(0);
  }
}
