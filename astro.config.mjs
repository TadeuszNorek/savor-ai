// @ts-check
import { defineConfig } from "astro/config";
import * as path from "path";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Load test environment if PLAYWRIGHT_TEST is set
let testEnv = {};
if (process.env.PLAYWRIGHT_TEST) {
  const dotenv = await import("dotenv");
  const envPath = path.resolve(process.cwd(), ".env.test");
  const result = dotenv.config({ path: envPath });
  if (result.parsed) {
    testEnv = result.parsed;
    // Also set in process.env for server-side code
    Object.keys(testEnv).forEach((key) => {
      process.env[key] = testEnv[key];
    });
  }
}

// Custom Vite plugin to inject test environment variables
function injectTestEnvPlugin() {
  return {
    name: "inject-test-env",
    config(config) {
      if (process.env.PLAYWRIGHT_TEST && Object.keys(testEnv).length > 0) {
        // Inject test env vars into Vite's define
        const defines = {};
        Object.keys(testEnv).forEach((key) => {
          if (key.startsWith("PUBLIC_") || key.startsWith("SUPABASE_") || key === "SUPABASE_URL") {
            defines[`import.meta.env.${key}`] = JSON.stringify(testEnv[key]);
          }
        });
        // Also add PUBLIC_SUPABASE_URL if not present
        if (testEnv.SUPABASE_URL && !testEnv.PUBLIC_SUPABASE_URL) {
          defines["import.meta.env.PUBLIC_SUPABASE_URL"] = JSON.stringify(testEnv.SUPABASE_URL);
        }
        return {
          define: {
            ...config.define,
            ...defines,
          },
        };
      }
    },
  };
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: process.env.PLAYWRIGHT_TEST ? 3001 : 3000 },
  vite: {
    plugins: [
      injectTestEnvPlugin(), // Add custom plugin first
      tailwindcss(),
    ],
    envPrefix: ["PUBLIC_", "SUPABASE_"], // Allow SUPABASE_ vars in import.meta.env
  },
  adapter: node({
    mode: "standalone",
  }),
});
