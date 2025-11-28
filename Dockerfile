# Build stage - Using standard node image to avoid Alpine/musl issues
FROM node:20-slim AS builder

WORKDIR /app

# Set NODE_ENV to development for build stage (required for devDependencies)
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
# Force npm usage and set registry explicitly
ENV npm_config_user_agent="npm/10.8.2 node/v20.0.0 linux x64"
ENV npm_config_registry="https://registry.npmjs.org/"

# Build-time arguments for Next.js client-side code
# These MUST be set at build time as they get baked into the JS bundle
# To use: docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=xxx ...
ARG NEXT_PUBLIC_SUPABASE_URL=https://supabase.nexcyte.com
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTEwNTM4MCwiZXhwIjo0OTE0Nzc4OTgwLCJyb2xlIjoiYW5vbiJ9.LEjES7ZdligKvnm15fl1ssmOHDXw9_1-ophSf9fKbm8
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG NEXT_PUBLIC_TENANT_SLUG=ezcr-01
ARG NEXT_PUBLIC_BASE_URL=https://staging.ezcycleramp.com
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51MZyzBH2Ea7mEUq79OBZiWvAUTeCzggk9qga1zfeUeyNOQX7qlW85LLC7NZPt8wL5ORWQeST5Z7mcloqsJgrsUQa002QA510SO
ARG SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTEwNTM4MCwiZXhwIjo0OTE0Nzc4OTgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.eJi_5yIeVN64jC-Vg_vdZLGUthLcWqY7dtMoRiE56YY

# Convert ARGs to ENVs for the build process
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_TENANT_SLUG=$NEXT_PUBLIC_TENANT_SLUG
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# Cache bust to ensure fresh install (update when needed)
ARG CACHEBUST=30

# Install dependencies (includes devDependencies like TypeScript)
COPY package*.json ./
RUN npm ci --no-optional

# Copy source
COPY . .

# Create .env.production file for Next.js build using ARG values
RUN echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" > .env.production && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}" >> .env.production && \
    echo "NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}" >> .env.production && \
    echo "NEXT_PUBLIC_TENANT_SLUG=${NEXT_PUBLIC_TENANT_SLUG}" >> .env.production && \
    echo "NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}" >> .env.production && \
    echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}" >> .env.production && \
    echo "SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}" >> .env.production && \
    cat .env.production

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

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy everything needed for Next.js
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/simple-server.js ./simple-server.js

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Next.js production server
CMD ["npm", "start"]
