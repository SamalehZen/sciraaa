// https://env.t3.gg/docs/nextjs#create-your-schema
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnv = createEnv({
  server: {
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),

    LOCAL_AUTH_SECRET: z.string().optional(),

    // Primary search providers
    EXA_API_KEY: process.env.NODE_ENV === 'production' ? z.string().min(1) : z.string().optional(),
    PARALLEL_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    FIRECRAWL_API_KEY: z.string().optional(),

    // Optional/legacy keys kept for compile-time compatibility (no defaults)
    XAI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    DAYTONA_API_KEY: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
    VALYU_API_KEY: z.string().optional(),
    TMDB_API_KEY: z.string().optional(),
    YT_ENDPOINT: z.string().optional(),
    OPENWEATHER_API_KEY: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    AMADEUS_API_KEY: z.string().optional(),
    AMADEUS_API_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    SMITHERY_API_KEY: z.string().optional(),
    COINGECKO_API_KEY: z.string().optional(),
    QSTASH_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    SUPERMEMORY_API_KEY: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),
  },
  experimental__runtimeEnv: process.env,
});
