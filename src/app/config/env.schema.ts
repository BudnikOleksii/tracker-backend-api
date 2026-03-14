import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z
    .string()
    .default('3000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0 && value < 65_536, {
      message: 'PORT must be between 1 and 65535',
    }),

  DATABASE_URL: z.url().default('postgresql://tracker:tracker123@localhost:5432/tracker'),

  DB_POOL_MAX: z
    .string()
    .default('20')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0 && value <= 100, {
      message: 'DB_POOL_MAX must be between 1 and 100',
    }),

  DB_POOL_MIN: z
    .string()
    .default('5')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value >= 0 && value <= 50, {
      message: 'DB_POOL_MIN must be between 0 and 50',
    }),

  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters long' })
    .default('your-secret-key-change-me-in-production-min-32-chars'),

  JWT_EXPIRES_IN: z
    .string()
    .default('15m')
    .refine((value) => /^\d+[smhd]$/.test(value), {
      message: 'JWT_EXPIRES_IN format is invalid (e.g. 60s, 15m, 2h, 7d)',
    }),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((value) => /^\d+[smhd]$/.test(value), {
      message: 'JWT_REFRESH_EXPIRES_IN format is invalid (e.g. 60s, 15m, 2h, 7d)',
    }),

  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  REDIS_URL: z
    .string()
    .refine((value) => /^rediss?:\/\/.+/.test(value), {
      message: 'REDIS_URL must start with redis:// or rediss://',
    })
    .default('redis://localhost:6379'),

  REDIS_TTL: z
    .string()
    .default('3600')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'REDIS_TTL must be greater than 0',
    }),

  API_BASE_URL: z.url().default('https://api.example.com'),

  THROTTLE_TTL: z
    .string()
    .default('60000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'THROTTLE_TTL must be greater than 0',
    }),

  THROTTLE_LIMIT: z
    .string()
    .default('60')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'THROTTLE_LIMIT must be greater than 0',
    }),

  THROTTLE_AUTH_TTL: z
    .string()
    .default('60000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'THROTTLE_AUTH_TTL must be greater than 0',
    }),

  THROTTLE_AUTH_LIMIT: z
    .string()
    .default('5')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'THROTTLE_AUTH_LIMIT must be greater than 0',
    }),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue: z.core.$ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      throw new Error(
        `Environment variable validation failed:\n${errorMessages}\n\nPlease check your .env file or environment variable configuration`,
        { cause: error },
      );
    }
    throw error;
  }
}
