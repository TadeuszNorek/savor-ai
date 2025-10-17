/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;

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
