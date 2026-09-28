import { existsSync } from 'node:fs';
import { z } from 'zod';

// Load .env from the repo root or the server folder when present (Node 22 built-in).
for (const f of ['../../.env', '.env']) if (existsSync(f)) process.loadEnvFile(f);

const Config = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default('0.0.0.0'),
  /** Public base URL used to build invite links, e.g. https://play.example.com */
  PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_PATH: z.string().default('data/mystery-night.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5'),
  ANTHROPIC_FAST_MODEL: z.string().default('claude-haiku-4-5'),
  NLPEARL_API_KEY: z.string().optional(),
});

export type Config = z.infer<typeof Config>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Config.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid configuration:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  }
  return parsed.data;
}
