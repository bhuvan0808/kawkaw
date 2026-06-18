/**
 * Typed configuration namespace. Values are read AFTER Joi validation, so
 * defaults here only document intent — env.validation.ts is authoritative.
 */
export interface AppConfig {
  env: string;
  isProduction: boolean;
  port: number;
  globalPrefix: string;
  logLevel: string;
  apiUrl: string;
  adminUrl: string;
  corsOrigins: string[];
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
}

export interface RedisConfig {
  url: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
  authLimit: number;
}

export interface OtpConfig {
  maxAttempts: number;
  windowSeconds: number;
}

export interface UploadConfig {
  maxBytes: number;
  allowedMime: string[];
}

export interface MapsConfig {
  nominatimUrl: string;
  osrmUrl: string;
}

export interface BusinessConfig {
  defaultDeliveryFee: number;
  launchCity: string;
}

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    apiUrl: process.env.API_URL ?? 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL ?? 'http://localhost:3001',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  } satisfies AppConfig,
  database: {
    url: process.env.DATABASE_URL as string,
  },
  redis: {
    url: process.env.REDIS_URL as string,
  } satisfies RedisConfig,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  } satisfies JwtConfig,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || undefined,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  } satisfies FirebaseConfig,
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
  } satisfies ThrottleConfig,
  otp: {
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
    windowSeconds: parseInt(process.env.OTP_WINDOW_SECONDS ?? '600', 10),
  } satisfies OtpConfig,
  upload: {
    maxBytes: parseInt(process.env.UPLOAD_MAX_BYTES ?? '5242880', 10),
    allowedMime: (process.env.UPLOAD_ALLOWED_MIME ?? 'image/jpeg,image/png,image/webp')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
  } satisfies UploadConfig,
  maps: {
    nominatimUrl: process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',
    osrmUrl: process.env.OSRM_URL ?? 'https://router.project-osrm.org',
  } satisfies MapsConfig,
  business: {
    defaultDeliveryFee: parseFloat(process.env.DEFAULT_DELIVERY_FEE ?? '20'),
    launchCity: process.env.LAUNCH_CITY ?? 'Bhadrachalam',
  } satisfies BusinessConfig,
});
