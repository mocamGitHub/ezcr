# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Set NODE_ENV to development for build stage (required for devDependencies)
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
# Use npm as package manager for Next.js
ENV npm_config_user_agent="npm"

# Cache bust to ensure fresh install (update when needed)
ARG CACHEBUST=2

# Install dependencies (includes devDependencies like TypeScript)
COPY package*.json ./
RUN npm ci --no-optional && \
    # Ensure no @react-email packages are present (they cause Html import errors)
    rm -rf node_modules/@react-email && \
    # Check what resend has installed
    echo "=== Checking resend dependencies ===" && \
    (npm ls resend || true) && \
    echo "=== Checking for react-email packages ===" && \
    (find node_modules -name "Html.js" -o -name "Html.tsx" -o -name "Html.ts" | head -5 || true)

# Copy source
COPY . .

# Build the application (Next.js will auto-download the correct SWC binary)
# Set package manager explicitly for Next.js
ENV NEXT_PRIVATE_STANDALONE=true
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
RUN npx next build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
