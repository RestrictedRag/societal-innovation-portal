# Civic Innovation & Research Marketplace

This project scaffold sets up a Next.js App Router application with Drizzle ORM, PostgreSQL + pgvector, AI triage, and S3-compatible upload helpers.

## Quick start

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Run database migrations or push schema:
   npm run db:push
4. Start the app:
   npm run dev

## Notes

- The schema includes pgvector-compatible custom type support for generating embeddings.
- For true AI embeddings, configure `GOOGLE_GENERATIVE_AI_API_KEY` in your environment and ensure your model supports text embeddings.
- For Cloudflare R2 uploads, set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`.
