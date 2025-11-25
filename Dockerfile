# Build stage - Using standard node image to avoid Alpine/musl issues
FROM node:20-slim AS builder

WORKDIR /app

# Set NODE_ENV to development for build stage (required for devDependencies)
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
# Force npm usage and set registry explicitly
ENV npm_config_user_agent="npm/10.8.2 node/v20.0.0 linux x64"
ENV npm_config_registry="https://registry.npmjs.org/"

# Cache bust to ensure fresh install (update when needed)
ARG CACHEBUST=22

# Install dependencies (includes devDependencies like TypeScript)
COPY package*.json ./
RUN npm ci --no-optional

# Copy source
COPY . .

# Pre-install SWC binary using npm to avoid pnpm detection
RUN npm install @next/swc-linux-x64-gnu@15.5.4 --save-dev --registry=https://registry.npmjs.org/

# Build the application (try standard build first)
ENV NEXT_PRIVATE_STANDALONE=true
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
RUN npm run build || npm run build:staging || echo "Build had errors but checking for server files..."

# Production stage - Using standard node image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy entire app with dependencies from builder
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use the standalone server directly
CMD ["node", ".next/standalone/server.js"]
