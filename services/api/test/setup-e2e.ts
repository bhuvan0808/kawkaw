/**
 * Runs before any e2e spec is imported (jest `setupFiles`). Provides safe test
 * defaults. DATABASE_URL / REDIS_URL come from the environment passed by the
 * runner (an isolated schema + Redis), so production data is never touched.
 *
 * dotenv (via @nestjs/config) does NOT override already-set process.env values,
 * so these test values win over .env.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'e2e_jwt_secret_0123456789_0123456789_0123456789';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'e2e_refresh_secret_0123456789_0123456789_0123';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'kawkaw08';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

if (!process.env.DATABASE_URL) {
  throw new Error('E2E requires DATABASE_URL pointing at an isolated test schema');
}
if (!process.env.REDIS_URL) {
  throw new Error('E2E requires REDIS_URL');
}
