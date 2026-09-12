/**
 * src/lib/env.ts
 *
 * Environment variable validator — Architecture §5.2
 * Fails fast at startup if required variables are missing or invalid.
 * NEVER import this file from Client Components; server env is server-only.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses RSS_FEED_URLS: expects a JSON array of 1–3 HTTPS URLs.
 * Returns the array or throws ZodError if invalid.
 */
function parseHttpsFeedArray(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "RSS_FEED_URLS must be a valid JSON array, e.g. [\"https://example.com/feed.xml\"]",
    );
  }

  const schema = z
    .array(
      z.string().url().startsWith("https://", {
        message: "Each RSS feed URL must start with https://",
      }),
    )
    .min(1, "RSS_FEED_URLS must have at least 1 URL")
    .max(3, "RSS_FEED_URLS must have at most 3 URLs");

  return schema.parse(parsed);
}

// ---------------------------------------------------------------------------
// Public environment (available on both client and server)
// ---------------------------------------------------------------------------

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1),
  // Support both publishable key (new projects) and anon key (legacy projects)
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .min(1),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Server-only environment (never sent to browser)
// ---------------------------------------------------------------------------

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  RSS_FEED_URLS: z.string().transform(parseHttpsFeedArray),
  RSS_CACHE_TTL_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .default(24),
  RSS_MAX_ARTICLES_PER_FEED: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .default(5),
  RSS_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(8000),
  APP_TIMEZONE: z.string().default("Asia/Bangkok"),
  VAPID_PRIVATE_KEY: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Parse & export
// ---------------------------------------------------------------------------

export function getPublicKey() {
  // Support both publishable key (new projects) and anon key (legacy projects)
  // Architecture §5.1: don't define both at once
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publishable && !anon) {
    throw new Error(
      "Either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  return (publishable ?? anon) as string;
}

/**
 * Validated public environment variables.
 * Safe to use on both client and server.
 */
export function getPublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    console.error("❌ Invalid public environment variables:", result.error.format());
    throw new Error("Invalid public environment configuration. Check .env.local.");
  }

  return {
    supabaseUrl: result.data.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublicKey: getPublicKey(),
    appUrl: result.data.NEXT_PUBLIC_APP_URL,
    vapidPublicKey: result.data.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  };
}

/**
 * Validated server-only environment variables.
 * MUST only be used in Server Components, Server Actions, Route Handlers,
 * and server-only modules.
 */
export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    RSS_FEED_URLS: process.env.RSS_FEED_URLS,
    RSS_CACHE_TTL_HOURS: process.env.RSS_CACHE_TTL_HOURS,
    RSS_MAX_ARTICLES_PER_FEED: process.env.RSS_MAX_ARTICLES_PER_FEED,
    RSS_REQUEST_TIMEOUT_MS: process.env.RSS_REQUEST_TIMEOUT_MS,
    APP_TIMEZONE: process.env.APP_TIMEZONE,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  });

  if (!result.success) {
    console.error("❌ Invalid server environment variables:", result.error.format());
    throw new Error("Invalid server environment configuration. Check .env.local.");
  }

  return result.data;
}
