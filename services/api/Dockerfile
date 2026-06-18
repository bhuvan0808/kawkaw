# Kaw Kaw API — production image.
# Build context MUST be the repo root:  docker build -f services/api/Dockerfile .
# syntax=docker/dockerfile:1

# ---- Builder ----------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Install workspace deps (root + needed workspaces) using only manifests first
# so the npm layer is cached when source changes.
COPY package.json package-lock.json* ./
COPY services/api/package.json services/api/package.json
COPY packages/shared_types/package.json packages/shared_types/package.json
RUN npm install

# Copy sources and build shared types + prisma client + api
COPY packages/shared_types packages/shared_types
COPY services/api services/api
RUN npm run build --workspace @kawkaw/shared-types \
  && npm --workspace @kawkaw/api run prisma:generate \
  && npm run build --workspace @kawkaw/api

# Prune dev dependencies for the runtime image
RUN npm prune --omit=dev

# ---- Runtime ----------------------------------------------------------------
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
WORKDIR /app

# Non-root user
RUN addgroup -S kawkaw && adduser -S kawkaw -G kawkaw

# Dependencies are hoisted to the root node_modules by npm workspaces.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared_types/dist ./packages/shared_types/dist
COPY --from=builder /app/packages/shared_types/package.json ./packages/shared_types/package.json
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/package.json
COPY --from=builder /app/services/api/prisma ./services/api/prisma

# Writable uploads dir for prescriptions (mount a volume in production)
RUN mkdir -p /app/services/api/uploads/prescriptions && chown -R kawkaw:kawkaw /app

USER kawkaw
WORKDIR /app/services/api
EXPOSE 3000

# Apply migrations then start. (migrate deploy is idempotent.)
CMD ["sh", "-c", "node /app/node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
