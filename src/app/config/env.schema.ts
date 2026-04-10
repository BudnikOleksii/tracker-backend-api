import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z
      .string()
      .default('3000')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0 && value < 65_536, {
        message: 'PORT must be between 1 and 65535',
      }),

    DATABASE_URL: z.url(),

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

    JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters long' }),

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

    REDIS_URL: z.string().refine((value) => /^rediss?:\/\/.+/.test(value), {
      message: 'REDIS_URL must start with redis:// or rediss://',
    }),

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

    REFRESH_TOKEN_COOKIE_NAME: z.string().default('refresh_token'),

    CSRF_TOKEN_COOKIE_NAME: z.string().default('csrf_token'),

    COOKIE_DOMAIN: z.string().optional(),

    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),

    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),

    COOKIE_PATH: z.string().default('/'),

    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.url().optional(),

    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_CALLBACK_URL: z.url().optional(),

    SOCIAL_AUTH_REDIRECT_URL: z.url().optional(),

    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z
      .string()
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
      .refine((value) => value === undefined || (value > 0 && value < 65_536), {
        message: 'SMTP_PORT must be between 1 and 65535',
      }),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),

    EMAIL_VERIFICATION_REDIRECT_URL: z.url().optional(),

    REQUEST_TIMEOUT_MS: z
      .string()
      .default('30000')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0, {
        message: 'REQUEST_TIMEOUT_MS must be greater than 0',
      }),
  })
  .refine(
    (env) => {
      const googleVars = [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL];
      const googleSet = googleVars.filter(Boolean).length;

      return googleSet === 0 || googleSet === 3;
    },
    {
      message:
        'Google OAuth requires all three variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL',
      path: ['GOOGLE_CLIENT_ID'],
    },
  )
  .refine(
    (env) => {
      const githubVars = [env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, env.GITHUB_CALLBACK_URL];
      const githubSet = githubVars.filter(Boolean).length;

      return githubSet === 0 || githubSet === 3;
    },
    {
      message:
        'GitHub OAuth requires all three variables: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL',
      path: ['GITHUB_CLIENT_ID'],
    },
  )
  .refine(
    (env) => {
      const hasGoogle = !!env.GOOGLE_CLIENT_ID;
      const hasGitHub = !!env.GITHUB_CLIENT_ID;

      if ((hasGoogle || hasGitHub) && !env.SOCIAL_AUTH_REDIRECT_URL) {
        return false;
      }

      return true;
    },
    {
      message: 'SOCIAL_AUTH_REDIRECT_URL is required when any social auth provider is configured',
      path: ['SOCIAL_AUTH_REDIRECT_URL'],
    },
  );

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
