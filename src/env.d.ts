/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

interface ImportMetaEnv {
  // Server-side only
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;

  // Client-side (browser) - exposed with PUBLIC_ prefix
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;

  // AI Provider Configuration
  // Use "mock" for development without API costs
  readonly AI_PROVIDER: "openrouter" | "google" | "mock";
  readonly OPENROUTER_API_KEY?: string;
  readonly GOOGLE_API_KEY?: string;
  readonly AI_MODEL?: string;
  readonly AI_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
