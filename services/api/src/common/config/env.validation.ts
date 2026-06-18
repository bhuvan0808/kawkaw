import * as Joi from 'joi';

/**
 * Boot-time environment validation. The process refuses to start if anything
 * required is missing or malformed. Keep in sync with `.env.example`.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_GLOBAL_PREFIX: Joi.string().default('api'),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  FIREBASE_PROJECT_ID: Joi.string().required(),
  // Firebase admin credentials are required in production; optional in dev/test
  // so the API can boot for local catalogue work without live OTP.
  FIREBASE_CLIENT_EMAIL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  FIREBASE_PRIVATE_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),

  API_URL: Joi.string().uri().default('http://localhost:3000'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:3001'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(120),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  OTP_MAX_ATTEMPTS: Joi.number().default(5),
  OTP_WINDOW_SECONDS: Joi.number().default(600),

  UPLOAD_MAX_BYTES: Joi.number().default(5_242_880),
  UPLOAD_ALLOWED_MIME: Joi.string().default('image/jpeg,image/png,image/webp'),

  NOMINATIM_URL: Joi.string().uri().default('https://nominatim.openstreetmap.org'),
  OSRM_URL: Joi.string().uri().default('https://router.project-osrm.org'),

  DEFAULT_DELIVERY_FEE: Joi.number().default(20),
  LAUNCH_CITY: Joi.string().default('Bhadrachalam'),

  // Optional error monitoring — disabled when blank/unset.
  SENTRY_DSN: Joi.string().uri().allow('').optional(),
});
